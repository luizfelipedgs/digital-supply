import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/DashboardHeader";
import { FaturamentoClient } from "./FaturamentoClient";

export default async function FaturamentoPage() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("status")
    .eq("id", userData.user.id)
    .single();

  if (!profile || profile.status !== "active") redirect("/aguardando");

  return (
    <div className="min-h-screen bg-ink-900 p-6 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <DashboardHeader backHref="/dashboard" />
        <h1 className="text-neutral-100 text-xl font-medium mb-6">Faturamento</h1>
        <FaturamentoClient userId={userData.user.id} />
      </div>
    </div>
  );
}
