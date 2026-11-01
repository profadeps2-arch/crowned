"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Crown from "../components/Crown";

export default function ResetPassword() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return setError("Use at least 8 characters.");
    setBusy(true);
    const { error } = await createClient().auth.updateUser({ password });
    if (error) {
      setBusy(false);
      return setError("That link may have expired. Request a new one from the log in screen.");
    }
    router.push("/today");
  }

  return (
    <main className="flex min-h-dvh flex-col gap-8 px-6 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[calc(3rem+env(safe-area-inset-top))]">
      <div className="flex flex-col gap-3">
        <Crown size={28} className="text-navy" strokeWidth={1.5} />
        <h1 className="text-[28px] font-semibold leading-[1.1] tracking-[-0.025em] text-navy">Choose a new password</h1>
        <p className="text-[15px] leading-snug text-muted">Use at least 8 characters.</p>
      </div>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password"
          autoComplete="new-password"
          className="field"
        />
        {error && <p role="alert" className="text-[14px] text-danger">{error}</p>}
        <button type="submit" disabled={busy} className="btn btn-orange mt-2">
          {busy ? "One moment" : "Save password"}
        </button>
      </form>
    </main>
  );
}
