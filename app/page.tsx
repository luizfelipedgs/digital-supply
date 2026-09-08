import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { FaqAccordion } from "./FaqAccordion";
import { LineIcon } from "@/components/LineIcon";
import { ResultsCarousel } from "./ResultsCarousel";

export const metadata: Metadata = {
  title: "Digital Supply — Comunidade DGS",
  description:
    "Aprenda a transformar visualizações em receita através de campanhas musicais. Dashboard de faturamento, templates prontos, ranking semanal e muito mais.",
};

// Etiqueta numerada usada no topo de cada seção da landing (ex: "01 — CONTEXTO"),
// inspirada em decks de apresentação — deixa a página mais fácil de escanear.
function SectionEyebrow({ num, label }: { num: string; label: string }) {
  return (
    <div className="flex items-center gap-2.5 text-xs tracking-widest text-neutral-500 font-medium mb-3">
      <span className="text-brand tabular-nums">{num}</span>
      <span className="w-5 h-px bg-white/20" />
      {label}
    </div>
  );
}

// Título da seção à esquerda + uma frase curta de contexto à direita (só aparece em telas maiores).
function SectionHead({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex items-end justify-between gap-6 flex-wrap mb-7">
      <h2 className="text-2xl sm:text-[28px] font-bold tracking-tight max-w-lg">{title}</h2>
      <div className="hidden sm:block text-neutral-500 text-xs text-right max-w-[220px]">{hint}</div>
    </div>
  );
}

// Card neutro (cinza) usado na seção de Contexto/problema — de propósito sem o
// verde da marca, pra diferenciar visualmente do que é "solução" nas seções seguintes.
function ContextCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="dgs-card">
      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-neutral-400 mb-3.5">
        <LineIcon name={icon} size={18} />
      </div>
      <div className="font-medium text-[14.5px] mb-1.5">{title}</div>
      <div className="text-neutral-500 text-[13.5px] leading-relaxed">{description}</div>
    </div>
  );
}

// Card com o verde da marca — usado nas seções que apresentam a solução (O Modelo, Razão).
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

// Os 4 passos da jornada real de um membro — do cadastro ao primeiro faturamento.
const HOW_IT_WORKS = [
  {
    num: "01",
    icon: "person",
    title: "Cadastro e acesso",
    description: "Você se cadastra, escolhe o plano e o acesso à comunidade é liberado automaticamente.",
  },
  {
    num: "02",
    icon: "edit",
    title: "Estrutura e aquecimento da página",
    description: "Aprende a estruturar a página do jeito certo e aplica as técnicas de aquecimento pra gerar alcance recorrente.",
  },
  {
    num: "03",
    icon: "megaphone",
    title: "Entra nas campanhas musicais",
    description: "Com a página pronta e aquecida, você acessa as campanhas de remuneração disponíveis na comunidade.",
  },
  {
    num: "04",
    icon: "wallet",
    title: "Fatura por performance",
    description: "Publica o conteúdo com a música da campanha e recebe de acordo com o volume gerado no período.",
  },
];

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
    a: "O processo tem 4 etapas: 1) você faz o cadastro na plataforma com seu email e senha; 2) escolhe um plano e paga via Cakto; 3) o pagamento é confirmado automaticamente pelo sistema, geralmente em poucos minutos; 4) você já consegue fazer login e acessar tudo — sem espera manual.",
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
            <a
              href="https://cakto.app/532Xkmt/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-neutral-100 transition-colors"
            >
              Grupo gratuito
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
      <section className="dgs-scene !min-h-0 py-16 sm:py-20">
        <div className="dgs-glow" style={{ left: "50%", top: "20%", transform: "translate(-50%,-50%)", width: 420, height: 420 }} />
        <div className="relative flex flex-col items-center text-center max-w-2xl mx-auto px-6">
          <div className="text-brand text-xs tracking-[5px] mb-5 dgs-fade-up" style={{ animationDelay: "0.2s" }}>
            COMUNIDADE DGS
          </div>
          <h1
            className="text-neutral-100 text-3xl sm:text-5xl font-bold leading-tight mb-6 dgs-fade-up"
            style={{ animationDelay: "0.5s" }}
          >
            Aprenda a transformar suas redes sociais em uma fonte de renda com campanhas musicais
          </h1>
          <p className="text-neutral-400 text-base sm:text-lg mb-9 max-w-lg dgs-fade-up" style={{ animationDelay: "0.8s" }}>
            Reuniões ao vivo diariamente no Discord, ferramentas exclusivas pra produção de vídeos em massa e
            estratégias de viralização orgânica — tudo dentro de um ecossistema feito pra acompanhar sua evolução do
            primeiro post ao primeiro milhão de views.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 dgs-fade-up" style={{ animationDelay: "1.1s" }}>
            <Link href="/cadastro" className="dgs-btn-primary w-auto px-8 py-3.5 no-underline">
              Quero fazer parte →
            </Link>
          </div>
        </div>
      </section>

      {/* 01 — Contexto */}
      <section className="max-w-4xl mx-auto px-6 py-10 sm:py-12">
        <SectionEyebrow num="01" label="CONTEXTO" />
        <SectionHead title="Fazer conteúdo sozinho, sem direção, não paga as contas" hint="O desafio de quem tenta crescer sozinho hoje." />
        <p className="text-neutral-400 text-[15px] leading-relaxed max-w-xl mb-7">
          Postar todo dia sem estratégia cansa e não converte. Descobrir sozinho como aparecer pro algoritmo — e
          ainda transformar isso em dinheiro — leva meses, quando não trava de vez no meio do caminho.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ContextCard icon="warning" title="Conteúdo sem direção" description="Postar sem saber o que funciona é tentativa e erro caro — em tempo e em oportunidade perdida." />
          <ContextCard icon="wallet" title="Views que não viram receita" description="Ter alcance é só metade do caminho. Sem acesso a campanhas de monetização, as visualizações não geram retorno." />
          <ContextCard icon="person" title="Tentando sozinho" description="Sem repertório nem comunidade, cada erro custa mais caro e cada acerto demora mais pra acontecer." />
        </div>
      </section>

      {/* 02 — O modelo */}
      <section className="max-w-4xl mx-auto px-6 py-10 sm:py-12">
        <SectionEyebrow num="02" label="O MODELO" />
        <SectionHead title="O que é a Comunidade DGS" hint="Aprendizado, ferramentas e monetização." />
        <p className="text-neutral-400 text-[15px] leading-relaxed max-w-xl mb-7">
          Uma comunidade que ensina como estruturar e crescer uma página do zero, e conecta você a campanhas musicais
          que pagam de acordo com as visualizações que você gera — tudo acompanhado dentro de uma plataforma própria.
        </p>
        <div className="dgs-card flex items-center justify-between flex-wrap gap-3 text-sm mb-7">
          <span className="text-neutral-400 whitespace-nowrap">você aprende</span>
          <span className="text-brand/60">→</span>
          <span className="text-neutral-400 whitespace-nowrap">estrutura sua página</span>
          <span className="text-brand/60">→</span>
          <span className="text-neutral-400 whitespace-nowrap">aquece o conteúdo</span>
          <span className="text-brand/60">→</span>
          <span className="text-brand font-semibold whitespace-nowrap">fatura por performance</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <BrandCard icon="video" title="Aulas ao vivo" description="Aprenda direto com quem já vive disso, em encontros práticos dentro da comunidade." />
          <BrandCard icon="sparkles" title="Templates e ferramentas prontas" description="Mais de 1.000 vídeos prontos pra modelar, e uma ferramenta própria de edição em massa pra acelerar sua produção." />
          <BrandCard icon="wallet" title="Pago por performance" description="Campanhas musicais remuneram de acordo com o volume de visualizações que o seu conteúdo gera." />
        </div>
      </section>

      {/* 03 — Razão */}
      <section className="max-w-4xl mx-auto px-6 py-10 sm:py-12">
        <SectionEyebrow num="03" label="RAZÃO" />
        <SectionHead title="Por que funciona" hint="Estratégia, comunidade e transparência." />
        <p className="text-neutral-400 text-[15px] leading-relaxed max-w-xl mb-3">
          <strong className="text-neutral-100">Pra sua página:</strong> aprender a estruturar e aquecer o conteúdo do
          jeito certo é o que separa um perfil que estagna de um que cresce de forma consistente — não depende de
          sorte, nem de viralizar uma vez só.
        </p>
        <p className="text-neutral-400 text-[15px] leading-relaxed max-w-xl mb-7">
          <strong className="text-neutral-100">Pra sua renda:</strong> em vez de esperar parcerias ou pagar por
          anúncio, você entra direto nas campanhas musicais disponíveis e fatura de acordo com o volume que gerar,
          com total transparência no seu dashboard.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <BrandCard icon="book" title="Aprendizado prático" description="Aulas e conteúdos direto ao ponto, sem enrolação, pensados pra quem quer aplicar e ver resultado." />
          <BrandCard icon="users" title="Comunidade ativa" description="Trocar com quem já passou pelos mesmos desafios acelera muito mais do que aprender sozinho." />
          <BrandCard icon="chart" title="Acompanhamento em tempo real" description="Dashboard próprio pra lançar e acompanhar seu faturamento por plataforma." />
        </div>
      </section>

      {/* 04 — Como funciona */}
      <section className="max-w-4xl mx-auto px-6 py-10 sm:py-12">
        <SectionEyebrow num="04" label="COMO FUNCIONA" />
        <SectionHead title="Como funciona" hint="Do cadastro ao seu primeiro faturamento." />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 relative">
          <div className="hidden sm:block absolute top-[26px] left-[12.5%] right-[12.5%] h-px bg-brand/25" />
          {HOW_IT_WORKS.map((step) => (
            <div key={step.num} className="relative">
              <div className="w-[52px] h-[52px] rounded-full border border-brand/40 bg-ink-900 flex items-center justify-center text-brand mb-4 relative z-10">
                <LineIcon name={step.icon} />
              </div>
              <div className="text-brand text-xs font-semibold mb-1.5">{step.num}</div>
              <div className="text-sm font-semibold mb-1.5">{step.title}</div>
              <div className="text-neutral-500 text-[13.5px] leading-relaxed">{step.description}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 05 — Resultados da comunidade */}
      <section id="resultados" className="max-w-4xl mx-auto px-6 py-10 sm:py-12">
        <SectionEyebrow num="05" label="RESULTADOS" />
        <SectionHead title="Resultados da comunidade" hint="Prints reais compartilhados pelos membros." />
        <ResultsCarousel />
      </section>

      {/* 06 — Benefícios */}
      <section id="beneficios" className="max-w-5xl mx-auto px-6 py-10 sm:py-12">
        <SectionEyebrow num="06" label="BENEFÍCIOS" />
        <SectionHead title="Tudo o que você precisa está dentro da comunidade" hint="Do primeiro clipe ao primeiro milhão de views." />
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

      {/* CTA final */}
      <section className="max-w-2xl mx-auto px-6 py-12 text-center">
        <h2 className="text-2xl font-bold mb-3">Pronto pra começar?</h2>
        <p className="text-neutral-500 text-sm mb-6">
          Cadastre-se e escolha o plano que faz mais sentido pro seu momento — o acesso é liberado automaticamente
          assim que o pagamento é confirmado.
        </p>
        <Link href="/cadastro" className="dgs-btn-primary w-auto px-8 py-3.5 no-underline inline-block">
          Quero fazer parte →
        </Link>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-2xl mx-auto px-6 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center">Tire suas dúvidas</h2>
        <FaqAccordion items={FAQ_ITEMS} />
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
