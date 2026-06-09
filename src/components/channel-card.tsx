"use client";
import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
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
        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors group"
      >
        <div className="w-8 h-8 rounded overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
          {channel.logo ? (
            <Image
              src={channel.logo}
              alt={channel.name}
              width={32}
              height={32}
              className="object-contain w-full h-full"
              unoptimized
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <Play className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <span className="text-sm truncate flex-1">{channel.name}</span>
        <Play className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </Link>
    );
  }

  return (
    <Link
      href={`/channels/${encodeURIComponent(channel.id)}`}
      className="group relative flex flex-col items-center gap-2 p-3 rounded-xl border bg-card hover:bg-accent transition-all hover:shadow-md hover:-translate-y-0.5"
    >
      <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
        {channel.logo ? (
          <Image
            src={channel.logo}
            alt={channel.name}
            width={64}
            height={64}
            className="object-contain w-full h-full"
            unoptimized
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <TvIcon />
        )}
      </div>
      <span className="text-xs text-center leading-tight line-clamp-2">{channel.name}</span>
      {/* Hover overlay */}
      <div className="absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="h-10 w-10 rounded-full bg-primary/90 flex items-center justify-center">
            <Play className="h-5 w-5 text-white ml-0.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}

function TvIcon() {
  return (
    <svg
      className="h-8 w-8 text-muted-foreground"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v12.75c0 .621.504 1.125 1.125 1.125Z"
      />
    </svg>
  );
}
