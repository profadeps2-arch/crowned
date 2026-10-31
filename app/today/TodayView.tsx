"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { OCCASIONS, buildLooks, missingFor, whyItWorks, type Look, type Occasion, type Piece, type StyleContext } from "@/lib/outfits";
import { weatherContext } from "@/lib/weather";
import { groupFor } from "@/lib/customize";
import { saveLook, wearLook } from "@/lib/looks-db";
import { loadPick, savePick } from "@/lib/today-pick";
import { useWardrobe } from "../components/useWardrobe";
import { useWeather } from "../components/useWeather";
import WeatherCard from "../components/WeatherCard";
import { Breakdown, LookBento, PieceViewer } from "../components/LookBento";
import ReadyScreen from "../components/ReadyScreen";
import Crown from "../components/Crown";

function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** What the day usually calls for, with fallbacks in case the wardrobe has nothing for it. */
function occasionsFor(d: Date): string[] {
  const day = d.getDay();
  const first = day === 0 ? "Church" : day === 5 ? "Friday wear" : day === 6 ? "Hangout" : "Office";
  return [first, "Everyday", "Hangout", "Date night", "Office"];
}

type Plan = { occasion: Occasion; look: Look };

export default function TodayView() {
  const { pieces, setPieces, uid, name, prefs, loading, error } = useWardrobe();
  const { state: weather, retry } = useWeather({
    ready: !loading,
    saved: prefs.lat !== null && prefs.lon !== null ? { lat: prefs.lat, lon: prefs.lon, city: prefs.city } : null,
  });
  const [waited, setWaited] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [empty, setEmpty] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const [viewing, setViewing] = useState<Piece | null>(null);
  const [worn, setWorn] = useState(false);
  const shown = useRef<Set<string>>(new Set());
  const [now] = useState(() => new Date());
  const day = now.toLocaleDateString("en-CA"); // YYYY-MM-DD in his own time zone

  // Do not hold the outfit back for the weather forever.
  useEffect(() => {
    const t = setTimeout(() => setWaited(true), 6000);
    return () => clearTimeout(t);
  }, []);

  const ctx: StyleContext = {
    ...(weather.status === "ready" && prefs.weatherAware ? weatherContext(weather.weather) : {}),
    likes: prefs.styles,
    colours: prefs.colours,
  };
  const settled = !loading && (weather.status !== "loading" || waited);

  const choose = useCallback(
    (fresh: boolean, useKept = false) => {
      if (fresh) shown.current.clear();
      // One outfit per day: reuse today's pick if it is still valid.
      if (useKept) {
        const kept = loadPick(uid, day, pieces);
        const keptOcc = kept && OCCASIONS.find((o) => o.label === kept.occasion);
        if (kept && keptOcc) {
          shown.current.add(kept.look.core);
          setPlan({ occasion: keptOcc, look: kept.look });
          setSaved(false);
          setProblem("");
          setEmpty("");
          return;
        }
      }
      for (const label of occasionsFor(now)) {
        const occ = OCCASIONS.find((o) => o.label === label);
        if (!occ) continue;
        let looks = buildLooks(pieces, occ, shown.current, ctx);
        if (looks.length === 0 && shown.current.size > 0) {
          shown.current.clear();
          looks = buildLooks(pieces, occ, shown.current, ctx);
        }
        if (looks.length === 0) continue;
        const look = looks.find((l) => l.tier === "Classy") ?? looks[0];
        shown.current.add(look.core);
        setPlan({ occasion: occ, look });
        savePick(uid, day, occ.label, look);
        setSaved(false);
        setProblem("");
        setEmpty("");
        return;
      }
      setPlan(null);
      const first = OCCASIONS.find((o) => o.label === occasionsFor(now)[0]) ?? OCCASIONS[0];
      setEmpty(missingFor(pieces, first, ctx));
    },
    // ctx is rebuilt each render. Its values are what matter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pieces, now, uid, day, ctx.hot, ctx.cool, ctx.rainy, prefs.styles, prefs.colours]
  );

  // Pick once the wardrobe and the weather have both settled.
  const picked = useRef(false);
  useEffect(() => {
    if (loading || error || !settled || picked.current) return;
    picked.current = true;
    choose(true, true);
  }, [loading, error, settled, choose]);

  async function love() {
    if (!plan || saved) return;
    setProblem("");
    const err = await saveLook(plan.look, plan.occasion.label);
    if (err) setProblem(err);
    else setSaved(true);
  }

  async function wear() {
    if (!plan) return;
    setBusy(true);
    setProblem("");
    const err = await wearLook(plan.look, plan.occasion.label);
    setBusy(false);
    if (err) return setProblem(err);
    const ids = new Set([plan.look.main, [plan.look.outer], [plan.look.shoes], [plan.look.extra]].flat().filter(Boolean).map((p) => p!.id));
    const today = new Date().toISOString().slice(0, 10);
    setPieces((list) => list.map((p) => (ids.has(p.id) ? { ...p, last_worn: today } : p)));
    setWorn(true);
  }

  const [open, setOpen] = useState(false);
  const thinking = loading || (!error && !settled) || (!plan && !empty && !error);
  const ready = plan && !thinking && !error;

  return (
    <main className="flex flex-col gap-8 px-6 pb-8 pt-[calc(2rem+env(safe-area-inset-top))]">
      <header className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <span className="eyebrow">
            {now.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" })}
          </span>
          <h1 className="large-title">
            {greeting(now.getHours())}
            {name ? `, ${name}` : ""}.
          </h1>
        </div>
        <WeatherCard state={weather} onRetry={retry} unit={prefs.unit} />
      </header>

      {error && <div className="card p-5 subhead text-navy">{error}</div>}

      {thinking && !error && (
        <div className="flex animate-pulse flex-col gap-3" aria-busy="true" aria-label="Choosing your outfit">
          <div className="aspect-[4/3] w-full rounded-[14px] bg-sand" />
          <div className="h-6 w-48 rounded bg-sand" />
        </div>
      )}

      {!thinking && !error && !plan && empty && (
        <div className="flex flex-col items-start gap-5 border-t border-line pt-8">
          <Crown size={32} className="text-orange" />
          <h2 className="title-2">{pieces.length === 0 ? "Your wardrobe is empty" : "We need a little more"}</h2>
          <p className="subhead text-muted">
            {pieces.length === 0 ? "Add a few pieces and your first outfit appears here." : empty}
          </p>
          <Link href="/wardrobe" className="btn btn-orange">
            {pieces.length === 0 ? "Add your first pieces" : "Go to Wardrobe"}
          </Link>
        </div>
      )}

      {ready && (
        <section key={plan.look.key} className="flex flex-col gap-6" aria-label="Today's outfit">
          <LookBento look={plan.look} onOpen={setViewing} />

          <div className="rise flex flex-col gap-1" style={{ "--d": "0.35s" } as React.CSSProperties}>
            <h2 className="title-2">{plan.look.title}</h2>
          </div>

          {problem && <p className="subhead text-danger">{problem}</p>}

          <div className="rise flex flex-col gap-5" style={{ "--d": "0.45s" } as React.CSSProperties}>
            <button onClick={wear} disabled={busy} className="btn btn-orange">
              Wear this today
            </button>
            <div className="flex justify-between px-1">
              <button onClick={() => choose(false)} className="link">Another</button>
              <Link
                href={`/customize?group=${groupFor(plan.occasion.label)}`}
                className="link"
              >
                Customize
              </Link>
              <button onClick={() => setOpen(true)} className="link">Details</button>
            </div>
          </div>
        </section>
      )}

      {open && plan && (
        <div className="sheet-in fixed inset-0 z-50 overflow-y-auto bg-cream" role="dialog" aria-label="Outfit details">
          <div className="mx-auto flex max-w-md flex-col gap-8 px-6 pb-12 pt-[calc(1rem+env(safe-area-inset-top))]">
            <div className="flex justify-end">
              <button onClick={() => setOpen(false)} className="link min-h-11">Close</button>
            </div>

            <h2 className="title-1">{plan.look.title}</h2>

            <div className="flex flex-col gap-3">
              <h3 className="headline">What you are wearing</h3>
              <Breakdown look={plan.look} onOpen={setViewing} />
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="headline">Why it works</h3>
              <p className="subhead text-muted">{whyItWorks(plan.look, plan.occasion, ctx)}</p>
              {plan.look.tips.map((t) => (
                <p key={t} className="subhead text-muted">{t}</p>
              ))}
            </div>

            <button onClick={love} className="btn btn-outline" aria-pressed={saved}>
              <Heart size={18} strokeWidth={1.5} fill={saved ? "currentColor" : "none"} aria-hidden />
              {saved ? "Saved to Outfits" : "Save to Outfits"}
            </button>
          </div>
        </div>
      )}

      <PieceViewer piece={viewing} onClose={() => setViewing(null)} />
      {worn && plan && <ReadyScreen title={plan.look.title} name="Oba" onDone={() => setWorn(false)} />}
    </main>
  );
}
