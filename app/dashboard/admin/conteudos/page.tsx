import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminConteudosClient } from "./AdminConteudosClient";

export default async function AdminConteudosPage() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userData.user.id)
    .single();

  if (!profile?.is_admin) redirect("/dashboard/conteudos");

  const { data: modules } = await supabase
    .from("content_modules")
    .select("id, title, order_index, content_lessons(id, title, content_type, order_index)")
    .order("order_index", { ascending: true });

  return <AdminConteudosClient initialModules={modules ?? []} />;
}
