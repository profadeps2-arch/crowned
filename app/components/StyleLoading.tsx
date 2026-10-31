"use client";

import { useEffect, useState } from "react";
import Crown from "./Crown";
import { useScreenTone } from "./useScreenTone";

const STEPS = [
  "Opening your wardrobe",
  "Checking the weather",
  "Matching colours",
  "Choosing your looks",
];

/** The dark loading screen. The crown is lit by a passing sheen while the steps move on. */
export default function StyleLoading() {
  useScreenTone("dark");
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 650);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-night-glow fixed inset-0 z-50 flex flex-col items-center justify-center gap-10 px-8 text-center"
    >
      <div className="sheen relative">
        <Crown size={88} base strokeWidth={0.8} className="text-orange" />
      </div>
      <div className="flex flex-col items-center gap-4">
        <p key={step} className="rise text-[19px] font-medium text-night-text">{STEPS[step]}</p>
        <div className="flex gap-2" aria-hidden>
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i <= step ? "w-6 bg-orange" : "w-1.5 bg-night-line"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
