"use client";

import { useEffect, useMemo, useState } from "react";
import { pop, success } from "@/lib/feedback";
import Link from "next/link";
import { Heart, RotateCcw, Shirt, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { OCCASIONS, buildLooks, missingFor, type Look, type Piece, type StyleContext } from "@/lib/outfits";
import { weatherContext } from "@/lib/weather";
import { saveLook, wearItems } from "@/lib/looks-db";
import { useWardrobe } from "../components/useWardrobe";
import { useWeather } from "../components/useWeather";
import OutfitCard from "../components/OutfitCard";
import { PieceViewer } from "../components/LookBento";
import ReadyScreen from "../components/ReadyScreen";
import Crown from "../components/Crown";

type Tab = "recommended" | "saved" | "history";

type SavedRow = {
  id?: string | number;
  occasion: string | null;
  tier: string | null;
  title: string | null;
  item_ids: (string | number)[] | null;
  created_at?: string | null;
};
type HistoryRow = {
  id: string;
  occasion: string | null;
  tier: string | null;
  title: string | null;
  item_ids: string[] | null;
  worn_on: string | null;
  created_at: string | null;
};

const keyOf = (ids: (string | number)[]) => ids.map(String).sort().join("|");

function dayLabel(iso: string | null) {
  if (!iso) return "";
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  const days = Math.round((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return d.toLocaleDateString([], { day: "numeric", month: "short" });
}

function Empty({ title, text, action }: { title: string; text: string; action?: { href: string; label: string } }) {
  return (
    <div className="card flex flex-col items-center gap-4 p-8 text-center">
      <Crown size={40} className="text-navy" />
      <h2 className="title-2">{title}</h2>
      <p className="subhead text-muted">{text}</p>
      {action && (
        <Link href={action.href} className="btn btn-orange w-full">
          {action.label}
        </Link>
      )}
    </div>
  );
}

export default function OutfitsPage() {
  const { pieces, setPieces, prefs, loading, error } = useWardrobe();
  const { state: weather } = useWeather({
    ready: !loading,
    saved: prefs.lat !== null && prefs.lon !== null ? { lat: prefs.lat, lon: prefs.lon, city: prefs.city } : null,
  });

  const [tab, setTab] = useState<Tab>("recommended");
  const [saved, setSaved] = useState<SavedRow[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [listsLoading, setListsLoading] = useState(true);
  const [problem, setProblem] = useState("");
  const [confirming, setConfirming] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Piece | null>(null);
  const [worn, setWorn] = useState<string | null>(null);

  // Saved looks and History. Each is allowed to fail on its own.
  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const [s, h] = await Promise.all([
        supabase.from("saved_looks").select("*"),
        supabase.from("worn_looks").select("*").order("created_at", { ascending: false }).limit(60),
      ]);
      if (s.error) {
        console.error("Saved looks failed to load:", s.error);
        setProblem("We could not load your saved outfits. Refresh to try again.");
      } else {
        const rows = (s.data ?? []) as SavedRow[];
        rows.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
        setSaved(rows);
      }
      if (h.error) console.warn("History not available yet:", h.error.message);
      else setHistory((h.data ?? []) as HistoryRow[]);
      setListsLoading(false);
    })();
  }, []);

  const byId = useMemo(() => new Map(pieces.map((p) => [String(p.id), p])), [pieces]);
  const piecesFor = (ids: (string | number)[] | null) =>
    (ids ?? []).map((i) => byId.get(String(i))).filter((p): p is Piece => !!p);

  const ctx: StyleContext = useMemo(
    () => ({
      ...(weather.status === "ready" && prefs.weatherAware ? weatherContext(weather.weather) : {}),
      likes: prefs.styles,
      colours: prefs.colours,
    }),
    [weather, prefs]
  );

  // Recommended: one good look for a few occasions, built from what he owns.
  // Keyed on which pieces he owns, not on when they were last worn, so wearing a
  // look does not reshuffle the list under his thumb.
  const wardrobeKey = pieces.map((p) => `${p.id}${p.at_washman ? "w" : ""}`).join();
  const ctxKey = `${ctx.hot}|${ctx.cool}|${ctx.rainy}|${prefs.styles.join()}|${prefs.colours.join()}|${wardrobeKey}`;
  const settled = !loading && weather.status !== "loading";
  const { recs, recNote } = useMemo(() => {
    if (!settled || error) return { recs: null, recNote: "" };
    const out: { occasion: string; look: Look }[] = [];
    for (const label of ["Office", "Everyday", "Owambe", "Church", "Date night", "Hangout"]) {
      const occ = OCCASIONS.find((o) => o.label === label);
      if (!occ) continue;
      const looks = buildLooks(pieces, occ, new Set(), ctx);
      const look = looks.find((l) => l.tier === "Classy") ?? looks[0];
      if (look && !out.some((o) => o.look.core === look.core)) out.push({ occasion: label, look });
      if (out.length === 4) break;
    }
    const first = OCCASIONS.find((o) => o.label === "Office") ?? OCCASIONS[0];
    return { recs: out, recNote: out.length === 0 ? missingFor(pieces, first, ctx) : "" };
    // ctx is rebuilt from the values in ctxKey.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settled, error, ctxKey]);

  const savedKeys = useMemo(() => new Set(saved.map((r) => keyOf(r.item_ids ?? []))), [saved]);

  async function saveRec(occasion: string, look: Look) {
    setProblem("");
    const err = await saveLook(look, occasion);
    if (err) return setProblem(err);
    // Reload so the new row carries its real id and can be removed cleanly.
    const { data, error: e } = await createClient().from("saved_looks").select("*");
    if (e) return console.error("Saved looks reload failed:", e);
    const rows = (data ?? []) as SavedRow[];
    rows.sort((x, y) => (y.created_at ?? "").localeCompare(x.created_at ?? ""));
    setSaved(rows);
    pop();
  }

  async function remove(kind: "saved" | "history", id: string | number | undefined, ids: (string | number)[] | null) {
    setProblem("");
    const supabase = createClient();
    let res;
    if (kind === "saved") {
      const q = supabase.from("saved_looks").delete();
      res = id !== undefined ? await q.eq("id", id) : await q.contains("item_ids", ids ?? []);
    } else {
      res = await supabase.from("worn_looks").delete().eq("id", id as string);
    }
    if (res.error) {
      console.error("Remove failed:", res.error);
      return setProblem("We could not remove that. Please try again.");
    }
    setConfirming(null);
    if (kind === "saved") setSaved((rows) => rows.filter((r) => (id !== undefined ? r.id !== id : keyOf(r.item_ids ?? []) !== keyOf(ids ?? []))));
    else setHistory((rows) => rows.filter((r) => r.id !== id));
  }

  async function wear(title: string, occasion: string, tier: string | null, avail: Piece[]) {
    setProblem("");
    const ids = avail.map((p) => p.id);
    const err = await wearItems(ids, { title, occasion, tier });
    if (err) return setProblem(err);
    const today = new Date().toISOString().slice(0, 10);
    setPieces((list) => list.map((p) => (ids.includes(p.id) ? { ...p, last_worn: today } : p)));
    setHistory((rows) => [
      { id: `local-${Date.now()}`, occasion, tier, title, item_ids: ids, worn_on: today, created_at: new Date().toISOString() },
      ...rows,
    ]);
    setWorn(title);
    success();
  }

  const awayNote = (all: (string | number)[] | null, have: Piece[]) => {
    const gone = (all ?? []).length - have.length;
    const washing = have.filter((p) => p.at_washman).length;
    const bits: string[] = [];
    if (gone > 0) bits.push(`${gone} ${gone === 1 ? "piece is" : "pieces are"} no longer in your wardrobe`);
    if (washing > 0) bits.push(`${washing} at the washman`);
    return bits.join(", ");
  };

  const tabs: { id: Tab; label: string; n?: number }[] = [
    { id: "recommended", label: "Recommended" },
    { id: "saved", label: "Saved", n: saved.length },
    { id: "history", label: "History" },
  ];

  const skeleton = (
    <div className="flex animate-pulse flex-col gap-3" aria-busy="true" aria-label="Loading outfits">
      {[0, 1].map((i) => (
        <div key={i} className="card flex flex-col gap-3 p-3">
          <div className="grid grid-cols-4 gap-2">
            {[0, 1, 2, 3].map((j) => (
              <div key={j} className="aspect-[3/4] rounded-xl bg-sand" />
            ))}
          </div>
          <div className="h-4 w-40 rounded bg-sand" />
        </div>
      ))}
    </div>
  );

  return (
    <main className="flex flex-col gap-6 px-6 pb-10 pt-3">
      <h1 className="text-[28px] font-semibold leading-[1.1] tracking-[-0.025em] text-navy">Outfit recommendations</h1>

      <div role="tablist" aria-label="Outfits" className="seg">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => {
              setTab(t.id);
              setConfirming(null);
              setProblem("");
            }}
            className="seg-item"
          >
            {t.label}
            {t.n ? <span className="ml-1 text-muted">{t.n}</span> : null}
          </button>
        ))}
      </div>

      {error && <div className="card p-5 subhead text-navy">{error}</div>}
      {problem && <p className="text-center text-sm text-danger">{problem}</p>}

      {/* Recommended */}
      {tab === "recommended" && !error && (
        <>
          {(!settled || recs === null) && skeleton}
          {settled && recs !== null && recs.length === 0 && (
            <Empty
              title={pieces.length === 0 ? "Your wardrobe is empty" : "We need a little more"}
              text={pieces.length === 0 ? "Add a few pieces and your recommended outfits appear here." : recNote}
              action={{ href: "/wardrobe", label: pieces.length === 0 ? "Add your first pieces" : "Go to Wardrobe" }}
            />
          )}
          {settled &&
            recs?.map(({ occasion, look }) => {
              const isSaved = savedKeys.has(keyOf([...look.main, look.outer, look.shoes, look.extra].filter(Boolean).map((p) => p!.id)));
              const list = [...look.main, look.outer, look.shoes, look.extra].filter((p): p is Piece => !!p);
              return (
                <OutfitCard key={look.core} eyebrow={occasion} title={look.title} pieces={list} onOpen={setViewing}>
                  <button
                    onClick={() => saveRec(occasion, look)}
                    disabled={isSaved}
                    className="btn btn-outline !h-11 flex-1 !text-sm disabled:opacity-100"
                  >
                    <Heart size={16} fill={isSaved ? "currentColor" : "none"} aria-hidden />
                    {isSaved ? "Saved" : "Save"}
                  </button>
                  <button
                    onClick={() => wear(look.title, occasion, look.tier, list)}
                    className="btn btn-orange !h-11 flex-1 !text-sm"
                  >
                    I wear this
                  </button>
                </OutfitCard>
              );
            })}
          {settled && recs && recs.length > 0 && (
            <Link href="/customize" className="btn btn-outline">
              Customize for an occasion
            </Link>
          )}
        </>
      )}

      {/* Saved */}
      {tab === "saved" && !error && (
        <>
          {listsLoading && skeleton}
          {!listsLoading && saved.length === 0 && (
            <Empty
              title="No saved outfits yet"
              text="Tap Love This Look on Today, or Save on any outfit, and it appears here."
              action={{ href: "/today", label: "See today's outfit" }}
            />
          )}
          {!listsLoading &&
            saved.map((r) => {
              const have = piecesFor(r.item_ids);
              const k = `s-${r.id ?? keyOf(r.item_ids ?? [])}`;
              const ready = have.filter((p) => !p.at_washman);
              return (
                <OutfitCard
                  key={k}
                  eyebrow={[r.occasion, r.tier].filter(Boolean).join(" · ") || "Saved"}
                  title={r.title ?? "Saved outfit"}
                  note={awayNote(r.item_ids, have)}
                  pieces={have}
                  onOpen={setViewing}
                >
                  {confirming === k ? (
                    <>
                      <span className="flex-1 text-sm text-navy">Remove this outfit?</span>
                      <button onClick={() => remove("saved", r.id, r.item_ids)} className="btn btn-navy !h-10 !px-5 !text-sm">Remove</button>
                      <button onClick={() => setConfirming(null)} className="btn btn-outline !h-10 !px-5 !text-sm">Keep</button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => wear(r.title ?? "Saved outfit", r.occasion ?? "Outfit", r.tier, ready)}
                        disabled={ready.length === 0}
                        className="btn btn-orange !h-11 flex-1 !text-sm"
                      >
                        <Shirt size={16} aria-hidden /> I wear this
                      </button>
                      <button
                        onClick={() => setConfirming(k)}
                        aria-label="Remove outfit"
                        className="btn !h-11 !w-11 shrink-0 !px-0 bg-fill text-danger"
                      >
                        <Trash2 size={17} aria-hidden />
                      </button>
                    </>
                  )}
                </OutfitCard>
              );
            })}
        </>
      )}

      {/* History */}
      {tab === "history" && !error && (
        <>
          {listsLoading && skeleton}
          {!listsLoading && history.length === 0 && (
            <Empty
              title="Nothing worn yet"
              text="When you tap I wear this on an outfit, it is recorded here so you can repeat or avoid it."
              action={{ href: "/today", label: "See today's outfit" }}
            />
          )}
          {!listsLoading &&
            history.map((r) => {
              const have = piecesFor(r.item_ids);
              const k = `h-${r.id}`;
              const ready = have.filter((p) => !p.at_washman);
              return (
                <OutfitCard
                  key={k}
                  eyebrow={`${dayLabel(r.worn_on)}${r.occasion ? ` · ${r.occasion}` : ""}`}
                  title={r.title ?? "Outfit"}
                  note={awayNote(r.item_ids, have)}
                  pieces={have}
                  onOpen={setViewing}
                >
                  {confirming === k ? (
                    <>
                      <span className="flex-1 text-sm text-navy">Remove from history?</span>
                      <button onClick={() => remove("history", r.id, r.item_ids)} className="btn btn-navy !h-10 !px-5 !text-sm">Remove</button>
                      <button onClick={() => setConfirming(null)} className="btn btn-outline !h-10 !px-5 !text-sm">Keep</button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => wear(r.title ?? "Outfit", r.occasion ?? "Outfit", r.tier, ready)}
                        disabled={ready.length === 0}
                        className="btn btn-outline !h-11 flex-1 !text-sm"
                      >
                        <RotateCcw size={16} aria-hidden /> Wear again
                      </button>
                      <button
                        onClick={() => setConfirming(k)}
                        aria-label="Remove from history"
                        className="btn !h-11 !w-11 shrink-0 !px-0 bg-fill text-danger"
                      >
                        <Trash2 size={17} aria-hidden />
                      </button>
                    </>
                  )}
                </OutfitCard>
              );
            })}
        </>
      )}

      <PieceViewer piece={viewing} onClose={() => setViewing(null)} />
      {worn && <ReadyScreen title={worn} name="Oba" onDone={() => setWorn(null)} />}
    </main>
  );
}
