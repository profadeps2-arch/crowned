import type { StyleContext } from "@/lib/outfits";

export type Sky = "clear" | "partly" | "cloud" | "fog" | "drizzle" | "rain" | "storm";

export type Weather = {
  temp: number;
  feels: number;
  humidity: number;
  wind: number;
  rainChance: number;
  precip: number;
  code: number;
  sky: Sky;
  label: string;
  isDay: boolean;
  high: number;
  low: number;
  /** When this reading was fetched, in ms. */
  fetchedAt: number;
};

export type Coords = { lat: number; lon: number; fallback: boolean };

/** Lagos, used when location is blocked or unavailable. */
export const LAGOS: Coords = { lat: 6.5244, lon: 3.3792, fallback: true };

/** WMO weather codes, as Open-Meteo returns them. */
export function skyOf(code: number): { sky: Sky; label: string } {
  if (code === 0) return { sky: "clear", label: "Clear" };
  if (code === 1) return { sky: "clear", label: "Mostly clear" };
  if (code === 2) return { sky: "partly", label: "Partly cloudy" };
  if (code === 3) return { sky: "cloud", label: "Overcast" };
  if (code === 45 || code === 48) return { sky: "fog", label: "Foggy" };
  if (code >= 51 && code <= 57) return { sky: "drizzle", label: "Drizzle" };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return { sky: "rain", label: "Rain" };
  if (code >= 95) return { sky: "storm", label: "Thunderstorm" };
  return { sky: "cloud", label: "Cloudy" };
}

const num = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

/** Reads the live conditions for a place. Throws if the answer is missing or malformed. */
export async function fetchWeather(c: Coords, signal?: AbortSignal): Promise<Weather> {
  const url =
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${c.lat.toFixed(3)}&longitude=${c.lon.toFixed(3)}` +
    "&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,is_day" +
    "&daily=precipitation_probability_max,temperature_2m_max,temperature_2m_min" +
    "&wind_speed_unit=kmh&timezone=auto&forecast_days=1";

  const res = await fetch(url, { signal, cache: "no-store" });
  if (!res.ok) throw new Error(`Weather request failed (${res.status})`);
  const j = await res.json();

  const cur = j?.current;
  const temp = num(cur?.temperature_2m);
  const code = num(cur?.weather_code);
  if (temp === null || code === null) throw new Error("Weather response was incomplete");

  const { sky, label } = skyOf(code);
  return {
    temp,
    feels: num(cur.apparent_temperature) ?? temp,
    humidity: num(cur.relative_humidity_2m) ?? 0,
    wind: num(cur.wind_speed_10m) ?? 0,
    precip: num(cur.precipitation) ?? 0,
    rainChance: num(j?.daily?.precipitation_probability_max?.[0]) ?? 0,
    code,
    sky,
    label,
    isDay: cur.is_day !== 0,
    high: num(j?.daily?.temperature_2m_max?.[0]) ?? temp,
    low: num(j?.daily?.temperature_2m_min?.[0]) ?? temp,
    fetchedAt: Date.now(),
  };
}

/** What the weather means for the clothes. */
export function weatherContext(w: Weather | null | undefined): StyleContext {
  if (!w) return {};
  return {
    hot: w.feels >= 31,
    cool: w.temp <= 23,
    rainy:
      w.rainChance >= 50 || w.precip > 0.1 || w.sky === "rain" || w.sky === "storm" || w.sky === "drizzle",
  };
}

/** One calm sentence about the day, or null on an ordinary day so the card stays small. */
export function weatherLine(w: Weather): string | null {
  if (w.sky === "storm") return "Storms around. Stay dry and dress for it.";
  if (w.sky === "rain" || w.sky === "drizzle" || w.rainChance >= 60) return "Rain is likely. Closed shoes will serve you.";
  if (w.feels >= 33) return "Properly hot. Keep the fabrics light.";
  if (w.feels >= 30) return "Warm out there. Breathable pieces win.";
  if (w.temp <= 22) return "A cooler day. A layer will help.";
  return null;
}
