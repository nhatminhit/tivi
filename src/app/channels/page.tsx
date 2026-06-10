"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ChannelGrid from "@/components/channel-grid";
import { usePlaylist } from "@/hooks/use-playlist";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Tv, X } from "lucide-react";

function ChannelsContent() {
  const searchParams = useSearchParams();
  const group = searchParams.get("group");
  const { channels, meta } = usePlaylist();

  if (channels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
        <div className="h-20 w-20 rounded-2xl glass flex items-center justify-center">
          <Tv className="h-10 w-10 text-muted-foreground/30" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Chưa có danh sách kênh</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Thêm playlist M3U để bắt đầu xem truyền hình
          </p>
        </div>
        <Button asChild className="glass rounded-xl px-6">
          <Link href="/">
            <Plus className="h-4 w-4 mr-2" />
            Thêm playlist
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="pt-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          {group || "Tất cả kênh"}
        </h1>
        <div className="flex items-center gap-3 flex-wrap">
          <p className="text-sm text-muted-foreground">
            {channels.length} kênh đang hoạt động
          </p>
          {group && (
            <Link
              href="/channels"
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
            >
              {group}
              <X className="h-3 w-3" />
            </Link>
          )}
        </div>
      </div>

      <ChannelGrid initialGroup={group} />
    </div>
  );
}

export default function ChannelsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    }>
      <ChannelsContent />
    </Suspense>
  );
}
