import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { IndiqueAdminClient } from "./IndiqueAdminClient";

export default async function AdminIndiquePage() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", userData.user.id).single();
  if (!profile?.is_admin) redirect("/dashboard");

  const { data: settings } = await supabase
    .from("affiliate_settings")
    .select("affiliate_link, title, commission_headline, commission_note, intro_text")
    .eq("id", "main")
    .maybeSingle();

  return (
    <IndiqueAdminClient
      initialLink={settings?.affiliate_link ?? ""}
      initialTitle={settings?.title ?? "Programa de Afiliados DGS"}
      initialCommissionHeadline={settings?.commission_headline ?? "25% até 40%"}
      initialCommissionNote={
        settings?.commission_note ??
        "Comissão inicial de 25%, podendo chegar até 40% de acordo com o seu desenvolvimento dentro da comunidade."
      }
      initialIntro={
        settings?.intro_text ??
        "Indique novos membros e receba comissão por recorrência a cada assinatura realizada pelo seu link."
      }
    />
  );
}
