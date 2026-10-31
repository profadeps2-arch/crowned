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
    <article className="card flex flex-col gap-3 p-3">
      {shown.length > 0 ? (
        <div className="grid grid-cols-4 gap-2">
          {shown.map((p, i) => (
            <button
              key={p.id}
              onClick={() => onOpen(p)}
              aria-label={pieceName(p)}
              className="block overflow-hidden rounded-xl active:scale-[0.97]"
            >
              <Photo src={p.url} alt="" className="aspect-[3/4] w-full">
                {more > 0 && i === shown.length - 1 && (
                  <span className="absolute inset-0 flex items-center justify-center bg-navy/55 text-sm font-semibold text-cream">
                    +{more}
                  </span>
                )}
              </Photo>
            </button>
          ))}
        </div>
      ) : (
        <p className="rounded-xl bg-sand px-3 py-6 text-center text-sm text-muted">
          These pieces are no longer in your wardrobe.
        </p>
      )}

      <div className="flex flex-col gap-0.5 px-1">
        <span className="eyebrow">{eyebrow}</span>
        <h3 className="text-[17px] font-semibold leading-snug text-navy">{title}</h3>
        {note && <p className="text-xs text-muted">{note}</p>}
      </div>

      {children && <div className="flex items-center gap-2 px-1 pb-1">{children}</div>}
    </article>
  );
}
