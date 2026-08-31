import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PaginasAdminClient } from "./PaginasAdminClient";

export default async function AdminPaginasPage() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", userData.user.id).single();
  if (!profile?.is_admin) redirect("/dashboard");

  const { data: settings } = await supabase
    .from("paginas_settings")
    .select("tutorial_video_url, description")
    .eq("id", "main")
    .maybeSingle();

  const { data: links } = await supabase
    .from("paginas_links")
    .select("id, category, name, link, description, order_index")
    .order("order_index", { ascending: true });

  return (
    <PaginasAdminClient
      initialTutorialUrl={settings?.tutorial_video_url ?? ""}
      initialDescription={settings?.description ?? ""}
      initialLinks={links ?? []}
    />
  );
}
