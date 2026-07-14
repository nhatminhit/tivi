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

  const referer = request.nextUrl.searchParams.get("referer") || undefined;
  const userAgent =
    request.nextUrl.searchParams.get("userAgent") ||
    "VLC/3.0.21 LibVLC/3.0.21";

  const headers: Record<string, string> = {
    "User-Agent": userAgent,
    Accept: "*/*",
    "Accept-Encoding": "identity",
  };
  if (referer) {
    headers["Referer"] = referer;
    headers["Origin"] = parsed.origin;
  }

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
