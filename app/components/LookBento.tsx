"use client";

import { useEffect } from "react";
import { pieceName, type Look, type Piece } from "@/lib/outfits";
import Photo from "./Photo";

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
      className={`rise block overflow-hidden rounded-2xl shadow-[0_1px_2px_rgba(31,42,68,0.06),0_12px_24px_-14px_rgba(31,42,68,0.35)] transition-transform active:scale-[0.98] ${className}`}
      style={{ "--d": `${delay * 90}ms` } as React.CSSProperties}
    >
      <Photo src={piece.url} alt="" className="h-full w-full" />
    </button>
  );
}

/** A look laid out as real photos of his own pieces. Tap a piece to see it large. */
export function LookBento({ look, onOpen }: { look: Look; onOpen: (p: Piece) => void }) {
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

/** Full-screen view of one piece. */
export function PieceViewer({ piece, onClose }: { piece: Piece | null; onClose: () => void }) {
  useEffect(() => {
    if (!piece) return;
    const close = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [piece, onClose]);

  if (!piece) return null;
  return (
    <button
      onClick={onClose}
      aria-label="Close"
      className="rise fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-navy/95 p-6"
    >
      {piece.url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={piece.url} alt={pieceName(piece)} className="max-h-[75vh] w-full max-w-md rounded-2xl object-contain" />
      )}
      <span className="text-sm font-semibold text-cream">{pieceName(piece)}</span>
    </button>
  );
}

/** The clothing breakdown: each piece with its photo, name and what it is. */
export function Breakdown({ look, onOpen }: { look: Look; onOpen: (p: Piece) => void }) {
  const rows: { label: string; piece: Piece }[] = [
    ...look.main.map((p) => ({ label: p.category === "Native" ? "Native set" : p.category === "Tops" ? "Top" : "Bottom", piece: p })),
    ...(look.outer ? [{ label: "Layer", piece: look.outer }] : []),
    { label: "Shoes", piece: look.shoes },
    ...(look.extra ? [{ label: "Accessory", piece: look.extra }] : []),
    ...(look.scent ? [{ label: "Fragrance", piece: look.scent }] : []),
  ];

  return (
    <ul className="flex flex-col gap-2">
      {rows.map(({ label, piece }) => (
        <li key={piece.id}>
          <button
            onClick={() => onOpen(piece)}
            className="flex w-full items-center gap-3 rounded-2xl border border-line bg-card p-2.5 text-left transition-transform active:scale-[0.99]"
          >
            <Photo src={piece.url} alt="" className="h-14 w-14 shrink-0 rounded-xl" />
            <span className="flex min-w-0 flex-col">
              <span className="eyebrow">{label}</span>
              <span className="truncate text-[15px] font-medium text-navy">{pieceName(piece)}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
