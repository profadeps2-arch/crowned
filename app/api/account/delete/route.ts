import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const admin = createAdminClient();

  try {
    while (true) {
      const { data: files, error } = await admin.storage
        .from("wardrobe")
        .list(user.id, { limit: 100 });
      if (error) throw error;
      if (!files || files.length === 0) break;
      const { error: removeError } = await admin.storage
        .from("wardrobe")
        .remove(files.map((f) => `${user.id}/${f.name}`));
      if (removeError) throw removeError;
    }

    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Account deletion failed:", err);
    return NextResponse.json({ error: "Deletion failed" }, { status: 500 });
  }
}
