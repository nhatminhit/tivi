import { NextRequest, NextResponse } from "next/server";
import https from "node:https";
import http from "node:http";

export const runtime = "nodejs";
export const maxDuration = 30;

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

function httpGet(
  url: string,
  headers: Record<string, string>,
): Promise<{ status: number; contentType: string; body: Buffer }> {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith("https") ? https : http;
    const req = mod.get(url, { headers, timeout: 15000 }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        httpGet(res.headers.location, headers).then(resolve).catch(reject);
        return;
      }
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("end", () => {
        resolve({
          status: res.statusCode || 500,
          contentType: res.headers["content-type"] || "",
          body: Buffer.concat(chunks),
        });
      });
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("timeout")); });
  });
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
    const upstream = await httpGet(parsed.href, headers);

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
      const text = upstream.body.toString("utf-8");
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
