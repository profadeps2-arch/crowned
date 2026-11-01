"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Crown from "./Crown";
import GoogleButton from "./GoogleButton";
import AppleButton from "./AppleButton";

type Mode = "signup" | "login" | "forgot";

function friendly(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "That email and password do not match.";
  if (m.includes("already registered")) return "That email already has an account. Log in instead.";
  if (m.includes("email not confirmed")) return "Confirm your email first. Check your inbox.";
  if (m.includes("rate limit") || m.includes("too many")) return "Too many tries. Wait a minute and try again.";
  return "Something went wrong. Please try again.";
}

export default function AuthForm({ failed = false }: { failed?: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(failed ? "We could not sign you in. Please try again." : "");
  const [notice, setNotice] = useState("");

  function switchTo(next: Mode) {
    setMode(next);
    setError("");
    setNotice("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    const mail = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(mail)) return setError("Enter a valid email address.");
    if (mode === "signup" && name.trim().length < 2) return setError("Tell us your name.");
    if (mode !== "forgot" && password.length < 8) return setError("Use at least 8 characters for your password.");

    setBusy(true);
    const supabase = createClient();

    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(mail, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });
      setBusy(false);
      if (error) return setError(friendly(error.message));
      return setNotice("If that email has an account, a reset link is on its way.");
    }

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email: mail,
        password,
        options: {
          data: { full_name: name.trim() },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      setBusy(false);
      if (error) return setError(friendly(error.message));
      if (data.session) return router.push("/profile");
      return setNotice("Check your email to confirm your account, then log in.");
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email: mail, password });
    if (error || !data.user) {
      setBusy(false);
      return setError(friendly(error?.message ?? ""));
    }
    const { data: profile } = await supabase.from("profiles").select("id").eq("id", data.user.id).maybeSingle();
    router.push(profile ? "/today" : "/profile");
  }

  const title = mode === "signup" ? "Create your account" : mode === "login" ? "Welcome back" : "Reset your password";
  const sub =
    mode === "signup"
      ? "Join Crowned and get styled from your own wardrobe."
      : mode === "login"
        ? "Log in to see your wardrobe and today's outfit."
        : "Enter your email and we will send you a link.";
  const action = mode === "signup" ? "Sign up" : mode === "login" ? "Log in" : "Send link";

  return (
    <main className="flex min-h-dvh flex-col gap-8 px-6 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[calc(3rem+env(safe-area-inset-top))]">
      <div className="flex flex-col gap-3">
        <Crown size={28} className="text-navy" strokeWidth={1.5} />
        <h1 className="text-[28px] font-semibold leading-[1.1] tracking-[-0.025em] text-navy">{title}</h1>
        <p className="text-[15px] leading-snug text-muted">{sub}</p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
        {mode === "signup" && (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            autoComplete="name"
            className="field"
          />
        )}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          autoComplete="email"
          inputMode="email"
          className="field"
        />
        {mode !== "forgot" && (
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              className="field w-full !pr-12"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted"
            >
              {show ? <EyeOff size={20} aria-hidden /> : <Eye size={20} aria-hidden />}
            </button>
          </div>
        )}

        {mode === "login" && (
          <button type="button" onClick={() => switchTo("forgot")} className="self-end text-[14px] font-medium text-navy">
            Forgot password?
          </button>
        )}

        {error && <p role="alert" className="text-[14px] text-danger">{error}</p>}
        {notice && <p role="status" className="text-[14px] text-muted">{notice}</p>}

        <button type="submit" disabled={busy} className="btn btn-orange mt-2">
          {busy ? "One moment" : action}
        </button>
      </form>

      {mode !== "forgot" && (
        <div className="flex flex-col gap-5">
          <p className="text-center text-[14px] text-muted">or continue with</p>
          <div className="flex flex-col gap-3">
            <AppleButton />
            <GoogleButton />
          </div>
        </div>
      )}

      <p className="mt-auto text-center text-[14px] text-muted">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <button onClick={() => switchTo("login")} className="font-semibold text-navy">Log in</button>
          </>
        ) : mode === "login" ? (
          <>
            Do not have an account?{" "}
            <button onClick={() => switchTo("signup")} className="font-semibold text-navy">Sign up</button>
          </>
        ) : (
          <button onClick={() => switchTo("login")} className="font-semibold text-navy">Back to log in</button>
        )}
      </p>
    </main>
  );
}
