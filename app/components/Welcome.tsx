"use client";

import { useState } from "react";
import Crown from "./Crown";
import AuthForm from "./AuthForm";
import Onboarding from "./Onboarding";
import { useScreenTone } from "./useScreenTone";

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

  if (stage === "splash") {
    return (
      <button
        onClick={enter}
        aria-label="Enter Crowned"
        className="bg-night-glow relative flex min-h-dvh w-full flex-col items-center overflow-hidden text-night-text"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/photos/splash.jpg" alt="" className="fade-to-full absolute inset-0 h-full w-full object-cover object-top" style={{ "--d": "0.1s" } as React.CSSProperties} />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 28%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.85) 100%)" }}
        />
        <div className="relative mt-[calc(3rem+env(safe-area-inset-top))] flex flex-col items-center gap-2">
          <Crown size={44} draw strokeWidth={1} className="text-orange" style={{ "--d": "0.2s" } as React.CSSProperties} />
          <span className="word-spread text-[14px] font-semibold text-white" style={{ "--d": "0.9s" } as React.CSSProperties}>
            CROWNED
          </span>
        </div>
        <div className="relative mt-auto flex w-full flex-col items-center gap-5 px-6 pb-[calc(2rem+env(safe-area-inset-bottom))]">
          <span className="fade-to-full text-[22px] font-semibold tracking-tight text-white" style={{ "--d": "1.6s" } as React.CSSProperties}>
            Every man is a king.
          </span>
          <span
            className="fade-to-full flex h-14 w-full max-w-xs items-center justify-center rounded-full bg-white text-[16px] font-semibold text-[#1D1D1F]"
            style={{ "--d": "2s" } as React.CSSProperties}
          >
            Get started
          </span>
        </div>
      </button>
    );
  }

  if (stage === "onboard") return <Onboarding onDone={finishIntro} />;

  return <AuthForm failed={failed} />;
}
