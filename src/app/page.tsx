"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePlaylist } from "@/hooks/use-playlist";
import { Tv } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { channels, loading, firstChannelId } = usePlaylist();

  useEffect(() => {
    if (!loading && firstChannelId) {
      router.replace(`/channels/${encodeURIComponent(firstChannelId)}`);
    }
  }, [loading, firstChannelId, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-5">
      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl shadow-primary/30 animate-pulse">
        <Tv className="h-7 w-7 text-white" />
      </div>
      <div className="text-center space-y-1">
        <h2 className="text-lg font-bold">TVStream</h2>
        <p className="text-muted-foreground text-sm">
          {loading ? "Đang tải danh sách kênh..." : "Không tìm thấy kênh nào"}
        </p>
      </div>
      {loading && (
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-1 w-6 rounded-full bg-primary/60 animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
