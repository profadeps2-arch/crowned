"use client";

import { useEffect, useState } from "react";
import Crown from "./Crown";
import GoogleButton from "./GoogleButton";
import { useScreenTone } from "./useScreenTone";

// Put one portrait photo here to fill the welcome screen. Without it, the
// screen shows a night glow and the crown instead, and nothing breaks.
const HERO_PHOTO = "/photos/welcome.jpg";

const SPLASH_MS = 3600;

export default function Welcome({ failed = false }: { failed?: boolean }) {
  const [stage, setStage] = useState<"splash" | "welcome">("splash");
  const [photoOk, setPhotoOk] = useState(true);

  useScreenTone("dark");

  useEffect(() => {
    if (stage !== "splash") return;
    const t = setTimeout(() => setStage("welcome"), SPLASH_MS);
    return () => clearTimeout(t);
  }, [stage]);

  if (stage === "splash") {
    return (
      <button
        onClick={() => setStage("welcome")}
        aria-label="Enter Crowned"
        className="bg-night-glow relative flex min-h-dvh w-full flex-col items-center justify-center gap-6 text-night-text"
      >
        <Crown size={96} base draw strokeWidth={0.7} className="text-orange" style={{ "--d": "0.2s" } as React.CSSProperties} />
        <span
          className="word-spread text-[15px] font-semibold text-orange"
          style={{ "--d": "0.9s" } as React.CSSProperties}
        >
          CROWNED
        </span>
        <span
          className="fade-to-full text-xl font-medium text-night-muted"
          style={{ "--d": "1.8s" } as React.CSSProperties}
        >
          Every man is a king.
        </span>
        <span
          className="fade-to-full absolute bottom-[calc(2.25rem+env(safe-area-inset-bottom))] text-[11px] font-semibold uppercase tracking-[0.24em] text-night-muted"
          style={{ "--d": "2.4s" } as React.CSSProperties}
        >
          Tap to enter
        </span>
      </button>
    );
  }

  return (
    <main className="bg-night-glow relative flex min-h-dvh flex-col overflow-hidden text-night-text">
      {photoOk && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={HERO_PHOTO}
          alt=""
          onError={() => setPhotoOk(false)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(13,23,35,0.2) 0%, rgba(13,23,35,0.5) 40%, rgba(13,23,35,0.97) 82%)",
        }}
      />

      {!photoOk && (
        <div aria-hidden="true" className="absolute inset-x-0 top-[14%] flex justify-center">
          <Crown size={120} base strokeWidth={0.6} className="text-orange/70" />
        </div>
      )}

      <div className="relative z-10 mt-auto flex flex-col gap-4 px-6 pb-[calc(2rem+env(safe-area-inset-bottom))]">
        <span className="rise text-xs font-semibold uppercase tracking-[0.2em] text-orange">
          Crowned · Your personal stylist
        </span>

        <h1
          className="rise text-[44px] leading-[1.02] text-white"
          style={{ "--d": "0.1s" } as React.CSSProperties}
        >
          Every man is a king.
          <span className="block text-orange">Dress like one.</span>
        </h1>

        <p
          className="rise max-w-xs text-[15px] leading-relaxed text-night-text"
          style={{ "--d": "0.2s" } as React.CSSProperties}
        >
          Your outfit, sorted in 1 minute. For owambe, office, church and every
          moment in between.
        </p>

        <div className="rise mt-2" style={{ "--d": "0.3s" } as React.CSSProperties}>
          <GoogleButton />
        </div>

        {failed && (
          <p role="alert" className="rise text-center text-sm text-[#F0A99C]">
            We could not sign you in. Please try again.
          </p>
        )}

        <p
          className="rise text-center text-xs text-night-muted"
          style={{ "--d": "0.4s" } as React.CSSProperties}
        >
          One quick screen, then we style you.
        </p>
      </div>
    </main>
  );
}
