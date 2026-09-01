"use client";

import { LineIcon } from "@/components/LineIcon";
import { CREDIT_PACKAGES, creditCheckoutUrl } from "@/lib/video-credits";

export function CreditosClient({
  currentCredits,
  isAdmin,
  email,
}: {
  currentCredits: number;
  isAdmin: boolean;
  email: string | null;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="dgs-card flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-brand/10 flex items-center justify-center text-brand shrink-0">
          <LineIcon name="zap" />
        </div>
        <div>
          <div className="text-neutral-500 text-xs">Seu saldo atual</div>
          <div className="text-neutral-100 text-lg font-medium">
            {isAdmin ? "Ilimitado (admin)" : `${currentCredits} crédito${currentCredits === 1 ? "" : "s"}`}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {CREDIT_PACKAGES.map((pkg) => (
          <div
            key={pkg.id}
            className={`relative rounded-xl p-5 flex flex-col border ${
              pkg.featured ? "bg-brand/5 border-brand/40" : "bg-white/[0.03] border-white/10"
            }`}
          >
            {pkg.featured && (
              <div className="absolute -top-2.5 left-5 bg-brand text-ink-950 text-[10px] font-bold tracking-wider px-2.5 py-0.5 rounded-full">
                MAIS POPULAR
              </div>
            )}
            <div className={`text-xs font-bold tracking-wider mb-2 ${pkg.featured ? "text-brand" : "text-neutral-400"}`}>
              {pkg.label.toUpperCase()}
            </div>
            <div className="text-neutral-100 text-2xl font-bold mb-1">{pkg.price}</div>
            <div className="text-neutral-400 text-sm mb-5">{pkg.credits} créditos</div>
            <a
              href={creditCheckoutUrl(pkg, email)}
              className={`text-center no-underline rounded-lg py-2.5 text-sm font-bold tracking-wide uppercase transition-all mt-auto ${
                pkg.featured
                  ? "bg-brand text-ink-950 hover:brightness-110"
                  : "bg-white/5 text-neutral-100 border border-white/15 hover:bg-white/10"
              }`}
            >
              Comprar
            </a>
          </div>
        ))}
      </div>

      <p className="text-neutral-600 text-xs leading-relaxed">
        Depois de confirmado o pagamento, os créditos são adicionados ao seu perfil automaticamente — normalmente em
        poucos minutos.
      </p>
    </div>
  );
}
