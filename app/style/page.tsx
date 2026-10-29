"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const occasions = [
  "Owambe", "Church", "Office", "Friday wear", "Aso ebi", "Date night",
  "Traditional wedding", "White wedding", "Interview", "Hangout", "Travel",
];

function greetingFor(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function StylePage() {
  const [hello, setHello] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    setHello(greetingFor(new Date().getHours()));
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", data.user.id)
        .maybeSingle();
      setName(profile?.name ?? (data.user.user_metadata?.full_name ?? "").split(" ")[0]);
    });
  }, []);

  return (
    <main className="flex flex-col gap-6 px-6 py-12">
      <div className="flex flex-col gap-2 pr-14">
        <p className="min-h-5 text-sm text-[#5C5648]">
          {hello && `${hello}${name ? `, King ${name}` : ""}.`}
        </p>
        <p className="text-sm tracking-[0.3em] text-[#B08D57]">STYLE ME</p>
        <h1 className="text-4xl leading-tight">Where will you be seen today?</h1>
      </div>

      <div className="flex flex-wrap gap-3">
        {occasions.map((o) => (
          <button
            key={o}
            className="rounded-full border border-[#E3DACB] bg-[#FBF8F2] px-5 py-3 text-[#1F2A44]"
          >
            {o}
          </button>
        ))}
      </div>
    </main>
  );
}