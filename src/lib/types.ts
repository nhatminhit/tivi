export interface Channel {
  id: string;
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
  order: number;
}

export interface ServerInfo {
  index: number;
  label: string;
  url: string;
}

export interface PlaylistMeta {
  id: string;
  name: string;
  source: "url" | "file";
  url?: string;
  channelCount: number;
  createdAt: number;
}
