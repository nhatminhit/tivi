"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Tv } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Channel } from "@/lib/types";

interface ChannelSidebarProps {
  channels: Channel[];
  currentId: string;
  onSelect?: () => void;
}

export default function ChannelSidebar({ channels, currentId, onSelect }: ChannelSidebarProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return channels;
    const q = search.toLowerCase();
    return channels.filter(
      (ch) => ch.name.toLowerCase().includes(q) || ch.group.toLowerCase().includes(q)
    );
  }, [channels, search]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b">
        <h2 className="text-sm font-semibold mb-2">Danh sách kênh</h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Tìm kênh..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-sm"
          />
        </div>
      </div>

      {/* Channel count */}
      <div className="px-3 py-1.5 text-xs text-muted-foreground border-b">
        {filtered.length} / {channels.length} kênh
      </div>

      {/* Channel list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.map((ch) => {
          const isActive = ch.id === currentId;
          return (
            <Link
              key={ch.id}
              href={`/channels/${encodeURIComponent(ch.id)}`}
              data-channel-id={ch.id}
              onClick={onSelect}
              className={`flex items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-accent ${
                isActive
                  ? "bg-accent font-medium text-foreground border-l-2 border-primary"
                  : "text-muted-foreground border-l-2 border-transparent"
              }`}
            >
              {ch.logo ? (
                <img
                  src={ch.logo}
                  alt=""
                  className="w-6 h-6 object-contain rounded flex-shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <Tv className="w-6 h-6 p-0.5 text-muted-foreground flex-shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate">{ch.name}</p>
                <p className="text-[10px] text-muted-foreground truncate leading-tight">{ch.group}</p>
              </div>
            </Link>
          );
        })}
        {filtered.length === 0 && (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">
            Không tìm thấy kênh
          </p>
        )}
      </div>
    </div>
  );
}
