import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/DashboardHeader";
import { LegendasClient } from "./LegendasClient";

export default async function LegendasPage() {
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
      <div className="max-w-3xl mx-auto flex flex-col h-[calc(100svh-3rem)] sm:h-[calc(100svh-4rem)]">
        <DashboardHeader backHref="/dashboard" />

        <div className="mb-4">
          <h1 className="text-neutral-100 text-xl font-medium">Mestre das Legendas</h1>
          <p className="text-neutral-500 text-sm mt-1">
            Envie um vídeo (limite de 5 por dia) ou converse em texto — legenda pra revisar, ideia ou pergunta — e
            receba conteúdo pronto pra publicar.
          </p>
        </div>

        <LegendasClient />
      </div>
    </div>
  );
}
