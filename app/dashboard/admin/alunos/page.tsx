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

  // Receita real recebida este mês (calendário, fuso de Brasília), a partir
  // dos eventos de pagamento aprovados que o webhook da Cakto já registrou.
  const nowBrasilia = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
  );
  const monthStart = new Date(nowBrasilia.getFullYear(), nowBrasilia.getMonth(), 1).toISOString();

  const { data: monthEvents } = await supabase
    .from("cakto_events")
    .select("raw_payload, event_type, processed")
    .eq("processed", true)
    .gte("received_at", monthStart);

  const grantEvents = ["purchase_approved", "subscription_renewed", "subscription_created"];
  const monthRevenue = (monthEvents ?? [])
    .filter((e) => grantEvents.includes(e.event_type ?? ""))
    .reduce((sum, e: any) => sum + Number(e.raw_payload?.data?.amount ?? 0), 0);

  return <AlunosClient initialProfiles={profiles ?? []} monthRevenue={monthRevenue} />;
}
