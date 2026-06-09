"use client";
import { PlaylistProvider } from "@/hooks/use-playlist";
import { PlayerProvider } from "@/hooks/use-player";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/hooks/use-theme";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <PlaylistProvider>
        <PlayerProvider>
          <Toaster position="top-right" richColors closeButton />
          {children}
        </PlayerProvider>
      </PlaylistProvider>
    </ThemeProvider>
  );
}
