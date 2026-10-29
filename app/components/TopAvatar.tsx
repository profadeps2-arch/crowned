"use client";

import { usePathname } from "next/navigation";
import Avatar from "./Avatar";

export default function TopAvatar() {
  const pathname = usePathname() ?? "";
  if (["/", "/profile", "/me"].includes(pathname) || pathname.startsWith("/auth")) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-end px-6 pt-4">
      <div className="pointer-events-auto">
        <Avatar />
      </div>
    </div>
  );
}