"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Shirt, Sparkles, User } from "lucide-react";

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
    <nav aria-label="Main" className="bar fixed inset-x-0 bottom-0 z-40 border-t border-line">
      <div className="mx-auto flex max-w-md justify-around pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.match.some((m) => pathname === m || pathname.startsWith(`${m}/`));
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex min-h-12 min-w-16 flex-col items-center gap-1 text-[11px] transition-colors duration-300 ${
                active ? "text-navy" : "text-muted"
              }`}
            >
              <Icon size={22} strokeWidth={active ? 1.7 : 1.3} aria-hidden />
              {tab.label}
              <span
                aria-hidden
                className={`absolute -top-2 h-0.5 w-5 rounded-full bg-navy transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  active ? "scale-x-100" : "scale-x-0"
                }`}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
