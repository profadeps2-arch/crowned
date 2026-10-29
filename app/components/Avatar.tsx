"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function Avatar({ size = 38 }: { size?: number }) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [initial, setInitial] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("name, avatar_path")
        .eq("id", user.id)
        .maybeSingle();

      const name = profile?.name ?? user.user_metadata?.full_name ?? "";
      setInitial(name.trim().charAt(0).toUpperCase());

      if (profile?.avatar_path) {
        const { data: signed } = await supabase.storage
          .from("wardrobe")
          .createSignedUrl(profile.avatar_path, 3600);
        if (signed?.signedUrl) {
          setPhoto(signed.signedUrl);
          return;
        }
      }
      setPhoto(user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null);
    });
  }, []);

  return (
    <Link
      href="/me"
      aria-label="Your profile"
      className="block overflow-hidden rounded-full border border-[#E3DACB] bg-[#1F2A44] transition-transform active:scale-95"
      style={{ width: size, height: size }}
    >
      {photo ? (
        <img src={photo} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center font-semibold text-[#F5F0E6]"
          style={{ fontSize: size * 0.42 }}
        >
          {initial}
        </span>
      )}
    </Link>
  );
}