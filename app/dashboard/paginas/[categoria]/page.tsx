import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/DashboardHeader";

const CATEGORY_LABEL: Record<string, string> = {
  portugues: "Páginas em Português",
  gringas: "Páginas Gringas",
};

export default async function PaginasCategoriaPage({ params }: { params: { categoria: string } }) {
  if (!CATEGORY_LABEL[params.categoria]) notFound();

  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("status")
    .eq("id", userData.user.id)
    .single();

  if (!profile || profile.status !== "active") redirect("/aguardando");

  const { data: links } = await supabase
    .from("paginas_links")
    .select("id, name, link, description")
    .eq("category", params.categoria)
    .order("order_index", { ascending: true });

  return (
    <div className="min-h-screen bg-ink-900 p-6 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <DashboardHeader backHref="/dashboard/paginas" backLabel="Voltar à lista de páginas" />
        <h1 className="text-neutral-100 text-xl font-medium mb-6">{CATEGORY_LABEL[params.categoria]}</h1>

        <div className="flex flex-col gap-2">
          {(!links || links.length === 0) && (
            <p className="text-neutral-500 text-sm">Nenhuma página cadastrada aqui ainda.</p>
          )}
          {links?.map((l) => (
            <a
              key={l.id}
              href={l.link}
              target="_blank"
              rel="noreferrer"
              className="dgs-card dgs-hover-card no-underline flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="text-neutral-100 font-medium text-sm mb-0.5 truncate">{l.name}</div>
                {l.description && <div className="text-neutral-500 text-xs truncate">{l.description}</div>}
              </div>
              <div className="text-brand text-xs shrink-0">Abrir →</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
