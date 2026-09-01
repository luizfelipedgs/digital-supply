import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/DashboardHeader";
import { LineIcon } from "@/components/LineIcon";
import { LegendasClient } from "./LegendasClient";
import { DAILY_VIDEO_LIMIT } from "@/lib/legendas-config";

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
      <div className="max-w-3xl mx-auto">
        <DashboardHeader backHref="/dashboard" />

        <div className="mb-5">
          <h1 className="text-neutral-100 text-xl font-medium">Mestre das Legendas</h1>
          <p className="text-neutral-500 text-sm mt-1">
            Sou o agente responsável por analisar seu vídeo e gerar títulos e descrições completas pro seu post no
            Instagram.
          </p>
        </div>

        <div className="rounded-lg border border-orange-700/30 bg-orange-700/5 px-4 py-3 mb-3 flex items-start gap-2.5">
          <span className="shrink-0 mt-0.5 text-orange-500">
            <LineIcon name="warning" size={14} />
          </span>
          <p className="text-neutral-400 text-xs leading-relaxed">
            Você pode enviar {DAILY_VIDEO_LIMIT} vídeos por dia. Use em vídeo que realmente valha a pena, com
            potencial de viralização. Depois de enviado, pode conversar à vontade em texto pra ajustar o resultado.
          </p>
        </div>

        <p className="text-neutral-600 text-xs leading-relaxed mb-5">
          Observação: o agente analisa apenas frames extraídos automaticamente do vídeo — ele não escuta
          áudio/narração.
        </p>

        <LegendasClient />
      </div>
    </div>
  );
}
