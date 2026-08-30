import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AlunosClient } from "./AlunosClient";

export default async function AdminAlunosPage() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", userData.user.id).single();
  if (!profile?.is_admin) redirect("/dashboard");

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, full_name, nickname, status, plan, plan_expires_at, created_at")
    .order("created_at", { ascending: false });

  return <AlunosClient initialProfiles={profiles ?? []} />;
}
