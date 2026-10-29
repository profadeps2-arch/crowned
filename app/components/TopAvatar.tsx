"use client";

import { usePathname } from "next/navigation";
import Avatar from "./Avatar";

export default function TopAvatar() {
  const pathname = usePathname() ?? "";
  if (["/", "/profile", "/me"].includes(pathname) || pathname.startsWith("/auth")) return null;

  return (
    <div className="flex justify-end px-6 pt-6">
      <Avatar showName />
    </div>
  );
}