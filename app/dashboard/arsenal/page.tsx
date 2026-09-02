import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/DashboardHeader";
import { LineIcon } from "@/components/LineIcon";

// Galeria "Arsenal DGS" — agrupa as ferramentas do dia a dia num só lugar,
// pra não deixar o dashboard principal poluído com muitos cards soltos.
const TOOLS = [
  {
    href: "/dashboard/legendas",
    icon: "sparkles",
    title: "Mestre das Legendas",
    description: "Envie um vídeo (até 5 por dia) e receba uma legenda pronta pra publicar, com contexto e headlines.",
  },
  {
    href: "/dashboard/editor-musicas",
    icon: "music",
    title: "Editor de Músicas",
    description: "Envie vários vídeos de uma vez e coloque a mesma música em todos automaticamente — som mudo, música no volume cheio.",
  },
  {
    href: "/dashboard/templates",
    icon: "play",
    title: "Templates Prontos",
    description: "Tenha acesso a mais de 1.000 vídeos no Canva para modelar e utilizar em suas páginas.",
  },
  {
    href: "/dashboard/paginas",
    icon: "search",
    title: "Lista de Páginas",
    description: "Páginas em português e gringas pra buscar vídeos com potencial de viralização.",
  },
  {
    href: "/dashboard/produtividade",
    icon: "target",
    title: "Anotações, tarefas e metas",
    description: "Organize sua rotina diária, defina metas de performance e guarde ideias e anotações.",
  },
  {
    href: "/dashboard/desktop",
    icon: "video",
    title: "Editor de Músicas — Desktop",
    description: "A versão pra instalar no seu computador: sem limite de vídeos e sem créditos, pagamento único.",
  },
];

export default async function ArsenalPage() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("status").eq("id", userData.user.id).single();
  if (!profile || profile.status !== "active") redirect("/aguardando");

  return (
    <div className="min-h-screen bg-ink-900 p-6 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <DashboardHeader backHref="/dashboard" backLabel="Voltar ao painel" />

        <h1 className="text-neutral-100 text-xl font-medium mb-2">Arsenal DGS</h1>
        <p className="text-neutral-500 text-sm mb-8 max-w-2xl">
          As principais ferramentas e recursos para facilitar sua produção, acelerar processos e tornar a operação
          mais eficiente.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TOOLS.map((t) => (
            <Link key={t.href} href={t.href} className="dgs-card dgs-hover-card no-underline flex flex-col gap-4">
              <div className="w-11 h-11 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
                <LineIcon name={t.icon} />
              </div>
              <div>
                <div className="text-neutral-100 font-medium mb-1.5">{t.title}</div>
                <div className="text-neutral-500 text-sm leading-relaxed">{t.description}</div>
              </div>
              <div className="text-brand text-xs mt-auto pt-1">Acessar →</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
