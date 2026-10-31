import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : null;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      if (safeNext) return NextResponse.redirect(`${origin}${safeNext}`);
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user!.id)
        .maybeSingle();

      return NextResponse.redirect(`${origin}${profile ? "/today" : "/profile"}`);
    }
  }

  return NextResponse.redirect(`${origin}/?error=signin`);
}
