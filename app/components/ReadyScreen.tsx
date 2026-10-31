"use client";

import Crown from "./Crown";
import { useScreenTone } from "./useScreenTone";

/** "Your outfit is ready" with the crown landing on it. */
export default function ReadyScreen({
  title,
  name,
  onDone,
}: {
  title: string;
  name?: string;
  onDone: () => void;
}) {
  useScreenTone("dark");
  return (
    <div className="bg-night-glow fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 px-8 text-center">
      <div className="crown-fall" style={{ "--d": "0.3s" } as React.CSSProperties}>
        <Crown variant="solid" size={72} className="text-orange" />
      </div>
      <div className="rise flex flex-col gap-3" style={{ "--d": "0.9s" } as React.CSSProperties}>
        <h2 className="large-title text-night-text">
          Your outfit is ready{name ? `, ${name}` : ""}.
        </h2>
        <p className="text-[17px] text-night-muted">{title}</p>
      </div>
      <button onClick={onDone} className="btn bg-night-text text-night rise mt-4 w-full max-w-xs" style={{ "--d": "1.3s" } as React.CSSProperties}>
        Done
      </button>
    </div>
  );
}
