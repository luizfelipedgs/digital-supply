import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/DashboardHeader";

const STEPS = [
  { title: "Acesse o link de afiliação", description: "Clique no botão abaixo pra abrir o convite de afiliado da Cakto." },
  { title: "Entre na Cakto", description: "Faça login na sua conta da Cakto com os dados que você já usa." },
  {
    title: "Mude seu perfil para Produtor",
    description: "Dentro da plataforma, altere o tipo de perfil pra \"Produtor\" — é essa opção que libera a área de afiliações e os links de divulgação.",
  },
  { title: "Acesse Produtos", description: "No painel principal da Cakto, clique na opção \"Produtos\"." },
  { title: "Entre em Minhas Afiliações", description: "Dentro da área de Produtos, acesse \"Minhas Afiliações\"." },
  { title: "Localize a DGS - Digital Supply", description: "Procure o produto entre as suas afiliações aprovadas." },
  {
    title: "Clique em Links",
    description:
      "Abra a afiliação do produto e entre em \"Links\". Lá vão estar seus links exclusivos: um pro grupo gratuito (WhatsApp) e outro pra página de vendas completa, prontos pra copiar e compartilhar.",
  },
];

export default async function IndiquePage() {
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
    .from("affiliate_settings")
    .select("affiliate_link, title, commission_headline, commission_note, intro_text")
    .eq("id", "main")
    .maybeSingle();

  return (
    <div className="min-h-screen bg-ink-900 p-6 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <DashboardHeader backHref="/dashboard" />

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-neutral-100 text-xl font-medium">Indique e Ganhe</h1>
          {profile.is_admin && (
            <Link href="/dashboard/admin/indique" className="text-brand text-sm no-underline">
              + Gerenciar
            </Link>
          )}
        </div>

        {/* Card principal */}
        <div className="dgs-card mb-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center text-2xl mx-auto mb-4">
            💰
          </div>
          <div className="text-neutral-100 text-lg font-medium mb-2">
            {settings?.title ?? "Programa de Afiliados DGS"}
          </div>
          <p className="text-neutral-400 text-sm leading-relaxed mb-4 max-w-md mx-auto">
            {settings?.intro_text ??
              "Indique novos membros e receba comissão por recorrência a cada assinatura realizada pelo seu link."}
          </p>
          <div className="inline-block bg-brand/10 border border-brand/20 rounded-lg px-5 py-3 mb-5 max-w-sm">
            <div className="text-brand text-2xl font-bold mb-1">{settings?.commission_headline ?? "25% até 40%"}</div>
            <div className="text-neutral-400 text-xs leading-relaxed">
              {settings?.commission_note ??
                "Comissão inicial de 25%, podendo chegar até 40% de acordo com o seu desenvolvimento dentro da comunidade."}
            </div>
          </div>
          <div>
            {settings?.affiliate_link ? (
              <a href={settings.affiliate_link} target="_blank" rel="noreferrer" className="dgs-btn-primary inline-block w-auto px-6 no-underline">
                Quero ser afiliado →
              </a>
            ) : (
              <p className="text-neutral-600 text-xs">Link de afiliação ainda não configurado.</p>
            )}
          </div>
        </div>

        {/* Aviso importante */}
        <div className="rounded-lg border border-orange-700/30 bg-orange-700/5 px-4 py-3 mb-6 flex items-start gap-2.5">
          <span className="text-sm shrink-0 mt-0.5">⚠️</span>
          <p className="text-neutral-400 text-xs leading-relaxed">
            <strong className="text-neutral-300">Importante: não convide qualquer pessoa.</strong> O objetivo desse
            programa não é trazer o maior número de membros, e sim construir uma comunidade forte, saudável e formada
            por gente comprometida. Antes de enviar seu link, avalie se a pessoa realmente tem interesse genuíno em
            páginas dark, criação de conteúdo e monetização.
          </p>
        </div>

        {/* Passo a passo */}
        <div className="text-neutral-100 font-medium text-sm mb-3">Como ativar seus links de afiliado</div>
        <div className="flex flex-col gap-2">
          {STEPS.map((step, i) => (
            <div key={i} className="dgs-card flex gap-3 !py-3">
              <div className="w-6 h-6 rounded-full bg-brand/10 text-brand text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </div>
              <div>
                <div className="text-neutral-200 text-sm font-medium mb-0.5">{step.title}</div>
                <div className="text-neutral-500 text-xs leading-relaxed">{step.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
