import { NextRequest, NextResponse } from "next/server";
import { ProxyAgent, fetch as undiciFetch } from "undici";

export const runtime = "nodejs";
export const maxDuration = 30;

// ── Proxy pool ────────────────────────────────────────────────
let proxyCache: { url: string; agent: ProxyAgent }[] = [];
let proxyCacheExpiry = 0;

async function getVNProxies(): Promise<{ url: string; agent: ProxyAgent }[]> {
  if (proxyCache.length > 0 && Date.now() < proxyCacheExpiry) return proxyCache;
  try {
    const res = await fetch(
      "https://api.proxyscrape.com/v4/free-proxy-list/get?request=display_proxies&proxy_format=protocolipport&format=text&country=vn&protocol=http&timeout=3000",
      { signal: AbortSignal.timeout(5000) }
    );
    const text = await res.text();
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 15);
    proxyCache = lines.map((url) => ({ url, agent: new ProxyAgent({ uri: url }) }));
    proxyCacheExpiry = Date.now() + 5 * 60 * 1000;
  } catch {
    // keep stale cache
  }
  return proxyCache;
}

async function fetchViaProxy(
  url: string,
  headers: Record<string, string>,
): Promise<{ status: number; contentType: string; body: Uint8Array }> {
  const proxies = await getVNProxies();

  // Try up to 3 VN proxies
  for (const { agent } of proxies.slice(0, 3)) {
    try {
      const res = await undiciFetch(url, { dispatcher: agent, headers, signal: AbortSignal.timeout(10000) });
      if (res.status >= 400) {
        const body = await res.arrayBuffer();
        return { status: res.status, contentType: res.headers.get("content-type") || "", body: new Uint8Array(body) };
      }
      const body = await res.arrayBuffer();
      return { status: res.status, contentType: res.headers.get("content-type") || "", body: new Uint8Array(body) };
    } catch {
      continue;
    }
  }

  // Fallback: direct
  const res = await undiciFetch(url, { headers, signal: AbortSignal.timeout(10000) });
  const body = await res.arrayBuffer();
  return { status: res.status, contentType: res.headers.get("content-type") || "", body: new Uint8Array(body) };
}

// ── Referer map ───────────────────────────────────────────────
const REFERER_MAP: Record<string, string> = {
  "fptplay53.net": "https://fptplay.vn/",
  "fptplay.vn": "https://fptplay.vn/",
  "vtv.vn": "https://vtv.vn/",
  "vtvgo.vn": "https://vtvgo.vn/",
  "htvc.vn": "https://htvc.vn/",
  "tv360.vn": "https://tv360.vn/",
};

function inferReferer(url: URL): string {
  const host = url.hostname;
  if (REFERER_MAP[host]) return REFERER_MAP[host];
  for (const [domain, ref] of Object.entries(REFERER_MAP)) {
    if (host.endsWith(`.${domain}`)) return ref;
  }
  return `${url.origin}/`;
}

function rewriteM3U(content: string, base: URL): string {
  return content.replace(
    /^(?!#)(.+)$/gm,
    (match) => {
      const trimmed = match.trim();
      if (!trimmed) return match;
      try {
        const abs = new URL(trimmed, base.href).href;
        return `/api/stream?url=${encodeURIComponent(abs)}`;
      } catch {
        return match;
      }
    }
  );
}

// ── Handler ───────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const targetUrl = request.nextUrl.searchParams.get("url");
  if (!targetUrl) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  const referer = request.nextUrl.searchParams.get("referer") || inferReferer(parsed);
  const userAgent =
    request.nextUrl.searchParams.get("userAgent") ||
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36";

  const headers: Record<string, string> = {
    "User-Agent": userAgent,
    "Referer": referer,
    "Origin": parsed.origin,
    "Accept": "*/*",
    "Accept-Encoding": "identity",
  };

  try {
    const upstream = await fetchViaProxy(parsed.href, headers);

    if (upstream.status >= 400) {
      return new NextResponse(upstream.body, {
        status: upstream.status,
        headers: { "Content-Type": upstream.contentType || "text/plain" },
      });
    }

    const isM3U =
      upstream.contentType.includes("mpegurl") ||
      upstream.contentType.includes("m3u") ||
      targetUrl.includes(".m3u");

    if (isM3U) {
      const text = new TextDecoder().decode(upstream.body);
      const rewritten = rewriteM3U(text, parsed);
      return new NextResponse(rewritten, {
        headers: {
          "Content-Type": "application/vnd.apple.mpegurl",
          "Cache-Control": "no-cache, no-store",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    return new NextResponse(upstream.body, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=60",
        ...(upstream.contentType ? { "Content-Type": upstream.contentType } : {}),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Fetch failed" }, { status: 502 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}
