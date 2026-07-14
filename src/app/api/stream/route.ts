import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

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

  const referer =
    request.nextUrl.searchParams.get("referer") || inferReferer(parsed);
  const userAgent =
    request.nextUrl.searchParams.get("userAgent") ||
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36";

  const headers: Record<string, string> = {
    "User-Agent": userAgent,
    Referer: referer,
    Origin: parsed.origin,
    Accept: "*/*",
    "Accept-Encoding": "identity",
  };

  const upstream = await fetch(parsed.href, {
    headers,
    redirect: "follow",
    signal: AbortSignal.timeout(15000),
  });

  if (!upstream.ok) {
    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: { "Content-Type": upstream.headers.get("Content-Type") || "text/plain" },
    });
  }

  const contentType = upstream.headers.get("Content-Type") || "";
  const isM3U = contentType.includes("mpegurl") || contentType.includes("m3u") || targetUrl.includes(".m3u");

  if (isM3U) {
    const text = await upstream.text();
    const rewritten = rewriteM3U(text, parsed);
    return new NextResponse(rewritten, {
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl",
        "Cache-Control": "no-cache, no-store",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  const resHeaders: Record<string, string> = {
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "public, max-age=60",
  };
  const ct = upstream.headers.get("Content-Type");
  if (ct) resHeaders["Content-Type"] = ct;

  return new NextResponse(upstream.body, { headers: resHeaders });
}

// CDN domains that need a different Referer than their own origin
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
  // Direct match
  if (REFERER_MAP[host]) return REFERER_MAP[host];
  // Check if host ends with a mapped domain (e.g. cdn.example.com → example.com)
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

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}
