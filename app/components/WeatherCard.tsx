"use client";

import { useState } from "react";
import { ChevronDown, CloudFog, CloudLightning, CloudRain, CloudSun, Cloud, Sun, Moon, CloudDrizzle } from "lucide-react";
import type { WeatherState } from "./useWeather";
import { weatherLine, type Sky } from "@/lib/weather";
import type { Unit } from "@/lib/prefs";

function SkyIcon({ sky, day, size = 18 }: { sky: Sky; day: boolean; size?: number }) {
  const p = { size, strokeWidth: 1.4, "aria-hidden": true } as const;
  if (sky === "clear") return day ? <Sun {...p} /> : <Moon {...p} />;
  if (sky === "partly") return <CloudSun {...p} />;
  if (sky === "fog") return <CloudFog {...p} />;
  if (sky === "drizzle") return <CloudDrizzle {...p} />;
  if (sky === "rain") return <CloudRain {...p} />;
  if (sky === "storm") return <CloudLightning {...p} />;
  return <Cloud {...p} />;
}

/**
 * The weather as one quiet line. Tap it for the detail. It lives in
 * WeatherCard.tsx for history; it is no longer a card.
 */
export default function WeatherCard({
  state,
  onRetry,
  unit = "C",
}: {
  state: WeatherState;
  onRetry: () => void;
  unit?: Unit;
}) {
  const [open, setOpen] = useState(false);
  const deg = (c: number) => Math.round(unit === "F" ? (c * 9) / 5 + 32 : c);

  if (state.status === "loading") {
    return <div className="h-6 w-40 animate-pulse rounded bg-sand" aria-busy="true" aria-label="Loading the weather" />;
  }

  if (state.status === "error") {
    return (
      <p className="subhead text-muted">
        Weather is unavailable.{" "}
        <button onClick={onRetry} className="link">Try again</button>
      </p>
    );
  }

  const w = state.weather;
  const advice = weatherLine(w);
  const place = state.place ?? (state.fallback ? "Lagos" : null);

  return (
    <section aria-label="Current weather" className="flex flex-col">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-fit items-center gap-2 text-[15px] text-navy"
      >
        <SkyIcon sky={w.sky} day={w.isDay} />
        <span>{deg(w.temp)}°{unit}, {w.label.toLowerCase()}</span>
        <ChevronDown
          size={15}
          aria-hidden
          className={`text-muted transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? "rotate-180" : ""}`}
        />
      </button>

      <div className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden">
          <div className="flex flex-col gap-1 pt-3 text-[14px] leading-snug text-muted">
            <p>Feels like {deg(w.feels)}°. High {deg(w.high)}°, low {deg(w.low)}°.</p>
            <p>{Math.round(w.rainChance)}% chance of rain, {Math.round(w.humidity)}% humidity, wind {Math.round(w.wind)} km/h.</p>
            {advice && <p className="text-navy">{advice}</p>}
            {place && <p>{place}.{state.fallback ? " Allow location, or set your city in Profile." : ""}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
