import { NextResponse } from "next/server";

export async function GET() {
  const url =
    "https://raw.githubusercontent.com/vietng228/m3u/refs/heads/main/new.m3u";
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    return NextResponse.json({ error: res.status }, { status: res.status });
  }
  const content = await res.text();
  return new NextResponse(content, {
    headers: { "Content-Type": "application/vnd.apple.mpegurl" },
  });
}
