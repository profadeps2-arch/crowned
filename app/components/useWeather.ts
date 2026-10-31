"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LAGOS, fetchWeather, type Coords, type Weather } from "@/lib/weather";

export type WeatherState =
  | { status: "loading" }
  | { status: "ready"; weather: Weather; fallback: boolean; place: string | null }
  | { status: "error" };

const REFRESH_MS = 10 * 60 * 1000;
const STALE_MS = 5 * 60 * 1000;
const KEY = "crowned.coords";

function readCached(): Coords | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const c = JSON.parse(raw);
    if (typeof c.lat === "number" && typeof c.lon === "number" && Date.now() - c.at < 24 * 3600 * 1000) {
      return { lat: c.lat, lon: c.lon, fallback: false };
    }
  } catch {}
  return null;
}

function locate(): Promise<Coords> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return resolve(LAGOS);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        try {
          localStorage.setItem(KEY, JSON.stringify({ ...c, at: Date.now() }));
        } catch {}
        resolve({ ...c, fallback: false });
      },
      () => resolve(LAGOS),
      { timeout: 7000, maximumAge: 3600 * 1000 }
    );
  });
}

/**
 * Live weather for where he is. Falls back to Lagos if location is blocked,
 * and refreshes every ten minutes and when the app comes back to the front.
 */
export function useWeather(opts: {
  /** Wait until the saved location is known before asking the phone. */
  ready: boolean;
  /** A location he saved in Profile. Wins over the phone and over Lagos. */
  saved?: { lat: number; lon: number; city: string | null } | null;
}) {
  const { ready, saved } = opts;
  const [state, setState] = useState<WeatherState>({ status: "loading" });
  const coords = useRef<Coords | null>(null);
  const last = useRef(0);
  const place = useRef<string | null>(null);
  const savedRef = useRef(saved);
  useEffect(() => {
    savedRef.current = saved;
  }, [saved]);

  const load = useCallback(async () => {
    try {
      if (!coords.current) {
        const s = savedRef.current;
        if (s) {
          coords.current = { lat: s.lat, lon: s.lon, fallback: false };
          place.current = s.city;
        } else {
          coords.current = readCached() ?? (await locate());
          place.current = null;
        }
      }
      const weather = await fetchWeather(coords.current);
      last.current = Date.now();
      setState({ status: "ready", weather, fallback: coords.current.fallback, place: place.current });
    } catch (e) {
      console.error("Weather failed:", e);
      // Keep showing the last good reading if there is one.
      setState((s) => (s.status === "ready" ? s : { status: "error" }));
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    // The state starts as loading, so the first call has nothing to reset.
    load();
    const timer = setInterval(() => load(), REFRESH_MS);
    const onShow = () => {
      if (document.visibilityState === "visible" && Date.now() - last.current > STALE_MS) load();
    };
    document.addEventListener("visibilitychange", onShow);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onShow);
    };
  }, [load, ready]);

  const retry = useCallback(() => {
    coords.current = null;
    setState({ status: "loading" });
    load();
  }, [load]);

  return { state, retry };
}
