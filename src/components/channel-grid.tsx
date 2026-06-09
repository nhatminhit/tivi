"use client";
import { useMemo, useState } from "react";
import { Search, Tv, Grid3X3, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ChannelCard from "@/components/channel-card";
import { usePlaylist } from "@/hooks/use-playlist";

export default function ChannelGrid() {
  const { channels, loading } = usePlaylist();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredChannels = useMemo(() => {
    if (!search.trim()) return channels;
    const q = search.toLowerCase();
    return channels.filter(
      (ch) =>
        ch.name.toLowerCase().includes(q) ||
        ch.group.toLowerCase().includes(q)
    );
  }, [channels, search]);

  // Group channels by category
  const grouped = useMemo(() => {
    const groups: Record<string, typeof channels> = {};
    for (const ch of filteredChannels) {
      const g = ch.group || "Khác";
      if (!groups[g]) groups[g] = [];
      groups[g].push(ch);
    }
    return groups;
  }, [filteredChannels]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Đang tải danh sách kênh...</p>
        </div>
      </div>
    );
  }

  if (channels.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Search + view toggle */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kênh theo tên hoặc thể loại..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          title={viewMode === "grid" ? "Chuyển sang danh sách" : "Chuyển sang lưới"}
        >
          {viewMode === "grid" ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
        </Button>
      </div>

      {/* Channel count */}
      <p className="text-sm text-muted-foreground">
        {filteredChannels.length} / {channels.length} kênh
        {search && ` (tìm thấy ${filteredChannels.length})`}
      </p>

      {/* Channels by group */}
      {Object.entries(grouped).map(([group, groupChannels]) => (
        <section key={group}>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Tv className="h-4 w-4 text-primary" />
            {group}
            <span className="text-xs text-muted-foreground font-normal">
              ({groupChannels.length})
            </span>
          </h2>
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2"
                : "flex flex-col gap-1"
            }
          >
            {groupChannels.map((ch) => (
              <ChannelCard key={ch.id} channel={ch} listMode={viewMode === "list"} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
