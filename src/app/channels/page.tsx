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
  const { channels } = usePlaylist();

  if (channels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
        <div className="h-20 w-20 rounded-2xl glass flex items-center justify-center">
          <Tv className="h-10 w-10 text-muted-foreground/30" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Chưa có danh sách kênh</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Đang tải playlist mặc định...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-4 space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">
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
