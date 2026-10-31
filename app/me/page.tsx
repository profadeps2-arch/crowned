"use client";

import { useEffect, useState, type ChangeEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const BUILDS = ["Slim", "Athletic", "Average", "Broad", "Big frame"];
const TOP_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
const WAISTS = ["28", "29", "30", "31", "32", "33", "34", "36", "38", "40", "42", "44"];
const SHOES = ["38", "39", "40", "41", "42", "43", "44", "45", "46", "47", "48"];

type Profile = {
  name: string | null;
  height_cm: number | null;
  body_type: string | null;
  avatar_path: string | null;
  top_size: string | null;
  waist_size: string | null;
  shoe_size: string | null;
};

const EMPTY: Profile = {
  name: null,
  height_cm: null,
  body_type: null,
  avatar_path: null,
  top_size: null,
  waist_size: null,
  shoe_size: null,
};

function splitHeight(cm: number) {
  const totalIn = Math.round(cm / 2.54);
  return { feet: Math.floor(totalIn / 12), inches: totalIn % 12 };
}

function heightLabel(cm: number | null) {
  if (!cm) return "Add";
  const { feet, inches } = splitHeight(cm);
  return `${feet} ft ${inches} in · ${cm} cm`;
}

function toJpeg(img: ImageBitmap, max: number, quality: number): Promise<Blob> {
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), "image/jpeg", quality));
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="px-1 text-xs tracking-[0.2em] text-[#6E6A66]">{title}</h2>
      <div className="divide-y divide-[#EFE8DC] overflow-hidden rounded-2xl border border-[#E9E4DE] bg-[#FFFFFF]">
        {children}
      </div>
    </section>
  );
}

function Row({
  label, value, open, onClick,
}: {
  label: string;
  value: string;
  open?: boolean;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left">
      <span className="font-medium text-[#1F2A44]">{label}</span>
      <span className="flex items-center gap-2 text-sm text-[#6E6A66]">
        {value}
        <span className={`text-[#6E6A66] transition-transform ${open ? "rotate-90" : ""}`}>›</span>
      </span>
    </button>
  );
}

function Chips({
  options, value, onPick,
}: {
  options: string[];
  value: string | null;
  onPick: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 px-4 pb-4">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onPick(o)}
          className={`rounded-full border px-4 py-2 text-sm ${
            value === o
              ? "border-[#1F2A44] bg-[#1F2A44] text-[#FDFAF6]"
              : "border-[#E9E4DE] bg-white text-[#1F2A44]"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

export default function MePage() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [since, setSince] = useState("");
  const [googlePhoto, setGooglePhoto] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile>(EMPTY);
  const [pieces, setPieces] = useState(0);
  const [washman, setWashman] = useState(0);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [feet, setFeet] = useState(5);
  const [inches, setInches] = useState(9);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const cm = Math.round((feet * 12 + inches) * 2.54);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }
      setUid(user.id);
      setEmail(user.email ?? "");
      setSince(
        new Date(user.created_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
      );
      setGooglePhoto(user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null);

      const { data: p } = await supabase
        .from("profiles")
        .select("name, height_cm, body_type, avatar_path, top_size, waist_size, shoe_size")
        .eq("id", user.id)
        .maybeSingle();

      const prof: Profile = { ...EMPTY, ...(p ?? {}) };
      setProfile(prof);
      setNameDraft(prof.name ?? "");
      if (prof.height_cm) {
        const h = splitHeight(prof.height_cm);
        setFeet(h.feet);
        setInches(h.inches);
      }

      if (prof.avatar_path) {
        const { data: signed } = await supabase.storage
          .from("wardrobe")
          .createSignedUrl(prof.avatar_path, 3600);
        setAvatarUrl(signed?.signedUrl ?? null);
      }

      const { count } = await supabase.from("items").select("id", { count: "exact", head: true });
      const { count: wash } = await supabase
        .from("items")
        .select("id", { count: "exact", head: true })
        .eq("at_washman", true);
      setPieces(count ?? 0);
      setWashman(wash ?? 0);
      setLoading(false);
    }
    load();
  }, [router]);

  function toggle(key: string) {
    setMessage("");
    setOpen((o) => (o === key ? null : key));
  }

  async function save(fields: Partial<Profile>) {
    if (!uid) return;
    setBusy(true);
    setMessage("");
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: uid, ...fields, updated_at: new Date().toISOString() });

    if (error) {
      console.error("Profile save failed:", error);
      setMessage("Couldn't save. Try again.");
      setBusy(false);
      return;
    }

    setProfile((p) => ({ ...p, ...fields }));
    setOpen(null);

    if ("top_size" in fields || "waist_size" in fields || "shoe_size" in fields) {
      const { data: n } = await supabase.rpc("apply_usual_sizes_to_existing");
      if (typeof n === "number" && n > 0) {
        setMessage(`Added your size to ${n} ${n === 1 ? "piece" : "pieces"}.`);
      } else {
        setMessage("Saved. New pieces will use this size.");
      }
    }
    setBusy(false);
  }

  async function changePhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !uid) return;
    setBusy(true);
    setMessage("");
    setOpen(null);

    try {
      const supabase = createClient();
      const img = await createImageBitmap(file);
      const blob = await toJpeg(img, 512, 0.85);
      const path = `${uid}/avatar-${Date.now()}.jpg`;

      const { error: upErr } = await supabase.storage
        .from("wardrobe")
        .upload(path, blob, { contentType: "image/jpeg" });
      if (upErr) throw upErr;

      const old = profile.avatar_path;
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: uid, avatar_path: path, updated_at: new Date().toISOString() });
      if (error) throw error;

      if (old) await supabase.storage.from("wardrobe").remove([old]);

      const { data: signed } = await supabase.storage.from("wardrobe").createSignedUrl(path, 3600);
      setAvatarUrl(signed?.signedUrl ?? null);
      setProfile((p) => ({ ...p, avatar_path: path }));
      setMessage("Photo updated.");
    } catch (err) {
      console.error("Photo change failed:", err);
      setMessage("Couldn't update your photo. Try again.");
    }
    setBusy(false);
  }

  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/");
  }

  async function deleteAccount() {
    setBusy(true);
    setMessage("");
    const res = await fetch("/api/account/delete", { method: "POST" });
    if (!res.ok) {
      setMessage("Couldn't delete your account. Try again.");
      setBusy(false);
      return;
    }
    await createClient().auth.signOut();
    router.replace("/");
  }

  const photo = avatarUrl ?? googlePhoto;
  const initial = (profile.name ?? "").charAt(0).toUpperCase();

  if (loading) {
    return (
      <main className="flex flex-col items-center gap-4 px-6 py-16">
        <div className="h-24 w-24 animate-pulse rounded-full bg-[#F7ECE1]" />
        <div className="h-5 w-40 animate-pulse rounded-full bg-[#F7ECE1]" />
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-8 px-6 pb-16 pt-10">
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="text-sm font-semibold text-[#1F2A44]">
          ‹ Back
        </button>
      </div>

      <div className="flex flex-col items-center gap-3 text-center">
        <div className="h-24 w-24 overflow-hidden rounded-full border border-[#E9E4DE] bg-[#1F2A44]">
          {photo ? (
            <img src={photo} alt="Your photo" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-4xl font-semibold text-[#FDFAF6]">
              {initial}
            </span>
          )}
        </div>
        <button onClick={() => toggle("photo")} className="text-sm font-semibold text-[#1F2A44]">
          {busy && open === null && message === "" ? "Updating…" : "Change Photo"}
        </button>
        {open === "photo" && (
          <div className="flex w-full max-w-xs flex-col gap-2">
            <label className="cursor-pointer rounded-full bg-[#1F2A44] py-3 text-sm font-semibold text-[#FDFAF6]">
              Take Photo
              <input type="file" accept="image/*" capture="user" className="hidden" onChange={changePhoto} />
            </label>
            <label className="cursor-pointer rounded-full border border-[#1F2A44] py-3 text-sm font-semibold text-[#1F2A44]">
              Choose from Library
              <input type="file" accept="image/*" className="hidden" onChange={changePhoto} />
            </label>
          </div>
        )}
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl">King {profile.name ?? ""}</h1>
          <span className="text-sm text-[#6E6A66]">{email}</span>
          <span className="text-xs text-[#6E6A66]">Member since {since}</span>
        </div>
      </div>

      {message && <p className="fade-in text-center text-sm text-[#1F2A44]">{message}</p>}

      <Section title="YOUR FIT">
        <div>
          <Row label="Name" value={profile.name ?? "Add"} open={open === "name"} onClick={() => toggle("name")} />
          {open === "name" && (
            <div className="flex gap-2 px-4 pb-4">
              <input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                className="min-w-0 flex-1 rounded-xl border border-[#E9E4DE] bg-white px-3 py-2"
              />
              <button
                onClick={() => nameDraft.trim().length >= 2 && save({ name: nameDraft.trim() })}
                disabled={busy || nameDraft.trim().length < 2}
                className="rounded-full bg-[#1F2A44] px-4 text-sm font-semibold text-[#FDFAF6] disabled:opacity-40"
              >
                Save
              </button>
            </div>
          )}
        </div>

        <div>
          <Row label="Height" value={heightLabel(profile.height_cm)} open={open === "height"} onClick={() => toggle("height")} />
          {open === "height" && (
            <div className="flex flex-wrap items-center gap-2 px-4 pb-4">
              <select
                value={feet}
                onChange={(e) => setFeet(Number(e.target.value))}
                className="rounded-xl border border-[#E9E4DE] bg-white px-3 py-2"
              >
                {[4, 5, 6, 7].map((f) => (
                  <option key={f} value={f}>{f} ft</option>
                ))}
              </select>
              <select
                value={inches}
                onChange={(e) => setInches(Number(e.target.value))}
                className="rounded-xl border border-[#E9E4DE] bg-white px-3 py-2"
              >
                {Array.from({ length: 12 }, (_, i) => i).map((i) => (
                  <option key={i} value={i}>{i} in</option>
                ))}
              </select>
              <span className="text-sm text-[#6E6A66]">= {cm} cm</span>
              <button
                onClick={() => save({ height_cm: cm })}
                disabled={busy}
                className="ml-auto rounded-full bg-[#1F2A44] px-4 py-2 text-sm font-semibold text-[#FDFAF6] disabled:opacity-40"
              >
                Save
              </button>
            </div>
          )}
        </div>

        <div>
          <Row label="Build" value={profile.body_type ?? "Add"} open={open === "build"} onClick={() => toggle("build")} />
          {open === "build" && (
            <Chips options={BUILDS} value={profile.body_type} onPick={(v) => save({ body_type: v })} />
          )}
        </div>
      </Section>

      <Section title="YOUR USUAL SIZES">
        <div>
          <Row label="Tops" value={profile.top_size ?? "Add"} open={open === "top"} onClick={() => toggle("top")} />
          {open === "top" && (
            <Chips options={TOP_SIZES} value={profile.top_size} onPick={(v) => save({ top_size: v })} />
          )}
        </div>
        <div>
          <Row
            label="Trouser Waist"
            value={profile.waist_size ? `${profile.waist_size} in` : "Add"}
            open={open === "waist"}
            onClick={() => toggle("waist")}
          />
          {open === "waist" && (
            <Chips options={WAISTS} value={profile.waist_size} onPick={(v) => save({ waist_size: v })} />
          )}
        </div>
        <div>
          <Row
            label="Shoes"
            value={profile.shoe_size ? `EU ${profile.shoe_size}` : "Add"}
            open={open === "shoe"}
            onClick={() => toggle("shoe")}
          />
          {open === "shoe" && (
            <Chips options={SHOES} value={profile.shoe_size} onPick={(v) => save({ shoe_size: v })} />
          )}
        </div>
      </Section>

      <Section title="WARDROBE">
        <Link href="/wardrobe" className="flex items-center justify-between px-4 py-4">
          <span className="font-medium text-[#1F2A44]">
            {pieces} {pieces === 1 ? "piece" : "pieces"}
          </span>
          <span className="flex items-center gap-2 text-sm text-[#6E6A66]">
            {washman > 0 && `${washman} at the Washman`}
            <span className="text-[#6E6A66]">›</span>
          </span>
        </Link>
      </Section>

      <Section title="ACCOUNT">
        <button onClick={signOut} className="w-full px-4 py-4 text-left font-medium text-[#1F2A44]">
          Sign Out
        </button>
        <div>
          <button
            onClick={() => setConfirmDelete((c) => !c)}
            className="w-full px-4 py-4 text-left font-medium text-red-700"
          >
            Delete Account
          </button>
          {confirmDelete && (
            <div className="flex flex-col gap-3 px-4 pb-4">
              <p className="text-sm text-[#6E6A66]">
                This permanently deletes your wardrobe, photos and profile. It can&apos;t be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={deleteAccount}
                  disabled={busy}
                  className="flex-1 rounded-full bg-red-700 py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {busy ? "Deleting…" : "Delete My Account"}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  disabled={busy}
                  className="rounded-full border border-[#E9E4DE] px-4 text-sm font-semibold text-[#1F2A44]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </Section>
    </main>
  );
}