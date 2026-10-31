"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Shirt, Sparkles, User } from "lucide-react";

// The four tabs.
const tabs = [
  { href: "/today", match: ["/today", "/customize"], label: "Today", icon: House },
  { href: "/wardrobe", match: ["/wardrobe"], label: "Wardrobe", icon: Shirt },
  { href: "/outfits", match: ["/outfits", "/saved"], label: "Outfits", icon: Sparkles },
  { href: "/me", match: ["/me"], label: "Profile", icon: User },
];

// Whether to show this bar at all is decided by AppShell.
export default function BottomNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav
      aria-label="Main"
      className="bar fixed inset-x-0 bottom-0 z-40 border-t-[0.5px] border-line"
    >
      <div className="mx-auto flex max-w-md justify-around pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.match.some((m) => pathname === m || pathname.startsWith(`${m}/`));
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-12 min-w-16 flex-col items-center gap-0.5 text-[10px] tracking-[0.01em] transition-colors ${
                active ? "font-semibold text-orange-deep" : "font-medium text-muted"
              }`}
            >
              <Icon
                size={25}
                strokeWidth={active ? 2 : 1.6}
                className={active ? "text-orange" : ""}
                fill={active ? "currentColor" : "none"}
                fillOpacity={active ? 0.2 : 0}
              />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
