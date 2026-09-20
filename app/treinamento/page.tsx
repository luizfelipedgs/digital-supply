import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";
import { LineIcon } from "@/components/LineIcon";
import { ResultsCarousel } from "@/app/ResultsCarousel";
import { LessonCompletedBadge, TreinamentoProgressSummary } from "@/components/TreinamentoProgress";

export const metadata: Metadata = {
  title: "Treinamento Gratuito — Digital Supply",
  description:
    "Treinamento teórico gratuito pra quem quer começar do zero no mercado de páginas darks: nicho, estrutura, aquecimento, viralização e um projeto prático aplicando tudo.",
};

// Mesmo par de helpers de título de seção usado na landing page principal —
// repetido aqui (em vez de importado) pra não criar dependência entre as
// duas páginas.
function SectionEyebrow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2.5 text-xs tracking-widest text-neutral-500 font-medium mb-3">
      <span className="text-brand">●</span>
      <span className="w-5 h-px bg-white/20" />
      {label}
    </div>
  );
}

function BrandCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="dgs-card">
      <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center text-brand mb-3.5">
        <LineIcon name={icon} size={18} />
      </div>
      <div className="font-medium text-[14.5px] mb-1.5">{title}</div>
      <div className="text-neutral-500 text-[13.5px] leading-relaxed">{description}</div>
    </div>
  );
}

const typeIcon: Record<string, string> = { text: "note", video: "play" };

const PRO_BENEFITS = [
  {
    icon: "megaphone",
    title: "Campanhas musicais privadas",
    description: "Acesso às campanhas de remuneração da comunidade — você fatura de acordo com o volume gerado.",
  },
  {
    icon: "chart",
    title: "Dashboard de faturamento",
    description: "Lance seus ganhos por plataforma e acompanhe sua evolução com gráficos em tempo real.",
  },
  {
    icon: "phone",
    title: "App exclusivo",
    description: "Editor de vídeos em massa e biblioteca de músicas, direto no app da comunidade.",
  },
  {
    icon: "video",
    title: "Reuniões ao vivo no Discord",
    description: "Encontros diários pra tirar dúvidas, trocar ideia e evoluir junto com quem já fatura.",
  },
];

export default async function TreinamentoPage() {
  const supabase = createClient();
  const { data: licoes } = await supabase
    .from("treinamento_licoes")
    .select("id, title, subtitle, content_type, is_bonus, order_index")
    .order("order_index", { ascending: true });

  const lessons = licoes ?? [];

  return (
    <div className="bg-ink-900 text-neutral-100">
      {/* Nav */}
      <header className="border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 no-underline">
            <Logo size={30} />
            <span className="text-sm font-semibold tracking-wide text-neutral-100">DIGITAL SUPPLY</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-neutral-400 text-sm no-underline hover:text-neutral-100 transition-colors hidden sm:block">
              ← Voltar pro site
            </Link>
            <Link href="/cadastro" className="dgs-btn-primary w-auto px-4 py-2 text-xs no-underline">
              Conhecer a DGS PRO
            </Link>
          </div>
        </div>
      </header>

      {/* Hero / apresentação */}
      <section className="dgs-scene !min-h-0 py-14 sm:py-16">
        <div className="dgs-glow" style={{ left: "50%", top: "15%", transform: "translate(-50%,-50%)", width: 380, height: 380 }} />
        <div className="relative flex flex-col items-center text-center max-w-2xl mx-auto px-6">
          <div className="text-brand text-xs tracking-[5px] mb-5 dgs-fade-up" style={{ animationDelay: "0.2s" }}>
            TREINAMENTO GRATUITO
          </div>
          <h1
            className="text-neutral-100 text-3xl sm:text-[42px] font-bold leading-tight mb-6 dgs-fade-up"
            style={{ animationDelay: "0.5s" }}
          >
            Do zero à sua primeira página: construindo uma base forte de engajamento e monetização
          </h1>
          <p className="text-neutral-400 text-base mb-6 max-w-lg dgs-fade-up" style={{ animationDelay: "0.8s" }}>
            Esse treinamento reúne o essencial pra quem está começando no mercado de páginas darks: como escolher
            nicho, estruturar uma página do jeito certo, aquecer a conta e viralizar de forma recorrente — sem
            depender de sorte.
          </p>
          <p className="text-neutral-500 text-sm mb-9 max-w-lg dgs-fade-up" style={{ animationDelay: "1s" }}>
            Rápido e sem enrolação — você avança pela trilha toda em pouco tempo e fecha com uma aula prática
            completa, aplicando do zero tudo o que foi ensinado.
          </p>
        </div>
      </section>

      {/* Grade de aulas */}
      <section className="max-w-3xl mx-auto px-6 py-10 sm:py-12">
        <SectionEyebrow label="TRILHA DO TREINAMENTO" />
        <h2 className="text-2xl sm:text-[28px] font-bold tracking-tight mb-2">Aulas</h2>
        <TreinamentoProgressSummary total={lessons.filter((l) => !l.is_bonus).length} />

        {lessons.length === 0 && (
          <p className="text-neutral-500 text-sm">As aulas serão publicadas em breve.</p>
        )}

        <div className="flex flex-col gap-2.5">
          {lessons.map((lesson, i) => (
            <Link
              key={lesson.id}
              href={`/treinamento/${lesson.id}`}
              className="dgs-card dgs-hover-card !py-3.5 flex items-center gap-4 no-underline"
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  lesson.is_bonus ? "bg-white/5 text-neutral-400" : "bg-brand/10 text-brand"
                }`}
              >
                <LineIcon name={lesson.is_bonus ? "gift" : typeIcon[lesson.content_type] ?? "play"} size={17} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-neutral-100 text-sm font-medium truncate">{lesson.title}</div>
                {lesson.subtitle && (
                  <div className="text-neutral-500 text-xs mt-0.5 truncate">{lesson.subtitle}</div>
                )}
              </div>
              <LessonCompletedBadge lessonId={lesson.id} />
              <span className="text-neutral-600 shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Citação de reflexão */}
      <section className="max-w-2xl mx-auto px-6 py-10 sm:py-12 text-center">
        <div className="dgs-card !bg-transparent !border-0 !p-0">
          <p className="text-neutral-300 text-lg sm:text-xl leading-relaxed italic border-l-2 border-brand/50 pl-5 text-left max-w-xl mx-auto">
            "Quem espera o momento perfeito pra começar, nunca começa. O aprendizado vem de aplicar, errar e ajustar
            no caminho — não de esperar se sentir 100% pronto."
          </p>
          <p className="text-neutral-500 text-xs mt-3 pl-5 text-left max-w-xl mx-auto">— Luiz Felipe, fundador da Digital Supply</p>
        </div>
      </section>

      {/* Apresentação DGS PRO */}
      <section id="dgs-pro" className="max-w-5xl mx-auto px-6 py-14 sm:py-16 border-t border-white/5">
        <div className="text-center max-w-xl mx-auto mb-10">
          <SectionEyebrow label="DEPOIS DO TREINAMENTO" />
          <h2 className="text-2xl sm:text-[32px] font-bold tracking-tight mb-4">Pronto pra transformar isso em receita?</h2>
          <p className="text-neutral-400 text-[15px] leading-relaxed">
            O treinamento gratuito te dá a base teórica. Na <strong className="text-neutral-100">Comunidade DGS PRO</strong>{" "}
            você entra nas campanhas musicais privadas, tem acesso ao app exclusivo de edição em massa e conta com
            reuniões ao vivo pra acelerar seus resultados de verdade.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
          {PRO_BENEFITS.map((b) => (
            <BrandCard key={b.title} {...b} />
          ))}
        </div>

        <div className="mb-4">
          <div className="text-center mb-6">
            <div className="text-neutral-100 font-medium text-sm mb-1">Resultados reais de quem já é PRO</div>
            <div className="text-neutral-500 text-xs">Prints compartilhados pelos próprios membros da comunidade.</div>
          </div>
          <ResultsCarousel />
        </div>

        <div className="text-center mt-12">
          <Link href="/cadastro" className="dgs-btn-primary w-auto px-8 py-3.5 no-underline inline-block">
            Quero entrar na DGS PRO →
          </Link>
          <a
            href="https://cakto.app/532Xkmt/"
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-4 text-neutral-400 text-xs hover:text-brand transition-colors no-underline"
          >
            Prefiro tirar dúvidas no grupo gratuito primeiro →
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Logo size={20} />
            <span className="text-neutral-500 text-xs">Digital Supply</span>
          </div>
          <span className="text-neutral-600 text-xs">© 2026 Digital Supply. Todos os direitos reservados.</span>
        </div>
      </footer>
    </div>
  );
}
