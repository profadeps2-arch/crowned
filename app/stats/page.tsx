"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { swatchOf } from "@/lib/colours";
import { useWardrobe } from "../components/useWardrobe";
import Photo from "../components/Photo";

const SECTION_LABEL: Record<string, string> = {
  Native: "Native",
  Tops: "Shirts and Tops",
  Bottoms: "Trousers",
  Outerwear: "Jackets",
  Shoes: "Shoes",
  Accessories: "Caps and Accessories",
  Fragrance: "Perfumes",
};

const DAY = 86400000;

function Bar({ label, n, max, colour }: { label: string; n: number; max: number; colour?: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {colour && <span className="h-4 w-4 shrink-0 rounded-full border border-line" style={{ background: colour }} />}
      <span className="w-32 shrink-0 truncate text-[14px] text-navy">{label}</span>
      <span className="h-2 flex-1 overflow-hidden rounded-full bg-fill">
        <span className="block h-full rounded-full bg-navy" style={{ width: `${Math.max(6, (n / max) * 100)}%` }} />
      </span>
      <span className="w-6 shrink-0 text-right text-[14px] text-muted">{n}</span>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="eyebrow px-4 !font-normal">{title}</h2>
      <div className="list">{children}</div>
    </section>
  );
}

export default function StatsPage() {
  const router = useRouter();
  const { pieces, loading, error } = useWardrobe();
  const [now, setNow] = useState(0);
  const [wornRows, setWornRows] = useState<{ item_ids: string[] | null; worn_on: string | null }[]>([]);

  useEffect(() => {
    createClient()
      .from("worn_looks")
      .select("item_ids, worn_on")
      .then(({ data, error: e }) => {
        setNow(Date.now());
        if (e) console.warn("History not available:", e.message);
        else setWornRows((data ?? []) as { item_ids: string[] | null; worn_on: string | null }[]);
      });
  }, []);

  const s = useMemo(() => {
    const byCategory = new Map<string, number>();
    const byColour = new Map<string, number>();
    let value = 0;
    let priced = 0;
    for (const p of pieces) {
      const cat = p.category ?? "Other";
      byCategory.set(cat, (byCategory.get(cat) ?? 0) + 1);
      if (p.colour) byColour.set(p.colour, (byColour.get(p.colour) ?? 0) + 1);
      if (typeof p.price === "number") {
        value += p.price;
        priced++;
      }
    }

    const counts = new Map<string, number>();
    for (const r of wornRows) for (const id of r.item_ids ?? []) counts.set(id, (counts.get(id) ?? 0) + 1);
    const mostWorn = pieces
      .map((p) => ({ p, n: counts.get(p.id) ?? 0 }))
      .filter((x) => x.n > 0)
      .sort((a, b) => b.n - a.n)
      .slice(0, 5);

    // The clock is read after the history loads, never while rendering.
    const live = now > 0 && pieces.length > 0;
    const idle = pieces
      .filter((p) => !p.last_worn || (live && now - new Date(p.last_worn).getTime() > 30 * DAY))
      .sort((a, b) => (a.last_worn ?? "").localeCompare(b.last_worn ?? ""));

    const month = live ? new Date(now).toISOString().slice(0, 7) : "";
    const wornThisMonth = live ? wornRows.filter((r) => r.worn_on?.startsWith(month)).length : 0;

    return {
      cats: [...byCategory.entries()].sort((a, b) => b[1] - a[1]),
      colours: [...byColour.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6),
      value,
      priced,
      mostWorn,
      idle,
      wornThisMonth,
    };
  }, [pieces, wornRows, now]);

  const money = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;
  const name = (p: { name: string | null; colour: string | null; type: string | null }) =>
    p.name ?? ([p.colour, p.type].filter(Boolean).join(" ") || "Piece");

  return (
    <main className="flex flex-col gap-6 px-5 pb-16 pt-[calc(0.75rem+env(safe-area-inset-top))]">
      <button onClick={() => router.back()} className="-ml-1.5 flex min-h-11 items-center gap-0.5 self-start text-[17px] text-orange-deep active:opacity-60">
        <ChevronLeft size={24} aria-hidden /> Back
      </button>
      <h1 className="px-1 text-[28px] font-semibold leading-[1.1] tracking-[-0.025em] text-navy">Wardrobe stats</h1>

      {error && <p className="px-1 text-sm text-danger">{error}</p>}
      {!loading && !error && pieces.length === 0 && (
        <p className="px-1 text-[15px] text-muted">Add a few pieces to your wardrobe and your numbers appear here.</p>
      )}

      {!loading && pieces.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3">
            {[
              { n: String(pieces.length), l: "Pieces" },
              { n: String(s.wornThisMonth), l: "Outfits worn this month" },
              { n: String(s.idle.length), l: "Not worn in 30 days" },
              { n: s.priced ? money(s.value) : "Not set", l: s.priced ? `Value of ${s.priced} priced` : "Add prices to see value" },
            ].map((t) => (
              <div key={t.l} className="flex flex-col gap-1 rounded-[20px] bg-sand p-4">
                <span className="text-[24px] font-semibold tracking-[-0.02em] text-navy">{t.n}</span>
                <span className="text-[13px] leading-snug text-muted">{t.l}</span>
              </div>
            ))}
          </div>

          <Block title="By section">
            {s.cats.map(([c, n]) => (
              <Bar key={c} label={SECTION_LABEL[c] ?? "To Sort"} n={n} max={s.cats[0][1]} />
            ))}
          </Block>

          {s.colours.length > 0 && (
            <Block title="Your colours">
              {s.colours.map(([c, n]) => (
                <Bar key={c} label={c} n={n} max={s.colours[0][1]} colour={swatchOf(c)} />
              ))}
            </Block>
          )}

          {s.mostWorn.length > 0 && (
            <Block title="Most worn">
              {s.mostWorn.map(({ p, n }) => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                  <Photo src={p.url} alt="" className="h-14 w-11 shrink-0 rounded-lg" />
                  <span className="min-w-0 flex-1 truncate text-[15px] text-navy">{name(p)}</span>
                  <span className="text-[14px] text-muted">{n}×</span>
                </div>
              ))}
            </Block>
          )}

          {s.idle.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="eyebrow px-4 !font-normal">Give these a turn</h2>
              <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1">
                {s.idle.slice(0, 10).map((p) => (
                  <div key={p.id} className="flex w-24 shrink-0 flex-col gap-1.5">
                    <Photo src={p.url} alt="" className="aspect-[3/4] w-full rounded-2xl" />
                    <span className="truncate text-[12px] text-muted">{name(p)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}
