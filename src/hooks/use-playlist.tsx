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
  getActivePlaylistId,
  setActivePlaylistId,
  getDefaultLink,
  getAutoLoaded,
  setAutoLoaded,
} from "@/lib/storage";
import { generatePlaylistId, parseM3U } from "@/lib/m3u-parser";
import { toast } from "sonner";

interface PlaylistContextType {
  channels: Channel[];
  meta: PlaylistMeta | null;
  loading: boolean;
  allPlaylists: PlaylistMeta[];
  firstChannelId: string | null;
  loadPlaylist: (id: string) => Promise<void>;
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

  // Tìm kênh VTV1 để làm mặc định, fallback về kênh đầu tiên
  const resolveDefaultChannel = useCallback((chs: Channel[]) => {
    const vtv1 = chs.find(
      (ch) => ch.id === "vtv1hd" || ch.name.toLowerCase().startsWith("vtv1")
    );
    return vtv1 ? vtv1.id : chs.length > 0 ? chs[0].id : null;
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
      }
    } catch (err) {
      console.error("Failed to load playlist:", err);
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
      let fetchUrl = url;
      if (fetchUrl.includes("github.com") && fetchUrl.includes("/blob/")) {
        fetchUrl = fetchUrl
          .replace("github.com", "raw.githubusercontent.com")
          .replace("/blob/", "/");
      }
      const res = await fetch(fetchUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; TiviIPTV/1.0)" },
      });
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

  // Init: load active playlist — nếu chưa có, tự động fetch từ link mặc định
  useEffect(() => {
    (async () => {
      await refreshPlaylistList();
      const activeId = await getActivePlaylistId();

      if (activeId) {
        const existingMeta = await loadPlaylistMeta(activeId);
        if (existingMeta) {
          await loadPlaylist(activeId);
          return;
        }
      }

      const defaultLink = await getDefaultLink();
      if (defaultLink && !getAutoLoaded()) {
        setAutoLoaded(true);
        try {
          toast.info("Đang tải danh sách kênh...");
          await fetchAndSaveFromUrl(defaultLink);
          toast.success("Đã tải danh sách kênh");
        } catch (err: any) {
          toast.error(err.message || "Không thể tải playlist mặc định");
          setLoading(false);
          return;
        }
      }

      setLoading(false);
    })();
  }, [loadPlaylist, refreshPlaylistList, fetchAndSaveFromUrl]);

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
