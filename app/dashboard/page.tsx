import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("status, full_name, plan")
    .eq("id", userData.user.id)
    .single();

  if (!profile || profile.status === "pending") redirect("/aguardando");
  if (profile.status !== "active") redirect("/login");

  return (
    <div className="min-h-screen bg-ink-900 p-8">
      <div className="flex items-center gap-3 mb-8">
        <Logo size={32} className="text-brand" />
        <div>
          <div className="text-neutral-100 font-medium">Olá, {profile.full_name ?? "aluno"}</div>
          <div className="text-neutral-500 text-xs">Plano {profile.plan} · ativo</div>
        </div>
      </div>
      <div className="text-neutral-500 text-sm mb-4">
        Próximas etapas: dashboard de faturamento, metas e tarefas entram aqui.
      </div>
      <a href="/dashboard/conteudos" className="text-brand text-sm no-underline">
        → Ver conteúdos
      </a>
    </div>
  );
}
