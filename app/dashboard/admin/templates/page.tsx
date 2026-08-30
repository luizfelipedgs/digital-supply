import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TemplatesAdminClient } from "./TemplatesAdminClient";

export default async function AdminTemplatesPage() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", userData.user.id).single();
  if (!profile?.is_admin) redirect("/dashboard");

  const { data: settings } = await supabase
    .from("templates_settings")
    .select("tutorial_video_url, description")
    .eq("id", "main")
    .maybeSingle();

  const { data: templates } = await supabase
    .from("templates")
    .select("id, name, canva_url, description, order_index")
    .order("order_index", { ascending: true });

  return (
    <TemplatesAdminClient
      initialTutorialUrl={settings?.tutorial_video_url ?? ""}
      initialDescription={settings?.description ?? ""}
      initialTemplates={templates ?? []}
    />
  );
}
