import { Channel } from "./types";

function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export interface ParsedChannel {
  name: string;
  url: string;
  logo: string;
  group: string;
  tvgId: string;
  tvgName: string;
  userAgent?: string;
  referer?: string;
  catchup?: string;
  catchupDays?: string;
  catchupSource?: string;
}

/**
 * Parse raw M3U content into Channel[]
 * Supports #EXTINF tags: tvg-id, tvg-logo, group-title, tvg-name
 * Supports #EXTVLCOPT: http-user-agent, http-referrer
 */
export function parseM3U(content: string): Channel[] {
  const lines = content.split(/\r?\n/);
  const channels: Channel[] = [];
  let currentExtinf: Partial<ParsedChannel> = {};
  let currentUserAgent: string | undefined;
  let currentReferer: string | undefined;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith("#EXTINF:")) {
      // Reset per-channel state
      currentExtinf = {};
      currentUserAgent = undefined;
      currentReferer = undefined;

      const params = line.slice(8); // Remove "#EXTINF:"
      const commaIndex = params.lastIndexOf(",");
      const name = commaIndex !== -1 ? params.slice(commaIndex + 1).trim() : "Unknown";

      currentExtinf.name = name;

      // Extract attributes from the EXTINF line
      const attrStr = commaIndex !== -1 ? params.slice(0, commaIndex) : params;

      // Extract tvg-id
      const tvgIdMatch = attrStr.match(/tvg-id="([^"]*)"/);
      currentExtinf.tvgId = tvgIdMatch ? tvgIdMatch[1] : slugify(name);
      currentExtinf.tvgName = currentExtinf.tvgId || "";

      // Extract tvg-logo
      const logoMatch = attrStr.match(/tvg-logo="([^"]*)"/);
      currentExtinf.logo = logoMatch ? logoMatch[1] : "";

      // Extract group-title
      const groupMatch = attrStr.match(/group-title="([^"]*)"/);
      currentExtinf.group = groupMatch ? groupMatch[1] : "Uncategorized";

      // Extract catchup
      const catchupMatch = attrStr.match(/catchup="([^"]*)"/);
      currentExtinf.catchup = catchupMatch ? catchupMatch[1] : undefined;

      const catchupDaysMatch = attrStr.match(/catchup-days="([^"]*)"/);
      currentExtinf.catchupDays = catchupDaysMatch ? catchupDaysMatch[1] : undefined;

      const catchupSourceMatch = attrStr.match(/catchup-source="([^"]*)"/);
      currentExtinf.catchupSource = catchupSourceMatch ? catchupSourceMatch[1] : undefined;

      // Also set tvg-id as name if name includes a dash prefix pattern
      if (currentExtinf.tvgId && currentExtinf.name === currentExtinf.tvgId) {
        // keep tvgId as is, name is already set
      }
    } else if (line.startsWith("#EXTVLCOPT:")) {
      const opt = line.slice(11).trim();
      if (opt.startsWith("http-user-agent=")) {
        currentUserAgent = opt.slice("http-user-agent=".length);
      } else if (opt.startsWith("http-referrer=") || opt.startsWith("http-referer=")) {
        currentReferer = opt.slice(opt.startsWith("http-referrer=") ? "http-referrer=".length : "http-referer=".length);
      }
    } else if (line.startsWith("http://") || line.startsWith("https://")) {
      if (currentExtinf.name) {
        channels.push({
          id: currentExtinf.tvgId || slugify(name) || `ch-${channels.length}`,
          name: currentExtinf.name,
          url: line,
          logo: currentExtinf.logo || "",
          group: currentExtinf.group || "Uncategorized",
          tvgId: currentExtinf.tvgId || "",
          tvgName: currentExtinf.tvgName || currentExtinf.name,
          userAgent: currentUserAgent,
          referer: currentReferer,
          catchup: currentExtinf.catchup,
          catchupDays: currentExtinf.catchupDays,
          catchupSource: currentExtinf.catchupSource,
          order: channels.length,
        });
      }
      currentExtinf = {};
    }
  }

  return channels;
}

/**
 * Generate a unique playlist ID
 */
export function generatePlaylistId(): string {
  return `pl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
