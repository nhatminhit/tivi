"use client";
import { PlaylistProvider } from "@/hooks/use-playlist";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/hooks/use-theme";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <PlaylistProvider>
        <Toaster position="top-right" richColors closeButton />
        {children}
      </PlaylistProvider>
    </ThemeProvider>
  );
}
