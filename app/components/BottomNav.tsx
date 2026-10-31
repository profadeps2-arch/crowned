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
  const activeIndex = tabs.findIndex((t) => t.match.some((m) => pathname === m || pathname.startsWith(`${m}/`)));

  return (
    <nav aria-label="Main" className="bar fixed inset-x-0 bottom-0 z-40 border-t border-line">
      <div className="relative mx-auto grid max-w-md grid-cols-4 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2">
        {/* The highlight that slides to the chosen tab */}
        {activeIndex >= 0 && (
          <span
            aria-hidden
            className="pointer-events-none absolute left-2 top-2 h-[52px] w-[calc((100%-1rem)/4)] p-1 transition-transform duration-500 ease-[cubic-bezier(0.3,1.25,0.5,1)]"
            style={{ transform: `translateX(${activeIndex * 100}%)` }}
          >
            <span className="block h-full w-full rounded-full bg-fill" />
          </span>
        )}
        {tabs.map((tab, i) => {
          const Icon = tab.icon;
          const active = i === activeIndex;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex h-[52px] flex-col items-center justify-center gap-0.5 text-[10.5px] transition-colors duration-300 ${
                active ? "font-semibold text-orange-deep" : "font-medium text-muted"
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.1 : 1.7} aria-hidden />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
