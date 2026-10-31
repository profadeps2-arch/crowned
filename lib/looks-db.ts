import { createClient } from "@/lib/supabase/client";
import { piecesOf, type Look } from "@/lib/outfits";

/** Saves a look. Returns an error message, or null on success. Saving twice is fine. */
export async function saveLook(look: Look, occasion: string): Promise<string | null> {
  const { error } = await createClient().from("saved_looks").insert({
    occasion,
    tier: look.tier,
    title: look.title,
    item_ids: piecesOf(look).map((p) => p.id).sort(),
  });
  if (error && error.code !== "23505") {
    console.error("Save failed:", error);
    return "We could not save this look. Please try again.";
  }
  return null;
}

/** Marks pieces as worn today and records it in History. Returns an error message, or null on success. */
export async function wearItems(
  ids: string[],
  meta: { title: string; occasion: string; tier?: string | null }
): Promise<string | null> {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { error } = await supabase.from("items").update({ last_worn: today }).in("id", ids);
  if (error) {
    console.error("Wear update failed:", error);
    return "We could not save that. Please try again.";
  }
  // History is a bonus. If its table is not set up yet, wearing still works.
  const { error: hist } = await supabase.from("worn_looks").insert({
    occasion: meta.occasion,
    tier: meta.tier ?? null,
    title: meta.title,
    item_ids: ids,
    worn_on: today,
  });
  if (hist) console.warn("History not recorded:", hist.message);
  return null;
}

export function wearLook(look: Look, occasion: string): Promise<string | null> {
  const ids = [...piecesOf(look), ...(look.scent ? [look.scent] : [])].map((p) => p.id);
  return wearItems(ids, { title: look.title, occasion, tier: look.tier });
}
