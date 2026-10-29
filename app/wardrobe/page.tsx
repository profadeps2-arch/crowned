"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { normalizeStyle } from "@/lib/style-rules";
import { buildName, titleCase, wordCount } from "@/lib/naming";

const COLOURS = [
  "Black", "White", "Cream", "Beige", "Navy", "Blue", "Grey", "Brown", "Tan", "Wine",
  "Red", "Orange", "Yellow", "Gold", "Green", "Olive", "Pink", "Purple", "Multicolour",
];

const COLOUR_WORDS: Record<string, string> = {
  maroon: "Wine", burgundy: "Wine", "wine red": "Wine",
  khaki: "Beige", "sky blue": "Blue", "royal blue": "Blue", "baby blue": "Blue",
  "off white": "Cream", "off-white": "Cream", ivory: "Cream",
  charcoal: "Grey", gray: "Grey", "ash": "Grey",
  "army green": "Olive", camel: "Tan", mustard: "Yellow", lilac: "Purple",
  multi: "Multicolour", multicolor: "Multicolour", "multi-colour": "Multicolour",
  colourful: "Multicolour", colorful: "Multicolour",
};

const SHADE_ORDER = [
  "Black", "Navy", "Wine", "Brown", "Olive", "Green", "Grey", "Blue", "Purple", "Red",
  "Orange", "Tan", "Gold", "Yellow", "Pink", "Beige", "Cream", "White", "Multicolour",
];

const SECTIONS = [
  { key: "Native", label: "Native" },
  { key: "Tops", label: "Shirts and Tops" },
  { key: "Bottoms", label: "Trousers" },
  { key: "Outerwear", label: "Jackets" },
  { key: "Shoes", label: "Shoes" },
  { key: "Accessories", label: "Caps and Accessories" },
  { key: "Fragrance", label: "Perfumes" },
];

type Item = {
  id: string;
  photo_path: string;
  photo_hash: string | null;
  name: string | null;
  category: string | null;
  type: string | null;
  colour: string | null;
  accent_colour: string | null;
  details: string[] | null;
  description: string | null;
  looks: string[] | null;
  needs_check: boolean;
  at_washman: boolean;
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
  confident: boolean;
};

type Fix = {
  name?: string;
  category?: string;
  type?: string;
  colour?: string;
  accent_colour?: string;
  details?: string[];
  description?: string;
};

type Pending = { key: string; preview: string };
type AddResult = "added" | "duplicate" | "failed" | "skipped" | "multiple";

function displayName(item: Pick<Item, "name" | "colour" | "type">): string {
  if (item.name) return titleCase(item.name);
  const built = [item.colour, item.type].filter(Boolean).join(" ");
  return built ? titleCase(built) : "New Piece";
}

function shadeRank(colour: string | null) {
  const i = SHADE_ORDER.indexOf(colour ?? "");
  return i === -1 ? 99 : i;
}

function byShade(a: Item, b: Item) {
  return shadeRank(a.colour) - shadeRank(b.colour) || displayName(a).localeCompare(displayName(b));
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
    ...COLOURS.map((c) => [c.toLowerCase(), c] as [string, string]),
    ...Object.entries(COLOUR_WORDS),
  ];
  const hits = candidates
    .map(([word, colour]) => ({
      colour,
      word,
      i: lower.search(new RegExp(`(^|[^a-z])${word}([^a-z]|$)`)),
    }))
    .filter(({ word, i }) => i >= 0 && !new RegExp(`\\bnot\\s+${word}([^a-z]|$)`).test(lower))
    .sort((a, b) => a.i - b.i);
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

  const extras = [
    current.accent_colour ? `${current.accent_colour.toLowerCase()} accents` : null,
    ...(current.details ?? []).map((d) => d.toLowerCase()),
  ].filter(Boolean);

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
        },
      })) ?? {};

    const lower = words.toLowerCase();
    const typeChanged =
      !!fix.type &&
      fix.type.toLowerCase() !== (current.type ?? "").toLowerCase() &&
      lower.includes(fix.type.toLowerCase());

    const type = typeChanged ? titleCase(fix.type!) : current.type ? titleCase(current.type) : null;
    const colour = colourFromText(words) ?? fix.colour ?? current.colour;
    const details = fix.details ?? current.details ?? [];

    const built = buildName({ words, previousName: current.name, colour, type, details });

    const lastTypeWord = (type ?? "").toLowerCase().split(" ").pop() ?? "";
    const aiNameOk =
      !!fix.name &&
      (!lastTypeWord || fix.name.toLowerCase().includes(lastTypeWord)) &&
      (!colour || fix.name.toLowerCase().includes(colour.toLowerCase())) &&
      wordCount(fix.name) >= wordCount(built);
    const name = aiNameOk ? titleCase(fix.name!) : built;

    const style = normalizeStyle({
      category: typeChanged ? fix.category ?? current.category : current.category,
      type,
      name,
      details,
    });

    const description =
      fix.description && (!lastTypeWord || fix.description.toLowerCase().includes(lastTypeWord))
        ? fix.description
        : words;

    const changes = {
      name,
      type,
      colour,
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#F5F0E6]">
      <div className="mx-auto flex max-w-md flex-col gap-6 px-6 pb-16 pt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl">Edit Piece</h2>
          <button onClick={onClose} className="text-sm font-semibold text-[#1F2A44]">
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

        <div
          key={`${current.name}-${current.colour}-${current.description}`}
          className="fade-in flex flex-col gap-1 rounded-2xl border border-[#E3DACB] bg-[#FBF8F2] p-4"
        >
          <span className="text-xs tracking-[0.2em] text-[#8A8476]">IDENTIFIED AS</span>
          <span className="text-lg font-semibold">{displayName(current)}</span>
          {extras.length > 0 && <span className="text-sm text-[#5C5648]">With {extras.join(", ")}.</span>}
          {current.description && <span className="text-sm text-[#5C5648]">{current.description}</span>}
          {current.looks && current.looks.length > 0 && (
            <span className="text-sm text-[#5C5648]">Best for {current.looks.join(", ")}.</span>
          )}
          {updated && <span className="fade-in pt-1 text-sm font-semibold text-[#1F2A44]">Updated.</span>}
        </div>

        <button
          role="switch"
          aria-checked={current.at_washman}
          onClick={toggleWashman}
          className="flex items-center justify-between gap-4 rounded-2xl border border-[#E3DACB] bg-[#FBF8F2] p-4 text-left"
        >
          <span className="flex flex-col">
            <span className="font-semibold">At the Washman</span>
            <span className="text-sm text-[#5C5648]">Crowned won&apos;t style this until it&apos;s back.</span>
          </span>
          <span
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
              current.at_washman ? "bg-[#1F2A44]" : "bg-[#D9D1C3]"
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
          <span className="text-sm text-[#5C5648]">
            Describe the piece in your own words. Colour, logo, fabric, anything.
          </span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            disabled={saving}
            placeholder="Blue leather jacket. Small white logo on the chest."
            className="rounded-xl border border-[#E3DACB] bg-white px-4 py-3"
          />
        </label>

        {error && <p className="text-sm text-red-700">{error}</p>}

        <button
          onClick={update}
          disabled={saving}
          className="rounded-full bg-[#1F2A44] py-4 font-semibold text-[#F5F0E6] transition-opacity disabled:opacity-60"
        >
          {saving ? "Updating…" : "Update"}
        </button>

        <div className="flex flex-col items-center gap-1">
          <button onClick={remove} disabled={saving} className="py-2 text-sm font-semibold text-red-700">
            {confirmRemove ? "Remove" : "Remove from Wardrobe"}
          </button>
          {confirmRemove && <span className="text-xs text-[#8A8476]">This can&apos;t be undone.</span>}
        </div>
      </div>
    </div>
  );
}

function PieceCard({ item, onOpen }: { item: Item; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="fade-in relative flex flex-col gap-1 text-left transition-transform active:scale-[0.98]"
    >
      <div className="relative overflow-hidden rounded-xl">
        {item.url && (
          <img
            src={item.url}
            alt={item.description ?? displayName(item)}
            className={`aspect-[3/4] w-full object-cover ${item.at_washman ? "opacity-40 grayscale" : ""}`}
          />
        )}
        {item.needs_check && !item.at_washman && (
          <span className="absolute left-2 top-2 rounded-full bg-[#B08D57] px-2 py-1 text-xs font-semibold text-[#1F2A44]">
            Review
          </span>
        )}
        {item.at_washman && (
          <span className="absolute bottom-2 left-2 rounded-full bg-[#1F2A44] px-2 py-1 text-xs font-semibold text-[#F5F0E6]">
            At the Washman
          </span>
        )}
      </div>
      <span className={`text-sm font-semibold ${item.at_washman ? "text-[#8A8476]" : ""}`}>
        {displayName(item)}
      </span>
      {item.looks && item.looks.length > 0 && (
        <span className="text-xs text-[#8A8476]">Best for {item.looks.join(", ")}</span>
      )}
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

  function tidyStyles(list: Item[]) {
    const supabase = createClient();
    for (const item of list) {
      if (!item.type && !item.name) continue;
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
        "id, photo_path, photo_hash, name, category, type, colour, accent_colour, details, description, looks, needs_check, at_washman"
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Wardrobe load failed:", error);
      setNotice("Couldn't load your wardrobe. Refresh to try again.");
      setLoading(false);
      return;
    }

    const list: Item[] = (data ?? []).map((i) => ({ ...i, at_washman: !!i.at_washman }));
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

    const { error } = await supabase.from("items").insert({
      photo_path: path,
      photo_hash: hash,
      name,
      type,
      category: style.category,
      colour,
      looks: style.looks,
      needs_check: !tags || !tags.confident,
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
  const status = readiness(items);

  const sections = [
    ...SECTIONS.map((s) => ({
      ...s,
      pieces: items.filter((i) => i.category === s.key).sort(byShade),
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
    <main className="flex flex-col gap-6 px-6 py-12">
      <style>{`
        .shimmer {
          background: linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.45) 50%, transparent 70%);
          background-size: 250% 100%;
          animation: shimmer 1.4s ease-in-out infinite;
        }
        @keyframes shimmer { from { background-position: 150% 0 } to { background-position: -100% 0 } }
        .fade-in { animation: fadeIn 0.5s ease-out both }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
        .no-scrollbar::-webkit-scrollbar { display: none }
        .no-scrollbar { scrollbar-width: none }
        @media (prefers-reduced-motion: reduce) { .shimmer, .fade-in { animation: none } }
      `}</style>

      {editing && (
        <Editor item={editing} onClose={() => setEditing(null)} onChanged={() => load()} />
      )}

      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm tracking-[0.3em] text-[#B08D57]">WARDROBE</p>
          <h1 className="text-4xl">Your pieces.</h1>
        </div>
        <span className="text-sm text-[#5C5648]">{total} {total === 1 ? "piece" : "pieces"}</span>
      </div>

      {!loading && (
        status.ok ? (
          <Link
            href="/style"
            className="flex items-center justify-between rounded-2xl border border-[#E3DACB] bg-[#FBF8F2] p-4"
          >
            <span className="text-sm">Your wardrobe is ready to style.</span>
            <span className="text-sm font-semibold text-[#1F2A44]">Style Me ›</span>
          </Link>
        ) : (
          <div className="rounded-2xl border border-[#E3DACB] bg-[#FBF8F2] p-4 text-sm">
            Add {listJoin(status.missing)} to get your first outfit.
          </div>
        )
      )}

      <div className="flex flex-col gap-2">
        <label className="cursor-pointer rounded-full bg-[#1F2A44] py-4 text-center font-semibold text-[#F5F0E6] transition-transform active:scale-[0.98]">
          Add Photos
          <input type="file" accept="image/*" multiple className="hidden" onChange={addPhotos} />
        </label>
        <p className="text-center text-sm text-[#8A8476]">
          One piece per photo, on a plain background.
        </p>
      </div>

      {notice && <p className="fade-in text-center text-sm text-[#5C5648]">{notice}</p>}

      {review.length > 0 && filter !== "review" && (
        <button
          onClick={() => setFilter("review")}
          className="flex items-center justify-between rounded-2xl bg-[#B08D57]/15 p-4 text-left"
        >
          <span className="text-sm font-semibold text-[#1F2A44]">
            {review.length === 1 ? "1 piece needs a quick look" : `${review.length} pieces need a quick look`}
          </span>
          <span className="text-[#1F2A44]">›</span>
        </button>
      )}

      {!loading && sections.length > 0 && (
        <div className="no-scrollbar sticky top-0 z-10 -mx-6 flex gap-2 overflow-x-auto bg-[#F5F0E6]/90 px-6 py-2 backdrop-blur">
          {[
            { key: "all", label: "All", count: items.length },
            ...sections.map((s) => ({ key: s.key, label: s.label, count: s.pieces.length })),
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-colors ${
                filter === f.key
                  ? "border-[#1F2A44] bg-[#1F2A44] text-[#F5F0E6]"
                  : "border-[#E3DACB] bg-[#FBF8F2] text-[#1F2A44]"
              }`}
            >
              {f.label} <span className="opacity-60">{f.count}</span>
            </button>
          ))}
        </div>
      )}

      {pending.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {pending.map((p) => (
            <div key={p.key} className="flex flex-col gap-2">
              <div className="relative overflow-hidden rounded-xl">
                <img src={p.preview} alt="New piece" className="aspect-[3/4] w-full object-cover" />
                <div className="shimmer absolute inset-0" />
              </div>
              <div className="h-3 w-2/3 rounded-full bg-[#E3DACB] shimmer" />
              <div className="h-2 w-1/3 rounded-full bg-[#E3DACB] shimmer" />
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="aspect-[3/4] w-full rounded-xl bg-[#E9E1D2] shimmer" />
          ))}
        </div>
      ) : total === 0 ? (
        <p className="text-center text-[#8A8476]">
          Your wardrobe is empty. Start with the pieces you wear most.
        </p>
      ) : (
        <div className="flex flex-col gap-8">
          {filter === "review" && (
            <button onClick={() => setFilter("all")} className="self-start text-sm font-semibold text-[#1F2A44]">
              ‹ All pieces
            </button>
          )}
          {visible.map((section) => (
            <section key={section.key} className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between">
                <h2 className="text-2xl">{section.label}</h2>
                <span className="text-sm text-[#8A8476]">{section.pieces.length}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {section.pieces.map((item) => (
                  <PieceCard key={item.id} item={item} onOpen={() => setEditing(item)} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}