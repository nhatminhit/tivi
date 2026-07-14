"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import { Play, Maximize, Minimize, Volume2, VolumeX } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface VideoPlayerProps {
  url: string;
  name: string;
  userAgent?: string;
  referer?: string;
}

function proxyUrl(url: string, userAgent?: string, referer?: string): string {
  let u = `/api/stream?url=${encodeURIComponent(url)}`;
  if (userAgent) u += `&userAgent=${encodeURIComponent(userAgent)}`;
  if (referer) u += `&referer=${encodeURIComponent(referer)}`;
  return u;
}

export default function VideoPlayer({ url, name, userAgent, referer }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(1);
  const [userInteracted, setUserInteracted] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    const ios = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(ios);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    mountedRef.current = true;
    setLoading(true);
    setUserInteracted(false);

    const loadingTimeout = setTimeout(() => {
      if (mountedRef.current) setLoading(false);
    }, 20000);

    if (url.includes(".m3u8")) {
      const hls = new Hls({
        lowLatencyMode: false,
        backBufferLength: 30,
        maxBufferLength: 30,
        startLevel: -1,
        liveDurationInfinity: true,
        liveSyncDurationCount: 3,
      });
      hlsRef.current = hls;
      hls.loadSource(proxyUrl(url, userAgent, referer));
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (mountedRef.current) setLoading(false);
      });
      hls.on(Hls.Events.LEVEL_LOADED, () => {
        if (mountedRef.current) setLoading(false);
      });
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (!data.fatal) return;
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
        else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
      });
    } else {
      video.src = proxyUrl(url, userAgent, referer);
      video.onloadedmetadata = () => {
        if (mountedRef.current) setLoading(false);
      };
    }

    return () => {
      clearTimeout(loadingTimeout);
      mountedRef.current = false;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [url]);

  useEffect(() => {
    const handler = () => {
      const fs = !!document.fullscreenElement;
      const webkitFs = !!(document as any).webkitFullscreenElement;
      setFullscreen(fs || webkitFs);
    };
    document.addEventListener("fullscreenchange", handler);
    document.addEventListener("webkitfullscreenchange", handler);
    return () => {
      document.removeEventListener("fullscreenchange", handler);
      document.removeEventListener("webkitfullscreenchange", handler);
    };
  }, []);

  const handlePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    setUserInteracted(true);
    setMuted(false);
    v.muted = false;
    v.volume = volume;
    v.play().catch(() => {});
    setPaused(false);
  }, [volume]);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (!userInteracted) {
      handlePlay();
      return;
    }
    if (v.paused) { v.play().catch(() => {}); setPaused(false); }
    else { v.pause(); setPaused(true); }
  }, [userInteracted, handlePlay]);

  const handleVolumeChange = useCallback((value: number[]) => {
    const v = videoRef.current;
    if (!v) return;
    const vol = value[0];
    setVolume(vol);
    if (vol === 0) {
      v.muted = true;
      setMuted(true);
    } else {
      v.muted = false;
      setMuted(false);
      v.volume = vol;
    }
  }, []);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (muted) {
      v.muted = false;
      setMuted(false);
      v.volume = volume || 1;
    } else {
      v.muted = true;
      setMuted(true);
    }
  }, [muted, volume]);

  const toggleFullscreen = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
      return;
    }
    if ((v as any).webkitEnterFullscreen) {
      (v as any).webkitEnterFullscreen();
    } else {
      v.requestFullscreen();
    }
  }, []);

  const flashControls = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onPlay = () => setPaused(false);
    const onPause = () => setPaused(true);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    return () => { v.removeEventListener("play", onPlay); v.removeEventListener("pause", onPause); };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === " " || e.key === "k") { e.preventDefault(); togglePlay(); }
      if (e.key === "f") { e.preventDefault(); toggleFullscreen(); }
      if (e.key === "m") { e.preventDefault(); toggleMute(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [togglePlay, toggleFullscreen, toggleMute]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden cursor-pointer select-none group"
      onClick={togglePlay}
      onTouchStart={flashControls}
      title={name}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain pointer-events-none"
        playsInline
        autoPlay
        muted={muted}
        preload="auto"
      />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-white/30 border-t-white animate-spin" />
        </div>
      )}

      {!userInteracted && !loading && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 transition-opacity cursor-pointer z-[5]"
          onClick={(e) => { e.stopPropagation(); handlePlay(); }}
        >
          <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center hover:bg-white/30 transition-colors mb-3">
            <Play className="h-7 w-7 text-white ml-1" fill="white" />
          </div>
          <span className="text-white/80 text-sm font-medium">Nhấn để phát</span>
        </div>
      )}

      {paused && userInteracted && !loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity pointer-events-none">
          <div className="h-14 w-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
            <Play className="h-6 w-6 text-white ml-1" />
          </div>
        </div>
      )}

      {/* Controls — bottom left corner, doesn't conflict with right hover zone */}
      <div
        className="absolute bottom-0 left-0 p-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-[5]"
        data-show={showControls || undefined}
        style={{ opacity: showControls ? 1 : undefined }}
      >
        {userInteracted && !isIOS && (
          <div className="flex items-center gap-1.5 bg-black/50 rounded-lg px-2 py-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={(e) => { e.stopPropagation(); toggleMute(); }}
              className="h-7 w-7 rounded flex items-center justify-center text-white hover:bg-white/10 transition-colors flex-shrink-0"
              title={muted ? "Bật âm thanh" : "Tắt âm thanh"}
            >
              {muted || volume === 0 ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            </button>
            <div className="w-16">
              <Slider
                value={[muted ? 0 : volume]}
                min={0}
                max={1}
                step={0.05}
                onValueChange={handleVolumeChange}
              />
            </div>
          </div>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
          className="h-7 w-7 rounded bg-black/50 flex items-center justify-center text-white hover:bg-white/10 transition-colors flex-shrink-0"
          title={fullscreen ? "Thoát fullscreen (F)" : "Fullscreen (F)"}
        >
          {fullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}
