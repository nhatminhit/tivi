"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Tv, Search, Heart, X } from "lucide-react";
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
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "glass shadow-lg shadow-black/20"
          : "bg-gradient-to-b from-background/95 to-transparent"
      }`}
    >
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
          <div className="relative">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25">
              <Tv className="h-5 w-5 text-white" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
          </div>
          <span className="font-bold text-lg tracking-tight hidden sm:block">
            TV<span className="text-primary">Stream</span>
          </span>
        </Link>

        {/* Categories */}
        <nav className="hidden md:flex items-center gap-1">
          {categories.map((cat) => {
            const isActive =
              cat.href === "/channels"
                ? pathname === "/channels"
                : pathname.startsWith("/channels");
            return (
              <Link
                key={cat.href}
                href={cat.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                {cat.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
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
                className="bg-transparent outline-none text-sm w-40 placeholder:text-muted-foreground"
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
              className="h-9 w-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            >
              <Search className="h-4.5 w-4.5" />
            </button>
          )}

          {/* Favorites */}
          <Link
            href="/channels/favorites"
            className="h-9 w-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Heart className="h-4.5 w-4.5" />
          </Link>

          {/* Channel count badge */}
          <div className="hidden sm:flex items-center gap-1.5 ml-2 px-3 py-1 rounded-full glass text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            {channels.length} kênh
          </div>
        </div>
      </div>
    </header>
  );
}
