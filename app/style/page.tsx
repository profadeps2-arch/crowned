"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const occasions = [
  "Owambe", "Church", "Office", "Friday wear", "Aso ebi", "Date night",
  "Traditional wedding", "White wedding", "Interview", "Hangout", "Travel",
];

export default function StylePage() {
  const router = useRouter();

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (!data.user) router.replace("/");
    });
  }, [router]);

  return (
    <main className="flex flex-col gap-6 px-6 pb-12 pt-6">
      <h1 className="text-4xl leading-tight">Oba, where will you be seen today?</h1>

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