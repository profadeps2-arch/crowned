import { Crown } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import GoogleButton from "./components/GoogleButton";

export const instant = false;

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/style");

  return (
    <main className="flex min-h-screen flex-col justify-between px-6 py-16">
      <div className="flex items-center gap-2 text-[#B08D57]">
        <Crown size={20} />
        <span className="text-sm tracking-[0.3em]">CROWNED</span>
      </div>

      <div className="flex flex-col gap-5">
        <h1 className="text-5xl leading-tight">
          Every man is a king. Dress like one.
        </h1>
        <p className="text-lg text-[#5C5648]">
          Your outfit, sorted in 1 minute. For owambe, office, church and every
          moment in between.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <GoogleButton />
        <p className="text-center text-sm text-[#8A8476]">
          One quick screen, then we style you.
        </p>
      </div>
    </main>
  );
}