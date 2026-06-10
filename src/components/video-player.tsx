"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import { Play, Maximize, Minimize, Volume2, VolumeX } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface VideoPlayerProps {
  url: string;
  name: string;
  showFullscreen?: boolean;
}

export default function VideoPlayer({ url, name, showFullscreen }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(1);
  const [userInteracted, setUserInteracted] = useState(false);
  const mountedRef = useRef(true);

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
      video.crossOrigin = "anonymous";

      const hls = new Hls({
        lowLatencyMode: false,
        backBufferLength: 30,
        maxBufferLength: 30,
        startLevel: -1,
        liveDurationInfinity: true,
        liveSyncDurationCount: 3,
      });
      hlsRef.current = hls;
      hls.loadSource(url);
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
      video.src = url;
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
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
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

  const toggleFullscreen = useCallback(() => {
    const c = containerRef.current;
    if (!c) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else c.requestFullscreen();
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
      if (e.key === "m" && videoRef.current) videoRef.current.muted = !videoRef.current.muted;
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [togglePlay, toggleFullscreen]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden cursor-pointer select-none group"
      onClick={togglePlay}
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
          className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 transition-opacity cursor-pointer z-10"
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
            <Play className="h-6 w-6 text-white ml-1" fill="white" />
          </div>
        </div>
      )}

      {showFullscreen && (
        <button
          onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
          className="absolute top-2 right-2 z-10 h-9 w-9 rounded bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
          title={fullscreen ? "Thoát fullscreen" : "Phóng to"}
        >
          {fullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </button>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-2 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {userInteracted && (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={(e) => {
                e.stopPropagation();
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
              }}
              className="h-8 w-8 rounded bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors flex-shrink-0"
              title={muted ? "Bật âm thanh" : "Tắt âm thanh"}
            >
              {muted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <div className="w-20">
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
          className="h-8 w-8 rounded bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
          title={fullscreen ? "Thoát fullscreen (F)" : "Fullscreen (F)"}
        >
          {fullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
