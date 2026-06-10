"use client";
import { useMemo, useState, useEffect } from "react";
import { Search, Grid3X3, List, ChevronDown, ChevronRight, Tv } from "lucide-react";
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
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

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

  // All unique groups for the filter pills
  const allGroups = useMemo(() => {
    const set = new Set(channels.map((ch) => ch.group).filter(Boolean));
    return Array.from(set).sort();
  }, [channels]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3">
            <div className="skeleton h-6 w-32 rounded-lg" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="skeleton aspect-video rounded-2xl" />
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
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kênh theo tên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 h-12 glass rounded-xl border-white/5 focus:border-primary/50 focus:ring-primary/25"
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          className="h-12 w-12 glass rounded-xl hover:bg-white/5"
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

      {/* Channels by group */}
      {grouped.map(([group, groupChannels]) => {
        const isCollapsed = collapsed.has(group);
        return (
          <section key={group}>
            <button
              onClick={() => {
                const next = new Set(collapsed);
                if (next.has(group)) next.delete(group);
                else next.add(group);
                setCollapsed(next);
              }}
              className="flex items-center gap-3 mb-4 group cursor-pointer"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              )}
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center">
                <Tv className="h-4 w-4 text-primary" />
              </div>
              <h2 className="text-lg font-semibold">{group}</h2>
              <span className="text-xs text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full">
                {groupChannels.length}
              </span>
            </button>

            {!isCollapsed && (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
                    : "space-y-2"
                }
              >
                {groupChannels.map((ch) => (
                  <ChannelCard key={ch.id} channel={ch} listMode={viewMode === "list"} />
                ))}
              </div>
            )}
          </section>
        );
      })}

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
