/** Named colours used to turn a picked shade into a friendly name and a base family. */
const NAMED: [string, string][] = [
  ["Black", "#151515"], ["White", "#FFFFFF"], ["Cream", "#F3E9D2"], ["Beige", "#D9C7A7"],
  ["Navy", "#1F2A44"], ["Blue", "#2F6FB3"], ["Grey", "#8E8E8E"], ["Brown", "#6B4423"],
  ["Tan", "#C19A6B"], ["Wine", "#6B1E2E"], ["Red", "#C0392B"], ["Orange", "#E67E22"],
  ["Yellow", "#F1C40F"], ["Gold", "#C9A44C"], ["Green", "#2E7D32"], ["Olive", "#708238"],
  ["Pink", "#E8A0B4"], ["Purple", "#6A1B9A"],
  // Extra names, each pointing at the closest base family above.
  ["Charcoal", "#36393F"], ["Sky Blue", "#87BCE5"], ["Teal", "#1F7A7A"], ["Mint", "#A8DCC4"],
  ["Khaki", "#B5A67A"], ["Cognac", "#9A4E1C"], ["Maroon", "#4E1220"], ["Burgundy", "#6D1A36"],
  ["Mustard", "#D3A62A"], ["Coral", "#F07C6B"], ["Lavender", "#B9A6D6"], ["Peach", "#F5C4A1"],
  ["Forest Green", "#1F4D2B"], ["Royal Blue", "#2A47A8"], ["Light Grey", "#C9C9CC"], ["Chocolate", "#3E2417"],
];

/** The base families the app styles with (the first 18 names above). */
export const FAMILY_COUNT = 18;

function rgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function nearest(hex: string, pool: [string, string][]) {
  const [r, g, b] = rgb(hex);
  let best = pool[0];
  let bestD = Infinity;
  for (const entry of pool) {
    const [R, G, B] = rgb(entry[1]);
    // Weighted so greens and reds count a little more than blue, like the eye does.
    const d = 2 * (r - R) ** 2 + 4 * (g - G) ** 2 + 3 * (b - B) ** 2;
    if (d < bestD) {
      bestD = d;
      best = entry;
    }
  }
  return best[0];
}

/** For any hex colour: the friendly name and the base family to style with. */
export function describeHex(hex: string): { name: string; family: string } {
  return { name: nearest(hex, NAMED), family: nearest(hex, NAMED.slice(0, FAMILY_COUNT)) };
}

/** Display colour for a base family name, for dots and bars. */
export function swatchOf(name: string | null): string {
  return NAMED.find(([n]) => n === name)?.[1] ?? "#D9D1C3";
}
