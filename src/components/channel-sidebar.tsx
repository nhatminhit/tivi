"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ChevronDown, ChevronRight, Tv, Radio } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Channel } from "@/lib/types";

interface ChannelSidebarProps {
  channels: Channel[];
  currentId: string;
  onSelect?: () => void;
}

export default function ChannelSidebar({ channels, currentId, onSelect }: ChannelSidebarProps) {
  const [search, setSearch] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    if (!search.trim()) return channels;
    const q = search.toLowerCase();
    return channels.filter(
      (ch) => ch.name.toLowerCase().includes(q) || ch.group.toLowerCase().includes(q)
    );
  }, [channels, search]);

  const grouped = useMemo(() => {
    const groups: Record<string, Channel[]> = {};
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

  const toggleGroup = (group: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Radio className="h-3.5 w-3.5 text-primary" />
            Kênh
          </h2>
          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            {filtered.length}
          </span>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Tìm kênh..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9 text-sm glass rounded-lg border-white/5"
          />
        </div>
      </div>

      {/* Channel list */}
      <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-hide">
        {grouped.map(([group, groupChannels]) => {
          const isCollapsed = collapsedGroups.has(group);
          return (
            <div key={group}>
              <button
                onClick={() => toggleGroup(group)}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:bg-white/[0.03] transition-colors sticky top-0 bg-background/95 backdrop-blur z-10"
              >
                {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                <span className="truncate">{group}</span>
                <span className="ml-auto text-[10px] font-normal opacity-50">{groupChannels.length}</span>
              </button>

              {!isCollapsed &&
                groupChannels.map((ch) => {
                  const isActive = ch.id === currentId;
                  return (
                    <Link
                      key={ch.id}
                      href={`/channels/${encodeURIComponent(ch.id)}`}
                      data-channel-id={ch.id}
                      onClick={onSelect}
                      className={`flex items-center gap-3 px-4 py-2.5 transition-all duration-200 ${
                        isActive
                          ? "bg-primary/10 text-foreground border-l-2 border-primary"
                          : "text-muted-foreground border-l-2 border-transparent hover:bg-white/[0.03] hover:text-foreground hover:border-primary/30"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/5 flex-shrink-0 flex items-center justify-center ring-1 ring-white/5">
                        {ch.logo ? (
                          <img
                            src={ch.logo}
                            alt=""
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <Tv className="h-3.5 w-3.5 text-muted-foreground/40" />
                        )}
                      </div>
                      <span className={`text-sm truncate ${isActive ? "font-medium" : ""}`}>
                        {ch.name}
                      </span>
                      {isActive && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary animate-pulse flex-shrink-0" />
                      )}
                    </Link>
                  );
                })}
            </div>
          );
        })}

        {grouped.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <Search className="h-6 w-6 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground text-center">Không tìm thấy kênh</p>
          </div>
        )}
      </div>
    </div>
  );
}
