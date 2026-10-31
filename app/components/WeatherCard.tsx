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
  now,
}: {
  state: WeatherState;
  onRetry: () => void;
  unit?: Unit;
  now: Date;
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
  const place = state.place ?? (state.fallback ? "Lagos" : null);
  return (
    <section className="card flex flex-col gap-3 p-4" aria-label="Current weather">
      <div className="flex items-start gap-3">
        <span className="shrink-0 text-orange" aria-hidden>
          <SkyIcon sky={w.sky} day={w.isDay} size={46} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-[34px] font-bold leading-none tracking-[-0.03em] text-navy">
            {deg(w.temp)}°{unit}
          </span>
          <span className="footnote mt-1 text-muted">Feels like {deg(w.feels)}°{unit}</span>
          <span className="footnote truncate text-muted">{w.label} · {Math.round(w.humidity)}% humidity</span>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5 text-right">
          <span className="flex items-center gap-1.5 rounded-full bg-fill px-2.5 py-1 text-[12px] font-medium text-navy">
            <span className="h-1.5 w-1.5 rounded-full bg-[#34C759]" aria-hidden />
            Live Weather
          </span>
          <span className="footnote text-muted">
            {now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
          </span>
          {place && <span className="footnote text-muted">{place}</span>}
        </div>
      </div>

      {(advice || state.fallback) && (
        <p className="footnote text-muted">
          {advice}
          {state.fallback && `${advice ? " " : ""}Showing Lagos. Allow location, or set your city in Profile.`}
        </p>
      )}
    </section>
  );
}
