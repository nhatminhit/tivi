"use client";
import { useParams } from "next/navigation";
import { useMemo, useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { usePlaylist } from "@/hooks/use-playlist";
import VideoPlayer from "@/components/video-player";
import ChannelSidebar from "@/components/channel-sidebar";
import { Button } from "@/components/ui/button";
import { Tv, PanelLeftClose, ChevronLeft, ChevronRight } from "lucide-react";

export default function ChannelPage() {
  const params = useParams();
  const { channels, loading } = usePlaylist();
  const [showSidebar, setShowSidebar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileListOpen, setMobileListOpen] = useState(false);
  const hoverZoneRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const channel = useMemo(() => {
    const id = decodeURIComponent(params.id as string);
    return channels.find((ch) => ch.id === id) || null;
  }, [channels, params.id]);

  // Find prev/next channel
  const channelIndex = useMemo(() => {
    if (!channel) return -1;
    return channels.findIndex((ch) => ch.id === channel.id);
  }, [channel, channels]);

  const prevChannel = channelIndex > 0 ? channels[channelIndex - 1] : null;
  const nextChannel = channelIndex >= 0 && channelIndex < channels.length - 1 ? channels[channelIndex + 1] : null;

  const startHideTimer = useCallback(() => {
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowSidebar(false), 300);
  }, []);

  const cancelHide = useCallback(() => {
    clearTimeout(hideTimerRef.current);
  }, []);

  if (!channel && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6">
        <div className="h-20 w-20 rounded-2xl glass flex items-center justify-center">
          <Tv className="h-10 w-10 text-muted-foreground/30" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold mb-2">Không tìm thấy kênh</p>
          <p className="text-sm text-muted-foreground mb-4">Kênh này có thể đã bị xóa hoặc không tồn tại</p>
        </div>
        <Button variant="outline" asChild className="glass rounded-xl">
          <Link href="/channels">Quay lại danh sách</Link>
        </Button>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl shadow-primary/30 animate-pulse">
            <Tv className="h-6 w-6 text-white" />
          </div>
          <p className="text-sm text-muted-foreground">Đang tải kênh...</p>
        </div>
      </div>
    );
  }

  // Mobile layout: player top, channel list bottom
  if (isMobile) {
    return (
      <div className="flex flex-col h-[calc(100dvh-4rem)] overflow-hidden">
        {/* Player */}
        <div
          className={`bg-black shrink-0 ${mobileListOpen ? "h-[40dvh]" : "h-[calc(100dvh-4rem-3.5rem)]"}`}
          style={{ transition: "height 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }}
        >
          <VideoPlayer url={channel.url} name={channel.name} showFullscreen />
        </div>

        {/* Channel info bar */}
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 glass border-t border-white/5 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/5 flex-shrink-0 flex items-center justify-center ring-1 ring-white/10">
              {channel.logo ? (
                <img src={channel.logo} alt="" className="w-full h-full object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <Tv className="h-4 w-4 text-muted-foreground/40" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold truncate">{channel.name}</p>
              <p className="text-xs text-muted-foreground truncate">{channel.group}</p>
            </div>
          </div>
          <button
            onClick={() => setMobileListOpen((v) => !v)}
            className="text-xs text-primary font-medium hover:text-primary/80 transition-colors"
          >
            {mobileListOpen ? "Thu gọn" : "Danh sách kênh"}
          </button>
        </div>

        {/* Channel list (bottom panel) */}
        <div
          className="flex-1 min-h-0 overflow-hidden"
          style={{
            maxHeight: mobileListOpen ? "55dvh" : "0",
            transition: "max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <div className="h-full overflow-y-auto">
            <ChannelSidebar channels={channels} currentId={channel.id} onSelect={() => setMobileListOpen(false)} />
          </div>
        </div>
      </div>
    );
  }

  // Desktop layout: player + sidebar
  return (
    <div className="relative -mx-4 md:-mx-6" style={{ height: "calc(100dvh - 4rem)" }}>
      <div className="absolute inset-0 flex">
        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Player */}
          <div className="flex-1 bg-black min-h-0 relative">
            <VideoPlayer url={channel.url} name={channel.name} />

            {/* Navigation arrows */}
            {prevChannel && (
              <Link
                href={`/channels/${encodeURIComponent(prevChannel.id)}`}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full glass flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all"
                title={prevChannel.name}
              >
                <ChevronLeft className="h-5 w-5 text-white" />
              </Link>
            )}
            {nextChannel && (
              <Link
                href={`/channels/${encodeURIComponent(nextChannel.id)}`}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full glass flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all"
                title={nextChannel.name}
              >
                <ChevronRight className="h-5 w-5 text-white" />
              </Link>
            )}
          </div>

          {/* Channel info bar */}
          <div className="flex items-center gap-4 px-6 py-3 glass border-t border-white/5">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/5 flex-shrink-0 flex items-center justify-center ring-1 ring-white/10">
              {channel.logo ? (
                <img src={channel.logo} alt="" className="w-full h-full object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <Tv className="h-4 w-4 text-muted-foreground/40" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{channel.name}</p>
              <p className="text-xs text-muted-foreground truncate">{channel.group}</p>
            </div>
            <span className="live-badge px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white uppercase tracking-wider">
              Live
            </span>
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
          className={`absolute right-0 top-0 bottom-0 z-40 glass border-l border-white/5 shadow-2xl transition-all duration-300 ${
            showSidebar ? "translate-x-0" : "translate-x-full"
          }`}
          style={{ width: "min(22rem, 80vw)" }}
        >
          <ChannelSidebar channels={channels} currentId={channel.id} onSelect={() => setShowSidebar(false)} />
        </div>

        {/* Close button */}
        {showSidebar && (
          <button
            onClick={() => setShowSidebar(false)}
            onMouseEnter={cancelHide}
            className="absolute right-[min(22rem,80vw)] top-2 z-50 h-8 w-8 rounded-l-lg glass border border-r-0 border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <PanelLeftClose className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
}
