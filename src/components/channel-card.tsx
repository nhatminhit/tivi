"use client";
import Link from "next/link";
import { Play, Tv } from "lucide-react";
import type { Channel } from "@/lib/types";

interface ChannelCardProps {
  channel: Channel;
  listMode?: boolean;
}

export default function ChannelCard({ channel, listMode = false }: ChannelCardProps) {
  if (listMode) {
    return (
      <Link
        href={`/channels/${encodeURIComponent(channel.id)}`}
        className="group flex items-center gap-3 px-3 py-2 rounded-xl glass-card hover-glow"
      >
        <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/5 flex-shrink-0 flex items-center justify-center ring-1 ring-white/10">
          {channel.logo ? (
            <img
              src={channel.logo}
              alt={channel.name}
              className="w-full h-full object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <Tv className="h-3.5 w-3.5 text-muted-foreground/50" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{channel.name}</p>
          <p className="text-xs text-muted-foreground truncate">{channel.group}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="live-badge px-2 py-0.5 rounded-full text-[9px] font-bold text-white uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
            Live
          </span>
          <Play className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all" />
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/channels/${encodeURIComponent(channel.id)}`}
      className="group relative glass-card rounded-xl overflow-hidden hover-glow"
    >
      {/* Channel logo */}
      <div className="aspect-video w-full bg-gradient-to-br from-white/[0.03] to-white/[0.01] flex items-center justify-center relative overflow-hidden">
        {channel.logo ? (
          <img
            src={channel.logo}
            alt={channel.name}
            className="w-14 h-14 object-contain group-hover:scale-110 transition-transform duration-500"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <Tv className="h-8 w-8 text-muted-foreground/30" />
        )}

        {/* Live badge */}
        <div className="absolute top-2 left-2">
          <span className="live-badge px-1.5 py-0.5 rounded text-[9px] font-bold text-white uppercase tracking-wider">
            Live
          </span>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
          <div className="h-10 w-10 rounded-full bg-primary/90 flex items-center justify-center shadow-lg shadow-primary/30 opacity-0 group-hover:opacity-100 group-hover:scale-100 scale-75 transition-all duration-300">
            <Play className="h-4 w-4 text-white ml-0.5" fill="white" />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-2">
        <p className="text-sm font-semibold truncate">{channel.name}</p>
        <p className="text-xs text-muted-foreground truncate">{channel.group}</p>
      </div>
    </Link>
  );
}
