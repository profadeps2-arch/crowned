"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Shirt, Bookmark } from "lucide-react";

const tabs = [
  { href: "/style", label: "Style Me", icon: Sparkles },
  { href: "/wardrobe", label: "Wardrobe", icon: Shirt },
  { href: "/saved", label: "Saved", icon: Bookmark },
];

export default function BottomNav() {
  const pathname = usePathname();

  if (pathname === "/") return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-[#E3DACB] bg-[#FBF8F2]">
      <div className="mx-auto flex max-w-md justify-around py-3">
        {tabs.map((tab) => {
          const active = pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-1 text-xs ${
                active ? "font-semibold text-[#1F2A44]" : "text-[#8A8476]"
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.2 : 1.6} />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
