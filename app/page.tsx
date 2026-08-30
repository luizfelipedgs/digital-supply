import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { FaqAccordion } from "./FaqAccordion";
import { LineIcon } from "./LineIcon";
import { ResultsCarousel } from "./ResultsCarousel";

export const metadata: Metadata = {
  title: "Digital Supply — Comunidade DGS",
  description:
    "Aprenda a transformar visualizações em receita através de campanhas musicais. Dashboard de faturamento, templates prontos, ranking semanal e muito mais.",
};

const BENEFITS = [
  {
    icon: "video",
    title: "Aulas e reuniões ao vivo",
    description: "Aprenda diretamente com quem já atua no mercado, com ensinamentos práticos realizados ao vivo dentro da comunidade.",
  },
  {
    icon: "trending",
    title: "Estratégias de crescimento",
    description: "Aprenda como estruturar suas páginas do jeito certo e aumentar o alcance dos seus conteúdos para milhões de pessoas.",
  },
  {
    icon: "zap",
    title: "Métodos de viralização",
    description: "Estratégias para encontrar, adaptar e trabalhar conteúdos com potencial de viralização.",
  },
  {
    icon: "wallet",
    title: "Monetização com músicas",
    description: "Aprenda a trabalhar com campanhas que remuneram criadores de acordo com as visualizações dos conteúdos.",
  },
  {
    icon: "chart",
    title: "Dashboard de faturamento",
    description: "Lance seus ganhos por plataforma e acompanhe sua evolução com gráficos e comparativos em tempo real.",
  },
  {
    icon: "play",
    title: "Templates prontos no Canva",
    description: "Mais de 1.000 vídeos prontos pra modelar e aplicar direto nas suas páginas.",
  },
  {
    icon: "sparkles",
    title: "Ferramenta de edição em massa",
    description: "Acesso à ferramenta de edição de vídeo exclusiva da comunidade para acelerar sua produção.",
  },
  {
    icon: "phone",
    title: "App no seu celular",
    description: "Instale a plataforma como app, direto na tela inicial, sem precisar baixar nada de loja.",
  },
];

const FAQ_ITEMS = [
  {
    q: "Como funciona o acesso à comunidade?",
    a: "Você se cadastra na plataforma, escolhe o plano que faz mais sentido pro seu momento, e o acesso é liberado automaticamente assim que o pagamento é confirmado — geralmente em poucos minutos.",
  },
  {
    q: "Preciso ter experiência para entrar?",
    a: "Não. A comunidade serve tanto pra quem está começando do zero quanto pra quem já tem experiência com conteúdo e redes sociais e quer profissionalizar os resultados.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim. Sua assinatura fica ativa até o fim do período pago, sem renovação automática forçada.",
  },
  {
    q: "Os conteúdos são atualizados?",
    a: "Sim — novos templates, aulas e avisos são publicados direto na plataforma conforme a comunidade evolui.",
  },
];

export default function LandingPage() {
  return (
    <div className="bg-ink-900 text-neutral-100">
      {/* Nav */}
      <header className="border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size={30} />
            <span className="text-sm font-semibold tracking-wide">DIGITAL SUPPLY</span>
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-neutral-400">
            <a href="#beneficios" className="hover:text-neutral-100 transition-colors">
              Benefícios
            </a>
            <a href="#resultados" className="hover:text-neutral-100 transition-colors">
              Resultados
            </a>
            <a href="#faq" className="hover:text-neutral-100 transition-colors">
              Dúvidas
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-neutral-400 text-sm no-underline hover:text-neutral-100 transition-colors">
              Entrar
            </Link>
            <Link href="/cadastro" className="dgs-btn-primary w-auto px-4 py-2 text-xs no-underline">
              Cadastre-se
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="dgs-scene !min-h-0 py-24 sm:py-32">
        <div className="dgs-glow" style={{ left: "50%", top: "20%", transform: "translate(-50%,-50%)", width: 420, height: 420 }} />
        <div className="relative flex flex-col items-center text-center max-w-2xl mx-auto px-6">
          <div className="text-brand text-xs tracking-[5px] mb-5 dgs-fade-up" style={{ animationDelay: "0.2s" }}>
            COMUNIDADE DGS
          </div>
          <h1
            className="text-neutral-100 text-3xl sm:text-5xl font-bold leading-tight mb-6 dgs-fade-up"
            style={{ animationDelay: "0.5s" }}
          >
            Seu próximo passo para viver do digital começa com uma página dark
          </h1>
          <p className="text-neutral-400 text-base sm:text-lg mb-9 max-w-lg dgs-fade-up" style={{ animationDelay: "0.8s" }}>
            Aprenda a transformar visualizações em receita através de campanhas musicais — e acompanhe tudo dentro de
            uma plataforma feita sob medida pra isso.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 dgs-fade-up" style={{ animationDelay: "1.1s" }}>
            <Link href="/cadastro" className="dgs-btn-primary w-auto px-8 py-3.5 no-underline">
              Quero fazer parte →
            </Link>
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section id="beneficios" className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Tudo o que você precisa está dentro da comunidade</h2>
          <p className="text-neutral-500 text-sm max-w-md mx-auto">
            Uma plataforma própria, feita pra acompanhar sua evolução do primeiro clipe ao primeiro milhão de views.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {BENEFITS.map((b) => (
            <div key={b.title} className="dgs-card dgs-hover-card">
              <div className="w-11 h-11 rounded-xl bg-brand/10 flex items-center justify-center text-brand mb-4">
                <LineIcon name={b.icon} />
              </div>
              <div className="text-neutral-100 font-medium mb-1.5">{b.title}</div>
              <div className="text-neutral-500 text-sm leading-relaxed">{b.description}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Resultados da comunidade */}
      <section id="resultados" className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Resultados da comunidade</h2>
          <p className="text-neutral-500 text-sm max-w-md mx-auto">
            Prints reais compartilhados pelos próprios membros, direto do grupo da comunidade.
          </p>
        </div>
        <ResultsCarousel />
      </section>

      {/* Para quem é */}
      <section className="max-w-2xl mx-auto px-6 py-16">
        <div className="dgs-card">
          <div className="w-11 h-11 rounded-xl bg-brand/10 flex items-center justify-center text-xl mb-4">👥</div>
          <h2 className="text-xl font-bold mb-4">Para quem é a DGS</h2>
          <div className="text-neutral-400 text-sm leading-relaxed flex flex-col gap-4">
            <p>
              A Digital Supply é pra quem quer construir uma renda real através do digital — desenvolvendo páginas
              dark, aumentando alcance e monetizando conteúdo por meio de campanhas musicais.
            </p>
            <p>
              Serve tanto pra quem já tentou outros caminhos no digital e tem alguma experiência com criação de
              conteúdo ou redes sociais, quanto pra quem está começando agora e quer aprender do zero.
            </p>
            <p>Se você tem disposição pra aprender e executar, a comunidade foi feita pra você.</p>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="max-w-2xl mx-auto px-6 py-16 text-center">
        <h2 className="text-2xl font-bold mb-3">Pronto pra começar?</h2>
        <p className="text-neutral-500 text-sm mb-8">
          Cadastre-se e escolha o plano que faz mais sentido pro seu momento — o acesso é liberado automaticamente
          assim que o pagamento é confirmado.
        </p>
        <Link href="/cadastro" className="dgs-btn-primary w-auto px-8 py-3.5 no-underline inline-block">
          Quero fazer parte →
        </Link>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-2xl mx-auto px-6 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center">Tire suas dúvidas</h2>
        <FaqAccordion items={FAQ_ITEMS} />
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
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
