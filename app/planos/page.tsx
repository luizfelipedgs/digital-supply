"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";

const CHECKOUT_LINKS = {
  mensal: "https://pay.cakto.com.br/33i9p85_1029588",
  trimestral: "https://pay.cakto.com.br/32u4hd6",
  anual: "https://pay.cakto.com.br/hpdu9fn",
};

const PLANS: {
  id: keyof typeof CHECKOUT_LINKS;
  label: string;
  price: string;
  sub: string;
  featured?: boolean;
}[] = [
  { id: "mensal", label: "MENSAL", price: "R$ 47,90", sub: "por mês" },
  { id: "trimestral", label: "TRIMESTRAL", price: "R$ 129,90", sub: "equivale a R$ 43,30/mês", featured: true },
  { id: "anual", label: "ANUAL", price: "R$ 527,90", sub: "equivale a R$ 43,99/mês" },
];

export default function PlanosPage() {
  const supabase = createClient();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, [supabase]);

  function checkoutUrl(plan: keyof typeof CHECKOUT_LINKS) {
    const base = CHECKOUT_LINKS[plan];
    if (!email) return base;
    const params = new URLSearchParams({ email, confirmEmail: email });
    return `${base}?${params.toString()}`;
  }

  return (
    <div className="dgs-scene">
      <div className="dgs-glow" style={{ left: "50%", top: "8%", transform: "translate(-50%,-50%)", width: 260, height: 260 }} />
      <div className="relative flex flex-col items-center w-full max-w-2xl">
        <Logo size={44} className="text-brand mb-2" />
        <div className="text-brand text-[10px] tracking-[5px] mb-4">COMUNIDADE DGS</div>
        <div className="text-neutral-100 text-xl font-medium mb-8 text-center">
          Escolha seu plano de acesso
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-xl p-5 flex flex-col items-center text-center border ${
                plan.featured
                  ? "bg-brand/5 border-brand/30"
                  : "bg-white/[0.03] border-white/10"
              }`}
            >
              <div className={`text-xs tracking-widest mb-2.5 ${plan.featured ? "text-brand" : "text-neutral-400"}`}>
                {plan.label}
              </div>
              <div className="text-neutral-100 text-xl font-medium mb-1">{plan.price}</div>
              <div className="text-neutral-500 text-[11px] mb-4">{plan.sub}</div>
              <a href={checkoutUrl(plan.id)} className="dgs-btn-primary text-center no-underline">
                Assinar
              </a>
            </div>
          ))}
        </div>

        <p className="text-neutral-500 text-xs mt-8 text-center max-w-md">
          Depois de confirmado o pagamento, seu acesso é liberado automaticamente —
          normalmente em poucos minutos.
        </p>
      </div>
    </div>
  );
}
