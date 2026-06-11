"use client";
import { useState, useRef, useEffect } from "react";
import { Server, ChevronDown, Check } from "lucide-react";
import type { ServerInfo } from "@/lib/types";

interface ServerSelectorProps {
  servers: ServerInfo[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

export default function ServerSelector({ servers, activeIndex, onSelect }: ServerSelectorProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (servers.length <= 1) return null;

  const activeLabel = servers[activeIndex]?.label || "Server 1";

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg glass hover:bg-white/10 transition-colors text-xs font-medium text-white/80 hover:text-white"
      >
        <Server className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{activeLabel}</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 right-0 min-w-[140px] glass rounded-xl border border-white/10 shadow-2xl py-1 z-50">
          <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            Chọn server
          </p>
          {servers.map((s) => (
            <button
              key={s.index}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(s.index);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${
                s.index === activeIndex
                  ? "bg-primary/15 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                s.index === activeIndex ? "bg-primary" : "bg-white/20"
              }`} />
              <span className="flex-1 text-left">{s.label}</span>
              {s.index === activeIndex && <Check className="h-3 w-3 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
