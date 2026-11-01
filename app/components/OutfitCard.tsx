"use client";

import type { ReactNode } from "react";
import { pieceName, type Piece } from "@/lib/outfits";
import Photo from "./Photo";

/** A look as a row of real photos, with a title and actions underneath. */
export default function OutfitCard({
  title,
  eyebrow,
  note,
  pieces,
  onOpen,
  children,
}: {
  title: string;
  eyebrow: string;
  note?: string;
  pieces: Piece[];
  onOpen: (p: Piece) => void;
  children?: ReactNode;
}) {
  const shown = pieces.slice(0, 4);
  const more = pieces.length - shown.length;

  return (
    <article className="card flex flex-col gap-4 p-4">
      {shown.length > 0 ? (
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(Math.max(shown.length, 2), 4)}, minmax(0, 1fr))` }}>
          {shown.map((p, i) => (
            <button
              key={p.id}
              onClick={() => onOpen(p)}
              aria-label={pieceName(p)}
              className="block overflow-hidden rounded-2xl active:scale-[0.97]"
            >
              <Photo src={p.url} alt="" className="aspect-[3/4] w-full">
                {more > 0 && i === shown.length - 1 && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm font-semibold text-white">
                    +{more}
                  </span>
                )}
              </Photo>
            </button>
          ))}
        </div>
      ) : (
        <p className="rounded-xl bg-sand px-3 py-6 text-center subhead text-muted">
          These pieces are no longer in your wardrobe.
        </p>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-1.5">
          {eyebrow.split(" · ").map((c) => (
            <span key={c} className="rounded-full bg-fill px-2.5 py-1 text-[12px] font-medium text-muted">{c}</span>
          ))}
        </div>
        <h3 className="text-[17px] font-semibold leading-tight tracking-[-0.01em] text-navy">{title}</h3>
        {note && <p className="text-[13px] text-muted">{note}</p>}
      </div>

      {children && <div className="flex items-center gap-2">{children}</div>}
    </article>
  );
}
