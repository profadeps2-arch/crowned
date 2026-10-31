"use client";

import { useState, useSyncExternalStore } from "react";
import { feedbackOn, setFeedback } from "@/lib/feedback";

/** A Profile row that switches the app's sounds and haptics on or off. */
export default function SoundRow() {
  const saved = useSyncExternalStore(
    () => () => {},
    () => feedbackOn(),
    () => true
  );
  const [choice, setChoice] = useState<boolean | null>(null);
  const on = choice ?? saved;

  return (
    <button
      onClick={() => {
        setChoice(!on);
        setFeedback(!on);
      }}
      aria-pressed={on}
      className="flex min-h-[52px] w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors active:bg-fill"
    >
      <span className="text-navy">Sound and haptics</span>
      <span className="text-muted">{on ? "On" : "Off"}</span>
    </button>
  );
}
