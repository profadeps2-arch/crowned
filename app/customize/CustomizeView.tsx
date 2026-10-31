"use client";

import { useEffect, useRef, useState } from "react";
import { pop, success } from "@/lib/feedback";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Bookmark, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { OCCASIONS, buildLooks, missingFor, whyItWorks, type Look, type Occasion, type StyleContext } from "@/lib/outfits";
import { GROUPS, resolve, type Group } from "@/lib/customize";
import { weatherContext } from "@/lib/weather";
import { saveLook, wearLook } from "@/lib/looks-db";
import { useWardrobe } from "../components/useWardrobe";
import { useWeather } from "../components/useWeather";
import { LookBento, PieceViewer } from "../components/LookBento";
import StyleLoading from "../components/StyleLoading";
import ReadyScreen from "../components/ReadyScreen";
import type { Piece } from "@/lib/outfits";

const COUNT_WORDS = ["", "One look", "Two looks", "Three looks"];
const MIN_LOADING_MS = 2600;

export default function CustomizeView() {
  const router = useRouter();
  const params = useSearchParams();
  const presetId = params.get("group");
  const { pieces, setPieces, prefs, loading, error } = useWardrobe();
  const { state: weather } = useWeather({
    ready: !loading,
    saved: prefs.lat !== null && prefs.lon !== null ? { lat: prefs.lat, lon: prefs.lon, city: prefs.city } : null,
  });

  // Today sends him here with his occasion already chosen.
  const [group, setGroup] = useState<Group | null>(() => GROUPS.find((g) => g.id === presetId) ?? null);
  const fromToday = !!presetId && group?.id === presetId;
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [styling, setStyling] = useState(false);
  const [looks, setLooks] = useState<Look[]>([]);
  const [occasion, setOccasion] = useState<Occasion | null>(null);
  const [ctx, setCtx] = useState<StyleContext>({});
  const [message, setMessage] = useState("");
  const [index, setIndex] = useState(0);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const [viewing, setViewing] = useState<Piece | null>(null);
  const [worn, setWorn] = useState<Look | null>(null);
  const shown = useRef<Set<string>>(new Set());
  const rail = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const complete = !!group && group.questions.every((q) => answers[q.id] !== undefined);

  function run(fresh: boolean) {
    if (!group) return;
    const { occasion: label, ctx: choice } = resolve(group, answers);
    const occ = OCCASIONS.find((o) => o.label === label);
    if (!occ) return;

    const full: StyleContext = {
      ...choice,
      ...(weather.status === "ready" && prefs.weatherAware ? weatherContext(weather.weather) : {}),
      likes: prefs.styles,
      colours: prefs.colours,
    };
    if (fresh) shown.current.clear();

    let result = buildLooks(pieces, occ, shown.current, full);
    if (result.length === 0 && shown.current.size > 0) {
      shown.current.clear();
      result = buildLooks(pieces, occ, shown.current, full);
    }
    result.forEach((l) => shown.current.add(l.core));

    setOccasion(occ);
    setCtx(full);
    setSaved(new Set());
    setProblem("");
    setIndex(0);

    // Hold the loading screen long enough to read, even when the answer is instant.
    setStyling(true);
    timer.current = setTimeout(() => {
      setLooks(result);
      setMessage(result.length === 0 ? missingFor(pieces, occ, full) : "");
      setStyling(false);
      rail.current?.scrollTo({ left: 0 });
      window.scrollTo({ top: 0 });
    }, MIN_LOADING_MS);
  }

  function onRailScroll() {
    const el = rail.current;
    if (!el) return;
    const kids = Array.from(el.children) as HTMLElement[];
    let best = 0;
    let gap = Infinity;
    kids.forEach((k, i) => {
      const d = Math.abs(k.offsetLeft - el.scrollLeft - 20);
      if (d < gap) {
        gap = d;
        best = i;
      }
    });
    setIndex(best);
  }

  function goTo(i: number) {
    const el = rail.current;
    const kid = el?.children[i] as HTMLElement | undefined;
    if (el && kid) el.scrollTo({ left: kid.offsetLeft - 20, behavior: "smooth" });
  }

  async function save(look: Look) {
    if (saved.has(look.key) || !occasion) return;
    setProblem("");
    const err = await saveLook(look, occasion.label);
    if (err) return setProblem(err);
    setSaved((s) => new Set(s).add(look.key));
    pop();
  }

  async function wear(look: Look) {
    setBusy(true);
    setProblem("");
    const err = await wearLook(look, occasion?.label ?? "Outfit");
    setBusy(false);
    if (err) return setProblem(err);
    const ids = new Set([...look.main, look.outer, look.shoes, look.extra, look.scent].filter(Boolean).map((p) => p!.id));
    const today = new Date().toISOString().slice(0, 10);
    setPieces((list) => list.map((p) => (ids.has(p.id) ? { ...p, last_worn: today } : p)));
    setWorn(look);
    success();
  }

  function changeAnswers() {
    setLooks([]);
    setMessage("");
    window.scrollTo({ top: 0 });
  }

  const showResults = !!occasion && !styling && (looks.length > 0 || !!message);

  return (
    <main className="flex flex-col gap-6 px-5 pb-8 pt-4">
      {styling && <StyleLoading />}

      {error && <div className="card p-5 subhead text-navy">{error}</div>}

      {/* 1. Pick the occasion */}
      {!showResults && !group && !error && (
        <>
          <header className="flex flex-col gap-1">
            <Link href="/today" className="flex items-center gap-1 self-start text-[17px] font-medium text-orange-deep">
              <ChevronLeft size={20} aria-hidden /> Today
            </Link>
            <h1 className="large-title">Where will you be seen?</h1>
            <p className="subhead text-muted">Pick the occasion. A couple of quick questions follow.</p>
          </header>

          <div className="list">
            {GROUPS.map((g) => (
              <button
                key={g.id}
                onClick={() => {
                  setGroup(g);
                  setAnswers({});
                }}
                disabled={loading}
                className="flex w-full items-center gap-3 p-4 text-left transition-colors active:bg-fill disabled:opacity-50"
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="headline text-navy">{g.label}</span>
                  <span className="footnote text-muted">{g.blurb}</span>
                </span>
                <ChevronRight size={18} className="shrink-0 text-muted" aria-hidden />
              </button>
            ))}
          </div>
        </>
      )}

      {/* 2. Questions for that occasion */}
      {!showResults && group && !error && (
        <>
          <header className="flex flex-col gap-1">
            <button
              onClick={() => setGroup(null)}
              className="flex items-center gap-1 self-start text-[17px] font-medium text-orange-deep"
            >
              <ChevronLeft size={20} aria-hidden /> {fromToday ? "Other occasions" : "Occasions"}
            </button>
            <span className="eyebrow">{group.label}</span>
            <h1 className="large-title">{fromToday ? "Customize today's outfit" : "A little more detail"}</h1>
          </header>

          {group.questions.map((q) => (
            <fieldset key={q.id} className="flex flex-col gap-3">
              <legend className="headline mb-3 text-navy">{q.ask}</legend>
              <div className="flex flex-wrap gap-2.5">
                {q.options.map((o, i) => (
                  <button
                    key={o.label}
                    type="button"
                    aria-pressed={answers[q.id] === i}
                    onClick={() => setAnswers((a) => ({ ...a, [q.id]: i }))}
                    className="chip !h-11"
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </fieldset>
          ))}

          <button onClick={() => run(true)} disabled={!complete || loading} className="btn btn-orange">
            Style Me
          </button>
          {!complete && <p className="-mt-3 text-center text-xs text-muted">Answer both to continue.</p>}
        </>
      )}

      {/* 3. The looks */}
      {showResults && occasion && (
        <>
          <header className="flex flex-col gap-1">
            <button onClick={changeAnswers} className="flex items-center gap-1 self-start text-[17px] font-medium text-orange-deep">
              <ChevronLeft size={20} aria-hidden /> Change answers
            </button>
            <h1 className="large-title">{occasion.label}</h1>
            {looks.length > 0 && (
              <p className="subhead text-muted">{COUNT_WORDS[looks.length]} from your wardrobe.</p>
            )}
          </header>

          {looks.length === 0 && (
            <div className="card flex flex-col gap-4 p-5">
              <p className="subhead text-navy">{message}</p>
              <Link href="/wardrobe" className="btn btn-orange">Go to Wardrobe</Link>
            </div>
          )}

          {looks.length > 0 && (
            <>
              <div
                ref={rail}
                onScroll={onRailScroll}
                className="no-scrollbar relative -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5"
              >
                {looks.map((look, i) => (
                  <article
                    key={look.key}
                    className={`deal flex w-[86%] shrink-0 snap-start flex-col gap-4 ${look.tier === "Boss" ? "glow rounded-3xl" : ""}`}
                    style={{ "--d": `${0.15 + i * 0.22}s` } as React.CSSProperties}
                  >
                    <div className="flex flex-col gap-1">
                      <span className="eyebrow">{look.tier}</span>
                      <h2 className="title-2">{look.title}</h2>
                    </div>

                    <LookBento look={look} onOpen={setViewing} />

                    <div className="card flex flex-col gap-2 p-4">
                      <h3 className="headline">Why it works</h3>
                      <p className="subhead text-muted">{whyItWorks(look, occasion, ctx)}</p>
                      {look.tips.map((t) => (
                        <p key={t} className="subhead text-muted">{t}</p>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => wear(look)} disabled={busy} className="btn btn-orange flex-1">
                        I Wear This
                      </button>
                      <button
                        onClick={() => save(look)}
                        aria-label={saved.has(look.key) ? "Saved" : "Save look"}
                        className="btn btn-outline !w-[52px] shrink-0 !px-0"
                      >
                        <Bookmark size={20} fill={saved.has(look.key) ? "currentColor" : "none"} aria-hidden />
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              {problem && <p className="text-center text-sm text-danger">{problem}</p>}

              <div className="flex flex-col items-center gap-4">
                {looks.length > 1 && (
                  <div className="flex gap-2">
                    {looks.map((l, i) => (
                      <button
                        key={l.key}
                        onClick={() => goTo(i)}
                        aria-label={`${l.tier} look`}
                        className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-navy" : "w-2 bg-muted/30"}`}
                      />
                    ))}
                  </div>
                )}
                <button onClick={() => run(false)} className="flex items-center gap-2 text-[17px] font-medium text-orange-deep">
                  <RefreshCw size={15} aria-hidden /> Show me others
                </button>
              </div>
            </>
          )}
        </>
      )}

      <PieceViewer piece={viewing} onClose={() => setViewing(null)} />
      {worn && <ReadyScreen title={worn.title} name="Oba" onDone={() => router.push("/today")} />}
    </main>
  );
}
