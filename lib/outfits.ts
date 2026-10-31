import { titleCase } from "@/lib/naming";

export type Piece = {
  id: string;
  photo_path: string;
  name: string | null;
  category: string | null;
  type: string | null;
  colour: string | null;
  looks: string[] | null;
  tags: string[] | null;
  at_washman: boolean;
  last_worn: string | null;
  url?: string;
};

export type Tier = "Clean" | "Classy" | "Boss";

export type Look = {
  key: string;
  core: string;
  tier: Tier;
  title: string;
  main: Piece[];
  outer: Piece | null;
  shoes: Piece;
  extra: Piece | null;
  scent: Piece | null;
  tips: string[];
};

export type Occasion = {
  label: string;
  primary: string[];
  secondary: string[];
  need: string;
};

/** What the day and the customer ask of the outfit. All fields are optional. */
export type StyleContext = {
  hot?: boolean;
  cool?: boolean;
  rainy?: boolean;
  /** Positive leans formal, negative leans relaxed. */
  dressUp?: number;
  style?: "native" | "western";
  outer?: "yes" | "no";
  /** His preferred looks tags and favourite colours. They only nudge the ranking. */
  likes?: string[];
  colours?: string[];
};

export const OCCASIONS: Occasion[] = [
  { label: "Everyday", primary: ["casual", "smart casual"], secondary: ["streetwear"], need: "Add a tee or polo, trousers and clean shoes." },
  { label: "Streetwear", primary: ["streetwear", "casual"], secondary: [], need: "Add a tee, trousers or joggers, and sneakers." },
  { label: "Owambe", primary: ["native"], secondary: ["formal", "smart casual"], need: "Add a native set and shoes." },
  { label: "Church", primary: ["native", "formal", "smart casual"], secondary: [], need: "Add a native set, or a shirt and trousers, with smart shoes." },
  { label: "Office", primary: ["smart casual", "formal"], secondary: ["native"], need: "Add a shirt, trousers and smart shoes." },
  { label: "Friday wear", primary: ["native", "smart casual"], secondary: ["casual"], need: "Add a native set and shoes." },
  { label: "Aso ebi", primary: ["native"], secondary: ["formal"], need: "Add a native set and shoes." },
  { label: "Date night", primary: ["smart casual"], secondary: ["formal", "casual"], need: "Add a shirt or polo, trousers and smart shoes." },
  { label: "Traditional wedding", primary: ["native"], secondary: [], need: "Add a native set and shoes." },
  { label: "White wedding", primary: ["formal"], secondary: ["smart casual", "native"], need: "Add a shirt, trousers and formal shoes." },
  { label: "Interview", primary: ["formal", "smart casual"], secondary: [], need: "Add a shirt, trousers and formal shoes." },
  { label: "Hangout", primary: ["casual", "streetwear"], secondary: ["smart casual"], need: "Add a tee or polo, trousers and sneakers." },
  { label: "School", primary: ["casual", "smart casual"], secondary: ["streetwear"], need: "Add a tee or polo, trousers or jeans, and clean sneakers." },
  { label: "Gym", primary: ["casual", "streetwear"], secondary: [], need: "Add a tee or jersey, joggers or shorts, and trainers." },
  { label: "Mosque", primary: ["native"], secondary: ["formal", "smart casual"], need: "Add a kaftan or native set, a cap if you wear one, and clean shoes." },
  { label: "Funeral", primary: ["native", "formal"], secondary: ["smart casual"], need: "Add a plain native set or a shirt and trousers in dark colours, with smart shoes." },
  { label: "Travel", primary: ["casual", "streetwear"], secondary: ["smart casual"], need: "Add a tee, comfortable trousers and sneakers." },
];

const TIERS: Tier[] = ["Clean", "Classy", "Boss"];
const PICK_ORDER: Tier[] = ["Boss", "Clean", "Classy"];

const FORMALITY: Record<string, number> = {
  formal: 4,
  native: 4,
  "smart casual": 3,
  casual: 2,
  streetwear: 1,
};

const NEUTRAL = new Set(["Black", "White", "Cream", "Beige", "Navy", "Grey", "Brown", "Tan", "Olive"]);

const norm = (s: string) => s.toLowerCase().trim();
const words = (p: Piece) => `${p.type ?? ""} ${p.name ?? ""}`.toLowerCase();
const has = (p: Piece | null, ...w: string[]) => !!p && w.some((x) => words(p).includes(x));

export function pieceName(p: Piece): string {
  if (p.name) return titleCase(p.name);
  const built = [p.colour, p.type].filter(Boolean).join(" ");
  return built ? titleCase(built) : "Piece";
}

function fit(p: Piece, occ: Occasion): number | null {
  const ls = (p.looks ?? []).map(norm);
  if (ls.length === 0) return -4;
  if (ls.some((l) => occ.primary.includes(l))) return 0;
  if (ls.some((l) => occ.secondary.includes(l))) return -3;
  return null;
}

function formality(p: Piece, occ: Occasion): number {
  const allowed = [...occ.primary, ...occ.secondary];
  const ls = (p.looks ?? []).map(norm).filter((l) => allowed.includes(l));
  if (ls.length === 0) return 2;
  return Math.max(...ls.map((l) => FORMALITY[l] ?? 2));
}

function daysSince(date: string | null): number {
  if (!date) return 99;
  return (Date.now() - new Date(date).getTime()) / 86400000;
}

function recency(p: Piece): number {
  const d = daysSince(p.last_worn);
  if (d < 2) return -8;
  if (d < 5) return -3;
  return 0;
}

function accessoryFits(p: Piece, native: boolean): boolean {
  const fila = has(p, "fila", "bead");
  const cap = !fila && has(p, "cap", "beanie", "bucket hat");
  if (native) return !cap;
  return !fila;
}

function shoeFits(s: Piece, native: boolean): boolean {
  if (has(s, "palm", "mule", "slipper", "sandal", "slide")) return native;
  if (has(s, "sneaker", "trainer")) return !native;
  return true;
}

function occasionIsSmart(occ: Occasion): boolean {
  return occ.primary.some((l) => (FORMALITY[l] ?? 0) >= 3);
}

type Candidate = {
  key: string;
  core: string;
  strict: boolean;
  native: boolean;
  main: Piece[];
  outer: Piece | null;
  shoes: Piece;
  extra: Piece | null;
  base: number;
  formal: number;
  bolds: number;
};

function harmony(main: Piece[], outer: Piece | null, shoes: Piece, native: boolean) {
  let score = 0;
  const body = [...main, ...(outer ? [outer] : [])];
  const bolds = new Set(
    body.map((p) => p.colour).filter((c): c is string => !!c && !NEUTRAL.has(c))
  );
  if (bolds.size > 1) score -= 4 * (bolds.size - 1);

  const ref = native ? main[0].colour : main[1]?.colour;
  if (!native) {
    const a = main[0].colour;
    const b = main[1].colour;
    const pair = [a, b].sort().join("+");
    if (pair === "Black+Navy" || pair === "Black+Brown") score -= 2;
    if (a && a === b && !NEUTRAL.has(a)) score -= 2;
  }

  const sc = shoes.colour;
  if (sc && ref) {
    if (sc === "Black" && ["Brown", "Tan"].includes(ref)) score -= 1.5;
    if (["Brown", "Tan"].includes(sc) && ref === "Black") score -= 1.5;
    if (["Brown", "Tan"].includes(sc) && ["Navy", "Grey", "Beige", "Cream", "White", "Olive", "Blue"].includes(ref)) score += 1;
    if (sc === "Black" && ["Black", "Grey", "Navy", "White"].includes(ref)) score += 1;
  }
  if (sc && !NEUTRAL.has(sc) && bolds.size > 0 && !bolds.has(sc)) score -= 2;

  return { score, bolds: bolds.size };
}

function ranked(list: Piece[], occ: Occasion, limit: number) {
  return list
    .map((p) => ({ p, f: fit(p, occ) }))
    .filter((x): x is { p: Piece; f: number } => x.f !== null)
    .sort((a, b) => b.f + recency(b.p) - (a.f + recency(a.p)))
    .slice(0, limit)
    .map((x) => x.p);
}

function candidates(pieces: Piece[], occ: Occasion, ctx: StyleContext): Candidate[] {
  const ready = pieces.filter((p) => !p.at_washman && p.url);
  const of = (cat: string) => ready.filter((p) => p.category === cat);

  const natives = ctx.style === "western" ? [] : ranked(of("Native"), occ, 12);
  const tops = ctx.style === "native" ? [] : ranked(of("Tops"), occ, 12);
  const bottoms = ctx.style === "native" ? [] : ranked(of("Bottoms"), occ, 12);
  const shoes = ranked(of("Shoes"), occ, 8);
  const outers = ranked(of("Outerwear"), occ, 4);
  const accs = ranked(of("Accessories"), occ, 4);

  const out: Candidate[] = [];
  const score = (p: Piece) => (fit(p, occ) ?? -4) + recency(p);

  const add = (main: Piece[], outer: Piece | null, shoe: Piece, extra: Piece | null, native: boolean) => {
    const h = harmony(main, outer, shoe, native);
    const all = [...main, outer, shoe, extra].filter((p): p is Piece => !!p);
    const body = [...main, ...(outer ? [outer] : [])];
    let fitPenalty = 0;
    for (const p of body) if ((fit(p, occ) ?? 0) < 0) fitPenalty -= 4;
    if (!native) {
      const gap = Math.abs(formality(main[0], occ) - formality(main[1], occ));
      if (gap >= 2) fitPenalty -= 3;
    }
    const bodyFormal = body.reduce((s, p) => s + formality(p, occ), 0) / body.length;
    if (Math.abs(formality(shoe, occ) - bodyFormal) >= 2) fitPenalty -= 2;

    // Weather and the customer's answers.
    const openShoe = has(shoe, "palm", "sandal", "slide", "mule", "slipper");
    if (ctx.hot && outer) fitPenalty -= 5;
    if (ctx.hot && native && has(main[0], "agbada")) fitPenalty -= 3;
    if (ctx.cool && !native && !outer && outers.length > 0) fitPenalty -= 1;
    if (ctx.rainy && openShoe) fitPenalty -= 4;
    if (ctx.outer === "yes") fitPenalty += outer ? 2 : -2;
    if (ctx.outer === "no" && outer) fitPenalty -= 4;
    fitPenalty += (ctx.dressUp ?? 0) * bodyFormal * 0.8;
    for (const p of body) {
      if (ctx.likes?.length && (p.looks ?? []).some((l) => ctx.likes!.includes(norm(l)))) fitPenalty += 0.7;
      if (ctx.colours?.length && p.colour && ctx.colours.includes(p.colour)) fitPenalty += 0.8;
    }
    const core = [...body, shoe];
    out.push({
      key: all.map((p) => p.id).sort().join("|"),
      core: core.map((p) => p.id).sort().join("|"),
      strict: core.every((p) => fit(p, occ) === 0),
      native,
      main,
      outer,
      shoes: shoe,
      extra,
      base: all.reduce((s, p) => s + score(p), 0) + h.score + fitPenalty,
      formal: bodyFormal,
      bolds: h.bolds,
    });
  };

  for (const n of natives) {
    for (const s of shoes) {
      if (!shoeFits(s, true)) continue;
      add([n], null, s, null, true);
      for (const a of accs) if (accessoryFits(a, true)) add([n], null, s, a, true);
    }
  }

  for (const t of tops) {
    for (const b of bottoms) {
      for (const s of shoes) {
        if (!shoeFits(s, false)) continue;
        for (const o of [null, ...outers]) {
          add([t, b], o, s, null, false);
          for (const a of accs) if (accessoryFits(a, false)) add([t, b], o, s, a, false);
        }
      }
    }
  }

  return out;
}

function tierScore(c: Candidate, tier: Tier, mid: number): number {
  const grand = c.native && has(c.main[0], "agbada");
  if (tier === "Clean") {
    return (grand ? -2 : 0) - c.formal * 1.2 + (c.bolds === 0 ? 2 : 0) - (c.outer ? 3 : 0) - (c.extra ? 1.5 : 0);
  }
  if (tier === "Classy") {
    const watch = has(c.extra, "watch");
    return -Math.abs(c.formal - mid) * 1.5 + (watch ? 1.5 : c.extra ? 0.5 : 0) + (c.outer ? 0.5 : 0);
  }
  return (grand ? 3 : 0) + c.formal * 1.5 + (c.outer ? 2.5 : 0) + (c.extra ? 1.5 : 0) + (c.bolds === 1 ? 1 : 0);
}

function tipsFor(c: Candidate, tier: Tier, occ: Occasion, scent: Piece | null): string[] {
  const t: string[] = [];

  if (c.native) {
    const n = c.main[0];
    t.push(
      has(n, "agbada")
        ? "Fold the agbada sleeves once onto your shoulders. Hands free, chest open."
        : "Wear it freshly pressed and let it fall straight."
    );
    if (has(c.extra, "fila")) t.push("Tilt the fila slightly to one side.");
  } else {
    const [top] = c.main;
    const smart = occasionIsSmart(occ) && formality(top, occ) >= 3;
    if (has(top, "polo")) {
      t.push(smart ? "Tuck the polo in for a sharper line." : "Leave the polo untucked to keep it relaxed.");
    } else if (has(top, "t-shirt", "tee")) {
      t.push("Wear the tee untucked and make sure it's crisp.");
    } else if (has(top, "shirt") && smart) {
      t.push("Tuck the shirt in and wear a belt that matches your shoes.");
    } else if (has(top, "shirt")) {
      t.push("Leave the top button open and roll the sleeves twice.");
    }
    if (c.outer) t.push(`Wear the ${(c.outer.type ?? "jacket").toLowerCase()} open.`);
  }

  if (!c.native && has(c.shoes, "loafer")) t.push("Let the trousers end just above the loafers so they show.");
  else if (has(c.shoes, "sneaker", "trainer")) t.push("Keep the sneakers spotless. They carry the whole look.");

  if (has(c.extra, "watch")) t.push("Let the watch show. One good accessory is enough.");

  if (scent && tier !== "Clean") {
    return [...t.slice(0, 1), `Two sprays of ${pieceName(scent)}, on the neck and wrists.`];
  }
  return t.slice(0, 2);
}

export function buildLooks(
  pieces: Piece[],
  occ: Occasion,
  exclude: Set<string>,
  ctx: StyleContext = {}
): Look[] {
  const cands = candidates(pieces, occ, ctx);
  if (cands.length === 0) return [];

  const formals = cands.map((c) => c.formal);
  const mid = (Math.min(...formals) + Math.max(...formals)) / 2;

  const scents = pieces
    .filter((p) => p.category === "Fragrance" && !p.at_washman)
    .sort((a, b) => daysSince(b.last_worn) - daysSince(a.last_worn));

  const chosen: Look[] = [];
  const used = new Set<string>();
  const cores = new Set<string>();

  for (const tier of PICK_ORDER) {
    let best: Candidate | null = null;
    let bestScore = -Infinity;

    let open = cands.filter((c) => !exclude.has(c.core) && !cores.has(c.core));
    // In rain, closed shoes win even for native wear, when he owns any.
    if (ctx.rainy) {
      const dry = open.filter((c) => !has(c.shoes, "palm", "sandal", "slide", "mule", "slipper"));
      if (dry.length > 0) open = dry;
    }
    const strict = open.filter((c) => c.strict);
    const pool = strict.length > 0 ? strict : open;

    for (const c of pool) {
      let s = c.base + tierScore(c, tier, mid) + Math.random() * 0.8;
      for (const p of c.main) if (used.has(p.id)) s -= 6;
      if (c.outer && used.has(c.outer.id)) s -= 3;
      if (used.has(c.shoes.id)) s -= 2;
      if (c.extra && used.has(c.extra.id)) s -= 1;
      if (s > bestScore) {
        bestScore = s;
        best = c;
      }
    }

    if (!best) break;

    const scent = tier === "Clean" ? null : scents[chosen.length % Math.max(scents.length, 1)] ?? null;
    const title = best.native
      ? pieceName(best.main[0])
      : `${pieceName(best.main[0])}, ${pieceName(best.main[1])}`;

    chosen.push({
      key: best.key,
      core: best.core,
      tier,
      title,
      main: best.main,
      outer: best.outer,
      shoes: best.shoes,
      extra: best.extra,
      scent,
      tips: tipsFor(best, tier, occ, scent),
    });

    cores.add(best.core);
    for (const p of [...best.main, best.outer, best.shoes, best.extra]) if (p) used.add(p.id);
  }

  return chosen.sort((a, b) => TIERS.indexOf(a.tier) - TIERS.indexOf(b.tier));
}

export function missingFor(pieces: Piece[], occ: Occasion, ctx: StyleContext = {}): string {
  const ready = pieces.filter((p) => !p.at_washman);
  const hasCat = (cat: string) => ready.some((p) => p.category === cat);

  if (pieces.length > 0 && ready.length === 0) {
    return "Everything is at the washman. Switch pieces back on in your Wardrobe when they return.";
  }

  const missing: string[] = [];
  if (!hasCat("Native")) {
    if (!hasCat("Tops")) missing.push("a shirt or top");
    if (!hasCat("Bottoms")) missing.push("trousers");
  }
  if (!hasCat("Shoes")) missing.push("shoes");

  if (ctx.style === "native" && !hasCat("Native")) {
    return "You asked for native, and there is no native set in your wardrobe yet. Add one, or choose shirt and trousers.";
  }
  if (ctx.style === "western" && !(hasCat("Tops") && hasCat("Bottoms"))) {
    return "You asked for shirt and trousers, and one of them is missing. Add it, or choose native.";
  }

  if (hasCat("Shoes") && (hasCat("Native") || (hasCat("Tops") && hasCat("Bottoms")))) {
    return `Nothing in your wardrobe suits ${occ.label} yet. ${occ.need}`;
  }

  const list =
    missing.length <= 1
      ? missing.join("")
      : `${missing.slice(0, -1).join(", ")} and ${missing[missing.length - 1]}`;
  return `Add ${list} to get your first outfit.`;
}
/** Two or three plain sentences on why this look was chosen. */
export function whyItWorks(look: Look, occ: Occasion, ctx: StyleContext = {}): string {
  const native = look.main.length === 1 && look.main[0].category === "Native";
  const out: string[] = [];

  if (native) {
    out.push(`A native set is the right call for ${occ.label}.`);
  } else {
    const level = Math.floor(
      look.main.reduce((sum, p) => sum + formality(p, occ), 0) / look.main.length
    );
    const word = level >= 4 ? "sharp" : level === 3 ? "neat" : "easy";
    out.push(`${pieceName(look.main[0])} with ${pieceName(look.main[1])} reads ${word} for ${occ.label}.`);
  }

  const body = [...look.main, ...(look.outer ? [look.outer] : [])];
  const bolds = new Set(
    body.map((p) => p.colour).filter((c): c is string => !!c && !NEUTRAL.has(c))
  );
  if (bolds.size === 0) out.push("Neutral tones keep it clean and easy to repeat.");
  else if (bolds.size === 1) out.push("One bold colour, with everything else kept calm.");

  const openShoe = has(look.shoes, "palm", "sandal", "slide", "mule", "slipper");
  if (ctx.rainy && !openShoe) out.push("Closed shoes, because rain is likely.");
  else if (ctx.hot && !look.outer) out.push("Kept light for the heat.");
  else if (ctx.cool && look.outer) out.push("The extra layer keeps you comfortable in the cool.");
  else {
    const all = [...look.main, look.outer, look.shoes, look.extra].filter((p): p is Piece => !!p);
    if (all.every((p) => daysSince(p.last_worn) >= 5)) out.push("None of it was worn in the last few days.");
  }

  return out.slice(0, 3).join(" ");
}

/** Every piece in a look, in display order. */
export function piecesOf(look: Look): Piece[] {
  return [...look.main, look.outer, look.shoes, look.extra].filter((p): p is Piece => !!p);
}
