"use client";

import { createClient } from "@/lib/supabase/client";

export default function GoogleButton() {
  async function signIn() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <button
      onClick={signIn}
      className="w-full rounded-full bg-[#1F2A44] py-4 text-center font-semibold text-[#F5F0E6]"
    >
      Continue with Google
    </button>
  );
}
