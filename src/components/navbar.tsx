"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tv, Home, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Trang chủ", icon: Home },
    { href: "/channels", label: "Kênh", icon: Tv },
    { href: "/settings", label: "Cài đặt", icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <Tv className="h-5 w-5 text-primary" />
          <span>Tivi</span>
        </Link>

        <nav className="flex items-center gap-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Button
                key={link.href}
                variant={isActive ? "secondary" : "ghost"}
                size="sm"
                asChild
              >
                <Link href={link.href} className="flex items-center gap-1.5">
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{link.label}</span>
                </Link>
              </Button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
