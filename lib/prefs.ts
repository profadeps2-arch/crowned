import type { createClient } from "@/lib/supabase/client";

export type Unit = "C" | "F";

export type Prefs = {
  /** Values match the "looks" tags on pieces: native, smart casual, casual, streetwear, formal. */
  styles: string[];
  colours: string[];
  city: string | null;
  lat: number | null;
  lon: number | null;
  unit: Unit;
  weatherAware: boolean;
};

export const DEFAULT_PREFS: Prefs = {
  styles: [],
  colours: [],
  city: null,
  lat: null,
  lon: null,
  unit: "C",
  weatherAware: true,
};

export const STYLE_OPTIONS = [
  { value: "native", label: "Native" },
  { value: "smart casual", label: "Smart casual" },
  { value: "formal", label: "Formal and classic" },
  { value: "casual", label: "Casual" },
  { value: "streetwear", label: "Streetwear" },
];

export const COLOUR_OPTIONS: { name: string; hex: string }[] = [
  { name: "Black", hex: "#1A1A1A" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Navy", hex: "#1F2A44" },
  { name: "Grey", hex: "#8C8C8C" },
  { name: "Beige", hex: "#D8C3A5" },
  { name: "Cream", hex: "#F1E6CF" },
  { name: "Brown", hex: "#6B4A2F" },
  { name: "Olive", hex: "#6B6B3A" },
  { name: "Blue", hex: "#2F6DB5" },
  { name: "Green", hex: "#2E7D4F" },
  { name: "Burgundy", hex: "#6D1F2F" },
  { name: "Red", hex: "#C0392B" },
];

/** Reads the saved preferences. If the database has not been updated yet, returns the defaults. */
export async function loadPrefs(
  supabase: ReturnType<typeof createClient>,
  uid: string
): Promise<Prefs> {
  const { data, error } = await supabase
    .from("profiles")
    .select("style_prefs, fav_colours, city, lat, lon, temp_unit, weather_aware")
    .eq("id", uid)
    .maybeSingle();

  if (error) {
    console.warn("Preferences not available yet:", error.message);
    return DEFAULT_PREFS;
  }
  if (!data) return DEFAULT_PREFS;

  return {
    styles: data.style_prefs ?? [],
    colours: data.fav_colours ?? [],
    city: data.city ?? null,
    lat: typeof data.lat === "number" ? data.lat : null,
    lon: typeof data.lon === "number" ? data.lon : null,
    unit: data.temp_unit === "F" ? "F" : "C",
    weatherAware: data.weather_aware !== false,
  };
}

/** Looks up a place by name. Uses Open-Meteo's free geocoder. */
export async function findPlace(
  query: string,
  signal?: AbortSignal
): Promise<{ name: string; lat: number; lon: number } | null> {
  const q = query.trim();
  if (q.length < 2) return null;
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=en&format=json`,
    { signal }
  );
  if (!res.ok) throw new Error(`Geocoding failed (${res.status})`);
  const j = await res.json();
  const r = j?.results?.[0];
  if (!r || typeof r.latitude !== "number" || typeof r.longitude !== "number") return null;
  return {
    name: [r.name, r.admin1, r.country_code].filter(Boolean).join(", "),
    lat: r.latitude,
    lon: r.longitude,
  };
}
