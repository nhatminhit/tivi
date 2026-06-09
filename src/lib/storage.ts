import { openDB, type IDBPDatabase } from "idb";
import type { Channel, PlaylistMeta } from "./types";

const DB_NAME = "tivi-db";
const DB_VERSION = 3;

interface TiviDB {
  channels: Channel[];
  playlists: PlaylistMeta[];
}

let dbPromise: Promise<IDBPDatabase<TiviDB>> | null = null;

function getDB(): Promise<IDBPDatabase<TiviDB>> {
  if (!dbPromise) {
    dbPromise = openDB<TiviDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 2) {
          db.createObjectStore("playlists", { keyPath: "id" });
          const store = db.createObjectStore("channels", { keyPath: "id" });
          store.createIndex("playlistId", "playlistId");
        }
        if (oldVersion >= 2) {
          // Xoá toàn bộ DB cũ để reset sạch
          db.deleteObjectStore("channels");
          db.deleteObjectStore("playlists");
          db.createObjectStore("playlists", { keyPath: "id" });
          const store = db.createObjectStore("channels", { keyPath: "id" });
          store.createIndex("playlistId", "playlistId");
          // Xoá cả localStorage keys (có thể fail trong private browsing)
          try {
            localStorage.removeItem("tivi-active-playlist");
            localStorage.removeItem("tivi-auto-loaded");
            localStorage.removeItem("tivi-default-link");
          } catch {
            // noop — private browsing hoặc sandboxed iframe
          }
        }
      },
    });
  }
  return dbPromise;
}

export async function savePlaylist(
  meta: PlaylistMeta,
  channels: Channel[]
): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(["playlists", "channels"], "readwrite");

  await tx.objectStore("playlists").put(meta);

  const channelStore = tx.objectStore("channels");
  const channelsWithPlaylist = channels.map((ch) => ({
    ...ch,
    playlistId: meta.id,
  }));

  // Delete existing channels for this playlist, then add new ones
  const index = channelStore.index("playlistId");
  const existing = await index.getAll(meta.id);
  for (const ch of existing) {
    await channelStore.delete(ch.id);
  }
  for (const ch of channelsWithPlaylist) {
    await channelStore.put(ch as Channel & { playlistId: string });
  }

  await tx.done;
}

export async function loadPlaylistMeta(
  playlistId: string
): Promise<PlaylistMeta | undefined> {
  const db = await getDB();
  return db.get("playlists", playlistId);
}

export async function loadPlaylistChannels(
  playlistId: string
): Promise<Channel[]> {
  const db = await getDB();
  const index = db.transaction("channels").store.index("playlistId");
  const channels = await index.getAll(playlistId);
  channels.sort((a, b) => {
    // VTV group lên đầu
    const aIsVtv = a.group === "VTV" ? 0 : 1;
    const bIsVtv = b.group === "VTV" ? 0 : 1;
    if (aIsVtv !== bIsVtv) return aIsVtv - bIsVtv;

    // Trong cùng nhóm, sort theo thứ tự file
    if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
    if (a.order !== undefined) return -1;
    if (b.order !== undefined) return 1;
    return 0;
  });
  return channels;
}

export async function listPlaylists(): Promise<PlaylistMeta[]> {
  const db = await getDB();
  return db.getAll("playlists");
}

export async function deletePlaylist(playlistId: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(["playlists", "channels"], "readwrite");

  await tx.objectStore("playlists").delete(playlistId);

  const index = tx.objectStore("channels").index("playlistId");
  const existing = await index.getAll(playlistId);
  for (const ch of existing) {
    await tx.objectStore("channels").delete(ch.id);
  }

  await tx.done;
}

export async function getActivePlaylistId(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("tivi-active-playlist");
}

export async function setActivePlaylistId(id: string): Promise<void> {
  if (typeof window === "undefined") return;
  localStorage.setItem("tivi-active-playlist", id);
}

const DEFAULT_LINK_KEY = "tivi-default-link";
export const BUILTIN_DEFAULT_LINK =
  "https://raw.githubusercontent.com/vietng228/m3u/main/new.m3u";

export async function getDefaultLink(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(DEFAULT_LINK_KEY) || BUILTIN_DEFAULT_LINK;
}

export async function setDefaultLink(url: string | null): Promise<void> {
  if (typeof window === "undefined") return;
  if (url) {
    localStorage.setItem(DEFAULT_LINK_KEY, url);
  } else {
    localStorage.removeItem(DEFAULT_LINK_KEY);
  }
}

const AUTO_LOADED_KEY = "tivi-auto-loaded";

export function getAutoLoaded(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(AUTO_LOADED_KEY) === "true";
}

export function setAutoLoaded(v: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTO_LOADED_KEY, v ? "true" : "false");
}
