"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import { Play, Maximize, Minimize } from "lucide-react";

interface VideoPlayerProps {
  url: string;
  name: string;
  userAgent?: string;
  referer?: string;
}

export default function VideoPlayer({ url, name, userAgent, referer }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    mountedRef.current = true;
    setLoading(true);

    if (referer) video.crossOrigin = "anonymous";

    if (url.includes(".m3u8") && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
        startLevel: -1,
      });
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (mountedRef.current) {
          setLoading(false);
          video.play().catch(() => {});
        }
      });
      hls.on(Hls.Events.LEVEL_LOADED, () => {
        if (mountedRef.current) setLoading(false);
      });
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
          else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
        }
      });
    } else {
      video.src = url;
      video.onloadedmetadata = () => {
        if (mountedRef.current) setLoading(false);
        video.play().catch(() => {});
      };
    }

    return () => {
      mountedRef.current = false;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [url, userAgent, referer]);

  // Track fullscreen state
  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play().catch(() => {}); setPaused(false); }
    else { v.pause(); setPaused(true); }
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

  // Keyboard
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
        preload="auto"
      />

      {/* Loading spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-white/30 border-t-white animate-spin" />
        </div>
      )}

      {/* Center play icon when paused */}
      {paused && !loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity">
          <div className="h-14 w-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
            <Play className="h-6 w-6 text-white ml-1" fill="white" />
          </div>
        </div>
      )}

      {/* Bottom overlay: fullscreen button */}
      <div className="absolute bottom-0 left-0 right-0 p-2 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
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
