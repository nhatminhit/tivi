import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Check if a URL is alive by sending a HEAD/GET request with a timeout.
 * Returns true if status is 2xx, false otherwise.
 */
export async function checkUrlAlive(url: string, timeoutMs = 5000): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, {
      method: "HEAD",
      signal: ctrl.signal,
      cache: "no-store",
    });
    clearTimeout(timer);
    return res.ok;
  } catch {
    // HEAD failed (CORS, method not allowed, etc.) → try GET
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      const res = await fetch(url, {
        method: "GET",
        signal: ctrl.signal,
        cache: "no-store",
      });
      clearTimeout(timer);
      // Only need to know if it's alive, don't consume body
      res.body?.cancel?.();
      return res.ok;
    } catch {
      return false;
    }
  }
}

/**
 * Given a list of URLs (primary + backups), return the first alive one.
 * Dead URLs are filtered out.
 */
export async function findAliveUrl(urls: string[], timeoutMs = 5000): Promise<string | null> {
  for (const url of urls) {
    if (await checkUrlAlive(url, timeoutMs)) return url;
  }
  return null;
}
