export const TAG_GROUPS: Record<string, string[]> = {
  Sleeve: ["Short Sleeve", "Long Sleeve", "Sleeveless", "Three-Quarter Sleeve"],
  Neckline: ["Round Neck", "V-Neck", "Collared", "Mandarin Collar", "Turtleneck", "Hooded"],
  Fit: ["Slim Fit", "Regular Fit", "Relaxed Fit", "Oversized", "Tapered", "Straight Leg", "Wide Leg"],
  Material: [
    "Cotton", "Linen", "Denim", "Leather", "Suede", "Wool", "Knit", "Silk", "Lace",
    "Ankara", "Adire", "Aso Oke", "Velvet", "Corduroy",
  ],
  Pattern: ["Striped", "Checked", "Printed", "Embroidered", "Graphic", "Plain"],
  Finish: ["Buttoned", "Zip-Up", "Pleated", "Ripped"],
};

export const ALL_TAGS = Object.values(TAG_GROUPS).flat();

const ORDER = ["Size", "Sleeve", "Neckline", "Fit", "Material", "Pattern", "Finish"];

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

function groupOf(tag: string): string | null {
  if (tag.startsWith("Size ")) return "Size";
  return Object.keys(TAG_GROUPS).find((g) => TAG_GROUPS[g].includes(tag)) ?? null;
}

export function tagsFromText(text: string): string[] {
  const lower = text.toLowerCase();
  return WORD_TAGS.filter(([re]) => re.test(lower)).map(([, tag]) => tag);
}

export function sizeFromText(text: string): string | null {
  const t = text.toLowerCase();
  const format = (raw: string) => `Size ${/^\d/.test(raw) && !/xl$/.test(raw) ? raw : raw.toUpperCase()}`;

  let m = t.match(/\bsize\s*:?\s*(xxxl|xxl|xl|xxs|xs|[2-5]xl|s|m|l|\d{1,2}(?:\.\d)?)\b/);
  if (m) return format(m[1]);

  m = t.match(/\b(xxxl|xxl|xl|xxs|xs|[2-5]xl)\b/);
  if (m) return format(m[1]);

  m = t.match(/\b(?:waist|eu|uk|us)\s*:?\s*(\d{2})\b/);
  if (m) return format(m[1]);

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