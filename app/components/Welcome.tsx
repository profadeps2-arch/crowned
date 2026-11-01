"use client";

import { useEffect, useState } from "react";
import Crown from "./Crown";
import AuthForm from "./AuthForm";
import { useScreenTone } from "./useScreenTone";

const SPLASH_MS = 3600;

export default function Welcome({ failed = false }: { failed?: boolean }) {
  const [stage, setStage] = useState<"splash" | "auth">("splash");
  useScreenTone(stage === "splash" ? "dark" : "light");

  useEffect(() => {
    if (stage !== "splash") return;
    const t = setTimeout(() => setStage("auth"), SPLASH_MS);
    return () => clearTimeout(t);
  }, [stage]);

  if (stage === "splash") {
    return (
      <button
        onClick={() => setStage("auth")}
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

  return <AuthForm failed={failed} />;
}
