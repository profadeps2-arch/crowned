"use client";

import { CloudFog, CloudLightning, CloudRain, CloudSun, Cloud, Droplets, Sun, Moon, Wind, CloudDrizzle } from "lucide-react";
import type { WeatherState } from "./useWeather";
import { weatherLine, type Sky } from "@/lib/weather";

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
}: {
  state: WeatherState;
  onRetry: () => void;
}) {
  if (state.status === "loading") {
    return (
      <div className="card flex animate-pulse flex-col gap-4 p-5" aria-busy="true" aria-label="Loading the weather">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-sand" />
          <div className="flex flex-col gap-2">
            <div className="h-7 w-24 rounded bg-sand" />
            <div className="h-4 w-32 rounded bg-sand" />
          </div>
        </div>
        <div className="h-10 rounded-xl bg-sand" />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="card flex items-center justify-between gap-4 p-5">
        <p className="text-sm text-muted">The weather is not available right now. Your outfit still works.</p>
        <button onClick={onRetry} className="shrink-0 text-sm font-semibold text-navy">
          Try again
        </button>
      </div>
    );
  }

  const w = state.weather;
  return (
    <section className="card flex flex-col gap-4 p-5" aria-label="Current weather">
      <div className="flex items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-orange-soft text-orange-deep">
          <SkyIcon sky={w.sky} day={w.isDay} />
        </span>
        <div className="flex min-w-0 flex-col">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold leading-none text-navy">{Math.round(w.temp)}°</span>
            <span className="text-base font-medium text-navy">{w.label}</span>
          </div>
          <span className="text-sm text-muted">
            Feels like {Math.round(w.feels)}° · H {Math.round(w.high)}° L {Math.round(w.low)}°
          </span>
        </div>
      </div>

      <p className="text-sm text-navy">{weatherLine(w)}</p>

      <dl className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-sand px-2 py-2.5">
          <dt className="flex items-center justify-center gap-1 text-[11px] text-muted"><CloudRain size={12} aria-hidden /> Rain</dt>
          <dd className="text-sm font-semibold text-navy">{Math.round(w.rainChance)}%</dd>
        </div>
        <div className="rounded-xl bg-sand px-2 py-2.5">
          <dt className="flex items-center justify-center gap-1 text-[11px] text-muted"><Droplets size={12} aria-hidden /> Humidity</dt>
          <dd className="text-sm font-semibold text-navy">{Math.round(w.humidity)}%</dd>
        </div>
        <div className="rounded-xl bg-sand px-2 py-2.5">
          <dt className="flex items-center justify-center gap-1 text-[11px] text-muted"><Wind size={12} aria-hidden /> Wind</dt>
          <dd className="text-sm font-semibold text-navy">{Math.round(w.wind)} km/h</dd>
        </div>
      </dl>

      <p className="flex items-center gap-2 text-[11px] text-muted">
        <span className="h-1.5 w-1.5 rounded-full bg-orange" aria-hidden />
        Live · updated {time(w.fetchedAt)}
        {state.fallback && " · showing Lagos. Allow location for your area."}
      </p>
    </section>
  );
}
