const MATERIALS = [
  "leather", "faux leather", "suede", "denim", "linen", "wool", "cotton", "silk", "satin",
  "velvet", "corduroy", "cashmere", "knit", "lace", "ankara", "adire", "aso oke", "kente",
];

const STYLES = [
  "oxford", "cargo", "bomber", "chelsea", "low-top", "high-top", "slim", "wide-leg",
  "straight", "pleated", "varsity", "puffer", "quilted", "button-down", "short-sleeve",
  "long-sleeve", "crew neck", "v-neck", "turtleneck", "hooded", "zip-up", "double-breasted",
];

const PATTERN_WORDS: Record<string, string> = {
  striped: "Striped", stripes: "Striped", stripe: "Striped", pinstripe: "Pinstriped",
  checked: "Checked", checks: "Checked", check: "Checked", plaid: "Checked", tartan: "Checked",
  printed: "Printed", print: "Printed", floral: "Floral",
  embroidered: "Embroidered", embroidery: "Embroidered",
  graphic: "Graphic", ripped: "Ripped", distressed: "Ripped", textured: "Textured",
};

const PATTERN_FROM_DETAILS: Record<string, string> = {
  Stripes: "Striped", Checks: "Checked", Print: "Printed", Embroidery: "Embroidered",
  Graphic: "Graphic", Lace: "Lace", Ripped: "Ripped", Textured: "Textured",
};

export function titleCase(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/(^|[\s-])\S/g, (m) => m.toUpperCase());
}

function has(text: string, word: string) {
  return new RegExp(`(^|[^a-z])${word.replace(/-/g, "\\-")}([^a-z]|$)`).test(text);
}

function earliest(text: string, words: string[]): string | null {
  const hits = words
    .map((w) => ({ w, i: has(text, w) ? text.indexOf(w) : -1 }))
    .filter((h) => h.i >= 0)
    .sort((a, b) => a.i - b.i);
  return hits[0]?.w ?? null;
}

function findIn(sources: string[], words: string[]): string | null {
  for (const s of sources) {
    const hit = earliest(s, words);
    if (hit) return hit;
  }
  return null;
}

export function buildName(input: {
  words?: string | null;
  previousName?: string | null;
  colour: string | null;
  type: string | null;
  details?: string[] | null;
}): string {
  const sources = [input.words ?? "", input.previousName ?? ""].map((s) => s.toLowerCase());
  const typeLower = (input.type ?? "").toLowerCase();

  const material = findIn(sources, MATERIALS);
  const style = findIn(sources, STYLES);

  const patternKey = findIn(sources, Object.keys(PATTERN_WORDS));
  const patternFromDetails = (input.details ?? [])
    .map((d) => PATTERN_FROM_DETAILS[d])
    .find(Boolean);
  const pattern = patternKey ? PATTERN_WORDS[patternKey] : patternFromDetails ?? null;

  const parts = [input.colour, pattern, material, style, input.type]
    .filter((p): p is string => !!p)
    .filter((p, i, all) => {
      const lower = p.toLowerCase();
      if (p !== input.type && typeLower.includes(lower)) return false;
      return all.findIndex((x) => x.toLowerCase() === lower) === i;
    });

  const trimmed = parts.length > 4 ? [parts[0], ...parts.slice(-3)] : parts;
  return titleCase(trimmed.join(" ")) || "New Piece";
}

export function wordCount(text: string | null | undefined): number {
  return (text ?? "").trim().split(/\s+/).filter(Boolean).length;
}