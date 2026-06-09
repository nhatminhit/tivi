"use client";
import { useParams } from "next/navigation";
import { useMemo, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { usePlaylist } from "@/hooks/use-playlist";
import VideoPlayer from "@/components/video-player";
import ChannelSidebar from "@/components/channel-sidebar";
import { Button } from "@/components/ui/button";
import { Tv, PanelLeftClose } from "lucide-react";

export default function ChannelPage() {
  const params = useParams();
  const { channels, loading } = usePlaylist();
  const [showSidebar, setShowSidebar] = useState(false);
  const hoverZoneRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const channel = useMemo(() => {
    const id = decodeURIComponent(params.id as string);
    return channels.find((ch) => ch.id === id) || null;
  }, [channels, params.id]);

  const startHideTimer = useCallback(() => {
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowSidebar(false), 300);
  }, []);

  const cancelHide = useCallback(() => {
    clearTimeout(hideTimerRef.current);
  }, []);

  if (!channel && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Tv className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Không tìm thấy kênh</p>
        <Button variant="outline" asChild>
          <Link href="/channels">Danh sách kênh</Link>
        </Button>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative -mx-4 md:-mx-6" style={{ height: "calc(100dvh - 3.5rem)" }}>
      {/* Player full area */}
      <div className="absolute inset-0 flex flex-col">
        <div className="flex-1 bg-black min-h-0">
          <VideoPlayer
            url={channel.url}
            name={channel.name}
          />
        </div>
        <div className="flex items-center gap-3 px-4 py-2.5 bg-card border-t">
          <div className="flex items-center gap-2 min-w-0">
            {channel.logo && (
              <img
                src={channel.logo}
                alt=""
                className="w-5 h-5 object-contain rounded flex-shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            )}
            <span className="text-sm font-medium truncate">{channel.name}</span>
            <span className="text-xs text-muted-foreground hidden sm:inline truncate">
              {channel.group}
            </span>
          </div>
        </div>
      </div>

      {/* Hover zone — right edge trigger */}
      <div
        ref={hoverZoneRef}
        className="absolute right-0 top-0 bottom-0 w-4 z-30"
        onMouseEnter={() => { cancelHide(); setShowSidebar(true); }}
      />

      {/* Sidebar overlay */}
      <div
        ref={sidebarRef}
        onMouseEnter={cancelHide}
        onMouseLeave={startHideTimer}
        className={`absolute right-0 top-0 bottom-0 z-40 bg-background/95 backdrop-blur-md border-l shadow-2xl transition-all duration-200 ${
          showSidebar ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ width: "min(20rem, 80vw)" }}
      >
        <ChannelSidebar
          channels={channels}
          currentId={channel.id}
          onSelect={() => setShowSidebar(false)}
        />
      </div>

      {/* Close button when sidebar is open */}
      {showSidebar && (
        <button
          onClick={() => setShowSidebar(false)}
          onMouseEnter={cancelHide}
          className="absolute right-[min(20rem,80vw)] top-2 z-50 h-8 w-8 rounded-l-md bg-background/80 backdrop-blur border border-r-0 flex items-center justify-center hover:bg-accent transition-colors"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
