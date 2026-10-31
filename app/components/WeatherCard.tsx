"use client";

import { CloudFog, CloudLightning, CloudRain, CloudSun, Cloud, Sun, Moon, CloudDrizzle } from "lucide-react";
import type { WeatherState } from "./useWeather";
import { weatherLine, type Sky } from "@/lib/weather";
import type { Unit } from "@/lib/prefs";

function SkyIcon({ sky, day, size = 40 }: { sky: Sky; day: boolean; size?: number }) {
  const p = { size, strokeWidth: 1.6, "aria-hidden": true } as const;
  if (sky === "clear") return day ? <Sun {...p} /> : <Moon {...p} />;
  if (sky === "partly") return <CloudSun {...p} />;
  if (sky === "fog") return <CloudFog {...p} />;
  if (sky === "drizzle") return <CloudDrizzle {...p} />;
  if (sky === "rain") return <CloudRain {...p} />;
  if (sky === "storm") return <CloudLightning {...p} />;
  return <Cloud {...p} />;
}

export default function WeatherCard({
  state,
  onRetry,
  unit = "C",
}: {
  state: WeatherState;
  onRetry: () => void;
  unit?: Unit;
}) {
  const deg = (c: number) => Math.round(unit === "F" ? (c * 9) / 5 + 32 : c);

  if (state.status === "loading") {
    return (
      <div className="card flex animate-pulse items-center gap-3 p-3.5" aria-busy="true" aria-label="Loading the weather">
        <div className="h-11 w-11 rounded-full bg-sand" />
        <div className="flex flex-col gap-2">
          <div className="h-5 w-32 rounded bg-sand" />
          <div className="h-3 w-48 rounded bg-sand" />
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="card flex items-center justify-between gap-4 p-3.5">
        <p className="text-sm text-muted">The weather is not available right now. Your outfit still works.</p>
        <button onClick={onRetry} className="shrink-0 text-[15px] font-semibold text-orange-deep">
          Try again
        </button>
      </div>
    );
  }

  const w = state.weather;
  const advice = weatherLine(w);
  return (
    <section className="flex flex-col gap-2" aria-label="Current weather">
      <div className="flex items-center gap-3">
        <span className="shrink-0 text-navy" aria-hidden>
          <SkyIcon sky={w.sky} day={w.isDay} size={30} />
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="text-[22px] font-bold leading-tight tracking-[-0.02em] text-navy">
            {deg(w.temp)}°  {w.label}
          </span>
          <span className="footnote text-muted">
            Feels {deg(w.feels)}°, high {deg(w.high)}°, low {deg(w.low)}°
            {state.place ? `, ${state.place}` : state.fallback ? ", Lagos" : ""}
          </span>
        </div>
      </div>
      {(advice || state.fallback) && (
        <p className="footnote text-muted">
          {advice}
          {state.fallback && `${advice ? " " : ""}Allow location, or set your city in Profile.`}
        </p>
      )}
    </section>
  );
}
