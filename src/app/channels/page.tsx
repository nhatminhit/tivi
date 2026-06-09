"use client";
import ChannelGrid from "@/components/channel-grid";
import { usePlaylist } from "@/hooks/use-playlist";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export default function ChannelsPage() {
  const { channels, meta } = usePlaylist();

  if (channels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-muted-foreground">Chưa có danh sách kênh nào</p>
        <Button asChild>
          <Link href="/">
            <Plus className="h-4 w-4 mr-1" />
            Thêm playlist
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">
          {meta?.name || "Danh sách kênh"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {channels.length} kênh
        </p>
      </div>
      <ChannelGrid />
    </div>
  );
}
