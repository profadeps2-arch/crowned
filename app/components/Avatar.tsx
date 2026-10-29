"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function PersonOutline({ size }: { size: number }) {
  return (
    <svg
      width={size * 0.55}
      height={size * 0.55}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </svg>
  );
}

function CrownMark() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#B08D57"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5L3 8z" />
    </svg>
  );
}

export default function Avatar({
  size = 34,
  showName = false,
}: {
  size?: number;
  showName?: boolean;
}) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [failed, setFailed] = useState(false);

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

      setName((profile?.name ?? user.user_metadata?.full_name ?? "").trim());

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

  const initial = name.charAt(0).toUpperCase();
  const showPhoto = photo && !failed;

  return (
    <Link
      href="/me"
      aria-label={name ? `King ${name}. Your profile` : "Your profile"}
      className="flex items-center gap-2.5 transition-opacity active:opacity-60"
    >
      {showName && (
        <span
          className={`flex items-center gap-1.5 transition-opacity duration-500 ${
            name ? "opacity-100" : "opacity-0"
          }`}
        >
          <CrownMark />
          <span className="max-w-[10rem] truncate text-[15px] font-medium tracking-[-0.01em] text-[#1F2A44]">
            King {name}
          </span>
        </span>
      )}

      <span
        className="flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-black/10 bg-[#E9E1D2] text-[#5C5648]"
        style={{ width: size, height: size }}
      >
        {showPhoto ? (
          <img
            src={photo}
            alt=""
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
            onError={() => setFailed(true)}
          />
        ) : initial ? (
          <span
            className="flex h-full w-full items-center justify-center bg-[#1F2A44] font-medium text-[#F5F0E6]"
            style={{ fontSize: size * 0.4 }}
          >
            {initial}
          </span>
        ) : (
          <PersonOutline size={size} />
        )}
      </span>
    </Link>
  );
}