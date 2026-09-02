import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/DashboardHeader";
import { LineIcon } from "@/components/LineIcon";
import { desktopAppCheckoutUrl, desktopAppDownloadUrl, DESKTOP_APP_PRICE_LABEL } from "@/lib/desktop-app";

export default async function DesktopAppPage() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("status, is_admin, desktop_app_purchased, email")
    .eq("id", userData.user.id)
    .single();

  if (!profile || profile.status !== "active") redirect("/aguardando");

  const hasAccess = !!profile.is_admin || !!profile.desktop_app_purchased;

  return (
    <div className="min-h-screen bg-ink-900 p-6 sm:p-8">
      <div className="max-w-3xl mx-auto">
        <DashboardHeader backHref="/dashboard" />

        <div className="mb-6">
          <h1 className="text-neutral-100 text-xl font-medium">Editor de Músicas — Desktop</h1>
          <p className="text-neutral-500 text-sm mt-1">
            A versão pra instalar no seu computador — a mesma ferramenta de colocar música em lote nos vídeos, mas
            sem limite de vídeos por lote e sem gastar crédito nenhum, processando direto com o poder da sua própria
            máquina. Recomendado pra quem já usa computador no dia a dia: é mais rápido e você não depende de
            internet durante o processamento.
          </p>
        </div>

        {hasAccess ? (
          <div className="dgs-card flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-brand/10 flex items-center justify-center text-brand shrink-0">
                <LineIcon name="download" />
              </div>
              <div>
                <div className="text-neutral-100 font-medium text-sm">
                  {profile.is_admin && !profile.desktop_app_purchased ? "Acesso liberado (admin)" : "Você já tem acesso"}
                </div>
                <div className="text-neutral-500 text-xs mt-0.5">Windows — instalador (.exe)</div>
              </div>
            </div>

            <a href={desktopAppDownloadUrl()} className="dgs-btn-primary no-underline text-center">
              Baixar programa
            </a>

            <div className="rounded-lg border border-orange-700/30 bg-orange-700/5 px-4 py-3 flex items-start gap-2.5">
              <span className="shrink-0 mt-0.5 text-orange-500">
                <LineIcon name="warning" size={14} />
              </span>
              <p className="text-neutral-400 text-xs leading-relaxed">
                O instalador não é assinado digitalmente, então o Windows pode mostrar um aviso ("Windows protegeu
                seu PC") na primeira abertura — isso é normal, clique em <strong>Mais informações</strong> e depois
                em <strong>Executar assim mesmo</strong>. Depois de instalado, abra o programa e faça login com o
                mesmo e-mail e senha que você usa aqui no site.
              </p>
            </div>
          </div>
        ) : (
          <div className="dgs-card flex flex-col gap-4">
            <div>
              <div className="text-neutral-100 text-2xl font-bold mb-1">{DESKTOP_APP_PRICE_LABEL}</div>
              <div className="text-neutral-500 text-sm">Pagamento único — acesso vitalício ao programa</div>
            </div>

            <ul className="flex flex-col gap-2">
              {[
                "Pagamento único — sem mensalidade, sem assinatura",
                "Acesso vitalício — pague uma vez, use pra sempre",
                "Todas as atualizações futuras inclusas, sem nenhum custo extra",
                "Sem limite de vídeos por lote e sem gastar créditos",
              ].map((benefit) => (
                <li key={benefit} className="flex items-start gap-2.5 text-neutral-300 text-sm">
                  <span className="shrink-0 mt-0.5 text-brand">
                    <LineIcon name="check" size={14} />
                  </span>
                  {benefit}
                </li>
              ))}
            </ul>

            <a href={desktopAppCheckoutUrl(profile.email)} className="dgs-btn-primary no-underline text-center">
              Comprar acesso
            </a>
            <p className="text-neutral-600 text-xs leading-relaxed">
              Depois de confirmado o pagamento, o botão de download aparece automaticamente aqui — normalmente em
              poucos minutos.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
