export const TAG_GROUPS: Record<string, string[]> = {
  Sleeve: ["Short Sleeve", "Long Sleeve", "Sleeveless", "Three-Quarter Sleeve"],
  Neckline: ["Round Neck", "V-Neck", "Collared", "Mandarin Collar", "Turtleneck", "Hooded"],
  Fit: ["Slim Fit", "Regular Fit", "Relaxed Fit", "Oversized", "Tapered", "Straight Leg", "Wide Leg"],
  ShoeStyle: ["Low-Top", "High-Top", "Slip-On", "Lace-Up"],
  Material: [
    "Cotton", "Linen", "Denim", "Leather", "Suede", "Wool", "Knit", "Silk", "Lace",
    "Ankara", "Adire", "Aso Oke", "Velvet", "Corduroy", "Canvas", "Gold-Tone", "Silver-Tone",
  ],
  Pattern: ["Striped", "Checked", "Printed", "Embroidered", "Graphic", "Plain"],
  Finish: ["Buttoned", "Zip-Up", "Pleated", "Ripped"],
};

export const TAG_LABELS: Record<string, string> = {
  Sleeve: "Sleeve",
  Neckline: "Neckline",
  Fit: "Fit",
  ShoeStyle: "Style",
  Material: "Material",
  Pattern: "Pattern",
  Finish: "Finish",
};

export const ALL_TAGS = Object.values(TAG_GROUPS).flat();

const ORDER = ["Size", "Sleeve", "Neckline", "Fit", "ShoeStyle", "Material", "Pattern", "Finish"];

export function groupsFor(category: string | null): string[] {
  switch (category) {
    case "Tops":
    case "Outerwear":
    case "Native":
      return ["Sleeve", "Neckline", "Fit", "Material", "Pattern", "Finish"];
    case "Bottoms":
      return ["Fit", "Material", "Pattern", "Finish"];
    case "Shoes":
      return ["ShoeStyle", "Material"];
    case "Accessories":
      return ["Material", "Pattern"];
    case "Fragrance":
      return [];
    default:
      return Object.keys(TAG_GROUPS);
  }
}

const WORD_TAGS: [RegExp, string][] = [
  [/short[\s-]?sleeve/, "Short Sleeve"],
  [/long[\s-]?sleeve/, "Long Sleeve"],
  [/sleeveless/, "Sleeveless"],
  [/three[\s-]?quarter/, "Three-Quarter Sleeve"],
  [/round[\s-]?neck|crew[\s-]?neck/, "Round Neck"],
  [/v[\s-]neck|\bvneck/, "V-Neck"],
  [/turtle[\s-]?neck|polo[\s-]neck/, "Turtleneck"],
  [/mandarin|chinese collar/, "Mandarin Collar"],
  [/collared|with a collar/, "Collared"],
  [/hood/, "Hooded"],
  [/slim[\s-]?fit|\bslim\b/, "Slim Fit"],
  [/regular[\s-]?fit/, "Regular Fit"],
  [/relaxed|\bloose\b/, "Relaxed Fit"],
  [/oversized|baggy/, "Oversized"],
  [/tapered/, "Tapered"],
  [/wide[\s-]?leg/, "Wide Leg"],
  [/straight[\s-]?leg/, "Straight Leg"],
  [/low[\s-]?top/, "Low-Top"],
  [/high[\s-]?top/, "High-Top"],
  [/slip[\s-]?on|loafer|mule|slides?\b|palm/, "Slip-On"],
  [/lace[\s-]?up|laces/, "Lace-Up"],
  [/cotton/, "Cotton"],
  [/linen/, "Linen"],
  [/denim|\bjean\b/, "Denim"],
  [/leather/, "Leather"],
  [/suede/, "Suede"],
  [/wool/, "Wool"],
  [/\bknit/, "Knit"],
  [/silk|satin/, "Silk"],
  [/\blace\b/, "Lace"],
  [/ankara/, "Ankara"],
  [/adire/, "Adire"],
  [/aso[\s-]?oke/, "Aso Oke"],
  [/velvet/, "Velvet"],
  [/corduroy/, "Corduroy"],
  [/canvas/, "Canvas"],
  [/gold[\s-]?tone|\bgold\b/, "Gold-Tone"],
  [/silver[\s-]?tone|\bsilver\b/, "Silver-Tone"],
  [/stripe/, "Striped"],
  [/check|plaid|tartan/, "Checked"],
  [/print/, "Printed"],
  [/embroider/, "Embroidered"],
  [/graphic/, "Graphic"],
  [/\bplain\b/, "Plain"],
  [/zip/, "Zip-Up"],
  [/button/, "Buttoned"],
  [/pleat/, "Pleated"],
  [/ripped|distressed/, "Ripped"],
];

const DETAIL_TAGS: Record<string, string> = {
  Stripes: "Striped",
  Checks: "Checked",
  Print: "Printed",
  Embroidery: "Embroidered",
  Graphic: "Graphic",
  Lace: "Lace",
  Ripped: "Ripped",
  Buttons: "Buttoned",
  Zip: "Zip-Up",
};

export function groupOf(tag: string): string | null {
  if (tag.startsWith("Size ")) return "Size";
  return Object.keys(TAG_GROUPS).find((g) => TAG_GROUPS[g].includes(tag)) ?? null;
}

export function tagsFromText(text: string): string[] {
  const lower = text.toLowerCase();
  return WORD_TAGS.filter(([re]) => re.test(lower)).map(([, tag]) => tag);
}

export function normalizeSize(raw: string): string | null {
  let t = raw
    .toLowerCase()
    .replace(/size/g, " ")
    .replace(/[^a-z0-9.\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!t) return null;

  const num = t.match(/^(\d{1,2}(?:\.5)?)$/) || t.match(/^(?:eu|uk|us|waist)\s*(\d{1,2}(?:\.5)?)$/);
  if (num) return `Size ${num[1]}`;

  t = t.replace(/-/g, " ").replace(/\s+/g, " ");

  const words: [RegExp, string][] = [
    [/^(4xl|xxxxl|4 ?x ?large|quadruple (extra|x) large)$/, "4XL"],
    [/^(3xl|xxxl|3 ?x ?large|triple (extra|x) large|triple xl|xxx large)$/, "XXXL"],
    [/^(2xl|xxl|2 ?x ?large|double (extra|x) large|double xl|xx large)$/, "XXL"],
    [/^(xl|x large|extra large|x l)$/, "XL"],
    [/^(l|large|lg|lrg)$/, "L"],
    [/^(m|medium|med|md)$/, "M"],
    [/^(s|small|sm)$/, "S"],
    [/^(xs|x small|extra small)$/, "XS"],
    [/^(xxs|2xs|xx small|double extra small)$/, "XXS"],
  ];
  for (const [re, size] of words) {
    if (re.test(t)) return `Size ${size}`;
  }
  return null;
}

export function sizeFromText(text: string): string | null {
  const t = text.toLowerCase();

  const after = t.match(/\bsize\s*:?\s*([a-z0-9.\s-]{1,30})/);
  if (after) {
    const phrase = after[1].split(/,|;| and | but /)[0].trim();
    const parts = phrase.split(/\s+/);
    for (let n = Math.min(4, parts.length); n >= 1; n--) {
      const size = normalizeSize(parts.slice(0, n).join(" "));
      if (size) return size;
    }
  }

  const token = t.match(
    /\b(xxxl|xxl|xl|xxs|xs|[2-5]xl|extra large|x-large|double xl|triple xl)\b/
  );
  if (token) return normalizeSize(token[1]);

  const m = t.match(/\b(?:waist|eu|uk|us)\s*:?\s*(\d{2})\b/);
  if (m) return `Size ${m[1]}`;

  return null;
}

export function buildTags(input: {
  words?: string | null;
  ai?: string[] | null;
  previous?: string[] | null;
  details?: string[] | null;
  size?: string | null;
}): string[] {
  const candidates = [
    ...(input.words ? tagsFromText(input.words) : []),
    ...(input.ai ?? []).filter((t) => ALL_TAGS.includes(t)),
    ...(input.previous ?? []).filter((t) => ALL_TAGS.includes(t)),
    ...(input.details ?? []).map((d) => DETAIL_TAGS[d]).filter(Boolean),
  ];

  const byGroup = new Map<string, string>();
  for (const tag of candidates) {
    const group = groupOf(tag);
    if (group && !byGroup.has(group)) byGroup.set(group, tag);
  }

  if (byGroup.size > 1 && byGroup.get("Pattern") === "Plain") byGroup.delete("Pattern");

  const ordered = ORDER.flatMap((g) => {
    if (g === "Size") return input.size ? [input.size] : [];
    const tag = byGroup.get(g);
    return tag ? [tag] : [];
  });

  return ordered.slice(0, 5);
}