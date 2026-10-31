"use client";

import { CloudFog, CloudLightning, CloudRain, CloudSun, Cloud, Droplets, Sun, Moon, Wind, CloudDrizzle } from "lucide-react";
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

const time = (ms: number) =>
  new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

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
        <button onClick={onRetry} className="shrink-0 text-sm font-semibold text-navy">
          Try again
        </button>
      </div>
    );
  }

  const w = state.weather;
  const advice = weatherLine(w);
  return (
    <section className="card flex flex-col gap-2 p-3.5" aria-label="Current weather">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-soft text-orange-deep">
          <SkyIcon sky={w.sky} day={w.isDay} size={24} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold leading-none text-navy">{deg(w.temp)}°</span>
            <span className="truncate text-sm font-medium text-navy">{w.label}</span>
          </div>
          <span className="text-xs text-muted">
            Feels {deg(w.feels)}° · H {deg(w.high)}° L {deg(w.low)}°
          </span>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 self-start text-[11px] text-muted" title="Live">
          <span className="h-1.5 w-1.5 rounded-full bg-orange" aria-hidden />
          {time(w.fetchedAt)}
        </span>
      </div>

      <dl className="flex items-center justify-between gap-2 rounded-xl bg-sand px-3 py-2 text-xs text-navy">
        <div className="flex items-center gap-1"><dt className="sr-only">Rain chance</dt><CloudRain size={13} aria-hidden /><dd className="font-semibold">{Math.round(w.rainChance)}%</dd></div>
        <div className="flex items-center gap-1"><dt className="sr-only">Humidity</dt><Droplets size={13} aria-hidden /><dd className="font-semibold">{Math.round(w.humidity)}%</dd></div>
        <div className="flex items-center gap-1"><dt className="sr-only">Wind</dt><Wind size={13} aria-hidden /><dd className="font-semibold">{Math.round(w.wind)} km/h</dd></div>
      </dl>

      {(advice || state.place || state.fallback) && (
        <p className="text-xs text-muted">
          {advice}
          {state.place && `${advice ? " " : ""}${state.place}.`}
          {state.fallback && `${advice ? " " : ""}Showing Lagos. Allow location, or set your city in Profile.`}
        </p>
      )}
    </section>
  );
}
