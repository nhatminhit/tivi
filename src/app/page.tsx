"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlaylist } from "@/hooks/use-playlist";
import { Tv, Play, ChevronRight, Star, Flame, Radio, Film, Newspaper } from "lucide-react";
import { getDefaultLink } from "@/lib/storage";

export default function Home() {
  const router = useRouter();
  const { channels, loading, firstChannelId, allPlaylists } = usePlaylist();
  const [defaultUrl, setDefaultUrl] = useState("");

  useEffect(() => {
    getDefaultLink().then((url) => { if (url) setDefaultUrl(url); });
  }, [allPlaylists]);

  useEffect(() => {
    if (!loading && firstChannelId) {
      router.replace(`/channels/${encodeURIComponent(firstChannelId)}`);
    }
  }, [loading, firstChannelId, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl shadow-primary/30 animate-pulse">
          <Tv className="h-8 w-8 text-white" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold">TVStream</h2>
          <p className="text-muted-foreground text-sm">Đang tải danh sách kênh...</p>
        </div>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-1.5 w-8 rounded-full bg-primary/60 animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (channels.length > 0) return null;

  return (
    <div className="min-h-[calc(100dvh-4rem)] relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 container py-12 md:py-20">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs text-primary font-medium mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            Truyền hình trực tuyến
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
            Xem TV<span className="text-primary"> mọi lúc,</span>
            <br />mọi nơi
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-xl mx-auto">
            Hơn 260 kênh truyền hình, thể thao, phim ảnh.
            <br className="hidden sm:block" />
            Trải nghiệm xem TV chất lượng cao ngay trên trình duyệt.
          </p>
        </div>

        {/* Playlist uploader */}
        <div className="max-w-xl mx-auto">
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <Play className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Thêm danh sách kênh</h3>
                <p className="text-xs text-muted-foreground">Nhập URL M3U hoặc tải file lên</p>
              </div>
            </div>

            {allPlaylists.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                  Danh sách gần đây
                </p>
                {allPlaylists.slice(0, 3).map((pl) => (
                  <button
                    key={pl.id}
                    className="w-full text-left px-4 py-3 rounded-xl glass-card flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Tv className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{pl.name}</p>
                        <p className="text-xs text-muted-foreground">{pl.channelCount} kênh</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-3">Đang tải từ danh sách mặc định...</p>
                {defaultUrl && (
                  <p className="text-xs text-muted-foreground/60 break-all">{defaultUrl}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Feature categories */}
        <div className="max-w-4xl mx-auto mt-16">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6 text-center">
            Danh mục nội dung
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { label: "VTV", icon: Tv, color: "from-blue-600 to-blue-400" },
              { label: "HTV", icon: Star, color: "from-purple-600 to-purple-400" },
              { label: "Thể thao", icon: Flame, color: "from-red-600 to-red-400" },
              { label: "Phim", icon: Film, color: "from-emerald-600 to-emerald-400" },
              { label: "Radio", icon: Radio, color: "from-cyan-600 to-cyan-400" },
              { label: "Địa phương", icon: Newspaper, color: "from-amber-600 to-amber-400" },
            ].map((cat) => (
              <div key={cat.label} className="glass-card rounded-2xl p-4 flex flex-col items-center gap-2 cursor-pointer">
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center shadow-lg`}>
                  <cat.icon className="h-6 w-6 text-white" />
                </div>
                <span className="text-sm font-medium text-center">{cat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
