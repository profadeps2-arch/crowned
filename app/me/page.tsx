"use client";

import { Bookmark, ChevronLeft, ChevronRight, LogOut, Shirt } from "lucide-react";
import SoundRow from "../components/SoundToggle";
import ThemeRow from "../components/ThemeRow";
import { useEffect, useState, type ChangeEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { COLOUR_OPTIONS, DEFAULT_PREFS, STYLE_OPTIONS, findPlace, loadPrefs, type Prefs, type Unit } from "@/lib/prefs";

const BUILDS = ["Slim", "Athletic", "Average", "Broad", "Big frame"];
const TOP_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
const WAISTS = ["28", "29", "30", "31", "32", "33", "34", "36", "38", "40", "42", "44"];
const SHOES = ["38", "39", "40", "41", "42", "43", "44", "45", "46", "47", "48"];

type Profile = {
  name: string | null;
  height_cm: number | null;
  body_type: string | null;
  avatar_path: string | null;
  top_size: string | null;
  waist_size: string | null;
  shoe_size: string | null;
};

const EMPTY: Profile = {
  name: null,
  height_cm: null,
  body_type: null,
  avatar_path: null,
  top_size: null,
  waist_size: null,
  shoe_size: null,
};

function splitHeight(cm: number) {
  const totalIn = Math.round(cm / 2.54);
  return { feet: Math.floor(totalIn / 12), inches: totalIn % 12 };
}

function heightLabel(cm: number | null) {
  if (!cm) return "Add";
  const { feet, inches } = splitHeight(cm);
  return `${feet} ft ${inches} in · ${cm} cm`;
}

function toJpeg(img: ImageBitmap, max: number, quality: number): Promise<Blob> {
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), "image/jpeg", quality));
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="eyebrow px-4 !font-normal">{title}</h2>
      <div className="list">
        {children}
      </div>
    </section>
  );
}

function Row({
  label, value, open, onClick,
}: {
  label: string;
  value: string;
  open?: boolean;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="flex min-h-[52px] w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors active:bg-fill">
      <span className="text-navy">{label}</span>
      <span className="flex items-center gap-2 text-muted">
        {value}
        <span className={`text-xl leading-none text-muted/60 transition-transform ${open ? "rotate-90" : ""}`}>›</span>
      </span>
    </button>
  );
}

function Chips({
  options, value, onPick,
}: {
  options: string[];
  value: string | null;
  onPick: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 px-4 pb-4">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onPick(o)}
          aria-pressed={value === o}
          className="chip"
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function MultiChips({
  options, value, onToggle,
}: {
  options: { value: string; label: string; hex?: string }[];
  value: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 px-4 pb-4">
      {options.map((o) => {
        const on = value.includes(o.value);
        return (
          <button
            key={o.value}
            onClick={() => onToggle(o.value)}
            aria-pressed={on}
            className="chip"
          >
            {o.hex && (
              <span className="h-3.5 w-3.5 rounded-full border border-black/15" style={{ background: o.hex }} aria-hidden />
            )}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export default function MePage() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [since, setSince] = useState("");
  const [googlePhoto, setGooglePhoto] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile>(EMPTY);
  const [pieces, setPieces] = useState(0);
  const [washman, setWashman] = useState(0);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [feet, setFeet] = useState(5);
  const [inches, setInches] = useState(9);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [cityDraft, setCityDraft] = useState("");

  const cm = Math.round((feet * 12 + inches) * 2.54);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }
      setUid(user.id);
      setEmail(user.email ?? "");
      setSince(
        new Date(user.created_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
      );
      setGooglePhoto(user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null);

      const { data: p } = await supabase
        .from("profiles")
        .select("name, height_cm, body_type, avatar_path, top_size, waist_size, shoe_size")
        .eq("id", user.id)
        .maybeSingle();

      const prof: Profile = { ...EMPTY, ...(p ?? {}) };
      setProfile(prof);
      setNameDraft(prof.name ?? "");
      if (prof.height_cm) {
        const h = splitHeight(prof.height_cm);
        setFeet(h.feet);
        setInches(h.inches);
      }

      if (prof.avatar_path) {
        const { data: signed } = await supabase.storage
          .from("wardrobe")
          .createSignedUrl(prof.avatar_path, 3600);
        setAvatarUrl(signed?.signedUrl ?? null);
      }

      const loadedPrefs = await loadPrefs(supabase, user.id);
      setPrefs(loadedPrefs);
      setCityDraft(loadedPrefs.city ?? "");

      const { count } = await supabase.from("items").select("id", { count: "exact", head: true });
      const { count: wash } = await supabase
        .from("items")
        .select("id", { count: "exact", head: true })
        .eq("at_washman", true);
      setPieces(count ?? 0);
      setWashman(wash ?? 0);
      setLoading(false);
    }
    load();
  }, [router]);

  function toggle(key: string) {
    setMessage("");
    setOpen((o) => (o === key ? null : key));
  }

  async function save(fields: Partial<Profile>) {
    if (!uid) return;
    setBusy(true);
    setMessage("");
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: uid, ...fields, updated_at: new Date().toISOString() });

    if (error) {
      console.error("Profile save failed:", error);
      setMessage("Couldn't save. Try again.");
      setBusy(false);
      return;
    }

    setProfile((p) => ({ ...p, ...fields }));
    setOpen(null);

    if ("top_size" in fields || "waist_size" in fields || "shoe_size" in fields) {
      const { data: n } = await supabase.rpc("apply_usual_sizes_to_existing");
      if (typeof n === "number" && n > 0) {
        setMessage(`Added your size to ${n} ${n === 1 ? "piece" : "pieces"}.`);
      } else {
        setMessage("Saved. New pieces will use this size.");
      }
    }
    setBusy(false);
  }

  /** Saves style, colour, location and weather choices. Rolls back if the save fails. */
  async function savePrefs(update: Partial<Prefs>, done?: string) {
    if (!uid) return false;
    const before = prefs;
    const next = { ...prefs, ...update };
    setPrefs(next);
    setMessage("");

    const row: Record<string, unknown> = { id: uid, updated_at: new Date().toISOString() };
    if ("styles" in update) row.style_prefs = next.styles;
    if ("colours" in update) row.fav_colours = next.colours;
    if ("city" in update) row.city = next.city;
    if ("lat" in update) row.lat = next.lat;
    if ("lon" in update) row.lon = next.lon;
    if ("unit" in update) row.temp_unit = next.unit;
    if ("weatherAware" in update) row.weather_aware = next.weatherAware;

    const { error } = await createClient().from("profiles").upsert(row);
    if (error) {
      console.error("Preferences save failed:", error);
      setPrefs(before);
      setMessage("We could not save that. Please try again.");
      return false;
    }
    if (done) setMessage(done);
    return true;
  }

  const toggleIn = (list: string[], v: string) =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

  async function findCity() {
    if (cityDraft.trim().length < 2) return;
    setBusy(true);
    setMessage("");
    try {
      const place = await findPlace(cityDraft);
      if (!place) {
        setMessage("We could not find that place. Try the city name only.");
      } else if (await savePrefs({ city: place.name, lat: place.lat, lon: place.lon }, `Location set to ${place.name}.`)) {
        setCityDraft(place.name);
        setOpen(null);
      }
    } catch (err) {
      console.error("City lookup failed:", err);
      setMessage("We could not look that up right now. Please try again.");
    }
    setBusy(false);
  }

  function useHere() {
    if (!navigator.geolocation) return setMessage("Location is not available on this device.");
    setBusy(true);
    setMessage("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const ok = await savePrefs(
          { city: "Current location", lat: pos.coords.latitude, lon: pos.coords.longitude },
          "Using your current location."
        );
        if (ok) {
          setCityDraft("");
          setOpen(null);
        }
        setBusy(false);
      },
      () => {
        setMessage("We could not get your location. Allow it in your browser, or type your city.");
        setBusy(false);
      },
      { timeout: 8000 }
    );
  }

  async function changePhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !uid) return;
    setBusy(true);
    setMessage("");
    setOpen(null);

    try {
      const supabase = createClient();
      const img = await createImageBitmap(file);
      const blob = await toJpeg(img, 512, 0.85);
      const path = `${uid}/avatar-${Date.now()}.jpg`;

      const { error: upErr } = await supabase.storage
        .from("wardrobe")
        .upload(path, blob, { contentType: "image/jpeg" });
      if (upErr) throw upErr;

      const old = profile.avatar_path;
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: uid, avatar_path: path, updated_at: new Date().toISOString() });
      if (error) throw error;

      if (old) await supabase.storage.from("wardrobe").remove([old]);

      const { data: signed } = await supabase.storage.from("wardrobe").createSignedUrl(path, 3600);
      setAvatarUrl(signed?.signedUrl ?? null);
      setProfile((p) => ({ ...p, avatar_path: path }));
      setMessage("Photo updated.");
    } catch (err) {
      console.error("Photo change failed:", err);
      setMessage("Couldn't update your photo. Try again.");
    }
    setBusy(false);
  }

  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/");
  }

  const photo = avatarUrl ?? googlePhoto;
  const initial = (profile.name ?? "").charAt(0).toUpperCase();

  if (loading) {
    return (
      <main className="flex flex-col items-center gap-4 px-6 py-16">
        <div className="h-24 w-24 animate-pulse rounded-full bg-sand" />
        <div className="h-5 w-40 animate-pulse rounded-full bg-sand" />
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-6 px-5 pb-16 pt-[calc(0.75rem+env(safe-area-inset-top))]">
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="-ml-1.5 flex min-h-11 items-center gap-0.5 text-[17px] text-orange-deep active:opacity-60">
          <ChevronLeft size={24} aria-hidden /> Back
        </button>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-full bg-navy">
            {photo ? (
              <img src={photo} alt="Your photo" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-3xl font-semibold text-cream">
                {initial}
              </span>
            )}
          </div>
          <div className="flex min-w-0 flex-col">
            <h1 className="truncate text-[22px] font-semibold leading-tight tracking-[-0.02em] text-navy">{profile.name ?? ""}</h1>
            <span className="truncate text-[14px] text-muted">{email}</span>
            <button onClick={() => toggle("photo")} className="mt-1 self-start text-[14px] font-medium text-navy">
              {busy && open === null && message === "" ? "Updating" : "Change photo"}
            </button>
          </div>
        </div>
        {open === "photo" && (
          <div className="flex w-full gap-2">
            <label className="btn btn-orange flex-1 cursor-pointer !h-11 !text-[15px]">
              Take photo
              <input type="file" accept="image/*" capture="user" className="hidden" onChange={changePhoto} />
            </label>
            <label className="btn btn-outline flex-1 cursor-pointer !h-11 !text-[15px]">
              From library
              <input type="file" accept="image/*" className="hidden" onChange={changePhoto} />
            </label>
          </div>
        )}
      </div>

      <div className="list">
        <Link href="/outfits" className="flex min-h-[56px] items-center gap-3 px-4 text-navy transition-colors active:bg-fill">
          <Bookmark size={20} strokeWidth={1.6} aria-hidden />
          <span className="flex-1">Saved outfits</span>
          <ChevronRight size={18} className="text-muted/60" aria-hidden />
        </Link>
        <Link href="/wardrobe" className="flex min-h-[56px] items-center gap-3 px-4 text-navy transition-colors active:bg-fill">
          <Shirt size={20} strokeWidth={1.6} aria-hidden />
          <span className="flex-1">My wardrobe</span>
          <ChevronRight size={18} className="text-muted/60" aria-hidden />
        </Link>
      </div>

      {message && <p className="fade-in text-center subhead text-navy">{message}</p>}

      <Section title="Your fit">
        <div>
          <Row label="Name" value={profile.name ?? "Add"} open={open === "name"} onClick={() => toggle("name")} />
          {open === "name" && (
            <div className="flex gap-2 px-4 pb-4">
              <input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                className="min-w-0 flex-1 field"
              />
              <button
                onClick={() => nameDraft.trim().length >= 2 && save({ name: nameDraft.trim() })}
                disabled={busy || nameDraft.trim().length < 2}
                className="btn btn-orange !h-12 !w-auto px-5 !text-[15px]"
              >
                Save
              </button>
            </div>
          )}
        </div>

        <div>
          <Row label="Height" value={heightLabel(profile.height_cm)} open={open === "height"} onClick={() => toggle("height")} />
          {open === "height" && (
            <div className="flex flex-wrap items-center gap-2 px-4 pb-4">
              <select
                value={feet}
                onChange={(e) => setFeet(Number(e.target.value))}
                className="field"
              >
                {[4, 5, 6, 7].map((f) => (
                  <option key={f} value={f}>{f} ft</option>
                ))}
              </select>
              <select
                value={inches}
                onChange={(e) => setInches(Number(e.target.value))}
                className="field"
              >
                {Array.from({ length: 12 }, (_, i) => i).map((i) => (
                  <option key={i} value={i}>{i} in</option>
                ))}
              </select>
              <span className="text-sm text-muted">= {cm} cm</span>
              <button
                onClick={() => save({ height_cm: cm })}
                disabled={busy}
                className="btn btn-orange ml-auto !h-12 !w-auto px-5 !text-[15px]"
              >
                Save
              </button>
            </div>
          )}
        </div>

        <div>
          <Row label="Build" value={profile.body_type ?? "Add"} open={open === "build"} onClick={() => toggle("build")} />
          {open === "build" && (
            <Chips options={BUILDS} value={profile.body_type} onPick={(v) => save({ body_type: v })} />
          )}
        </div>
      </Section>

      <Section title="Your usual sizes">
        <div>
          <Row label="Tops" value={profile.top_size ?? "Add"} open={open === "top"} onClick={() => toggle("top")} />
          {open === "top" && (
            <Chips options={TOP_SIZES} value={profile.top_size} onPick={(v) => save({ top_size: v })} />
          )}
        </div>
        <div>
          <Row
            label="Trouser Waist"
            value={profile.waist_size ? `${profile.waist_size} in` : "Add"}
            open={open === "waist"}
            onClick={() => toggle("waist")}
          />
          {open === "waist" && (
            <Chips options={WAISTS} value={profile.waist_size} onPick={(v) => save({ waist_size: v })} />
          )}
        </div>
        <div>
          <Row
            label="Shoes"
            value={profile.shoe_size ? `EU ${profile.shoe_size}` : "Add"}
            open={open === "shoe"}
            onClick={() => toggle("shoe")}
          />
          {open === "shoe" && (
            <Chips options={SHOES} value={profile.shoe_size} onPick={(v) => save({ shoe_size: v })} />
          )}
        </div>
      </Section>

      <Section title="Your style">
        <div>
          <Row
            label="Looks you like"
            value={prefs.styles.length ? `${prefs.styles.length} chosen` : "Add"}
            open={open === "styles"}
            onClick={() => toggle("styles")}
          />
          {open === "styles" && (
            <MultiChips
              options={STYLE_OPTIONS}
              value={prefs.styles}
              onToggle={(v) => savePrefs({ styles: toggleIn(prefs.styles, v) })}
            />
          )}
        </div>
        <div>
          <Row
            label="Favourite colours"
            value={prefs.colours.length ? prefs.colours.slice(0, 3).join(", ") + (prefs.colours.length > 3 ? "…" : "") : "Add"}
            open={open === "colours"}
            onClick={() => toggle("colours")}
          />
          {open === "colours" && (
            <MultiChips
              options={COLOUR_OPTIONS.map((c) => ({ value: c.name, label: c.name, hex: c.hex }))}
              value={prefs.colours}
              onToggle={(v) => savePrefs({ colours: toggleIn(prefs.colours, v) })}
            />
          )}
        </div>
      </Section>

      <Section title="Location and weather">
        <div>
          <Row
            label="Your city"
            value={prefs.city ?? "Uses your phone"}
            open={open === "city"}
            onClick={() => toggle("city")}
          />
          {open === "city" && (
            <div className="flex flex-col gap-3 px-4 pb-4">
              <div className="flex gap-2">
                <input
                  value={cityDraft}
                  onChange={(e) => setCityDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && findCity()}
                  placeholder="For example, Lagos"
                  aria-label="City"
                  className="min-w-0 flex-1 field"
                />
                <button
                  onClick={findCity}
                  disabled={busy || cityDraft.trim().length < 2}
                  className="btn btn-orange !h-12 !w-auto px-5 !text-[15px]"
                >
                  Find
                </button>
              </div>
              <div className="flex gap-4">
                <button onClick={useHere} disabled={busy} className="text-[15px] font-medium text-orange-deep disabled:opacity-40">
                  Use my current location
                </button>
                {(prefs.city || prefs.lat !== null) && (
                  <button
                    onClick={() => {
                      setCityDraft("");
                      savePrefs({ city: null, lat: null, lon: null }, "Location cleared. We will use your phone.");
                    }}
                    disabled={busy}
                    className="text-[15px] font-medium text-muted disabled:opacity-40"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
        <div>
          <Row
            label="Temperature"
            value={prefs.unit === "F" ? "Fahrenheit" : "Celsius"}
            open={open === "unit"}
            onClick={() => toggle("unit")}
          />
          {open === "unit" && (
            <Chips
              options={["Celsius", "Fahrenheit"]}
              value={prefs.unit === "F" ? "Fahrenheit" : "Celsius"}
              onPick={(v) => savePrefs({ unit: (v === "Fahrenheit" ? "F" : "C") as Unit })}
            />
          )}
        </div>
        <div>
          <Row
            label="Dress for the weather"
            value={prefs.weatherAware ? "On" : "Off"}
            open={open === "aware"}
            onClick={() => toggle("aware")}
          />
          {open === "aware" && (
            <div className="flex flex-col gap-3">
              <Chips
                options={["On", "Off"]}
                value={prefs.weatherAware ? "On" : "Off"}
                onPick={(v) => savePrefs({ weatherAware: v === "On" })}
              />
              <p className="-mt-2 px-4 pb-4 text-xs text-muted">
                On, heat and rain shape your outfits. Off, the weather is shown but ignored.
              </p>
            </div>
          )}
        </div>
      </Section>

      <Section title="Wardrobe">
        <Link href="/wardrobe" className="flex min-h-[52px] items-center justify-between px-4 py-3 transition-colors active:bg-fill">
          <span className="text-navy">
            {pieces} {pieces === 1 ? "piece" : "pieces"}
          </span>
          <span className="flex items-center gap-2 text-sm text-muted">
            {washman > 0 && `${washman} at the Washman`}
            <span className="text-muted">›</span>
          </span>
        </Link>
      </Section>

      <Section title="App">
        <ThemeRow />
        <SoundRow />
      </Section>

      <Section title="Account">
        <button onClick={signOut} className="flex min-h-[56px] w-full items-center gap-3 px-4 text-left text-danger transition-colors active:bg-fill">
          <LogOut size={20} strokeWidth={1.6} aria-hidden />
          Log out
        </button>
      </Section>
    </main>
  );
}