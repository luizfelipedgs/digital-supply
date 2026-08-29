import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";

const PLAN_LABEL: Record<string, string> = { mensal: "Mensal", trimestral: "Trimestral", anual: "Anual" };

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("status, full_name, plan, is_admin")
    .eq("id", userData.user.id)
    .single();

  if (!profile || profile.status === "pending") redirect("/aguardando");
  if (profile.status !== "active") redirect("/login");

  const firstName = (profile.full_name ?? "aluno").split(" ")[0];

  const sections = [
    {
      href: "/dashboard/faturamento",
      icon: "💰",
      title: "Faturamento",
      description: "Lance seus ganhos por plataforma e acompanhe sua evolução com gráficos e comparativos.",
    },
    {
      href: "/dashboard/produtividade",
      icon: "🎯",
      title: "Anotações, tarefas e metas",
      description: "Organize sua rotina diária, defina metas de performance e guarde ideias e anotações.",
    },
    {
      href: "/dashboard/conteudos",
      icon: "📚",
      title: "Conteúdos",
      description: "Aulas em texto, áudio e vídeo, organizadas por módulo, com acompanhamento de progresso.",
    },
  ];

  return (
    <div className="min-h-screen bg-ink-900 p-6 sm:p-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-brand/10 flex items-center justify-center">
              <Logo size={24} className="text-brand" />
            </div>
            <div>
              <div className="text-neutral-100 font-medium">Olá, {firstName}</div>
              <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                Plano {PLAN_LABEL[profile.plan ?? ""] ?? profile.plan} · ativo
              </div>
            </div>
          </div>
          {profile.is_admin && (
            <Link href="/dashboard/admin/conteudos" className="dgs-btn-ghost no-underline">
              Painel admin
            </Link>
          )}
        </div>

        <div className="mb-8">
          <div className="text-neutral-100 text-lg font-medium mb-1">Bem-vindo de volta</div>
          <div className="text-neutral-500 text-sm">Escolha uma área pra continuar.</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {sections.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="dgs-card dgs-hover-card no-underline flex flex-col gap-4"
            >
              <div className="w-11 h-11 rounded-xl bg-brand/10 flex items-center justify-center text-xl">
                {s.icon}
              </div>
              <div>
                <div className="text-neutral-100 font-medium mb-1.5">{s.title}</div>
                <div className="text-neutral-500 text-sm leading-relaxed">{s.description}</div>
              </div>
              <div className="text-brand text-xs mt-auto pt-1">Acessar →</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
