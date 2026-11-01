"use client";

import { useState } from "react";
import { Camera, Image as ImageIcon, PenLine, Shirt } from "lucide-react";

type Props = { onDone: () => void };

const SWATCH = { shirt: "#EDE6DA", trousers: "#222222", loafers: "#6B4A2F", polo: "#27344F", chinos: "#CDB798", watch: "#9AA9A8" };

/** A small look made of colour tiles, standing in for his own photos. */
function MiniLook({ tiles }: { tiles: string[] }) {
  return (
    <div className="flex gap-2">
      {tiles.map((c) => (
        <span key={c} className="aspect-[3/4] flex-1 rounded-2xl shadow-[0_2px_10px_rgb(0_0_0/0.08)]" style={{ background: c }} />
      ))}
    </div>
  );
}

function SlideOne() {
  return (
    <div className="flex w-full max-w-[290px] flex-col gap-2">
      <div className="flex gap-2">
        <span className="rise aspect-[3/4] flex-1 rounded-[22px] shadow-[0_2px_10px_rgb(0_0_0/0.08)]" style={{ background: SWATCH.shirt }} />
        <span className="rise aspect-[3/4] flex-1 rounded-[22px] shadow-[0_2px_10px_rgb(0_0_0/0.08)]" style={{ background: SWATCH.trousers, "--d": "80ms" } as React.CSSProperties} />
      </div>
      <div className="flex gap-2">
        <span className="rise h-24 flex-1 rounded-[22px] shadow-[0_2px_10px_rgb(0_0_0/0.08)]" style={{ background: SWATCH.loafers, "--d": "160ms" } as React.CSSProperties} />
        <span className="rise h-24 w-24 rounded-[22px] shadow-[0_2px_10px_rgb(0_0_0/0.08)]" style={{ background: SWATCH.watch, "--d": "240ms" } as React.CSSProperties} />
      </div>
    </div>
  );
}

function SlideTwo() {
  return (
    <div className="flex w-full max-w-[290px] flex-col gap-4">
      <div className="relative flex aspect-square items-center justify-center rounded-[28px] bg-sand">
        {[
          "left-5 top-5 border-l-2 border-t-2 rounded-tl-xl",
          "right-5 top-5 border-r-2 border-t-2 rounded-tr-xl",
          "left-5 bottom-5 border-b-2 border-l-2 rounded-bl-xl",
          "right-5 bottom-5 border-b-2 border-r-2 rounded-br-xl",
        ].map((c) => (
          <span key={c} className={`absolute h-7 w-7 border-navy ${c}`} aria-hidden />
        ))}
        <Shirt size={96} strokeWidth={1} className="text-navy" aria-hidden />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Camera", Icon: Camera },
          { label: "Gallery", Icon: ImageIcon },
          { label: "Manual", Icon: PenLine },
        ].map(({ label, Icon }) => (
          <div key={label} className="flex flex-col items-center gap-1.5 rounded-2xl py-3 shadow-[inset_0_0_0_1px_var(--color-line)]">
            <Icon size={20} strokeWidth={1.6} className="text-navy" aria-hidden />
            <span className="text-[12px] font-medium text-muted">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SlideThree() {
  return (
    <div className="flex w-full max-w-[290px] flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {["Office", "Church", "Owambe", "Date night", "Gym"].map((o, i) => (
          <span
            key={o}
            className={`rounded-full px-4 py-2 text-[14px] font-medium ${i === 0 ? "bg-navy text-white" : "text-navy shadow-[inset_0_0_0_1px_var(--color-line)]"}`}
          >
            {o}
          </span>
        ))}
      </div>
      <div className="flex flex-col gap-3 rounded-[24px] p-4 shadow-[0_0_0_1px_var(--color-line)]">
        <MiniLook tiles={[SWATCH.polo, SWATCH.trousers, SWATCH.loafers]} />
        <div className="flex flex-col gap-0.5">
          <span className="text-[12px] text-muted">Office</span>
          <span className="text-[17px] font-semibold tracking-tight text-navy">Navy Polo, Black Trousers</span>
        </div>
      </div>
    </div>
  );
}

const SLIDES = [
  { title: "Outfits that match your style.", body: "Smarter picks. Better looks. Every day.", art: <SlideOne /> },
  { title: "Add your clothes with a photo.", body: "Snap a piece or upload it. We sort your wardrobe for you.", art: <SlideTwo /> },
  { title: "Dressed right for every occasion.", body: "Office, church, owambe, school, gym and more, from what you already own.", art: <SlideThree /> },
];

export default function Onboarding({ onDone }: Props) {
  const [i, setI] = useState(0);
  const last = i === SLIDES.length - 1;

  return (
    <main className="flex min-h-dvh flex-col overflow-hidden px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-[calc(2rem+env(safe-area-inset-top))]">
      <div className="relative flex-1 overflow-hidden">
        <div
          className="absolute inset-0 flex transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
          style={{ transform: `translateX(-${i * 100}%)` }}
        >
          {SLIDES.map((s, n) => (
            <section key={s.title} className="flex h-full w-full shrink-0 flex-col gap-6" aria-hidden={n !== i}>
              <div className="flex flex-1 items-center justify-center">{n === i && s.art}</div>
              <div className="flex flex-col gap-3">
                <h1 className="text-[28px] font-semibold leading-[1.1] tracking-[-0.025em] text-navy">{s.title}</h1>
                <p className="text-[15px] leading-snug text-muted">{s.body}</p>
              </div>
            </section>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center gap-5 pt-8">
        <div className="flex gap-2" aria-hidden>
          {SLIDES.map((s, n) => (
            <span key={s.title} className={`h-1.5 rounded-full transition-all duration-300 ${n === i ? "w-5 bg-navy" : "w-1.5 bg-navy/20"}`} />
          ))}
        </div>
        <button onClick={() => (last ? onDone() : setI(i + 1))} className="btn btn-orange">
          {last ? "Get started" : "Next"}
        </button>
        <button onClick={onDone} className={`text-[15px] font-medium text-muted ${last ? "invisible" : ""}`} tabIndex={last ? -1 : 0}>
          Skip
        </button>
      </div>
    </main>
  );
}
