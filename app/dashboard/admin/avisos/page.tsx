import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AvisosClient } from "./AvisosClient";

export default async function AdminAvisosPage() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", userData.user.id).single();
  if (!profile?.is_admin) redirect("/dashboard");

  const { data: announcements } = await supabase
    .from("announcements")
    .select("id, title, body, created_at")
    .order("created_at", { ascending: false });

  return <AvisosClient initialAnnouncements={announcements ?? []} userId={userData.user.id} />;
}
