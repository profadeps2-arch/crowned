import type { Look, Piece } from "@/lib/outfits";

const KEY = "crowned.today";

type Stored = {
  uid: string;
  day: string;
  occasion: string;
  look: {
    key: string;
    core: string;
    tier: Look["tier"];
    title: string;
    main: string[];
    outer: string | null;
    shoes: string;
    extra: string | null;
    scent: string | null;
    tips: string[];
  };
};

/** Remembers today's outfit on this device, so it does not change on every reload. */
export function savePick(uid: string, day: string, occasion: string, look: Look) {
  try {
    const stored: Stored = {
      uid,
      day,
      occasion,
      look: {
        key: look.key,
        core: look.core,
        tier: look.tier,
        title: look.title,
        main: look.main.map((p) => String(p.id)),
        outer: look.outer ? String(look.outer.id) : null,
        shoes: String(look.shoes.id),
        extra: look.extra ? String(look.extra.id) : null,
        scent: look.scent ? String(look.scent.id) : null,
        tips: look.tips,
      },
    };
    localStorage.setItem(KEY, JSON.stringify(stored));
  } catch {
    // Private mode or full storage. The outfit just will not be remembered.
  }
}

/** Today's remembered outfit, if every piece is still in his wardrobe and not at the washman. */
export function loadPick(uid: string, day: string, pieces: Piece[]): { occasion: string; look: Look } | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Stored;
    if (s.uid !== uid || s.day !== day || !s.look) return null;

    const byId = new Map(pieces.map((p) => [String(p.id), p]));
    const get = (id: string | null) => (id ? byId.get(id) ?? null : null);
    const ready = (p: Piece | null) => !!p && !p.at_washman && !!p.url;

    const main = s.look.main.map((id) => get(id));
    const shoes = get(s.look.shoes);
    const outer = get(s.look.outer);
    const extra = get(s.look.extra);
    const scent = get(s.look.scent);

    if (main.length === 0 || main.some((p) => !ready(p)) || !ready(shoes)) return null;
    if ((s.look.outer && !ready(outer)) || (s.look.extra && !ready(extra))) return null;

    return {
      occasion: s.occasion,
      look: {
        key: s.look.key,
        core: s.look.core,
        tier: s.look.tier,
        title: s.look.title,
        main: main as Piece[],
        outer,
        shoes: shoes as Piece,
        extra,
        scent: scent && !scent.at_washman ? scent : null,
        tips: s.look.tips ?? [],
      },
    };
  } catch {
    return null;
  }
}
