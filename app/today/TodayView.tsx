"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronRight, Heart, SlidersHorizontal, RefreshCw } from "lucide-react";
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
import Avatar from "../components/Avatar";
import Photo from "../components/Photo";

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

const GLANCE_LABELS: Record<string, string> = { Outerwear: "Jackets" };
const GLANCE_ORDER = ["Tops", "Bottoms", "Outerwear", "Shoes", "Native", "Accessories"];

/** One tile per category: a photo and a count. */
function glance(pieces: Piece[]) {
  const by = new Map<string, Piece[]>();
  for (const p of pieces) {
    if (!p.category) continue;
    by.set(p.category, [...(by.get(p.category) ?? []), p]);
  }
  const keys = [...GLANCE_ORDER.filter((k) => by.has(k)), ...[...by.keys()].filter((k) => !GLANCE_ORDER.includes(k))];
  return keys.map((k) => {
    const list = by.get(k)!;
    return { key: k, label: GLANCE_LABELS[k] ?? k, count: list.length, photo: list.find((p) => p.url)?.url ?? null };
  });
}

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

  const thinking = loading || (!error && !settled) || (!plan && !empty && !error);
  const [open, setOpen] = useState(false);
  const tiles = glance(pieces);
  const ready = plan && !thinking && !error;
  const rainOk = weather.status === "ready" && prefs.weatherAware;

  return (
    <main className="flex flex-col gap-5 px-5 pb-8 pt-[calc(1rem+env(safe-area-inset-top))]">
      <header className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="large-title">
            {greeting(now.getHours())}
            {name ? `, ${name}` : ""}.
          </h1>
          <p className="subhead text-orange-deep">Your style is ready for today.</p>
        </div>
        <div className="shrink-0 pt-1"><Avatar size={40} /></div>
      </header>

      <WeatherCard state={weather} onRetry={retry} unit={prefs.unit} now={now} />

      {ready && (
        <Link
          href={`/customize?group=${groupFor(plan.occasion.label)}`}
          className="btn btn-outline w-full"
        >
          <SlidersHorizontal size={18} aria-hidden /> Customize Today&apos;s Outfit
        </Link>
      )}

      {error && <div className="card p-5 subhead text-navy">{error}</div>}

      {thinking && !error && (
        <div className="flex animate-pulse flex-col gap-3" aria-busy="true" aria-label="Choosing your outfit">
          <div className="h-5 w-32 rounded bg-sand" />
          <div className="h-48 w-full rounded-[20px] bg-sand" />
        </div>
      )}

      {!thinking && !error && !plan && empty && (
        <div className="card flex flex-col items-center gap-4 p-8 text-center">
          <Crown size={40} className="text-orange" />
          <h2 className="title-2">{pieces.length === 0 ? "Your wardrobe is empty" : "We need a little more"}</h2>
          <p className="text-sm text-muted">
            {pieces.length === 0 ? "Add a few pieces and your first outfit appears here." : empty}
          </p>
          <Link href="/wardrobe" className="btn btn-orange w-full">
            {pieces.length === 0 ? "Add your first pieces" : "Go to Wardrobe"}
          </Link>
        </div>
      )}

      {ready && (
        <section className="flex flex-col gap-2" aria-label="Today's look">
          <h2 className="headline px-1">Today&apos;s Look</h2>
          <div className="card flex gap-4 p-3">
            <button
              onClick={() => setOpen(true)}
              aria-label="View outfit"
              className="grid w-[38%] shrink-0 grid-rows-2 gap-1 self-stretch overflow-hidden rounded-2xl"
              style={{ minHeight: 168 }}
            >
              {[...plan.look.main, ...(plan.look.main.length < 2 ? [plan.look.shoes] : [])].slice(0, 2).map((p) => (
                <Photo key={p.id} src={p.url} alt="" className="h-full w-full" />
              ))}
            </button>
            <div className="flex min-w-0 flex-1 flex-col gap-2 py-1">
              <div className="flex flex-col gap-0.5">
                <span className="eyebrow">{plan.occasion.label}</span>
                <h3 className="headline">{plan.look.title}</h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {rainOk && <span className="rounded-full bg-orange-soft px-2.5 py-1 text-[12px] font-medium text-orange-deep">Weather appropriate</span>}
                <span className="rounded-full bg-orange-soft px-2.5 py-1 text-[12px] font-medium text-orange-deep">From your wardrobe</span>
              </div>
              <button onClick={() => setOpen(true)} className="btn btn-orange mt-auto !h-11 !text-[15px]">
                View Outfit
              </button>
            </div>
          </div>
        </section>
      )}

      {!loading && !error && tiles.length > 0 && (
        <section className="flex flex-col gap-2" aria-label="Your wardrobe at a glance">
          <div className="flex items-center justify-between px-1">
            <h2 className="headline">Your wardrobe at a glance</h2>
            <Link href="/wardrobe" className="flex items-center text-[15px] text-orange-deep">
              See all <ChevronRight size={16} aria-hidden />
            </Link>
          </div>
          <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5">
            {tiles.map((t) => (
              <Link key={t.key} href="/wardrobe" className="flex w-[88px] shrink-0 flex-col gap-1.5">
                <Photo src={t.photo} alt="" className="aspect-square w-full rounded-2xl" />
                <span className="flex flex-col px-0.5">
                  <span className="text-[15px] font-semibold leading-tight text-navy">{t.label}</span>
                  <span className="footnote text-muted">{t.count} {t.count === 1 ? "item" : "items"}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {open && plan && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-cream" role="dialog" aria-label="Today's outfit">
          <div className="mx-auto flex max-w-md flex-col gap-5 px-5 pb-10 pt-[calc(0.75rem+env(safe-area-inset-top))]">
            <div className="flex items-center justify-between">
              <button onClick={() => setOpen(false)} className="min-h-11 text-[17px] font-semibold text-orange-deep">Done</button>
              <button
                onClick={() => choose(false)}
                className="flex min-h-11 items-center gap-1.5 text-[15px] font-semibold text-orange-deep active:opacity-60"
              >
                <RefreshCw size={14} aria-hidden /> Another
              </button>
            </div>

            <div className="flex flex-col gap-1">
              <span className="eyebrow">{plan.occasion.label}</span>
              <h2 className="large-title">{plan.look.title}</h2>
            </div>

            <LookBento key={plan.look.key} look={plan.look} onOpen={setViewing} />

            <div className="flex flex-col gap-2">
              <h3 className="headline px-1">What you are wearing</h3>
              <Breakdown look={plan.look} onOpen={setViewing} />
            </div>

            <div className="card flex flex-col gap-2 p-5">
              <h3 className="headline">Why it works</h3>
              <p className="subhead text-muted">{whyItWorks(plan.look, plan.occasion, ctx)}</p>
              {plan.look.tips.map((t) => (
                <p key={t} className="subhead text-muted">{t}</p>
              ))}
            </div>

            {problem && <p className="text-center text-sm text-danger">{problem}</p>}

            <div className="flex flex-col gap-3">
              <button onClick={love} className="btn btn-orange" aria-pressed={saved}>
                <Heart size={18} fill={saved ? "currentColor" : "none"} aria-hidden />
                {saved ? "Saved to Outfits" : "Love This Look"}
              </button>
              <button onClick={wear} disabled={busy} className="btn btn-ghost">
                I am wearing this today
              </button>
            </div>
          </div>
        </div>
      )}

      <PieceViewer piece={viewing} onClose={() => setViewing(null)} />
      {worn && plan && <ReadyScreen title={plan.look.title} name="Oba" onDone={() => setWorn(false)} />}
    </main>
  );
}
