"use client";

import { useEffect, useRef, useState } from "react";
import { pop, success } from "@/lib/feedback";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bookmark, Briefcase, ChevronLeft, Church, Coffee, Dumbbell, Flower2, Footprints, GraduationCap, Heart, Moon, PartyPopper, RefreshCw, Shirt, Gem, type LucideIcon } from "lucide-react";
import { OCCASIONS, buildLooks, missingFor, whyItWorks, type Look, type Occasion, type StyleContext } from "@/lib/outfits";
import { GROUPS, PALETTES, resolve, type Group } from "@/lib/customize";
import { weatherContext } from "@/lib/weather";
import { saveLook, wearLook } from "@/lib/looks-db";
import { useWardrobe } from "../components/useWardrobe";
import { useWeather } from "../components/useWeather";
import { LookBento, PieceViewer } from "../components/LookBento";
import StyleLoading from "../components/StyleLoading";
import ReadyScreen from "../components/ReadyScreen";
import type { Piece } from "@/lib/outfits";

const ICONS: Record<string, LucideIcon> = {
  work: Briefcase, church: Church, mosque: Moon, school: GraduationCap, gym: Dumbbell, friday: Shirt,
  owambe: PartyPopper, funeral: Flower2, date: Heart, everyday: Coffee, street: Footprints, special: Gem,
};

const COUNT_WORDS = ["", "One look", "Two looks", "Three looks"];
const MIN_LOADING_MS = 2600;

/**
 * One occasion tile. If a photo exists at /occasions/<id>.jpg it fills the tile,
 * otherwise the tile stays a quiet icon card. No code change needed to add photos.
 */
function OccasionCard({
  group, Icon, disabled, onPick,
}: {
  group: Group;
  Icon: typeof Shirt;
  disabled: boolean;
  onPick: () => void;
}) {
  const [photo, setPhoto] = useState(false);
  return (
    <button
      onClick={onPick}
      disabled={disabled}
      className="relative flex min-h-[148px] flex-col justify-between overflow-hidden rounded-[22px] bg-sand p-4 text-left transition-transform active:scale-[0.97] disabled:opacity-50"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/occasions/${group.id}.jpg`}
        alt=""
        onLoad={() => setPhoto(true)}
        onError={() => setPhoto(false)}
        className={photo ? "absolute inset-0 h-full w-full object-cover" : "hidden"}
      />
      {photo && <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/5" aria-hidden />}
      <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-cream">
        <Icon size={20} strokeWidth={1.6} className="text-navy" aria-hidden />
      </span>
      <span className="relative flex flex-col gap-0.5">
        <span className={`text-[16px] font-semibold leading-tight ${photo ? "text-white" : "text-navy"}`}>{group.label}</span>
        <span className={`text-[13px] leading-snug ${photo ? "text-white/80" : "text-muted"}`}>{group.blurb}</span>
      </span>
    </button>
  );
}

/**
 * Next keeps a page's state alive when you leave it. Keying on bfcacheId throws that state
 * away on every fresh visit (tapping Customize), so it always starts at the occasion list.
 * Browser back and forward still restore it.
 */
export default function CustomizeView() {
  const { bfcacheId } = useRouter();
  return <CustomizeFlow key={bfcacheId} />;
}

function CustomizeFlow() {
  const router = useRouter();
  const { pieces, setPieces, prefs, loading, error } = useWardrobe();
  const { state: weather } = useWeather({
    ready: !loading,
    saved: prefs.lat !== null && prefs.lon !== null ? { lat: prefs.lat, lon: prefs.lon, city: prefs.city } : null,
  });

  // Always starts from scratch: no occasion is picked for him.
  const [group, setGroup] = useState<Group | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [palette, setPalette] = useState(0);
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
      palette: PALETTES[palette].colours,
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
      const d = Math.abs(k.offsetLeft - el.scrollLeft - 24);
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
    if (el && kid) el.scrollTo({ left: kid.offsetLeft - 24, behavior: "smooth" });
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
    <main className="flex flex-col gap-8 px-6 pb-10 pt-3">
      {styling && <StyleLoading />}

      {error && <p className="text-[15px] text-muted">{error}</p>}

      {/* 1. Pick the occasion */}
      {!showResults && !group && !error && (
        <>
          <header className="flex flex-col gap-3">
            <Link href="/today" className="-ml-1 flex items-center gap-0.5 self-start text-[15px] font-medium text-muted active:opacity-60">
              <ChevronLeft size={18} aria-hidden /> Today
            </Link>
            <h1 className="text-[28px] font-semibold leading-[1.1] tracking-[-0.025em] text-navy">What are you dressing for today?</h1>
            <p className="text-[15px] leading-snug text-muted">Choose the occasion so we can build the right look for you.</p>
          </header>

          <div className="grid grid-cols-2 gap-3">
            {GROUPS.map((g) => {
              return (
                <OccasionCard
                  key={g.id}
                  group={g}
                  Icon={ICONS[g.id] ?? Shirt}
                  disabled={loading}
                  onPick={() => {
                    setGroup(g);
                    setAnswers({});
                    setPalette(0);
                  }}
                />
              );
            })}
          </div>
        </>
      )}

      {/* 2. Questions for that occasion */}
      {!showResults && group && !error && (
        <>
          <header className="flex flex-col gap-3">
            <button
              onClick={() => setGroup(null)}
              className="-ml-1 flex items-center gap-0.5 self-start text-[15px] font-medium text-muted active:opacity-60"
            >
              <ChevronLeft size={18} aria-hidden /> Occasions
            </button>
            <span className="eyebrow !text-[13px]">{group.label}</span>
            <h1 className="text-[28px] font-semibold leading-[1.1] tracking-[-0.025em] text-navy">A little more detail</h1>
          </header>

          {group.questions.map((q) => (
            <fieldset key={q.id} className="flex flex-col">
              <legend className="mb-4 text-[17px] font-medium text-navy">{q.ask}</legend>
              <div className="flex flex-wrap gap-2">
                {q.options.map((o, i) => (
                  <button
                    key={o.label}
                    type="button"
                    aria-pressed={answers[q.id] === i}
                    onClick={() => setAnswers((a) => ({ ...a, [q.id]: i }))}
                    className="chip"
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </fieldset>
          ))}

          <fieldset className="flex flex-col">
            <legend className="mb-1 text-[17px] font-medium text-navy">Colours</legend>
            <p className="mb-4 text-[14px] text-muted">Optional. Leave it and we pick what works.</p>
            <div className="flex flex-wrap gap-2">
              {PALETTES.map((pal, i) => (
                <button
                  key={pal.label}
                  type="button"
                  aria-pressed={palette === i}
                  onClick={() => setPalette(i)}
                  className="chip"
                >
                  {pal.label}
                </button>
              ))}
            </div>
          </fieldset>

          <button onClick={() => run(true)} disabled={!complete || loading} className="btn btn-orange">
            Style Me
          </button>
        </>
      )}

      {/* 3. The looks */}
      {showResults && occasion && (
        <>
          <header className="flex flex-col gap-3">
            <button onClick={changeAnswers} className="-ml-1 flex items-center gap-0.5 self-start text-[15px] font-medium text-muted active:opacity-60">
              <ChevronLeft size={18} aria-hidden /> Change answers
            </button>
            <h1 className="text-[28px] font-semibold leading-[1.1] tracking-[-0.025em] text-navy">{occasion.label}</h1>
            {looks.length > 0 && (
              <p className="text-[15px] text-muted">{COUNT_WORDS[looks.length]} from your wardrobe.</p>
            )}
          </header>

          {looks.length === 0 && (
            <div className="flex flex-col gap-5">
              <p className="text-[15px] leading-relaxed text-muted">{message}</p>
              <Link href="/wardrobe" className="btn btn-orange">Go to Wardrobe</Link>
            </div>
          )}

          {looks.length > 0 && (
            <>
              <div
                ref={rail}
                onScroll={onRailScroll}
                className="no-scrollbar relative -mx-6 flex scroll-pl-6 snap-x snap-mandatory gap-4 overflow-x-auto px-6"
              >
                {looks.map((look, i) => (
                  <article
                    key={look.key}
                    className="deal flex w-[88%] shrink-0 snap-start flex-col gap-5"
                    style={{ "--d": `${0.15 + i * 0.22}s` } as React.CSSProperties}
                  >
                    <div className="flex flex-col gap-1.5">
                      <span className="eyebrow">{look.tier}</span>
                      <h2 className="text-[20px] font-semibold leading-tight tracking-[-0.02em] text-navy">{look.title}</h2>
                    </div>

                    <LookBento look={look} onOpen={setViewing} />

                    <div className="flex flex-col gap-2">
                      <h3 className="text-[15px] font-semibold text-navy">Why it works</h3>
                      <p className="text-[15px] leading-relaxed text-muted">{whyItWorks(look, occasion, ctx)}</p>
                      {look.tips.map((t) => (
                        <p key={t} className="text-[15px] leading-relaxed text-muted">{t}</p>
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

              <div className="flex flex-col items-center gap-5">
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
                <button onClick={() => run(false)} className="flex items-center gap-2 text-[15px] font-medium text-navy active:opacity-60">
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
