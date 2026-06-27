"use client";
import { useMemo, useState, useEffect, useRef } from "react";
import { Search, List, Grid3X3, ChevronRight, Tv } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ChannelCard from "@/components/channel-card";
import { usePlaylist } from "@/hooks/use-playlist";

interface ChannelGridProps {
  initialGroup?: string | null;
}

export default function ChannelGrid({ initialGroup }: ChannelGridProps) {
  const { channels, loading } = usePlaylist();
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState(initialGroup || "");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    setGroupFilter(initialGroup || "");
    setSearch("");
  }, [initialGroup]);

  const filtered = useMemo(() => {
    let result = channels;
    if (groupFilter) {
      result = result.filter((ch) => ch.group === groupFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (ch) => ch.name.toLowerCase().includes(q) || ch.group.toLowerCase().includes(q)
      );
    }
    return result;
  }, [channels, groupFilter, search]);

  const grouped = useMemo(() => {
    const groups: Record<string, typeof channels> = {};
    for (const ch of filtered) {
      const g = ch.group || "Khác";
      if (!groups[g]) groups[g] = [];
      groups[g].push(ch);
    }
    return Object.entries(groups).sort(([a], [b]) => {
      if (a === "VTV") return -1;
      if (b === "VTV") return 1;
      return a.localeCompare(b);
    });
  }, [filtered]);

  const allGroups = useMemo(() => {
    const set = new Set(channels.map((ch) => ch.group).filter(Boolean));
    return Array.from(set).sort();
  }, [channels]);

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3">
            <div className="skeleton h-5 w-28 rounded-lg" />
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {[1, 2, 3, 4, 5, 6].map((j) => (
                <div key={j} className="skeleton aspect-video rounded-xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (channels.length === 0) return null;

  return (
    <div className="space-y-6">
      {/* Group filter pills */}
      {!groupFilter && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
          <button
            onClick={() => setGroupFilter("")}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium bg-primary/15 text-primary border border-primary/20 transition-colors"
          >
            Tất cả ({channels.length})
          </button>
          {allGroups.map((g) => (
            <button
              key={g}
              onClick={() => setGroupFilter(g)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground glass border-white/5 hover:text-foreground hover:border-white/10 transition-colors"
            >
              {g}
            </button>
          ))}
        </div>
      )}

      {/* Search + view toggle */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kênh..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 glass rounded-xl border-white/5 focus:border-primary/50 focus:ring-primary/25"
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          className="h-10 w-10 glass rounded-xl hover:bg-white/5"
        >
          {viewMode === "grid" ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
        </Button>
      </div>

      {/* Channel count */}
      <div className="flex items-center gap-2">
        <span className="live-badge px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white uppercase tracking-wider">
          Live
        </span>
        <p className="text-sm text-muted-foreground">
          {filtered.length} / {channels.length} kênh
        </p>
      </div>

      {/* Channels by group — Netflix horizontal rows */}
      {grouped.map(([group, groupChannels]) => (
        <section key={group} className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-primary/15 flex items-center justify-center">
              <Tv className="h-3.5 w-3.5 text-primary" />
            </div>
            <h2 className="text-base font-semibold">{group}</h2>
            <span className="text-xs text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full">
              {groupChannels.length}
            </span>
          </div>

          {viewMode === "list" ? (
            <div className="space-y-1">
              {groupChannels.map((ch) => (
                <ChannelCard key={ch.id} channel={ch} listMode />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-hide -mx-1 px-1 pb-2">
              <div className="flex gap-3" style={{ minWidth: "min-content" }}>
                {groupChannels.map((ch) => (
                  <div key={ch.id} className="w-[140px] sm:w-[160px] md:w-[180px] flex-shrink-0">
                    <ChannelCard channel={ch} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      ))}

      {grouped.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-16 w-16 rounded-2xl glass flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <p className="text-lg font-medium mb-1">Không tìm thấy kênh</p>
          <p className="text-sm text-muted-foreground">
            Thử tìm kiếm với từ khóa khác
          </p>
        </div>
      )}
    </div>
  );
}
