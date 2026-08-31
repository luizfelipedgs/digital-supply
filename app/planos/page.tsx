"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CHECKOUT_LINKS, checkoutUrl } from "@/lib/plans";
import { LineIcon } from "@/components/LineIcon";

const PLANS: {
  id: keyof typeof CHECKOUT_LINKS;
  label: string;
  price: string;
  duration: string;
  description: string;
  featured?: boolean;
}[] = [
  {
    id: "mensal",
    label: "ASSINATURA MENSAL",
    price: "R$ 47,90",
    duration: "30 dias de acesso à comunidade",
    description: "Ideal para começar sua jornada, acompanhar as aulas ao vivo e colocar as estratégias em prática.",
  },
  {
    id: "trimestral",
    label: "ASSINATURA TRIMESTRAL",
    price: "R$ 129,90",
    duration: "90 dias de acesso à comunidade",
    description: "Mais tempo para aprender, aplicar as estratégias, testar seus conteúdos e evoluir suas páginas.",
    featured: true,
  },
  {
    id: "anual",
    label: "ASSINATURA ANUAL",
    price: "R$ 527,90",
    duration: "365 dias de acesso à comunidade",
    description:
      "Para quem decidiu construir sua operação no digital a longo prazo e acompanhar continuamente as estratégias, atualizações e oportunidades da comunidade.",
  },
];

export default function PlanosPage() {
  const supabase = createClient();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, [supabase]);

  function planUrl(plan: keyof typeof CHECKOUT_LINKS) {
    return checkoutUrl(plan, email);
  }

  return (
    <div className="dgs-scene py-16" style={{ alignItems: "flex-start" }}>
      <div className="dgs-glow" style={{ left: "50%", top: "6%", transform: "translate(-50%,-50%)", width: 320, height: 320 }} />
      <div className="relative flex flex-col items-center w-full max-w-4xl">
        <h1 className="text-neutral-100 text-3xl sm:text-4xl font-semibold mb-3 text-center dgs-fade-up">
          Escolha seu plano
        </h1>
        <p
          className="text-neutral-500 text-sm mb-10 text-center max-w-md dgs-fade-up"
          style={{ animationDelay: "0.15s" }}
        >
          Tenha acesso à comunidade pelo período que fizer mais sentido para o seu momento.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full">
          {PLANS.map((plan, i) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-6 flex flex-col border dgs-fade-up transition-all duration-300 ${
                plan.featured
                  ? "bg-brand/5 border-brand/40 sm:-translate-y-2 hover:shadow-[0_0_36px_-10px_rgba(154,205,50,0.5)]"
                  : "bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05]"
              }`}
              style={{ animationDelay: `${0.3 + i * 0.12}s` }}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand text-ink-950 text-[10px] font-bold tracking-wider px-3 py-1 rounded-full whitespace-nowrap">
                  MAIS POPULAR
                </div>
              )}

              <div className={`text-xs font-bold tracking-wider mb-3 ${plan.featured ? "text-brand" : "text-neutral-400"}`}>
                {plan.label}
              </div>
              <div className="text-neutral-100 text-3xl font-bold mb-1">{plan.price}</div>
              <div className="text-neutral-300 text-xs font-medium mb-4">{plan.duration}</div>
              <p className="text-neutral-500 text-sm leading-relaxed mb-6 flex-1">{plan.description}</p>

              <a
                href={planUrl(plan.id)}
                className={`text-center no-underline rounded-lg py-3 text-sm font-bold tracking-wide uppercase transition-all ${
                  plan.featured
                    ? "bg-brand text-ink-950 hover:brightness-110"
                    : "bg-white/5 text-neutral-100 border border-white/15 hover:bg-white/10"
                }`}
              >
                Assinar agora
              </a>
            </div>
          ))}
        </div>

        <div
          className="dgs-card w-full max-w-2xl mt-10 dgs-fade-up"
          style={{ animationDelay: "0.55s" }}
        >
          <div className="w-11 h-11 rounded-xl bg-brand/10 flex items-center justify-center text-brand mb-4">
            <LineIcon name="users" />
          </div>
          <h2 className="text-neutral-100 text-xl font-bold mb-4">Para quem é a DGS</h2>
          <div className="text-neutral-400 text-sm leading-relaxed flex flex-col gap-4">
            <p>
              A Digital Supply reúne pessoas que querem construir uma fonte de renda real através de páginas de
              conteúdo digital, unindo estratégia, constância e monetização por meio de campanhas musicais.
            </p>
            <p>
              Se você já tem alguma experiência com redes sociais ou criação de conteúdo — ou está disposto a
              desenvolver essa habilidade — vai encontrar aqui um caminho estruturado, com acompanhamento e
              comunidade.
            </p>
            <p>
              Não é para quem busca fórmula mágica. É para quem está pronto para aprender, aplicar e evoluir junto
              com outras pessoas com o mesmo objetivo.
            </p>
          </div>
        </div>

        <p className="text-neutral-600 text-xs mt-10 text-center max-w-md dgs-fade-up" style={{ animationDelay: "0.7s" }}>
          Depois de confirmado o pagamento, seu acesso é liberado automaticamente — normalmente em poucos minutos.
        </p>
      </div>
    </div>
  );
}
