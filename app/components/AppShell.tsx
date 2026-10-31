"use client";

import { usePathname } from "next/navigation";
import BottomNav from "./BottomNav";

// Routes that carry no bottom nav. Every screen carries its own title, so
// there is no shared top bar.
const NO_NAV = ["/", "/profile"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const showNav = !NO_NAV.includes(pathname) && !pathname.startsWith("/auth");

  return (
    <>
      <div
        className={`relative mx-auto min-h-dvh max-w-md ${
          showNav ? "pb-[calc(6rem+env(safe-area-inset-bottom))]" : ""
        }`}
      >
        {children}
      </div>
      {showNav && <BottomNav />}
    </>
  );
}
