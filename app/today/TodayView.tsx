"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Heart, SlidersHorizontal, RefreshCw } from "lucide-react";
import { OCCASIONS, buildLooks, missingFor, whyItWorks, type Look, type Occasion, type Piece } from "@/lib/outfits";
import { weatherContext } from "@/lib/weather";
import { saveLook, wearLook } from "@/lib/looks-db";
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
  const { pieces, setPieces, name, loading, error } = useWardrobe();
  const { state: weather, retry } = useWeather();
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

  // Do not hold the outfit back for the weather forever.
  useEffect(() => {
    const t = setTimeout(() => setWaited(true), 6000);
    return () => clearTimeout(t);
  }, []);

  const ctx = weather.status === "ready" ? weatherContext(weather.weather) : {};
  const settled = weather.status !== "loading" || waited;

  const choose = useCallback(
    (fresh: boolean) => {
      if (fresh) shown.current.clear();
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
    [pieces, now, ctx.hot, ctx.cool, ctx.rainy]
  );

  // Pick once the wardrobe and the weather have both settled.
  const picked = useRef(false);
  useEffect(() => {
    if (loading || error || !settled || picked.current) return;
    picked.current = true;
    choose(true);
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
    const err = await wearLook(plan.look);
    setBusy(false);
    if (err) return setProblem(err);
    const ids = new Set([plan.look.main, [plan.look.outer], [plan.look.shoes], [plan.look.extra]].flat().filter(Boolean).map((p) => p!.id));
    const today = new Date().toISOString().slice(0, 10);
    setPieces((list) => list.map((p) => (ids.has(p.id) ? { ...p, last_worn: today } : p)));
    setWorn(true);
  }

  const thinking = loading || (!error && !settled) || (!plan && !empty && !error);

  return (
    <main className="flex flex-col gap-6 px-5 pb-8 pt-4">
      <header className="flex flex-col gap-1">
        <span className="eyebrow">
          {now.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" })}
        </span>
        <h1 className="text-3xl leading-tight">
          {greeting(now.getHours())}
          {name ? `, ${name}` : ""}.
        </h1>
      </header>

      <WeatherCard state={weather} onRetry={retry} />

      {error && (
        <div className="card p-5 text-sm text-navy">{error}</div>
      )}

      {thinking && !error && (
        <div className="flex animate-pulse flex-col gap-3" aria-busy="true" aria-label="Choosing your outfit">
          <div className="h-5 w-40 rounded bg-sand" />
          <div className="aspect-[4/5] w-full rounded-2xl bg-sand" />
          <div className="flex gap-2">
            <div className="h-32 flex-1 rounded-2xl bg-sand" />
            <div className="h-32 w-32 rounded-2xl bg-sand" />
          </div>
        </div>
      )}

      {!thinking && !error && !plan && empty && (
        <div className="card flex flex-col items-center gap-4 p-8 text-center">
          <Crown size={40} className="text-orange" />
          <h2 className="text-xl">{pieces.length === 0 ? "Your wardrobe is empty" : "We need a little more"}</h2>
          <p className="text-sm text-muted">
            {pieces.length === 0 ? "Add a few pieces and your first outfit appears here." : empty}
          </p>
          <Link href="/wardrobe" className="btn btn-orange w-full">
            {pieces.length === 0 ? "Add your first pieces" : "Go to Wardrobe"}
          </Link>
        </div>
      )}

      {plan && !thinking && !error && (
        <section className="flex flex-col gap-5" aria-label="Today's outfit">
          <div className="flex items-end justify-between gap-3">
            <div className="flex flex-col gap-1">
              <span className="eyebrow">Today&apos;s outfit · {plan.occasion.label}</span>
              <h2 className="text-2xl leading-tight">{plan.look.title}</h2>
            </div>
            <button
              onClick={() => choose(false)}
              className="flex shrink-0 items-center gap-1.5 pb-1 text-sm font-semibold text-navy"
            >
              <RefreshCw size={14} aria-hidden /> Another
            </button>
          </div>

          <LookBento key={plan.look.key} look={plan.look} onOpen={setViewing} />

          <div className="flex flex-col gap-2">
            <h3 className="text-base font-semibold">What you are wearing</h3>
            <Breakdown look={plan.look} onOpen={setViewing} />
          </div>

          <div className="card flex flex-col gap-2 p-5">
            <h3 className="text-base font-semibold">Why it works</h3>
            <p className="text-sm leading-relaxed text-muted">
              {whyItWorks(plan.look, plan.occasion, ctx)}
            </p>
            {plan.look.tips.map((t) => (
              <p key={t} className="text-sm leading-relaxed text-muted">{t}</p>
            ))}
          </div>

          {problem && <p className="text-center text-sm text-[#C0392B]">{problem}</p>}

          <div className="flex flex-col gap-3">
            <button onClick={love} className="btn btn-orange" aria-pressed={saved}>
              <Heart size={18} fill={saved ? "currentColor" : "none"} aria-hidden />
              {saved ? "Saved to Outfits" : "Love This Look"}
            </button>
            <Link href="/customize" className="btn btn-outline">
              <SlidersHorizontal size={18} aria-hidden /> Customize My Outfit
            </Link>
            <button onClick={wear} disabled={busy} className="text-sm font-semibold text-navy disabled:opacity-50">
              I am wearing this today
            </button>
          </div>
        </section>
      )}

      <PieceViewer piece={viewing} onClose={() => setViewing(null)} />
      {worn && plan && <ReadyScreen title={plan.look.title} name="Oba" onDone={() => setWorn(false)} />}
    </main>
  );
}
