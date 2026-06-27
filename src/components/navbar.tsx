"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Tv, Search, Heart, X, QrCode } from "lucide-react";
import { usePlaylist } from "@/hooks/use-playlist";

const categories = [
  { label: "Tất cả", href: "/channels" },
  { label: "VTV", href: "/channels?group=VTV" },
  { label: "HTV", href: "/channels?group=HTV" },
  { label: "Phim", href: "/channels?group=XemTV" },
  { label: "Radio", href: "/channels?group=Radio+VN" },
  { label: "Địa phương", href: "/channels?group=Truy%E1%BB%81nh+h%C3%ACnh+%C4%91%E1%BB%8Ba+ph%C6%B0%C6%A1ng" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { channels } = usePlaylist();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        router.push(`/channels?q=${encodeURIComponent(searchQuery.trim())}`);
        setSearchOpen(false);
        setSearchQuery("");
      }
    },
    [searchQuery, router]
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container flex h-14 items-center justify-between gap-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Tv className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-base tracking-tight hidden sm:block">
            TV<span className="text-primary">Stream</span>
          </span>
        </Link>

        {/* Categories — scrollable on mobile */}
        <nav className="flex-1 overflow-x-auto scrollbar-hide mx-4">
          <div className="flex items-center gap-1">
            {categories.map((cat) => {
              const isActive =
                cat.href === "/channels"
                  ? pathname === "/channels"
                  : pathname.startsWith("/channels");
              return (
                <Link
                  key={cat.href}
                  href={cat.href}
                  className={`px-3 py-1 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  {cat.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-1.5">
          {/* Search */}
          {searchOpen ? (
            <form
              onSubmit={handleSearch}
              className="flex items-center gap-2 glass rounded-full px-3 py-1.5"
            >
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kênh..."
                className="bg-transparent outline-none text-sm w-32 sm:w-40 placeholder:text-muted-foreground"
              />
              <button
                type="button"
                onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            >
              <Search className="h-4 w-4" />
            </button>
          )}

          {/* QR Code */}
          <Link
            href="/qr"
            className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${
              pathname === "/qr"
                ? "text-primary bg-primary/15"
                : "text-muted-foreground hover:text-primary hover:bg-primary/10"
            }`}
          >
            <QrCode className="h-4 w-4" />
          </Link>

          {/* Favorites */}
          <Link
            href="/channels/favorites"
            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Heart className="h-4 w-4" />
          </Link>

          {/* Channel count badge */}
          <div className="hidden sm:flex items-center gap-1.5 ml-1 px-2.5 py-1 rounded-full glass text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            {channels.length}
          </div>
        </div>
      </div>
    </header>
  );
}
