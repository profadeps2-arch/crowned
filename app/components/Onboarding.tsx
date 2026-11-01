"use client";

import { useState } from "react";
import { Camera, Image as ImageIcon, PenLine } from "lucide-react";

type Props = { onDone: () => void };

function Photo({ src, pos = "50% 20%" }: { src: string; pos?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: pos }} />
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return <div className="relative min-h-0 w-full flex-1 overflow-hidden rounded-[28px] bg-sand">{children}</div>;
}

function SlideOne() {
  return (
    <Frame>
      <Photo src="/photos/look-earth.jpg" pos="50% 30%" />
    </Frame>
  );
}

function SlideTwo() {
  return (
    <div className="flex h-full w-full flex-col gap-3">
      <Frame>
        <Photo src="/photos/look-native.jpg" pos="50% 25%" />
        {[
          "left-5 top-5 border-l-2 border-t-2 rounded-tl-xl",
          "right-5 top-5 border-r-2 border-t-2 rounded-tr-xl",
          "left-5 bottom-5 border-b-2 border-l-2 rounded-bl-xl",
          "right-5 bottom-5 border-b-2 border-r-2 rounded-br-xl",
        ].map((c) => (
          <span key={c} className={`absolute h-8 w-8 border-white/90 ${c}`} aria-hidden />
        ))}
      </Frame>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Camera", Icon: Camera },
          { label: "Gallery", Icon: ImageIcon },
          { label: "Manual", Icon: PenLine },
        ].map(({ label, Icon }) => (
          <div key={label} className="flex flex-col items-center gap-1 rounded-2xl py-2.5 shadow-[inset_0_0_0_1px_var(--color-line)]">
            <Icon size={18} strokeWidth={1.6} className="text-navy" aria-hidden />
            <span className="text-[12px] font-medium text-muted">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SlideThree() {
  return (
    <Frame>
      <Photo src="/photos/look-white.jpg" pos="50% 15%" />
      <div className="absolute left-3 top-1/2 flex -translate-y-1/2 flex-col gap-2">
        {["Church", "Mosque", "Office", "Owambe"].map((o, i) => (
          <span
            key={o}
            className={`rounded-full px-4 py-2 text-[13px] font-medium backdrop-blur-md ${
              i === 1 ? "bg-navy text-white" : "bg-white/85 text-navy"
            }`}
          >
            {o}
          </span>
        ))}
      </div>
    </Frame>
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
              <div className="flex min-h-0 flex-1">{s.art}</div>
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
