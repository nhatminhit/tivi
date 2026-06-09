"use client";
import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { Channel } from "@/lib/types";

interface PlayerContextType {
  currentChannel: Channel | null;
  isPlaying: boolean;
  play: (channel: Channel) => void;
  stop: () => void;
  togglePlayPause: () => void;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<any>(null);

  const stop = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.removeAttribute("src");
      videoRef.current.load();
    }
    setIsPlaying(false);
  }, []);

  const play = useCallback(
    (channel: Channel) => {
      stop();
      setCurrentChannel(channel);
      setIsPlaying(true);
    },
    [stop]
  );

  const togglePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, []);

  return (
    <PlayerContext.Provider
      value={{ currentChannel, isPlaying, play, stop, togglePlayPause }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}

// These refs are set by VideoPlayer so PlayerProvider can control playback
export function usePlayerRefs() {
  return {
    videoRef: (typeof window !== "undefined")
      ? ({} as React.MutableRefObject<HTMLVideoElement | null>)
      : ({} as React.MutableRefObject<HTMLVideoElement | null>),
    hlsRef: (typeof window !== "undefined")
      ? ({} as React.MutableRefObject<any>)
      : ({} as React.MutableRefObject<any>),
  };
}
