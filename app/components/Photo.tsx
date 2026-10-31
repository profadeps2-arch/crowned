"use client";

import { useState } from "react";
import Crown from "./Crown";

type PhotoProps = {
  /** His photo. Usually a signed Supabase URL. */
  src?: string | null;
  alt?: string;
  /** "cover" fills the frame. "contain" shows the whole piece. */
  fit?: "cover" | "contain";
  className?: string;
  children?: React.ReactNode;
};

/**
 * A frame for one of his real photos. The sand tone only shows behind a
 * photo that is still loading, or when a photo is missing or fails, and then
 * it carries a faint crown instead of an empty block.
 * Size it with className, for example "aspect-[3/4] rounded-2xl".
 * Anything in children (labels, badges) sits on top of the photo.
 */
export default function Photo({
  src,
  alt = "",
  fit = "cover",
  className = "",
  children,
}: PhotoProps) {
  const [failed, setFailed] = useState(false);
  const showImage = !!src && !failed;

  return (
    <div className={`relative overflow-hidden bg-sand ${className}`}>
      {showImage ? (
        // Signed Supabase URLs are not on next/image's allow list, so a plain img is correct here.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className={`absolute inset-0 h-full w-full ${
            fit === "cover" ? "object-cover" : "object-contain"
          }`}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-navy/10">
          <Crown size={40} />
        </div>
      )}
      {children}
    </div>
  );
}
