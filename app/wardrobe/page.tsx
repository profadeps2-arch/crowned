"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { normalizeStyle } from "@/lib/style-rules";
import Photo from "../components/Photo";
import Crown from "../components/Crown";
import { buildName, titleCase, wordCount } from "@/lib/naming";
import {
  buildTags,
  sizeFromText,
  normalizeSize,
  groupOf,
  groupsFor,
  TAG_GROUPS,
  TAG_LABELS,
} from "@/lib/tags";

const COLOUR_SWATCHES: [string, string][] = [
  ["Black", "#151515"], ["White", "#FFFFFF"], ["Cream", "#F3E9D2"], ["Beige", "#D9C7A7"],
  ["Navy", "#1F2A44"], ["Blue", "#2F6FB3"], ["Grey", "#8E8E8E"], ["Brown", "#6B4423"],
  ["Tan", "#C19A6B"], ["Wine", "#6B1E2E"], ["Red", "#C0392B"], ["Orange", "#E67E22"],
  ["Yellow", "#F1C40F"], ["Gold", "#C9A44C"], ["Green", "#2E7D32"], ["Olive", "#708238"],
  ["Pink", "#E8A0B4"], ["Purple", "#6A1B9A"],
  ["Multicolour", "conic-gradient(#C0392B, #F1C40F, #2E7D32, #2F6FB3, #6A1B9A, #C0392B)"],
];

const COLOURS = COLOUR_SWATCHES.map(([c]) => c);

const COLOUR_WORDS: Record<string, string> = {
  maroon: "Wine", burgundy: "Wine", "wine red": "Wine", oxblood: "Wine", plum: "Wine",
  khaki: "Beige", sand: "Beige", stone: "Beige", nude: "Beige", taupe: "Beige",
  "sky blue": "Blue", "royal blue": "Blue", "baby blue": "Blue", teal: "Blue",
  turquoise: "Blue", cobalt: "Blue", denim: "Blue", aqua: "Blue",
  indigo: "Navy", midnight: "Navy", "dark blue": "Navy",
  "off white": "Cream", "off-white": "Cream", ivory: "Cream", champagne: "Cream", bone: "Cream",
  charcoal: "Grey", gray: "Grey", ash: "Grey", silver: "Grey", slate: "Grey",
  "army green": "Olive", sage: "Green", mint: "Green",
  emerald: "Green", lime: "Green", forest: "Green", bottle: "Green",
  camel: "Tan", cognac: "Brown", chocolate: "Brown", coffee: "Brown", rust: "Orange",
  coral: "Orange", peach: "Pink", mustard: "Yellow", lemon: "Yellow", bronze: "Gold",
  lilac: "Purple", lavender: "Purple", violet: "Purple", magenta: "Pink", fuchsia: "Pink",
  multi: "Multicolour", multicolor: "Multicolour", "multi-colour": "Multicolour",
  colourful: "Multicolour", colorful: "Multicolour",
};

const SECTIONS = [
  { key: "Native", label: "Native" },
  { key: "Tops", label: "Shirts and Tops" },
  { key: "Bottoms", label: "Trousers" },
  { key: "Outerwear", label: "Jackets" },
  { key: "Shoes", label: "Shoes" },
  { key: "Accessories", label: "Caps and Accessories" },
  { key: "Fragrance", label: "Perfumes" },
];

const SIZED = ["Native", "Tops", "Bottoms", "Outerwear", "Shoes"];

const EVERY_LOOK = ["Streetwear", "Casual", "Smart Casual", "Native", "Formal"];

const SECTION_LOOKS: Record<string, string[]> = {
  Native: ["Native"],
  Tops: ["Casual", "Smart Casual"],
  Bottoms: ["Casual", "Smart Casual"],
  Outerwear: ["Casual", "Smart Casual"],
  Shoes: ["Casual", "Smart Casual"],
  Accessories: EVERY_LOOK,
  Fragrance: EVERY_LOOK,
};

function sectionLabel(category: string | null) {
  return SECTIONS.find((s) => s.key === category)?.label ?? "To Sort";
}

function styleInSection(
  item: { type: string | null; name: string | null; details?: string[] | null },
  category: string
) {
  const style = normalizeStyle({ ...item, category });
  return style.category === category
    ? style
    : { category, looks: SECTION_LOOKS[category] ?? ["Casual"] };
}

type Item = {
  id: string;
  photo_path: string;
  photo_hash: string | null;
  name: string | null;
  category: string | null;
  type: string | null;
  colour: string | null;
  colour_label: string | null;
  accent_colour: string | null;
  details: string[] | null;
  tags: string[] | null;
  size: string | null;
  description: string | null;
  looks: string[] | null;
  needs_check: boolean;
  at_washman: boolean;
  confirmed: boolean;
  category_locked: boolean;
  url?: string;
};

type Tags = {
  is_clothing: boolean;
  multiple_items?: boolean;
  name: string;
  category: string;
  type: string;
  colour: string;
  looks: string[];
  tags?: string[];
  size?: string;
  confident: boolean;
};

type Fix = {
  name?: string;
  category?: string;
  type?: string;
  colour?: string;
  accent_colour?: string;
  details?: string[];
  tags?: string[];
  description?: string;
};

type Pending = { key: string; preview: string };
type AddResult = "added" | "duplicate" | "failed" | "skipped" | "multiple";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function displayName(item: Pick<Item, "name" | "colour" | "type">): string {
  if (item.name) return titleCase(item.name);
  const built = [item.colour, item.type].filter(Boolean).join(" ");
  return built ? titleCase(built) : "New Piece";
}

function readSize(raw?: string | null): string | null {
  if (!raw) return null;
  return normalizeSize(raw) ?? sizeFromText(`size ${raw}`);
}

function swatchFor(colour: string | null) {
  return COLOUR_SWATCHES.find(([c]) => c === colour)?.[1] ?? "#D9D1C3";
}

function listJoin(parts: string[]) {
  if (parts.length <= 1) return parts.join("");
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

function readiness(list: Item[]) {
  const ready = list.filter((i) => !i.at_washman);
  const has = (cat: string) => ready.some((i) => i.category === cat);
  if (has("Shoes") && (has("Native") || (has("Tops") && has("Bottoms")))) {
    return { ok: true, missing: [] as string[] };
  }
  const missing: string[] = [];
  if (!has("Native")) {
    if (!has("Tops")) missing.push("a shirt or top");
    if (!has("Bottoms")) missing.push("trousers");
  }
  if (!has("Shoes")) missing.push("shoes");
  return { ok: false, missing };
}

function toJpeg(img: ImageBitmap, max: number, quality: number): Promise<Blob> {
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), "image/jpeg", quality));
}

function toBase64(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
    reader.readAsDataURL(blob);
  });
}

async function blobHash(blob: Blob): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function colourFromText(text: string): string | null {
  const lower = text.toLowerCase();
  const candidates: [string, string][] = [
    ...Object.entries(COLOUR_WORDS),
    ...COLOURS.map((c) => [c.toLowerCase(), c] as [string, string]),
  ];
  const hits = candidates
    .map(([word, colour]) => ({
      colour,
      word,
      i: lower.search(new RegExp(`(^|[^a-z])${word}([^a-z]|$)`)),
    }))
    .filter(({ word, i }) => i >= 0 && !new RegExp(`\\bnot\\s+${word}([^a-z]|$)`).test(lower))
    .sort((a, b) => a.i - b.i || b.word.length - a.word.length);
  return hits[0]?.colour ?? null;
}

async function askAI<T>(body: object): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch("/api/tag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      console.error("AI returned", res.status);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error("AI request failed:", err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function Pencil() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function Dot({ colour }: { colour: string | null }) {
  const bg = swatchFor(colour);
  return (
    <span
      aria-hidden="true"
      className="inline-block h-3 w-3 shrink-0 rounded-full border border-black/10"
      style={{ background: bg }}
    />
  );
}

function TagRow({
  tags, max, askSize,
}: {
  tags: string[];
  max?: number;
  askSize?: boolean;
}) {
  if (tags.length === 0 && !askSize) return null;
  const shown = max ? tags.slice(0, max) : tags;
  const extra = tags.length - shown.length;
  return (
    <div className="flex flex-wrap gap-1">
      {askSize && (
        <span className="rounded-full border border-dashed border-navy px-2 py-0.5 text-[11px] text-orange-deep">
          + Size
        </span>
      )}
      {shown.map((t) => (
        <span
          key={t}
          className="rounded-full bg-fill px-2 py-0.5 text-[11px] text-muted"
        >
          {t}
        </span>
      ))}
      {extra > 0 && <span className="px-1 py-0.5 text-[11px] text-muted">+{extra}</span>}
    </div>
  );
}

function needsSize(item: Item) {
  return SIZED.includes(item.category ?? "") && !item.size;
}

function TagEditor({
  item, onSave, onSaveColour,
}: {
  item: Item;
  onSave: (tags: string[], size: string | null) => Promise<void>;
  onSaveColour: (text: string, family?: string) => Promise<boolean>;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const [sizeText, setSizeText] = useState("");
  const [colourText, setColourText] = useState("");
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState("");

  const tags = (item.tags ?? []).filter((t) => !t.startsWith("Size "));
  const sized = SIZED.includes(item.category ?? "");
  const allowed = groupsFor(item.category);
  const usedGroups = tags.map((t) => groupOf(t));
  const addable = allowed.filter((g) => !usedGroups.includes(g));
  const count = tags.length + (item.size ? 1 : 0);
  const sizePreview = sizeText.trim() ? normalizeSize(sizeText) ?? sizeFromText(`size ${sizeText}`) : null;
  const colourPreview = colourText.trim() ? colourFromText(colourText) : null;
  const colourShown = item.colour_label ?? item.colour;

  async function commit(nextTags: string[], size: string | null) {
    setBusy(true);
    await onSave(buildTags({ previous: nextTags, size }), size);
    setBusy(false);
    setOpen(null);
    setSizeText("");
    setHint("");
  }

  async function commitColour(text: string, family?: string) {
    setBusy(true);
    const ok = await onSaveColour(text, family);
    setBusy(false);
    if (ok) {
      setOpen(null);
      setColourText("");
    }
  }

  function replace(oldTag: string | null, newTag: string) {
    const group = groupOf(newTag);
    const next = tags.filter((t) => t !== oldTag && groupOf(t) !== group);
    return commit([...next, newTag], item.size);
  }

  function remove(tag: string) {
    return commit(tags.filter((t) => t !== tag), item.size);
  }

  function toggle(key: string) {
    setHint("");
    setOpen((o) => (o === key ? null : key));
  }

  function startAdd() {
    if (count >= 5) {
      setHint("Remove a tag first. Each piece can have up to 5.");
      return;
    }
    toggle("add");
  }

  const chip = (label: string, key: string, dashed = false, colour?: string | null) => (
    <button
      key={key}
      onClick={() => toggle(key)}
      disabled={busy}
      className={`flex items-center gap-1.5 rounded-full border border-transparent px-3 py-1 text-[13px] transition-colors ${
        open === key
          ? "bg-navy text-on-orange"
          : dashed
          ? "border-dashed border-navy text-orange-deep"
          : "bg-fill text-navy"
      }`}
    >
      {colour !== undefined && <Dot colour={colour} />}
      {label}
      {!dashed && <Pencil />}
    </button>
  );

  const option = (label: string, active: boolean, onClick: () => void, colour?: string) => (
    <button
      key={label}
      onClick={onClick}
      disabled={busy}
      className={`flex items-center gap-1.5 rounded-full border border-transparent px-3 py-1 text-[13px] ${
        active ? "bg-navy text-on-orange" : "bg-fill text-navy"
      }`}
    >
      {colour && <Dot colour={colour} />}
      {label}
    </button>
  );

  const special = ["size", "add", "colour"];
  const openTag = open && !special.includes(open) && !open.startsWith("group:") ? open : null;
  const openGroup = open?.startsWith("group:") ? open.slice(6) : null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {chip(colourShown ?? "+ Colour", "colour", !colourShown, colourShown ? item.colour : undefined)}
        {sized && chip(item.size ?? "+ Size", "size", !item.size)}
        {tags.map((t) => chip(t, t))}
        {allowed.length > 0 && addable.length > 0 && (
          <button
            onClick={startAdd}
            disabled={busy}
            className={`rounded-full border border-dashed px-3 py-1 text-[13px] ${
              open === "add" ? "border-navy text-navy" : "border-line text-muted"
            }`}
          >
            + Add Tag
          </button>
        )}
      </div>

      {hint && <p className="fade-in text-xs text-orange-deep">{hint}</p>}

      {open === "colour" && (
        <div className="fade-in flex flex-col gap-3 rounded-xl bg-card p-3">
          <span className="text-xs text-muted">Colour</span>
          <div className="flex flex-wrap gap-2">
            {COLOURS.map((c) =>
              option(c, c === item.colour && !item.colour_label, () => commitColour(c, c), c)
            )}
          </div>
          <div className="flex flex-col gap-2 border-t border-line pt-3">
            <span className="text-xs text-muted">Can&apos;t find it? Write it your way.</span>
            <div className="flex gap-2">
              <input
                value={colourText}
                onChange={(e) => setColourText(e.target.value)}
                placeholder="Teal, cognac, wine red…"
                className="field min-w-0 flex-1 !h-11"
              />
              <button
                onClick={() => colourText.trim() && commitColour(colourText.trim())}
                disabled={!colourText.trim() || busy}
                className="btn btn-orange !h-11 !w-auto px-5 !text-[15px]"
              >
                {busy ? "Saving…" : "Save"}
              </button>
            </div>
            {colourText.trim() && (
              <span className="flex items-center gap-1.5 text-xs text-muted">
                {colourPreview ? (
                  <>
                    <Dot colour={colourPreview} /> We&apos;ll style it as {colourPreview}.
                  </>
                ) : (
                  "We'll work out the closest colour when you save."
                )}
              </span>
            )}
          </div>
        </div>
      )}

      {open === "size" && (
        <div className="fade-in flex flex-col gap-2 rounded-xl bg-card p-3">
          <input
            autoFocus
            value={sizeText}
            onChange={(e) => setSizeText(e.target.value)}
            placeholder="For example: L, XL, large, 42"
            className="field !h-11"
          />
          <span className="text-xs text-muted">
            {sizeText.trim()
              ? sizePreview
                ? `Will save as ${sizePreview}`
                : "Try L, XL, XXL or a number like 42."
              : "Type it any way. Crowned will tidy it up."}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => sizePreview && commit(tags, sizePreview)}
              disabled={!sizePreview || busy}
              className="btn btn-orange !h-11 flex-1 !text-[15px]"
            >
              Save Size
            </button>
            {item.size && (
              <button
                onClick={() => commit(tags, null)}
                disabled={busy}
                className="rounded-full px-3 py-2 text-sm font-semibold text-red-700"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      )}

      {openTag && (
        <div className="fade-in flex flex-col gap-2 rounded-xl bg-card p-3">
          <span className="text-xs text-muted">{TAG_LABELS[groupOf(openTag) ?? ""] ?? "Tag"}</span>
          <div className="flex flex-wrap gap-2">
            {(TAG_GROUPS[groupOf(openTag) ?? ""] ?? []).map((o) =>
              option(o, o === openTag, () => (o === openTag ? setOpen(null) : replace(openTag, o)))
            )}
          </div>
          <button
            onClick={() => remove(openTag)}
            disabled={busy}
            className="self-start py-1 text-xs font-semibold text-red-700"
          >
            Remove Tag
          </button>
        </div>
      )}

      {open === "add" && (
        <div className="fade-in flex flex-col gap-2 rounded-xl bg-card p-3">
          <span className="text-xs text-muted">What would you like to add?</span>
          <div className="flex flex-wrap gap-2">
            {addable.map((g) => option(TAG_LABELS[g], false, () => setOpen(`group:${g}`)))}
          </div>
        </div>
      )}

      {openGroup && (
        <div className="fade-in flex flex-col gap-2 rounded-xl bg-card p-3">
          <span className="text-xs text-muted">{TAG_LABELS[openGroup]}</span>
          <div className="flex flex-wrap gap-2">
            {TAG_GROUPS[openGroup].map((o) => option(o, false, () => replace(null, o)))}
          </div>
        </div>
      )}
    </div>
  );
}

function SectionSheet({
  item, onPick, onClose,
}: {
  item: Item;
  onPick: (category: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="sheet-up w-full max-w-md rounded-t-3xl bg-card px-6 pb-10 pt-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-muted/40" />
        <p className="title-2 text-navy">Where does this belong?</p>
        <p className="mb-4 text-sm text-muted">{displayName(item)}</p>
        <div className="flex flex-col">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              onClick={() => onPick(s.key)}
              className="flex items-center justify-between border-b border-line py-3.5 text-left text-navy last:border-0"
            >
              <span>{s.label}</span>
              {item.category === s.key && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12l5 5L20 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

async function saveSection(item: Item, category: string) {
  const style = styleInSection(item, category);
  const changes = {
    category: style.category,
    looks: style.looks,
    category_locked: true,
    needs_check: false,
  };
  const { error } = await createClient().from("items").update(changes).eq("id", item.id);
  if (error) {
    console.error("Section update failed:", error);
    return null;
  }
  return changes;
}

function Editor({
  item, onClose, onChanged,
}: {
  item: Item;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [current, setCurrent] = useState<Item>(item);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [error, setError] = useState("");
  const [updated, setUpdated] = useState(false);
  const [sheet, setSheet] = useState(false);

  async function moveTo(category: string) {
    setSheet(false);
    if (category === current.category) return;
    setError("");
    const changes = await saveSection(current, category);
    if (!changes) {
      setError("Couldn't update. Try again.");
      return;
    }
    setCurrent((c) => ({ ...c, ...changes }));
    setUpdated(true);
    onChanged();
  }

  async function saveTags(tags: string[], size: string | null) {
    setError("");
    const { error } = await createClient()
      .from("items")
      .update({ tags, size })
      .eq("id", current.id);
    if (error) {
      console.error("Tag update failed:", error);
      setError("Couldn't update. Try again.");
      return;
    }
    setCurrent((c) => ({ ...c, tags, size }));
    setUpdated(true);
    onChanged();
  }

  async function saveColour(text: string, family?: string): Promise<boolean> {
    setError("");
    let fam = family ?? colourFromText(text);

    if (!fam) {
      const fix = await askAI<Fix>({
        note: `The main colour is ${text}.`,
        current: {
          name: displayName(current),
          category: current.category,
          type: current.type,
          colour: current.colour,
        },
      });
      fam = fix?.colour ?? null;
    }

    if (!fam) {
      setError("Couldn't recognise that colour. Try another word.");
      return false;
    }

    const typed = family ? null : titleCase(text);
    const label = typed && typed.toLowerCase() !== fam.toLowerCase() ? typed : null;
    const shown = label ?? fam;

    const name = buildName({
      previousName: current.name,
      colour: shown,
      type: current.type,
      details: current.details,
    });

    const changes = { colour: fam, colour_label: label, name, needs_check: false };
    const { error } = await createClient().from("items").update(changes).eq("id", current.id);

    if (error) {
      console.error("Colour update failed:", error);
      setError("Couldn't update. Try again.");
      return false;
    }

    setCurrent((c) => ({ ...c, ...changes }));
    setUpdated(true);
    onChanged();
    return true;
  }

  async function toggleWashman() {
    const next = !current.at_washman;
    setCurrent((c) => ({ ...c, at_washman: next }));
    const { error } = await createClient()
      .from("items")
      .update({ at_washman: next })
      .eq("id", current.id);
    if (error) {
      console.error("Washman update failed:", error);
      setCurrent((c) => ({ ...c, at_washman: !next }));
      setError("Couldn't update. Try again.");
      return;
    }
    onChanged();
  }

  async function update() {
    const words = note.trim();
    if (!words) {
      setError("Describe what to change.");
      return;
    }
    setError("");
    setUpdated(false);
    setSaving(true);

    const fix =
      (await askAI<Fix>({
        note: words,
        current: {
          name: displayName(current),
          category: current.category,
          type: current.type,
          colour: current.colour,
          accent_colour: current.accent_colour,
          details: current.details,
          tags: (current.tags ?? []).filter((t) => !t.startsWith("Size ")),
        },
      })) ?? {};

    const lower = words.toLowerCase();
    const typeChanged =
      !!fix.type &&
      fix.type.toLowerCase() !== (current.type ?? "").toLowerCase() &&
      lower.includes(fix.type.toLowerCase());

    const type = typeChanged ? titleCase(fix.type!) : current.type ? titleCase(current.type) : null;
    const typedColour = colourFromText(words);
    const colour = typedColour ?? fix.colour ?? current.colour;
    const colourLabel = typedColour ? null : current.colour_label;
    const details = fix.details ?? current.details ?? [];
    const size = sizeFromText(words) ?? current.size;

    const built = buildName({
      words,
      previousName: current.name,
      colour: colourLabel ?? colour,
      type,
      details,
    });

    const lastTypeWord = (type ?? "").toLowerCase().split(" ").pop() ?? "";
    const aiNameOk =
      !colourLabel &&
      !!fix.name &&
      (!lastTypeWord || fix.name.toLowerCase().includes(lastTypeWord)) &&
      (!colour || fix.name.toLowerCase().includes(colour.toLowerCase())) &&
      wordCount(fix.name) >= wordCount(built);
    const name = aiNameOk ? titleCase(fix.name!) : built;

    const keepSection = current.category_locked && !typeChanged && !!current.category;
    const style = keepSection
      ? styleInSection({ type, name, details }, current.category!)
      : normalizeStyle({
          category: typeChanged ? fix.category ?? current.category : current.category,
          type,
          name,
          details,
        });

    const tags = buildTags({
      words: `${words} ${name}`,
      ai: fix.tags,
      previous: current.tags,
      details,
      size,
    });

    const description =
      fix.description && (!lastTypeWord || fix.description.toLowerCase().includes(lastTypeWord))
        ? fix.description
        : words;

    const changes = {
      name,
      type,
      colour,
      colour_label: colourLabel,
      size,
      tags,
      category: style.category,
      looks: style.looks,
      accent_colour:
        fix.accent_colour === undefined
          ? current.accent_colour
          : fix.accent_colour === "None"
          ? null
          : fix.accent_colour,
      details,
      description,
      needs_check: false,
      category_locked: keepSection,
    };

    const { error } = await createClient().from("items").update(changes).eq("id", current.id);

    if (error) {
      console.error("Update failed:", error);
      setError("Couldn't update. Try again.");
      setSaving(false);
      return;
    }

    setCurrent((c) => ({ ...c, ...changes }));
    setNote("");
    setSaving(false);
    setUpdated(true);
    onChanged();
  }

  async function remove() {
    if (!confirmRemove) {
      setConfirmRemove(true);
      return;
    }
    setSaving(true);
    const supabase = createClient();
    await supabase.storage.from("wardrobe").remove([current.photo_path]);
    await supabase.from("items").delete().eq("id", current.id);
    onChanged();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-cream">
      <div className="mx-auto flex max-w-md flex-col gap-6 px-6 pb-16 pt-10">
        <div className="flex items-center justify-between">
          <h2 className="title-1">Edit Piece</h2>
          <button onClick={onClose} className="text-[17px] font-semibold text-orange-deep">
            Done
          </button>
        </div>

        {current.url && (
          <div className="relative overflow-hidden rounded-2xl">
            <img
              src={current.url}
              alt={displayName(current)}
              className={`aspect-[3/4] w-full object-cover transition-opacity ${current.at_washman ? "opacity-50" : ""}`}
            />
            {saving && <div className="shimmer absolute inset-0" />}
          </div>
        )}

        <div className="flex flex-col gap-3 rounded-2xl bg-card p-4">
          <span className="text-xs tracking-[0.2em] text-muted">IDENTIFIED AS</span>
          <span key={`${current.name}-${current.colour}`} className="fade-in text-lg font-semibold">
            {displayName(current)}
          </span>
          <button
            onClick={() => setSheet(true)}
            className="flex items-center gap-1.5 self-start text-sm text-muted"
          >
            In <span className="font-semibold text-navy">{sectionLabel(current.category)}</span>
            <Pencil />
          </button>
          <TagEditor item={current} onSave={saveTags} onSaveColour={saveColour} />
          {current.description && <span className="text-sm text-muted">{current.description}</span>}
          {current.looks && current.looks.length > 0 && (
            <span className="text-sm text-muted">Best for {current.looks.join(", ")}.</span>
          )}
          {updated && <span className="fade-in text-sm font-semibold text-navy">Updated.</span>}
        </div>

        {sheet && <SectionSheet item={current} onPick={moveTo} onClose={() => setSheet(false)} />}

        <button
          role="switch"
          aria-checked={current.at_washman}
          onClick={toggleWashman}
          className="flex items-center justify-between gap-4 rounded-2xl bg-card p-4 text-left"
        >
          <span className="flex flex-col">
            <span className="font-semibold">At the Washman</span>
            <span className="text-sm text-muted">Crowned won&apos;t style this until it&apos;s back.</span>
          </span>
          <span
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
              current.at_washman ? "bg-navy" : "bg-fill"
            }`}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                current.at_washman ? "translate-x-[22px]" : "translate-x-0.5"
              }`}
            />
          </span>
        </button>

        <label className="flex flex-col gap-2">
          <span className="text-lg font-semibold">Something not right?</span>
          <span className="text-sm text-muted">
            Describe the piece in your own words. Size, colour, sleeves, fabric, anything.
          </span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            disabled={saving}
            placeholder="Size large, long sleeve, round neck. Blue, not black."
            className="field !h-12"
          />
        </label>

        {error && <p className="text-sm text-red-700">{error}</p>}

        <button
          onClick={update}
          disabled={saving}
          className="btn btn-orange"
        >
          {saving ? "Updating…" : "Update"}
        </button>

        <div className="flex flex-col items-center gap-1">
          <button onClick={remove} disabled={saving} className="py-2 text-sm font-semibold text-red-700">
            {confirmRemove ? "Remove" : "Remove from Wardrobe"}
          </button>
          {confirmRemove && <span className="text-xs text-muted">This can&apos;t be undone.</span>}
        </div>
      </div>
    </div>
  );
}

function PieceCard({ item, onOpen }: { item: Item; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="fade-in relative flex w-full flex-col gap-1 text-left transition-transform active:scale-[0.98]"
    >
      <div className="relative overflow-hidden rounded-2xl shadow-[0_1px_2px_rgba(31,42,68,0.06),0_10px_20px_-14px_rgba(31,42,68,0.3)]">
        <div className={item.at_washman ? "opacity-40 grayscale" : ""}>
          <Photo src={item.url} alt={item.description ?? displayName(item)} className="aspect-[3/4] w-full" />
        </div>
        {item.needs_check && !item.at_washman && (
          <span className="absolute left-2 top-2 rounded-full bg-navy px-2 py-1 text-xs font-semibold text-white">
            Review
          </span>
        )}
        {item.at_washman && (
          <span className="absolute bottom-2 left-2 rounded-full bg-navy px-2 py-1 text-xs font-semibold text-cream">
            At the Washman
          </span>
        )}
      </div>
      <span className={`text-sm font-semibold ${item.at_washman ? "text-muted" : ""}`}>
        {displayName(item)}
      </span>
      <TagRow tags={item.tags ?? []} max={3} askSize={needsSize(item)} />
    </button>
  );
}

export default function WardrobePage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [pending, setPending] = useState<Pending[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<Item | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [sorting, setSorting] = useState<Item | null>(null);
  const tagRunning = useRef(false);
  const tried = useRef<Set<string>>(new Set());

  function openFilter(key: string) {
    setFilter(key);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function pickSection(item: Item, category: string) {
    setSorting(null);
    if (category === item.category) return;
    const changes = await saveSection(item, category);
    if (!changes) {
      setNotice("Couldn't update. Try again.");
      return;
    }
    setItems((list) => list.map((i) => (i.id === item.id ? { ...i, ...changes } : i)));
  }

  async function allGood() {
    const ids = items.filter((i) => !i.confirmed).map((i) => i.id);
    if (ids.length === 0) return;
    setItems((list) => list.map((i) => (ids.includes(i.id) ? { ...i, confirmed: true, needs_check: false } : i)));
    const { error } = await createClient()
      .from("items")
      .update({ confirmed: true, needs_check: false })
      .in("id", ids);
    if (error) {
      console.error("Confirm failed:", error);
      setNotice("Couldn't update. Try again.");
      load();
    }
  }

  function tidyStyles(list: Item[]) {
    const supabase = createClient();
    for (const item of list) {
      if (!item.type && !item.name) continue;
      if (item.category_locked) continue;
      const style = normalizeStyle(item);
      const sameLooks = (item.looks ?? []).join(",") === style.looks.join(",");
      if (item.category !== style.category || !sameLooks) {
        item.category = style.category;
        item.looks = style.looks;
        supabase
          .from("items")
          .update({ category: style.category, looks: style.looks })
          .eq("id", item.id)
          .then(({ error }) => error && console.error("Style tidy failed:", error));
      }
    }
  }

  async function backfillHashes(list: Item[]) {
    const supabase = createClient();
    for (const item of list.filter((i) => !i.photo_hash && i.url)) {
      try {
        const blob = await (await fetch(item.url!)).blob();
        const hash = await blobHash(blob);
        const { error } = await supabase.from("items").update({ photo_hash: hash }).eq("id", item.id);
        if (!error) item.photo_hash = hash;
      } catch (err) {
        console.error("Fingerprint failed:", err);
      }
    }
  }

  async function backfillTags(list: Item[]) {
    if (tagRunning.current) return;
    tagRunning.current = true;
    const supabase = createClient();

    try {
      const missing = list.filter(
        (i) =>
          (!i.tags || i.tags.length === 0) &&
          i.url &&
          i.category !== "Fragrance" &&
          !tried.current.has(i.id)
      );

      for (const item of missing) {
        tried.current.add(item.id);

        let image: string | null = null;
        try {
          const blob = await (await fetch(item.url!)).blob();
          const img = await createImageBitmap(blob);
          image = await toBase64(await toJpeg(img, 512, 0.7));
        } catch (err) {
          console.error("Could not prepare photo:", err);
          continue;
        }

        let read: Tags | null = null;
        for (let attempt = 0; attempt < 3 && !read; attempt++) {
          if (attempt > 0) await wait(6000 * attempt);
          read = await askAI<Tags>({ image });
        }

        const size = item.size ?? readSize(read?.size);
        const tags = buildTags({
          ai: read?.tags,
          words: `${item.name ?? ""} ${item.type ?? ""} ${item.description ?? ""}`,
          details: item.details,
          size,
        });

        if (tags.length > 0) {
          const { error } = await supabase.from("items").update({ tags, size }).eq("id", item.id);
          if (!error) {
            setItems((prev) => prev.map((p) => (p.id === item.id ? { ...p, tags, size } : p)));
          }
        }

        await wait(4000);
      }
    } finally {
      tagRunning.current = false;
    }
  }

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/");
      return;
    }
    setUserId(user.id);

    const { data, error } = await supabase
      .from("items")
      .select(
        "id, photo_path, photo_hash, name, category, type, colour, colour_label, accent_colour, details, tags, size, description, looks, needs_check, at_washman, confirmed, category_locked"
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Wardrobe load failed:", error);
      setNotice("Couldn't load your wardrobe. Refresh to try again.");
      setLoading(false);
      return;
    }

    const list: Item[] = (data ?? []).map((i) => ({
      ...i,
      at_washman: !!i.at_washman,
      confirmed: i.confirmed !== false,
      category_locked: !!i.category_locked,
    }));
    tidyStyles(list);
    if (list.length > 0) {
      const { data: signed } = await supabase.storage
        .from("wardrobe")
        .createSignedUrls(list.map((i) => i.photo_path), 3600);
      list.forEach((item, i) => (item.url = signed?.[i]?.signedUrl ?? undefined));
    }
    setItems(list);
    setLoading(false);
    backfillHashes(list);
    backfillTags(list);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addOne(big: Blob, small: Blob, hash: string): Promise<AddResult> {
    const supabase = createClient();
    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.jpg`;

    const [tags, upload] = await Promise.all([
      toBase64(small).then((image) => askAI<Tags>({ image })),
      supabase.storage.from("wardrobe").upload(path, big, { contentType: "image/jpeg" }),
    ]);

    if (upload.error) {
      console.error("Upload failed:", upload.error);
      return "failed";
    }

    if (tags && tags.is_clothing === false) {
      await supabase.storage.from("wardrobe").remove([path]);
      return "skipped";
    }

    if (tags && tags.multiple_items) {
      await supabase.storage.from("wardrobe").remove([path]);
      return "multiple";
    }

    const type = tags?.type ? titleCase(tags.type) : null;
    const colour = tags?.colour ?? null;
    const built = tags ? buildName({ previousName: tags.name, colour, type }) : null;
    const name = tags
      ? wordCount(tags.name) >= wordCount(built) ? titleCase(tags.name) : built
      : null;
    const style = tags
      ? normalizeStyle({ category: tags.category, type, name, details: [] })
      : { category: null, looks: [] };
    const size = readSize(tags?.size);

    const { error } = await supabase.from("items").insert({
      photo_path: path,
      photo_hash: hash,
      name,
      type,
      category: style.category,
      colour,
      looks: style.looks,
      size,
      tags: buildTags({ ai: tags?.tags, words: `${name ?? ""} ${type ?? ""}`, size }),
      needs_check: !tags || !tags.confident,
      confirmed: false,
    });

    if (error) {
      await supabase.storage.from("wardrobe").remove([path]);
      if (error.code === "23505") return "duplicate";
      console.error("Save failed:", error);
      return "failed";
    }
    return "added";
  }

  async function addPhotos(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setNotice("");
    setFilter("all");

    const known = new Set(items.map((i) => i.photo_hash).filter(Boolean));
    const fresh: { big: Blob; small: Blob; hash: string; file: File }[] = [];
    let duplicates = 0;

    for (const file of files) {
      const img = await createImageBitmap(file);
      const [big, small] = await Promise.all([toJpeg(img, 1200, 0.8), toJpeg(img, 512, 0.7)]);
      const hash = await blobHash(big);
      if (known.has(hash)) {
        duplicates++;
      } else {
        known.add(hash);
        fresh.push({ big, small, hash, file });
      }
    }

    const batch = fresh.map((f, i) => ({
      ...f,
      key: `${Date.now()}-${i}`,
      preview: URL.createObjectURL(f.file),
    }));
    setPending((p) => [...batch.map(({ key, preview }) => ({ key, preview })), ...p]);

    let failed = 0;
    let skipped = 0;
    let multiple = 0;

    for (let i = 0; i < batch.length; i += 3) {
      await Promise.all(
        batch.slice(i, i + 3).map(async (b) => {
          const result = await addOne(b.big, b.small, b.hash);
          if (result === "duplicate") duplicates++;
          if (result === "failed") failed++;
          if (result === "skipped") skipped++;
          if (result === "multiple") multiple++;
          await load();
          setPending((p) => p.filter((x) => x.key !== b.key));
        })
      );
    }

    setNotice(
      [
        duplicates > 0
          ? duplicates === 1
            ? "Already in your wardrobe."
            : `${duplicates} photos are already in your wardrobe.`
          : "",
        multiple > 0
          ? multiple === 1
            ? "A photo had more than one piece. Add each one on its own."
            : `${multiple} photos had more than one piece. Add each one on its own.`
          : "",
        skipped > 0 ? "A photo didn't look like clothing, so it wasn't added." : "",
        failed > 0 ? "Couldn't upload a photo. Try again." : "",
      ]
        .filter(Boolean)
        .join(" ")
    );
  }

  const total = items.length + pending.length;
  const review = items.filter((i) => i.needs_check);
  const fresh = items.filter((i) => !i.confirmed);
  const status = readiness(items);

  const sections = [
    ...SECTIONS.map((s) => ({
      ...s,
      pieces: items.filter((i) => i.category === s.key),
    })),
    {
      key: "unsorted",
      label: "To Sort",
      pieces: items.filter((i) => !SECTIONS.some((s) => s.key === i.category)),
    },
  ].filter((s) => s.pieces.length > 0);

  const visible =
    filter === "all"
      ? sections
      : filter === "review"
      ? [{ key: "review", label: "Needs a Quick Look", pieces: review }]
      : sections.filter((s) => s.key === filter);

  return (
    <main className="flex flex-col gap-6 px-6 pb-12 pt-6">
      <style>{`
        .shimmer {
          background: linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.45) 50%, transparent 70%);
          background-size: 250% 100%;
          animation: shimmer 1.4s ease-in-out infinite;
        }
        @keyframes shimmer { from { background-position: 150% 0 } to { background-position: -100% 0 } }
        .fade-in { animation: fadeIn 0.5s ease-out both }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
        .sheet-up { animation: sheetUp 0.35s cubic-bezier(0.2, 0.8, 0.2, 1) both }
        @keyframes sheetUp { from { transform: translateY(100%) } to { transform: none } }
        .no-scrollbar::-webkit-scrollbar { display: none }
        .no-scrollbar { scrollbar-width: none }
        .rail { scroll-behavior: smooth; -webkit-overflow-scrolling: touch; overscroll-behavior-x: contain }
        @media (prefers-reduced-motion: reduce) { .shimmer, .fade-in, .sheet-up { animation: none } .rail { scroll-behavior: auto } }
      `}</style>

      {editing && (
        <Editor item={editing} onClose={() => setEditing(null)} onChanged={() => load()} />
      )}

      <div className="flex items-baseline justify-between">
        <h1 className="large-title">Wardrobe</h1>
        <span className="subhead text-muted">{total} {total === 1 ? "piece" : "pieces"}</span>
      </div>

      {!loading && (
        status.ok ? (
          <Link
            href="/today"
            className="flex items-center justify-between rounded-2xl bg-card p-4"
          >
            <span className="subhead">Your wardrobe is ready to style.</span>
            <span className="shrink-0 whitespace-nowrap text-[15px] font-medium text-orange-deep">Open Today ›</span>
          </Link>
        ) : (
          <div className="rounded-2xl bg-card p-4 text-sm">
            Add {listJoin(status.missing)} to get your first outfit.
          </div>
        )
      )}

      <div className="flex flex-col gap-2">
        <label className="btn btn-orange cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
            <circle cx="12" cy="13" r="3.5" />
          </svg>
          Take Photo
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={addPhotos}
          />
        </label>
        <label className="btn btn-outline cursor-pointer">
          Choose from Library
          <input type="file" accept="image/*" multiple className="hidden" onChange={addPhotos} />
        </label>
        <p className="text-center text-sm text-muted">
          One piece per photo, on a plain background.
        </p>
      </div>

      {notice && <p className="fade-in text-center text-sm text-muted">{notice}</p>}

      {(pending.length > 0 || fresh.length > 0) && (
        <section className="fade-in flex flex-col gap-3 rounded-3xl bg-card py-4">
          <div className="flex items-center justify-between px-4">
            <div className="flex flex-col">
              <h2 className="title-2">
                Just Added <span className="text-base text-muted">{pending.length + fresh.length}</span>
              </h2>
              <span className="text-xs text-muted">
                {pending.length > 0 ? "Sorting your pieces…" : "Check each one landed in the right place."}
              </span>
            </div>
            {pending.length === 0 && fresh.length > 0 && (
              <button
                onClick={allGood}
                className="btn btn-orange !h-10 !w-auto px-4 !text-[15px]"
              >
                All Good
              </button>
            )}
          </div>

          <div className="no-scrollbar rail flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4">
            {pending.map((p) => (
              <div key={p.key} className="flex w-[42%] shrink-0 snap-start flex-col gap-2">
                <div className="relative overflow-hidden rounded-xl">
                  <img src={p.preview} alt="New piece" className="aspect-[3/4] w-full object-cover" />
                  <div className="shimmer absolute inset-0" />
                </div>
                <div className="h-3 w-2/3 rounded-full bg-fill shimmer" />
                <div className="h-2 w-1/3 rounded-full bg-fill shimmer" />
              </div>
            ))}
            {fresh.map((item) => (
              <div key={item.id} className="flex w-[42%] shrink-0 snap-start flex-col gap-1.5">
                <PieceCard item={item} onOpen={() => setEditing(item)} />
                <button
                  onClick={() => setSorting(item)}
                  className="flex items-center gap-1 self-start rounded-full bg-fill px-2.5 py-1 text-[11px] text-muted"
                >
                  In <span className="font-semibold text-navy">{sectionLabel(item.category)}</span>
                  <Pencil />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {sorting && (
        <SectionSheet item={sorting} onPick={(c) => pickSection(sorting, c)} onClose={() => setSorting(null)} />
      )}

      {review.length > 0 && filter !== "review" && (
        <button
          onClick={() => openFilter("review")}
          className="flex items-center justify-between rounded-2xl bg-fill p-4 text-left"
        >
          <span className="text-sm font-semibold text-navy">
            {review.length === 1 ? "1 piece needs a quick look" : `${review.length} pieces need a quick look`}
          </span>
          <span className="text-navy">›</span>
        </button>
      )}

      {!loading && sections.length > 0 && (
        <div className="no-scrollbar sticky top-0 z-10 -mx-6 flex gap-2 overflow-x-auto bg-cream/90 px-6 py-2 backdrop-blur">
          {[
            { key: "all", label: "All", count: items.length },
            ...sections.map((s) => ({ key: s.key, label: s.label, count: s.pieces.length })),
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => openFilter(f.key)}
              className={`shrink-0 rounded-full border border-transparent px-4 py-2 text-[15px] transition-colors ${
                filter === f.key
                  ? "bg-navy text-on-orange"
                  : "bg-fill text-navy"
              }`}
            >
              {f.label} <span className="opacity-60">{f.count}</span>
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex gap-3 overflow-hidden">
          {[0, 1, 2].map((i) => (
            <div key={i} className="aspect-[3/4] w-[44%] shrink-0 rounded-xl bg-sand shimmer" />
          ))}
        </div>
      ) : total === 0 ? (
        <div className="card flex flex-col items-center gap-3 p-8 text-center">
          <Crown size={40} className="text-navy" />
          <h2 className="text-xl">Your wardrobe is empty</h2>
          <p className="text-sm text-muted">
            Start with the pieces you wear most.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {filter !== "all" && (
            <button onClick={() => openFilter("all")} className="self-start text-sm font-semibold text-navy">
              ‹ All pieces
            </button>
          )}
          {visible.map((section) => (
            <section key={section.key} className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between">
                <h2 className="title-2">
                  {section.label} <span className="text-base text-muted">{section.pieces.length}</span>
                </h2>
                {filter === "all" && section.pieces.length > 2 && (
                  <button
                    onClick={() => openFilter(section.key)}
                    className="text-sm font-semibold text-navy"
                  >
                    See All ›
                  </button>
                )}
              </div>

              {filter === "all" ? (
                <div className="no-scrollbar rail -mx-6 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-6 px-6 pb-1">
                  {section.pieces.map((item) => (
                    <div key={item.id} className="w-[44%] shrink-0 snap-start">
                      <PieceCard item={item} onOpen={() => setEditing(item)} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {section.pieces.map((item) => (
                    <PieceCard key={item.id} item={item} onOpen={() => setEditing(item)} />
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </main>
  );
}