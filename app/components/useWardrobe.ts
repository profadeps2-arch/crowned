"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Piece } from "@/lib/outfits";

/** Loads the signed-in user's wardrobe with photo links, and their first name. */
export function useWardrobe() {
  const router = useRouter();
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/");
        return;
      }

      const [{ data: profile }, { data, error }] = await Promise.all([
        supabase.from("profiles").select("name").eq("id", user.id).maybeSingle(),
        supabase
          .from("items")
          .select("id, photo_path, name, category, type, colour, looks, tags, at_washman, last_worn")
          .order("created_at", { ascending: false }),
      ]);

      const full = (profile?.name ?? user.user_metadata?.full_name ?? "").trim();
      setName(full.split(/\s+/)[0] ?? "");

      if (error) {
        console.error("Wardrobe load failed:", error);
        setError("We could not load your wardrobe. Refresh to try again.");
        setLoading(false);
        return;
      }

      const list: Piece[] = (data ?? []).map((i) => ({ ...i, at_washman: !!i.at_washman }));
      if (list.length > 0) {
        const { data: signed } = await supabase.storage
          .from("wardrobe")
          .createSignedUrls(list.map((i) => i.photo_path), 3600);
        list.forEach((p, i) => (p.url = signed?.[i]?.signedUrl ?? undefined));
      }
      setPieces(list);
      setLoading(false);
    })();
  }, [router]);

  return { pieces, setPieces, name, loading, error };
}
