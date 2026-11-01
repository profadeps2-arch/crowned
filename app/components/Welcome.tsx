"use client";

import { useEffect, useState } from "react";
import Crown from "./Crown";
import AuthForm from "./AuthForm";
import Onboarding from "./Onboarding";
import { useScreenTone } from "./useScreenTone";

const SPLASH_MS = 3600;

export default function Welcome({ failed = false }: { failed?: boolean }) {
  const [stage, setStage] = useState<"splash" | "onboard" | "auth">(failed ? "auth" : "splash");
  useScreenTone(stage === "splash" ? "dark" : "light");

  // Someone who has seen the intro before goes straight to log in.
  function enter() {
    let seen = false;
    try { seen = localStorage.getItem("crowned.intro") === "1"; } catch {}
    setStage(seen ? "auth" : "onboard");
  }

  function finishIntro() {
    try { localStorage.setItem("crowned.intro", "1"); } catch {}
    setStage("auth");
  }

  // The splash moves on by itself, or on a tap.
  useEffect(() => {
    if (stage !== "splash") return;
    const t = setTimeout(enter, SPLASH_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  if (stage === "splash") {
    return (
      <button
        onClick={enter}
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

  if (stage === "onboard") return <Onboarding onDone={finishIntro} />;

  return <AuthForm failed={failed} />;
}
