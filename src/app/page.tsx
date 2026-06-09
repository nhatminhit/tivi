"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PlaylistUploader from "@/components/playlist-uploader";
import { usePlaylist } from "@/hooks/use-playlist";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tv, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { getDefaultLink } from "@/lib/storage";

export default function Home() {
  const router = useRouter();
  const { channels, meta, loading, allPlaylists, firstChannelId } = usePlaylist();
  const [defaultUrl, setDefaultUrl] = useState("");

  useEffect(() => {
    getDefaultLink().then((url) => {
      if (url) setDefaultUrl(url);
    });
  }, [allPlaylists]);

  // Tự động redirect sang kênh đầu tiên sau khi load xong
  useEffect(() => {
    if (!loading && firstChannelId) {
      router.replace(`/channels/${encodeURIComponent(firstChannelId)}`);
    }
  }, [loading, firstChannelId, router]);

  // Khi đang loading → chỉ hiển thị spinner
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Đang tải danh sách kênh...</p>
      </div>
    );
  }

  // Nếu đã có channels thì đang redirect, không hiện gì
  if (channels.length > 0) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-8 py-8 md:py-12">
      {/* Hero */}
      <div className="text-center space-y-2 max-w-lg">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          Xem truyền hình IPTV
        </h1>
        <p className="text-muted-foreground">
          Tải danh sách kênh M3U và xem trực tiếp trên trình duyệt
        </p>
      </div>

      {/* Upload area */}
      <div className="w-full max-w-xl">
        <PlaylistUploader />
      </div>

      {/* Recent playlists */}
      {allPlaylists.length > 0 && (
        <div className="w-full max-w-xl space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Danh sách gần đây
          </h2>
          {allPlaylists.slice(0, 5).map((pl) => (
            <RecentPlaylistItem key={pl.id} playlist={pl} />
          ))}
        </div>
      )}

      {/* Hint about default source */}
      {!allPlaylists.length && (
        <Card className="w-full max-w-xl">
          <CardContent className="pt-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Đang tải danh sách kênh từ link mặc định. Thêm link khác trong{" "}
              <Link href="/settings" className="text-primary underline underline-offset-2">
                Cài đặt
              </Link>
            </p>
            {defaultUrl && (
              <p className="text-xs text-muted-foreground break-all">
                Link hiện tại: {defaultUrl}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function RecentPlaylistItem({ playlist }: { playlist: { id: string; name: string; channelCount: number; createdAt: number } }) {
  const { loadPlaylist } = usePlaylist();
  return (
    <button
      onClick={() => loadPlaylist(playlist.id)}
      className="w-full text-left px-4 py-3 rounded-lg border bg-card hover:bg-accent transition-colors flex items-center justify-between"
    >
      <div>
        <p className="text-sm font-medium">{playlist.name}</p>
        <p className="text-xs text-muted-foreground">
          {playlist.channelCount} kênh &middot;{" "}
          {new Date(playlist.createdAt).toLocaleDateString("vi-VN")}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}
