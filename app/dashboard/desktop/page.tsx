import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/DashboardHeader";
import { LineIcon } from "@/components/LineIcon";
import {
  desktopAppCheckoutUrl,
  desktopAppDownloadUrl,
  desktopAppDownloadUrlMacAppleSilicon,
  desktopAppDownloadUrlMacIntel,
} from "@/lib/desktop-app";
import { toYoutubeEmbedUrl } from "@/lib/youtube";

export default async function DesktopAppPage() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("status, is_admin, desktop_app_purchased, desktop_app_suspended, email, plan")
    .eq("id", userData.user.id)
    .single();

  if (!profile || profile.status !== "active") redirect("/aguardando");

  // Alunos com assinatura ativa ou administradores possuem acesso total à Central DGS
  const hasAccess = !!profile.is_admin || profile.status === "active";

  const { data: settings } = await supabase
    .from("desktop_app_settings")
    .select("tutorial_video_url")
    .eq("id", "main")
    .maybeSingle();

  const tutorialEmbedUrl = settings?.tutorial_video_url ? toYoutubeEmbedUrl(settings.tutorial_video_url) : null;

  return (
    <div className="min-h-screen bg-ink-900 p-6 sm:p-8">
      <div className="max-w-3xl mx-auto">
        <DashboardHeader backHref="/dashboard" />

        <div className="mb-6">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-neutral-100 text-xl font-medium">Central DGS — Hub Desktop Unificado</h1>
            {profile.is_admin && (
              <Link href="/dashboard/admin/desktop" className="text-brand text-xs no-underline shrink-0">
                + Editar vídeo tutorial
              </Link>
            )}
          </div>
          <p className="text-neutral-500 text-sm mt-1">
            O software oficial da Digital Supply para instalar no seu computador. Agendamento automático nas 3 redes
            (Instagram Reels, TikTok e YouTube Shorts), Editor de Músicas em lote com FFmpeg de alta performance e
            métodos de monetização integrados em uma única aplicação.
          </p>
        </div>

        {/* Pilares Unificados da Central DGS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
            <div className="flex items-center gap-2 text-brand font-semibold text-xs">
              <LineIcon name="sparkles" size={14} />
              Agendador 3 Redes
            </div>
            <p className="text-neutral-400 text-xs leading-relaxed">
              Motor Playwright seguro com navegador visível, proteção anti-bloqueio e postagens simultâneas.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
            <div className="flex items-center gap-2 text-brand font-semibold text-xs">
              <LineIcon name="video" size={14} />
              Editor de Músicas
            </div>
            <p className="text-neutral-400 text-xs leading-relaxed">
              Substituição de áudio em dezenas de vídeos em lote com FFmpeg local e envio direto pra fila.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
            <div className="flex items-center gap-2 text-brand font-semibold text-xs">
              <LineIcon name="trophy" size={14} />
              Aulas & Campanhas
            </div>
            <p className="text-neutral-400 text-xs leading-relaxed">
              Acesso a campanhas com premiações em dinheiro e treinamentos práticos de escala.
            </p>
          </div>
        </div>

        {tutorialEmbedUrl && (
          <div className="aspect-video rounded-xl overflow-hidden border border-white/10 mb-6">
            <iframe
              src={tutorialEmbedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        {hasAccess ? (
          <div className="dgs-card flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-brand/10 flex items-center justify-center text-brand shrink-0">
                <LineIcon name="download" />
              </div>
              <div>
                <div className="text-neutral-100 font-medium text-sm">
                  {profile.is_admin ? "Acesso liberado (Administrador DGS)" : "Acesso liberado pela sua Assinatura"}
                </div>
                <div className="text-neutral-500 text-xs mt-0.5">Escolha o sistema operacional do seu computador</div>
              </div>
            </div>

            <div className="rounded-lg border border-white/10 p-4 flex flex-col gap-2.5">
              <div className="text-neutral-200 text-xs font-semibold">Windows (Recomendado)</div>
              <a href={desktopAppDownloadUrl()} download className="dgs-btn-primary no-underline text-center">
                Baixar Central DGS para Windows (Instalador .zip)
              </a>
              <div className="rounded-lg border border-orange-700/30 bg-orange-700/5 px-4 py-3 flex items-start gap-2.5">
                <span className="shrink-0 mt-0.5 text-orange-500">
                  <LineIcon name="warning" size={14} />
                </span>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  O instalador não é assinado digitalmente, então o Windows pode mostrar um aviso (&quot;Windows protegeu
                  seu PC&quot;) na primeira abertura — clique em <strong>Mais informações</strong> e depois em{" "}
                  <strong>Executar assim mesmo</strong>.
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-white/10 p-4 flex flex-col gap-2.5">
              <div className="text-neutral-200 text-xs font-semibold">Mac</div>
              <a href={desktopAppDownloadUrlMacAppleSilicon()} className="dgs-btn-primary no-underline text-center">
                Baixar Central DGS (.dmg) — Apple Silicon (M1/M2/M3/M4)
              </a>
              <a href={desktopAppDownloadUrlMacIntel()} className="dgs-btn-ghost no-underline text-center">
                Baixar pra Mac Intel (mais antigo)
              </a>
              <p className="text-neutral-600 text-[11px] leading-relaxed">
                Não sabe qual é o seu? Menu Apple (canto superior esquerdo) → Sobre Este Mac. Se aparecer &quot;Chip Apple
                M1/M2/M3/M4...&quot;, é Apple Silicon.
              </p>
              <div className="rounded-lg border border-blue-700/30 bg-blue-700/5 px-4 py-3 flex items-start gap-2.5">
                <span className="shrink-0 mt-0.5 text-blue-400">
                  <LineIcon name="warning" size={14} />
                </span>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  O app também não é assinado pela Apple, então na primeira abertura o Mac vai bloquear com
                  &quot;desenvolvedor não identificado&quot; — clique com o <strong>botão direito</strong> no app, escolha{" "}
                  <strong>Abrir</strong> e confirme. Só precisa fazer isso uma vez.
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-brand/20 bg-brand/5 p-4 flex items-start gap-3">
              <div className="text-brand shrink-0 mt-0.5">
                <LineIcon name="check" size={16} />
              </div>
              <p className="text-neutral-300 text-xs leading-relaxed">
                <strong>Como entrar:</strong> Depois de instalar e abrir a Central DGS, utilize o <strong>mesmo e-mail e senha</strong> cadastrados na sua assinatura aqui no site. O software sincroniza suas permissões e libera automaticamente todos os módulos!
              </p>
            </div>
          </div>
        ) : (
          <div className="dgs-card flex flex-col gap-4">
            <div>
              <div className="text-neutral-100 text-xl font-bold mb-1">Assinatura Ativa Necessária</div>
              <div className="text-neutral-500 text-sm">Mantenha sua assinatura ativa para ter acesso ilimitado à Central DGS</div>
            </div>

            <a href="/planos" className="dgs-btn-primary no-underline text-center">
              Ativar Minha Assinatura
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
