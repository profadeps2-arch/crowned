"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { OCCASIONS, buildLooks, missingFor, pieceName, type Look, type Piece } from "@/lib/outfits";

const COUNT_WORDS = ["", "One look", "Two looks", "Three looks"];

function CrownMark({ size = 13 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#B08D57"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5L3 8z" />
    </svg>
  );
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 3h12v18l-6-4-6 4z" />
    </svg>
  );
}

function Tile({
  piece, className, delay, onOpen,
}: {
  piece: Piece;
  className: string;
  delay: number;
  onOpen: (p: Piece) => void;
}) {
  return (
    <button
      onClick={() => onOpen(piece)}
      aria-label={pieceName(piece)}
      className={`tile-in relative overflow-hidden rounded-2xl bg-[#E9E1D2] shadow-[0_1px_2px_rgba(31,42,68,0.06),0_12px_24px_-14px_rgba(31,42,68,0.35)] transition-transform active:scale-[0.98] ${className}`}
      style={{ animationDelay: `${delay * 90}ms` }}
    >
      {piece.url && (
        <img src={piece.url} alt="" className="absolute inset-0 h-full w-full object-cover" />
      )}
    </button>
  );
}

function Bento({ look, onOpen }: { look: Look; onOpen: (p: Piece) => void }) {
  const body = [...(look.outer ? [look.outer] : []), ...look.main];
  const single = body.length === 1;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        {body.map((p, i) => (
          <Tile
            key={p.id}
            piece={p}
            delay={i}
            onOpen={onOpen}
            className={single ? "aspect-[4/5] w-full" : "aspect-[3/4] min-w-0 flex-1"}
          />
        ))}
      </div>
      <div className="flex gap-2">
        <Tile piece={look.shoes} delay={body.length} onOpen={onOpen} className="h-32 min-w-0 flex-1" />
        {look.extra && (
          <Tile piece={look.extra} delay={body.length + 1} onOpen={onOpen} className="h-32 w-32 shrink-0" />
        )}
      </div>
    </div>
  );
}

export default function StylePage() {
  const router = useRouter();
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [loading, setLoading] = useState(true);
  const [occasion, setOccasion] = useState<string | null>(null);
  const [looks, setLooks] = useState<Look[]>([]);
  const [message, setMessage] = useState("");
  const [index, setIndex] = useState(0);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [worn, setWorn] = useState<Look | null>(null);
  const [viewing, setViewing] = useState<Piece | null>(null);
  const shown = useRef<Set<string>>(new Set());
  const rail = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/");
        return;
      }

      const { data, error } = await supabase
        .from("items")
        .select("id, photo_path, name, category, type, colour, looks, tags, at_washman, last_worn")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Wardrobe load failed:", error);
        setMessage("Couldn't load your wardrobe. Refresh to try again.");
        setLoading(false);
        return;
      }

      const list: Piece[] = (data ?? []).map((i) => ({ ...i, at_washman: !!i.at_washman }));
      if (list.length > 0) {
        const { data: signed } = await supabase.storage
          .from("wardrobe")
          .createSignedUrls(list.map((i) => i.photo_path), 3600);
        list.forEach((p, i) => (p.url = signed?.[i]?.signedUrl ?? undefined));
      }
      setPieces(list);
      setLoading(false);
    })();
  }, [router]);

  useEffect(() => {
    if (!viewing) return;
    const close = (e: KeyboardEvent) => e.key === "Escape" && setViewing(null);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [viewing]);

  function styleMe(label = occasion) {
    const occ = OCCASIONS.find((o) => o.label === label);
    if (!occ) return;
    setError("");
    setMessage("");

    let result = buildLooks(pieces, occ, shown.current);
    if (result.length === 0 && shown.current.size > 0) {
      shown.current.clear();
      result = buildLooks(pieces, occ, shown.current);
    }

    if (result.length === 0) {
      setLooks([]);
      setMessage(missingFor(pieces, occ));
      return;
    }

    result.forEach((l) => shown.current.add(l.core));
    setLooks(result);
    setIndex(0);
    rail.current?.scrollTo({ left: 0 });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function pick(label: string) {
    setMessage("");
    setOccasion((o) => (o === label ? null : label));
    shown.current.clear();
  }

  function backToOccasions() {
    setLooks([]);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function onRailScroll() {
    const el = rail.current;
    if (!el) return;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  }

  function goTo(i: number) {
    const el = rail.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  }

  function piecesOf(look: Look) {
    return [...look.main, look.outer, look.shoes, look.extra].filter((p): p is Piece => !!p);
  }

  async function wear(look: Look) {
    setBusy(true);
    setError("");
    const today = new Date().toISOString().slice(0, 10);
    const ids = [...piecesOf(look), ...(look.scent ? [look.scent] : [])].map((p) => p.id);

    const { error } = await createClient().from("items").update({ last_worn: today }).in("id", ids);
    setBusy(false);

    if (error) {
      console.error("Wear update failed:", error);
      setError("Couldn't save that. Try again.");
      return;
    }

    setPieces((list) => list.map((p) => (ids.includes(p.id) ? { ...p, last_worn: today } : p)));
    setWorn(look);
  }

  async function save(look: Look) {
    if (saved.has(look.key) || !occasion) return;
    setError("");
    const { error } = await createClient().from("saved_looks").insert({
      occasion,
      tier: look.tier,
      title: look.title,
      item_ids: piecesOf(look).map((p) => p.id).sort(),
    });

    if (error && error.code !== "23505") {
      console.error("Save failed:", error);
      setError("Couldn't save this look. Try again.");
      return;
    }
    setSaved((s) => new Set(s).add(look.key));
  }

  function finish() {
    setWorn(null);
    setLooks([]);
    setOccasion(null);
    shown.current.clear();
    window.scrollTo({ top: 0 });
  }

  return (
    <main className="flex flex-col gap-6 px-6 pb-12 pt-6">
      <style>{`
        .tile-in { animation: tileIn 0.55s cubic-bezier(0.2, 0.8, 0.2, 1) both }
        @keyframes tileIn { from { opacity: 0; transform: translateY(10px) scale(0.98) } to { opacity: 1; transform: none } }
        .fade-in { animation: fadeIn 0.45s ease-out both }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
        .moment { animation: moment 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both }
        @keyframes moment { from { opacity: 0 } to { opacity: 1 } }
        .moment-text { animation: fadeIn 0.7s 0.25s ease-out both }
        .no-scrollbar::-webkit-scrollbar { display: none }
        .no-scrollbar { scrollbar-width: none }
        @media (prefers-reduced-motion: reduce) { .tile-in, .fade-in, .moment, .moment-text { animation: none } }
      `}</style>

      {looks.length === 0 ? (
        <>
          <h1 className="text-4xl leading-tight">Oba, where will you be seen today?</h1>

          <div className="flex flex-wrap gap-3">
            {OCCASIONS.map((o) => (
              <button
                key={o.label}
                onClick={() => pick(o.label)}
                aria-pressed={occasion === o.label}
                className={`rounded-full border px-5 py-3 transition-colors ${
                  occasion === o.label
                    ? "border-[#1F2A44] bg-[#1F2A44] text-[#F5F0E6]"
                    : "border-[#E3DACB] bg-[#FBF8F2] text-[#1F2A44]"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => styleMe()}
            disabled={!occasion || loading}
            className="flex items-center justify-center gap-2 rounded-full bg-[#1F2A44] py-4 font-semibold text-[#F5F0E6] transition-all active:scale-[0.98] disabled:opacity-40"
          >
            <CrownMark size={16} />
            Style Me
          </button>

          {message && (
            <div className="fade-in flex flex-col gap-3 rounded-2xl border border-[#E3DACB] bg-[#FBF8F2] p-4">
              <p className="text-sm text-[#1F2A44]">{message}</p>
              <Link href="/wardrobe" className="text-sm font-semibold text-[#1F2A44]">
                Go to Wardrobe ›
              </Link>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <button onClick={backToOccasions} className="self-start text-sm font-semibold text-[#1F2A44]">
              ‹ Occasions
            </button>
            <h1 className="text-4xl leading-tight">{occasion}</h1>
            <p className="text-sm text-[#5C5648]">{COUNT_WORDS[looks.length]} from your wardrobe.</p>
          </div>

          <div
            ref={rail}
            onScroll={onRailScroll}
            className="no-scrollbar -mx-6 flex snap-x snap-mandatory overflow-x-auto"
          >
            {looks.map((look) => (
              <article key={look.key} className="flex w-full shrink-0 snap-center flex-col gap-5 px-6">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold tracking-[0.22em] text-[#8A6A3A]">
                    {look.tier.toUpperCase()}
                  </span>
                  <h2 className="text-2xl leading-tight">{look.title}</h2>
                </div>

                <Bento look={look} onOpen={setViewing} />

                {look.tips.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-semibold text-[#1F2A44]">How to wear it</span>
                    {look.tips.map((t) => (
                      <p key={t} className="text-sm leading-relaxed text-[#5C5648]">{t}</p>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => wear(look)}
                    disabled={busy}
                    className="flex-1 rounded-full bg-[#1F2A44] py-4 font-semibold text-[#F5F0E6] transition-transform active:scale-[0.98] disabled:opacity-60"
                  >
                    I Wear This
                  </button>
                  <button
                    onClick={() => save(look)}
                    aria-label={saved.has(look.key) ? "Saved" : "Save look"}
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border transition-colors ${
                      saved.has(look.key)
                        ? "border-[#1F2A44] bg-[#1F2A44] text-[#F5F0E6]"
                        : "border-[#1F2A44]/25 text-[#1F2A44]"
                    }`}
                  >
                    <BookmarkIcon filled={saved.has(look.key)} />
                  </button>
                </div>
              </article>
            ))}
          </div>

          {error && <p className="text-center text-sm text-red-700">{error}</p>}

          <div className="flex flex-col items-center gap-4">
            {looks.length > 1 && (
              <div className="flex gap-2">
                {looks.map((l, i) => (
                  <button
                    key={l.key}
                    onClick={() => goTo(i)}
                    aria-label={`${l.tier} look`}
                    className={`h-2 rounded-full transition-all ${
                      i === index ? "w-6 bg-[#1F2A44]" : "w-2 bg-[#1F2A44]/20"
                    }`}
                  />
                ))}
              </div>
            )}
            <button
              onClick={() => styleMe()}
              className="flex items-center gap-2 text-sm font-semibold text-[#1F2A44]"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 12a8 8 0 1 1-2.3-5.7" />
                <path d="M20 4v5h-5" />
              </svg>
              Show Me Others
            </button>
          </div>
        </>
      )}

      {viewing && (
        <button
          onClick={() => setViewing(null)}
          aria-label="Close"
          className="fade-in fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-[#1F2A44]/95 p-6"
        >
          {viewing.url && (
            <img
              src={viewing.url}
              alt={pieceName(viewing)}
              className="max-h-[75vh] w-full max-w-md rounded-2xl object-contain"
            />
          )}
          <span className="text-sm font-semibold text-[#F5F0E6]">{pieceName(viewing)}</span>
        </button>
      )}

      {worn && (
        <div className="moment fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-[#1F2A44] px-8 text-center">
          <div className="moment-text flex flex-col items-center gap-5">
            <CrownMark size={40} />
            <h2 className="text-4xl leading-tight text-[#F5F0E6]">Your outfit is ready, Oba.</h2>
            <p className="text-sm text-[#C9C2B3]">{worn.title}</p>
          </div>
          <button
            onClick={finish}
            className="moment-text mt-6 rounded-full bg-[#B08D57] px-12 py-4 font-semibold text-[#1F2A44] transition-transform active:scale-[0.98]"
          >
            Done
          </button>
        </div>
      )}
    </main>
  );
}