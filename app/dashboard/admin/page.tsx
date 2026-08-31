import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/DashboardHeader";
import { CoverUploader } from "./CoverUploader";

export default async function AdminHubPage() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", userData.user.id).single();
  if (!profile?.is_admin) redirect("/dashboard");

  const { data: settings } = await supabase.from("site_settings").select("cover_path").eq("id", "main").maybeSingle();

  const items = [
    { href: "/dashboard/admin/alunos", icon: "👤", title: "Alunos", description: "Aprovação manual e gestão de acesso." },
    { href: "/dashboard/admin/conteudos", icon: "📚", title: "Conteúdos", description: "Módulos, aulas e capas." },
    { href: "/dashboard/admin/templates", icon: "🎬", title: "Templates Prontos", description: "Vídeo tutorial e links do Canva." },
    { href: "/dashboard/admin/paginas", icon: "🔎", title: "Lista de Páginas", description: "Páginas BR e gringas pra reciclar vídeos." },
    { href: "/dashboard/admin/indique", icon: "🎁", title: "Indique e Ganhe", description: "Link de afiliado e comissão." },
    { href: "/dashboard/admin/avisos", icon: "📢", title: "Avisos", description: "Notificações pros alunos." },
  ];

  return (
    <div className="min-h-screen bg-ink-900 p-6 sm:p-8">
      <div className="max-w-xl mx-auto">
        <DashboardHeader backHref="/dashboard" />
        <h1 className="text-neutral-100 text-xl font-medium mb-6">Painel admin</h1>

        <CoverUploader initialCoverPath={settings?.cover_path ?? null} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map((item) => (
            <Link key={item.href} href={item.href} className="dgs-card dgs-hover-card no-underline flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-lg">{item.icon}</div>
              <div>
                <div className="text-neutral-100 font-medium text-sm mb-1">{item.title}</div>
                <div className="text-neutral-500 text-xs">{item.description}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
