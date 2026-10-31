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

/** Marks the pieces as worn today. Returns an error message, or null on success. */
export async function wearLook(look: Look): Promise<string | null> {
  const today = new Date().toISOString().slice(0, 10);
  const ids = [...piecesOf(look), ...(look.scent ? [look.scent] : [])].map((p) => p.id);
  const { error } = await createClient().from("items").update({ last_worn: today }).in("id", ids);
  if (error) {
    console.error("Wear update failed:", error);
    return "We could not save that. Please try again.";
  }
  return null;
}
