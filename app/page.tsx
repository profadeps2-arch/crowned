import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Welcome from "./components/Welcome";

export const instant = false;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/today");

  const { error } = await searchParams;

  return <Welcome failed={error === "signin"} />;
}
