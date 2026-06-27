"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { Channel, PlaylistMeta } from "@/lib/types";
import {
  savePlaylist,
  loadPlaylistChannels,
  loadPlaylistMeta,
  listPlaylists,
  deletePlaylist,
  setActivePlaylistId,
  getDefaultLink,
} from "@/lib/storage";
import { generatePlaylistId, parseM3U } from "@/lib/m3u-parser";
import { toast } from "sonner";


interface PlaylistContextType {
  channels: Channel[];
  meta: PlaylistMeta | null;
  loading: boolean;
  allPlaylists: PlaylistMeta[];
  firstChannelId: string | null;
  loadPlaylist: (id: string) => Promise<number>;
  saveAndActivate: (meta: PlaylistMeta, channels: Channel[]) => Promise<string>;
  removePlaylist: (id: string) => Promise<void>;
  fetchAndSaveFromUrl: (url: string) => Promise<void>;
}

const PlaylistContext = createContext<PlaylistContextType | null>(null);

export function PlaylistProvider({ children }: { children: ReactNode }) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [meta, setMeta] = useState<PlaylistMeta | null>(null);
  const [allPlaylists, setAllPlaylists] = useState<PlaylistMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [firstChannelId, setFirstChannelId] = useState<string | null>(null);

  // Tìm VTV1 — ưu tiên theo id cũ, sau đó tên, rồi group+name combo
  const resolveDefaultChannel = useCallback((chs: Channel[]) => {
    const vtv1 = chs.find((ch) => ch.id === "vtv1hd");
    if (vtv1) return vtv1.id;
    const vtv1ByName = chs.find((ch) => ch.name.trim().toLowerCase() === "vtv1");
    if (vtv1ByName) return vtv1ByName.id;
    const vtv1ByGroup = chs.find((ch) => ch.group === "VTV" && ch.name.trim().toLowerCase() === "vtv1");
    if (vtv1ByGroup) return vtv1ByGroup.id;
    return chs.length > 0 ? chs[0].id : null;
  }, []);

  const refreshPlaylistList = useCallback(async () => {
    const list = await listPlaylists();
    setAllPlaylists(list.sort((a, b) => b.createdAt - a.createdAt));
  }, []);

  const loadPlaylist = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const [m, chs] = await Promise.all([
        loadPlaylistMeta(id),
        loadPlaylistChannels(id),
      ]);
      if (m) {
        setMeta(m);
        setChannels(chs);
        setFirstChannelId(resolveDefaultChannel(chs));
        await setActivePlaylistId(id);
        return chs.length; // return count để caller kiểm tra
      }
      return 0;
    } catch (err) {
      console.error("Failed to load playlist:", err);
      return 0;
    } finally {
      setLoading(false);
    }
  }, []);

  const saveAndActivate = useCallback(
    async (newMeta: PlaylistMeta, chs: Channel[]): Promise<string> => {
      const id = newMeta.id || generatePlaylistId();
      const metaWithId = { ...newMeta, id };
      await savePlaylist(metaWithId, chs);
      await setActivePlaylistId(id);
      await loadPlaylist(id);
      await refreshPlaylistList();
      return id;
    },
    [loadPlaylist, refreshPlaylistList]
  );

  const removePlaylist = useCallback(
    async (id: string) => {
      await deletePlaylist(id);
      await refreshPlaylistList();
      if (meta?.id === id) {
        setMeta(null);
        setChannels([]);
        setFirstChannelId(null);
      }
    },
    [meta, refreshPlaylistList]
  );

  const fetchAndSaveFromUrl = useCallback(
    async (url: string) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const content = await res.text();
      const parsed = parseM3U(content);
      if (parsed.length === 0) throw new Error("Không tìm thấy kênh nào");
      const name = url.split("/").pop() || "Playlist";
      await saveAndActivate(
        {
          id: generatePlaylistId(),
          name,
          source: "url",
          url,
          channelCount: parsed.length,
          createdAt: Date.now(),
        },
        parsed
      );
    },
    [saveAndActivate]
  );

  // Init: mỗi lần mở app → fetch fresh từ GitHub
  useEffect(() => {
    (async () => {
      await refreshPlaylistList();
      try {
        const defaultLink = await getDefaultLink();
        if (defaultLink) {
          await fetchAndSaveFromUrl(defaultLink);
        } else {
          setLoading(false);
        }
      } catch (err: any) {
        toast.error(err.message || "Không thể tải playlist");
        setLoading(false);
      }
    })();
  }, [refreshPlaylistList, fetchAndSaveFromUrl]);

  return (
    <PlaylistContext.Provider
      value={{
        channels,
        meta,
        loading,
        allPlaylists,
        firstChannelId,
        loadPlaylist,
        saveAndActivate,
        removePlaylist,
        fetchAndSaveFromUrl,
      }}
    >
      {children}
    </PlaylistContext.Provider>
  );
}

export function usePlaylist() {
  const ctx = useContext(PlaylistContext);
  if (!ctx) throw new Error("usePlaylist must be used within PlaylistProvider");
  return ctx;
}
