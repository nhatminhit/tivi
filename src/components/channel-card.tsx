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
        className="group flex items-center gap-3 px-4 py-3 rounded-xl glass-card"
      >
        <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/5 flex-shrink-0 flex items-center justify-center ring-1 ring-white/10">
          {channel.logo ? (
            <img
              src={channel.logo}
              alt={channel.name}
              className="w-full h-full object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <Tv className="h-4 w-4 text-muted-foreground/50" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{channel.name}</p>
          <p className="text-xs text-muted-foreground truncate">{channel.group}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="live-badge px-2 py-0.5 rounded-full text-[10px] font-bold text-white uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
            Live
          </span>
          <Play className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all" />
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/channels/${encodeURIComponent(channel.id)}`}
      className="group relative glass-card rounded-2xl overflow-hidden"
    >
      {/* Channel logo */}
      <div className="aspect-video w-full bg-gradient-to-br from-white/[0.03] to-white/[0.01] flex items-center justify-center relative overflow-hidden">
        {channel.logo ? (
          <img
            src={channel.logo}
            alt={channel.name}
            className="w-16 h-16 object-contain group-hover:scale-110 transition-transform duration-500"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <Tv className="h-10 w-10 text-muted-foreground/30" />
        )}

        {/* Live badge */}
        <div className="absolute top-3 left-3">
          <span className="live-badge px-2 py-0.5 rounded-full text-[10px] font-bold text-white uppercase tracking-wider">
            Live
          </span>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
          <div className="h-12 w-12 rounded-full bg-primary/90 flex items-center justify-center shadow-xl shadow-primary/30 opacity-0 group-hover:opacity-100 group-hover:scale-100 scale-75 transition-all duration-300">
            <Play className="h-5 w-5 text-white ml-0.5" fill="white" />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-semibold truncate mb-0.5">{channel.name}</p>
        <p className="text-xs text-muted-foreground truncate">{channel.group}</p>
      </div>
    </Link>
  );
}
