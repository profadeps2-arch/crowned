"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Crown from "../components/Crown";

const bodyTypes = ["Slim", "Athletic", "Average", "Broad", "Big frame"];

export default function ProfilePage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [feet, setFeet] = useState(5);
  const [inches, setInches] = useState(9);
  const [bodyType, setBodyType] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const cm = Math.round((feet * 12 + inches) * 2.54);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/");
        return;
      }
      setUserId(data.user.id);
      const fullName = data.user.user_metadata?.full_name ?? "";
      setName(fullName.split(" ")[0]);
    });
  }, [router]);

  async function handleSave() {
    if (name.trim().length < 2) {
      setError("Please tell us your name.");
      return;
    }
    if (!bodyType) {
      setError("Please pick your build.");
      return;
    }
    setError("");
    setSaving(true);

    const { error } = await createClient().from("profiles").upsert({
      id: userId,
      name: name.trim(),
      height_cm: cm,
      body_type: bodyType,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      setError("Something went wrong. Please try again.");
      setSaving(false);
      return;
    }
    router.push("/today");
  }

  return (
    <main className="flex min-h-dvh flex-col gap-8 px-6 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[calc(3rem+env(safe-area-inset-top))]">
      <div className="flex flex-col gap-3">
        <Crown size={32} className="text-navy" strokeWidth={1.5} />
        <h1 className="large-title">Let us get your fit right, King.</h1>
        <p className="text-[17px] text-muted">This helps us style you properly. It takes 20 seconds.</p>
      </div>

      <label className="flex flex-col gap-2">
        <span className="headline">What should we call you?</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your first name"
          className="field"
        />
      </label>

      <div className="flex flex-col gap-2">
        <span className="headline">How tall are you?</span>
        <div className="flex items-center gap-3">
          <select
            value={feet}
            onChange={(e) => setFeet(Number(e.target.value))}
            className="field"
          >
            {[4, 5, 6, 7].map((f) => (
              <option key={f} value={f}>{f} ft</option>
            ))}
          </select>
          <select
            value={inches}
            onChange={(e) => setInches(Number(e.target.value))}
            className="field"
          >
            {Array.from({ length: 12 }, (_, i) => i).map((i) => (
              <option key={i} value={i}>{i} in</option>
            ))}
          </select>
          <span className="text-muted">= {cm} cm</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="headline">Your build</span>
        <div className="flex flex-wrap gap-2">
          {bodyTypes.map((type) => (
            <button
              key={type}
              onClick={() => setBodyType(type)}
              aria-pressed={bodyType === type}
              className="chip !h-11"
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="subhead text-danger">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="btn btn-orange mt-auto"
      >
        {saving ? "Saving" : "Save and style me"}
      </button>
    </main>
  );
}
