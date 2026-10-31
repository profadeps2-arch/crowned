"use client";

import { usePathname } from "next/navigation";
import TopAvatar from "./TopAvatar";
import BottomNav from "./BottomNav";

// Routes that carry no top bar, and routes that carry no bottom nav.
const NO_TOP = ["/", "/profile", "/me"];
const NO_NAV = ["/", "/profile"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
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
