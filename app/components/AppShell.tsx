"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { tap } from "@/lib/feedback";
import TopAvatar from "./TopAvatar";
import BottomNav from "./BottomNav";

// Routes that carry no top bar, and routes that carry no bottom nav.
const NO_TOP = ["/", "/profile", "/me", "/reset-password"];
const NO_NAV = ["/", "/profile", "/reset-password"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";

  // A light tap on every button, chip, tab and tab bar link.
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>(".btn, .chip, .seg-item, nav a");
      if (el && !(el as HTMLButtonElement).disabled) tap();
    };
    document.addEventListener("pointerdown", onDown, { passive: true });
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);
  const showTop = !NO_TOP.includes(pathname) && !pathname.startsWith("/auth");
  const showNav = !NO_NAV.includes(pathname);

  return (
    <>
      <div
        className={`relative mx-auto min-h-dvh max-w-md ${
          showNav ? "pb-[calc(6rem+env(safe-area-inset-bottom))]" : ""
        }`}
      >
        {showTop && <TopAvatar />}
        {children}
      </div>
      {showNav && <BottomNav />}
    </>
  );
}
