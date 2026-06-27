"use client";
import { useParams } from "next/navigation";
import { useMemo, useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { usePlaylist } from "@/hooks/use-playlist";
import VideoPlayer from "@/components/video-player";
import ChannelSidebar from "@/components/channel-sidebar";
import { Button } from "@/components/ui/button";
import { Tv, ChevronLeft, ChevronRight, List } from "lucide-react";

export default function ChannelPage() {
  const params = useParams();
  const { channels, loading } = usePlaylist();
  const [showSidebar, setShowSidebar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileListOpen, setMobileListOpen] = useState(false);
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

  const channelIndex = useMemo(() => {
    if (!channel) return -1;
    return channels.findIndex((ch) => ch.id === channel.id);
  }, [channel, channels]);

  const prevChannel = channelIndex > 0 ? channels[channelIndex - 1] : null;
  const nextChannel = channelIndex >= 0 && channelIndex < channels.length - 1 ? channels[channelIndex + 1] : null;

  const cancelHide = useCallback(() => {
    clearTimeout(hideTimerRef.current);
  }, []);

  const scheduleHide = useCallback(() => {
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowSidebar(false), 400);
  }, []);

  useEffect(() => {
    return () => clearTimeout(hideTimerRef.current);
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

  // Mobile layout
  if (isMobile) {
    return (
      <div className="flex flex-col h-[calc(100dvh-3.5rem)] overflow-hidden">
        <div
          className={`bg-black shrink-0 ${mobileListOpen ? "h-[40dvh]" : "flex-1"}`}
          style={{ transition: "height 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }}
        >
          <VideoPlayer url={channel.url} name={channel.name} />
        </div>

        <div className="flex items-center justify-between gap-3 px-3 py-2 glass border-t border-white/5 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg overflow-hidden bg-white/5 flex-shrink-0 flex items-center justify-center ring-1 ring-white/10">
              {channel.logo ? (
                <img src={channel.logo} alt="" className="w-full h-full object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <Tv className="h-3.5 w-3.5 text-muted-foreground/40" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{channel.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{channel.group}</p>
            </div>
          </div>
          <button
            onClick={() => setMobileListOpen((v) => !v)}
            className="flex items-center gap-1 text-xs text-primary font-medium hover:text-primary/80 transition-colors"
          >
            <List className="h-3.5 w-3.5" />
            {mobileListOpen ? "Thu gọn" : "Kênh"}
          </button>
        </div>

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

  // Desktop layout: player full width + hover sidebar overlay
  return (
    <div className="-mx-4 md:-mx-6 relative" style={{ height: "calc(100dvh - 3.5rem)" }}>
      {/* Player — full width */}
      <div className="absolute inset-0 bg-black group/player">
        <VideoPlayer url={channel.url} name={channel.name} />

        {prevChannel && (
          <Link
            href={`/channels/${encodeURIComponent(prevChannel.id)}`}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full glass flex items-center justify-center opacity-0 group-hover/player:opacity-100 hover:bg-white/10 transition-all"
            title={prevChannel.name}
          >
            <ChevronLeft className="h-5 w-5 text-white" />
          </Link>
        )}
        {nextChannel && (
          <Link
            href={`/channels/${encodeURIComponent(nextChannel.id)}`}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full glass flex items-center justify-center opacity-0 group-hover/player:opacity-100 hover:bg-white/10 transition-all"
            title={nextChannel.name}
          >
            <ChevronRight className="h-5 w-5 text-white" />
          </Link>
        )}

        {/* Channel info — bottom overlay */}
        <div className="absolute bottom-0 left-0 right-0 z-10 glass border-t border-white/5 opacity-0 group-hover/player:opacity-100 transition-opacity duration-300">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-7 h-7 rounded-lg overflow-hidden bg-white/5 flex-shrink-0 flex items-center justify-center ring-1 ring-white/10">
              {channel.logo ? (
                <img src={channel.logo} alt="" className="w-full h-full object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <Tv className="h-3.5 w-3.5 text-muted-foreground/40" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{channel.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{channel.group}</p>
            </div>
            <span className="live-badge px-2 py-0.5 rounded text-[9px] font-bold text-white uppercase tracking-wider">
              Live
            </span>
          </div>
        </div>
      </div>

      {/* Hover zone — right edge trigger */}
      <div
        className="absolute right-0 top-0 bottom-0 w-4 z-30"
        onMouseEnter={() => { cancelHide(); setShowSidebar(true); }}
        onMouseLeave={scheduleHide}
      />

      {/* Sidebar overlay — slides in */}
      <div
        className="absolute right-0 top-0 bottom-0 z-40 will-change-transform transition-transform duration-300 ease-in-out"
        style={{
          width: "min(18rem, 70vw)",
          transform: showSidebar ? "translateX(0)" : "translateX(100%)",
        }}
        onMouseEnter={cancelHide}
        onMouseLeave={scheduleHide}
      >
        <div className="h-full glass border-l border-white/5 shadow-2xl">
          <ChannelSidebar channels={channels} currentId={channel.id} onSelect={() => setShowSidebar(false)} />
        </div>
      </div>
    </div>
  );
}
