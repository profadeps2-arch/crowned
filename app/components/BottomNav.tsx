"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sun, Shirt, Sparkles, User } from "lucide-react";

// The four tabs. Until the Today and Outfits screens are built (steps 3 and 4),
// Today points at /style and Outfits at /saved. Those two hrefs are the only
// lines that change later.
const tabs = [
  { href: "/style", label: "Today", icon: Sun },
  { href: "/wardrobe", label: "Wardrobe", icon: Shirt },
  { href: "/saved", label: "Outfits", icon: Sparkles },
  { href: "/me", label: "Profile", icon: User },
];

// Whether to show this bar at all is decided by AppShell.
export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 backdrop-blur"
    >
      <div className="mx-auto flex max-w-md justify-around pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 min-w-16 flex-col items-center gap-1 text-[11px] transition-colors ${
                active ? "font-semibold text-navy" : "text-muted"
              }`}
            >
              <Icon
                size={22}
                strokeWidth={active ? 2.2 : 1.7}
                className={active ? "text-orange" : ""}
                fill={active ? "currentColor" : "none"}
                fillOpacity={active ? 0.15 : 0}
              />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
