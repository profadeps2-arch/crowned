export const LOOKS = ["Streetwear", "Casual", "Smart Casual", "Native", "Formal"];
const ALL = [...LOOKS];

type Rule = { words: string[]; looks: string[] };

const NATIVE_SET_WORDS = [
  "agbada", "buba", "sokoto", "kaftan", "senator", "dashiki", "danshiki",
  "isiagu", "babariga", "aso oke", "native set",
];

const groups: Record<string, Rule[]> = {
  Accessories: [
    { words: ["fila", "beads", "native cap", "abeti aja"], looks: ["Native"] },
    { words: ["cap", "beanie", "bucket hat"], looks: ["Streetwear", "Casual"] },
    { words: ["tie", "bow tie", "cufflinks", "pocket square"], looks: ["Formal", "Smart Casual"] },
    { words: ["watch", "belt", "sunglasses", "glasses", "bracelet", "ring", "chain", "bag"], looks: ALL },
  ],
  Outerwear: [
    { words: ["blazer", "suit jacket", "sport coat"], looks: ["Smart Casual", "Formal"] },
    { words: ["bomber", "hoodie", "puffer", "windbreaker", "track jacket", "varsity"], looks: ["Streetwear", "Casual"] },
    { words: ["leather jacket", "denim jacket", "jean jacket"], looks: ["Streetwear", "Casual", "Smart Casual"] },
    { words: ["overshirt", "shacket", "cardigan"], looks: ["Casual", "Smart Casual"] },
    { words: ["jacket", "coat"], looks: ["Casual", "Smart Casual"] },
  ],
  Tops: [
    { words: ["t-shirt", "tee", "tank", "vest", "jersey", "sweatshirt"], looks: ["Streetwear", "Casual"] },
    { words: ["polo"], looks: ["Casual", "Smart Casual"] },
    { words: ["oxford", "dress shirt", "formal shirt"], looks: ["Smart Casual", "Formal"] },
    { words: ["sweater", "jumper", "knit", "turtleneck"], looks: ["Casual", "Smart Casual"] },
    { words: ["shirt"], looks: ["Casual", "Smart Casual"] },
  ],
  Bottoms: [
    { words: ["jeans", "denim"], looks: ["Streetwear", "Casual", "Smart Casual"] },
    { words: ["cargo", "jogger", "sweatpants", "track pants"], looks: ["Streetwear", "Casual"] },
    { words: ["shorts"], looks: ["Casual", "Streetwear"] },
    { words: ["chinos"], looks: ["Casual", "Smart Casual"] },
    { words: ["suit trousers", "trousers", "slacks", "pants"], looks: ["Smart Casual", "Formal"] },
  ],
  Shoes: [
    { words: ["sneakers", "sneaker", "trainers"], looks: ["Streetwear", "Casual"] },
    { words: ["loafers", "loafer"], looks: ["Smart Casual", "Formal", "Native"] },
    { words: ["oxford", "derby", "brogue", "dress shoes", "formal shoes"], looks: ["Formal", "Smart Casual"] },
    { words: ["palm", "mules", "mule", "sandals", "slides", "slippers"], looks: ["Native", "Casual"] },
    { words: ["boots", "boot"], looks: ["Casual", "Smart Casual", "Streetwear"] },
    { words: ["shoes", "shoe", "footwear"], looks: ["Casual", "Smart Casual"] },
  ],
};

const categoryDefaults: Record<string, string[]> = {
  Native: ["Native"],
  Outerwear: ["Casual", "Smart Casual"],
  Tops: ["Casual", "Smart Casual"],
  Bottoms: ["Casual", "Smart Casual"],
  Shoes: ["Casual", "Smart Casual"],
  Accessories: ALL,
  Fragrance: ALL,
};

function has(text: string, word: string) {
  return new RegExp(`(^|[^a-z])${word}([^a-z]|$)`).test(text);
}

function findRule(text: string, category: string | null) {
  const order = category && groups[category]
    ? [category, ...Object.keys(groups).filter((g) => g !== category)]
    : Object.keys(groups);
  for (const group of order) {
    const rule = groups[group].find((r) => r.words.some((w) => has(text, w)));
    if (rule) return { group, rule };
  }
  return null;
}

export function normalizeStyle(item: {
  category: string | null;
  type: string | null;
  name: string | null;
  details?: string[] | null;
}): { category: string | null; looks: string[] } {
  const text = `${item.name ?? ""} ${item.type ?? ""}`.toLowerCase();

  if (item.category === "Fragrance" || has(text, "perfume") || has(text, "fragrance") || has(text, "cologne")) {
    return { category: "Fragrance", looks: ALL };
  }

  const wearable = !["Shoes", "Accessories"].includes(item.category ?? "");
  if (wearable && NATIVE_SET_WORDS.some((w) => has(text, w))) {
    return { category: "Native", looks: ["Native"] };
  }

  const own = item.category && groups[item.category]
    ? groups[item.category].find((r) => r.words.some((w) => has(text, w)))
    : undefined;

  const accessory = own
    ? undefined
    : groups.Accessories.find((r) => r.words.some((w) => has(text, w)));
  if (accessory) {
    return { category: "Accessories", looks: accessory.looks };
  }

  const match = own ? { group: item.category as string, rule: own } : findRule(text, item.category);
  const category = match
    ? match.group
    : item.category === "Native"
    ? null
    : item.category;

  let looks = match ? match.rule.looks : categoryDefaults[category ?? ""] ?? ["Casual"];

  const loud = (item.details ?? []).some((d) => d === "Logo" || d === "Graphic");
  if (loud && ["Tops", "Outerwear", "Bottoms"].includes(category ?? "")) {
    const relaxed = looks.filter((l) => l === "Streetwear" || l === "Casual");
    looks = relaxed.length > 0 ? relaxed : ["Streetwear", "Casual"];
  }

  return { category, looks };
}