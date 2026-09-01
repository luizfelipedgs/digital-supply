import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Logo } from "@/components/Logo";

export default async function GrupoPage() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("status, is_admin")
    .eq("id", userData.user.id)
    .single();

  if (!profile || profile.status !== "active") redirect("/aguardando");

  const { data: settings } = await supabase
    .from("grupo_settings")
    .select("group_link, title, description")
    .eq("id", "main")
    .maybeSingle();

  const { data: regras } = await supabase
    .from("grupo_regras")
    .select("id, text")
    .order("order_index", { ascending: true });

  return (
    <div className="min-h-screen bg-ink-900 p-6 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <DashboardHeader backHref="/dashboard" />

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-neutral-100 text-xl font-medium">Grupo DGS</h1>
          {profile.is_admin && (
            <Link href="/dashboard/admin/grupo" className="text-brand text-sm no-underline">
              + Gerenciar
            </Link>
          )}
        </div>

        {/* Card principal */}
        <div className="dgs-card mb-6 text-center">
          <div className="w-14 h-14 rounded-xl bg-brand/10 flex items-center justify-center mx-auto mb-4">
            <Logo size={30} className="text-brand" />
          </div>
          <div className="text-neutral-100 text-lg font-medium mb-2">
            {settings?.title ?? "Grupo exclusivo DGS PRO"}
          </div>
          <p className="text-neutral-400 text-sm leading-relaxed mb-6 max-w-md mx-auto">
            {settings?.description ??
              "Entre para acompanhar as orientações da comunidade, tirar dúvidas e ficar por dentro das oportunidades e estratégias que serão compartilhadas ao longo da sua jornada. Leia as regras abaixo antes de entrar."}
          </p>
          {settings?.group_link ? (
            <a href={settings.group_link} target="_blank" rel="noreferrer" className="dgs-btn-primary inline-block w-auto px-6 no-underline">
              Entrar no grupo →
            </a>
          ) : (
            <p className="text-neutral-600 text-xs">Link do grupo ainda não configurado.</p>
          )}
        </div>

        {/* Regras */}
        <div className="text-neutral-100 font-medium text-sm mb-3">Regras da comunidade</div>
        <div className="flex flex-col gap-2">
          {(regras ?? []).map((regra, i) => (
            <div key={regra.id} className="dgs-card flex gap-3 !py-3">
              <div className="w-6 h-6 rounded-full bg-brand/10 text-brand text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </div>
              <div className="text-neutral-300 text-sm leading-relaxed">{regra.text}</div>
            </div>
          ))}
          {(!regras || regras.length === 0) && (
            <p className="text-neutral-500 text-sm">Nenhuma regra cadastrada ainda.</p>
          )}
        </div>
      </div>
    </div>
  );
}
