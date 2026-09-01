import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GrupoAdminClient } from "./GrupoAdminClient";

export default async function AdminGrupoPage() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", userData.user.id).single();
  if (!profile?.is_admin) redirect("/dashboard");

  const { data: settings } = await supabase
    .from("grupo_settings")
    .select("group_link, title, description")
    .eq("id", "main")
    .maybeSingle();

  const { data: regras } = await supabase
    .from("grupo_regras")
    .select("id, text, order_index")
    .order("order_index", { ascending: true });

  return (
    <GrupoAdminClient
      initialLink={settings?.group_link ?? ""}
      initialTitle={settings?.title ?? "Grupo exclusivo DGS PRO"}
      initialDescription={
        settings?.description ??
        "Entre para acompanhar as orientações da comunidade, tirar dúvidas e ficar por dentro das oportunidades e estratégias que serão compartilhadas ao longo da sua jornada. Leia as regras abaixo antes de entrar."
      }
      initialRegras={regras ?? []}
    />
  );
}
