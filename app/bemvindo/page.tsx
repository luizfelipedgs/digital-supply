import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";
import { LineIcon } from "@/components/LineIcon";
import { desktopAppDownloadUrl } from "@/lib/desktop-app";
import { LogoutButton } from "./LogoutButton";
import { VideoPlayer } from "./VideoPlayer";

export const metadata: Metadata = {
  title: "Bem-vindo à Central DGS | Digital Supply",
  description: "Baixe e configure a Central DGS no seu computador com nosso guia passo a passo.",
};

export default async function BemVindoPage() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, status, plan, plan_expires_at, email, full_name, is_admin")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (!profile || profile.status === "pending") {
    redirect("/aguardando");
  }

  const expiredByDate =
    !profile.is_admin && !!profile.plan_expires_at && new Date(profile.plan_expires_at).getTime() < Date.now();

  if (!profile.is_admin && (profile.status === "suspended" || expiredByDate)) {
    redirect("/assinatura-expirada");
  }

  const { data: grupoSettings } = await supabase
    .from("grupo_settings")
    .select("group_link")
    .eq("id", "main")
    .maybeSingle();

  const whatsappUrl = grupoSettings?.group_link || "https://chat.whatsapp.com/I4h3zQRr1869hsC0rRzTQ7";

  return (
    <div className="min-h-screen bg-[#070906] text-neutral-100 flex flex-col relative overflow-x-hidden selection:bg-brand/30 selection:text-white">
      {/* Luz ambiente de fundo */}
      <div
        className="dgs-glow absolute pointer-events-none opacity-40"
        style={{ left: "50%", top: "15%", transform: "translate(-50%, -50%)", width: 500, height: 500 }}
      />

      {/* Barra de Navegação Superior */}
      <header className="border-b border-white/[0.08] bg-[#070906]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size={32} className="text-brand shrink-0" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-wider text-neutral-100">DIGITAL SUPPLY</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs text-neutral-400 bg-white/[0.04] px-2.5 py-1 rounded-full border border-white/5">
              {profile.is_admin ? "Administrador DGS" : profile.email}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 flex flex-col gap-10 flex-1 relative z-10 w-full">
        {/* Cabeçalho de Boas-Vindas */}
        <section className="text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-medium tracking-wide uppercase mb-3">
            <LineIcon name="sparkles" size={14} />
            <span>Bem-vindo à Comunidade DGS PRO</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-neutral-100 max-w-2xl">
            Sua jornada começa na <span className="text-brand">Central DGS</span>
          </h1>
        </section>

        {/* Card do Vídeo Ilustrativo + Botão de Download Imediatamente Abaixo */}
        <section className="dgs-card rounded-2xl p-5 sm:p-7 border border-white/10 bg-[#0d100c]/90 shadow-2xl flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand shrink-0">
                <LineIcon name="play" size={20} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-neutral-100">
                  Como Baixar, Instalar e Acessar
                </h2>
                <p className="text-neutral-500 text-xs">
                  Assista ao vídeo demonstrando o passo a passo completo.
                </p>
              </div>
            </div>
          </div>

          {/* Player do Vídeo Tutorial Oficial */}
          <VideoPlayer src="/tutorial/DGS_Tutorial_v2.mp4" poster="/tutorial/poster_v2.png" />

          {/* BOTÃO DE DOWNLOAD ÚNICO DA CENTRAL DGS (DIRETAMENTE ABAIXO DO VÍDEO) */}
          <div className="flex flex-col gap-4 pt-2">
            <a
              href={desktopAppDownloadUrl()}
              download="Launcher_Central_DGS.exe"
              className="dgs-btn-primary py-4 px-6 rounded-xl text-base sm:text-lg font-semibold text-center flex items-center justify-center gap-3 shadow-lg shadow-brand/20 hover:brightness-110 active:scale-[0.99] transition-all no-underline text-[#080806]"
            >
              <LineIcon name="download" size={24} className="stroke-[2.5]" />
              <span>Baixar Instalador da Central DGS (Launcher Oficial .exe)</span>
            </a>

            {/* Alerta de Segurança do Windows (SmartScreen & Smart App Control) */}
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.07] p-5 flex flex-col gap-4 text-xs leading-relaxed text-amber-200/90 shadow-lg">
              <div className="flex items-start gap-3">
                <span className="shrink-0 mt-0.5 text-amber-400">
                  <LineIcon name="warning" size={18} />
                </span>
                <div className="space-y-3 w-full">
                  <div>
                    <strong className="text-amber-300 block text-sm font-bold">
                      Avisos de Segurança do Windows na 1ª abertura:
                    </strong>
                    <span className="text-neutral-400 text-[11px]">
                      Como o aplicativo é novo e independente, o Windows pode exibir avisos de segurança de fábrica.
                    </span>
                  </div>

                  {/* Caso 1: SmartScreen */}
                  <div className="p-3 rounded-xl bg-black/30 border border-amber-500/20 space-y-1">
                    <div className="font-semibold text-amber-200 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                      1. Tela azul &quot;O Windows protegeu o seu computador&quot; (SmartScreen):
                    </div>
                    <p className="text-neutral-300 text-xs pl-3">
                      Basta clicar no texto sublinhado <span className="underline font-bold text-white">Mais informações</span> e em seguida no botão{" "}
                      <span className="font-bold text-white bg-white/10 px-1.5 py-0.5 rounded">Executar assim mesmo</span>.
                    </p>
                  </div>

                  {/* Caso 2: Smart App Control do Windows 11 */}
                  <div className="p-3.5 rounded-xl bg-black/40 border border-brand/30 space-y-2">
                    <div className="font-bold text-brand flex items-center gap-1.5 text-xs sm:text-sm">
                      <span className="w-2 h-2 rounded-full bg-brand"></span>
                      2. Tela preta &quot;O controle inteligente de aplicativos bloqueou um aplicativo&quot; (Windows 11):
                    </div>
                    <p className="text-neutral-300 text-xs">
                      Se o seu Windows 11 exibir este aviso de bloqueio, libere o executável facilmente:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-xs text-neutral-200 pl-1">
                      <li><strong>Passo Rápido:</strong> Clique com o botão direito no <strong className="text-brand">Launcher_Central_DGS.exe</strong> ➔ selecione <strong>Propriedades</strong> ➔ marque a caixa <strong className="text-white">☑ Desbloquear</strong> no rodapé ➔ clique em <strong>OK</strong>.</li>
                      <li><strong>Alternativa:</strong> Pressione a tecla <strong>Windows</strong>, digite <code className="bg-black/60 px-1.5 py-0.5 rounded text-brand font-mono">Controle inteligente de aplicativos</code> e alterne para <strong>&quot;Desativado&quot;</strong>.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Lembrete de Credenciais */}
        <section className="rounded-xl border border-white/10 bg-white/[0.02] p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center text-brand shrink-0">
              <LineIcon name="person" size={20} />
            </div>
            <div>
              <div className="text-xs text-neutral-400">Seu e-mail de acesso à Central DGS:</div>
              <div className="text-sm font-semibold text-neutral-100">{profile.email}</div>
            </div>
          </div>
          <div className="text-xs text-neutral-400 text-center sm:text-right">
            Sua senha é a mesma que você acabou de usar para entrar neste site.
          </div>
        </section>

        {/* Comunidade DGS PRO & Indique e Ganhe */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card WhatsApp */}
          <div className="dgs-card rounded-xl p-6 border border-white/10 bg-white/[0.02] flex flex-col justify-between gap-5">
            <div className="flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <LineIcon name="users" size={20} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-neutral-100">Comunidade DGS PRO (WhatsApp)</h3>
                <p className="text-neutral-400 text-xs leading-relaxed mt-1">
                  Entre no nosso grupo exclusivo no WhatsApp para networking diário, novidades, estratégias de corte e
                  troca de experiências com outros membros.
                </p>
              </div>
            </div>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors no-underline"
            >
              <LineIcon name="users" size={16} />
              <span>Acessar Grupo no WhatsApp</span>
            </a>
          </div>

          {/* Card Indique e Ganhe */}
          <div className="dgs-card rounded-xl p-6 border border-white/10 bg-white/[0.02] flex flex-col justify-between gap-5">
            <div className="flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <LineIcon name="gift" size={20} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-neutral-100">Indique e Ganhe</h3>
                <p className="text-neutral-400 text-xs leading-relaxed mt-1">
                  Ganhe de 25% a 40% de comissão recorrente por cada amigo ou seguidor que assinar a Comunidade DGS com seu
                  link de afiliado Cakto.
                </p>
              </div>
            </div>
            <div className="text-xs text-neutral-400 flex items-center gap-2 bg-white/[0.03] p-3 rounded-lg border border-white/5">
              <LineIcon name="sparkles" size={16} className="text-amber-400 shrink-0" />
              <span>Disponível no menu lateral da <strong>Central DGS</strong> após a instalação!</span>
            </div>
          </div>
        </section>

        {/* Rodapé */}
        <footer className="text-center text-xs text-neutral-600 pt-6 pb-4 border-t border-white/[0.05]">
          © {new Date().getFullYear()} Digital Supply — Todos os direitos reservados.
        </footer>
      </main>
    </div>
  );
}
