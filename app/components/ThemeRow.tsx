"use client";

import { useSyncExternalStore } from "react";
import { getTheme, setTheme, subscribeTheme, type ThemeChoice } from "@/lib/theme";

const OPTIONS: { id: ThemeChoice; label: string }[] = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "system", label: "Auto" },
];

/** A Profile row that switches the app between light, dark and automatic. */
export default function ThemeRow() {
  const theme = useSyncExternalStore(subscribeTheme, getTheme, () => "light" as ThemeChoice);

  return (
    <div className="flex min-h-[52px] items-center justify-between gap-4 px-4 py-2">
      <span className="text-navy">Appearance</span>
      <div role="radiogroup" aria-label="Appearance" className="flex rounded-full bg-fill p-0.5">
        {OPTIONS.map((o) => (
          <button
            key={o.id}
            role="radio"
            aria-checked={theme === o.id}
            onClick={() => setTheme(o.id)}
            className={`h-8 rounded-full px-3 text-[13px] font-medium transition-colors ${
              theme === o.id ? "bg-card text-navy shadow-sm" : "text-muted"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
