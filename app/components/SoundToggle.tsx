"use client";

import { useSyncExternalStore, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { feedbackOn, setFeedback } from "@/lib/feedback";

/** Switches the app's sounds and haptics on or off. */
export default function SoundToggle() {
  // Read the saved choice without a render before it is known.
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
        const next = !on;
        setChoice(next);
        setFeedback(next);
      }}
      aria-label={on ? "Turn sound off" : "Turn sound on"}
      aria-pressed={on}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-card text-navy shadow-[var(--lift)] transition-transform duration-150 active:scale-90"
    >
      {on ? <Volume2 size={17} aria-hidden /> : <VolumeX size={17} aria-hidden />}
    </button>
  );
}
