import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";
import { LineIcon } from "@/components/LineIcon";
import { PLAN_LABEL, checkoutUrl } from "@/lib/plans";
import { SairLink } from "./SairLink";

export default async function AssinaturaExpiradaPage() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("status, plan, plan_expires_at, email, is_admin")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (!profile) redirect("/login");

  const expiredByDate = !!profile.plan_expires_at && new Date(profile.plan_expires_at).getTime() < Date.now();

  // Se por acaso a pessoa já renovou (ou é admin) e caiu aqui por um link
  // antigo, manda ela direto pro dashboard em vez de mostrar o aviso à toa.
  if (profile.is_admin || (profile.status === "active" && !expiredByDate)) {
    redirect("/dashboard");
  }

  const expiresLabel = profile.plan_expires_at
    ? new Date(profile.plan_expires_at).toLocaleDateString("pt-BR")
    : null;

  const renewUrl =
    profile.plan && ["mensal", "trimestral", "anual"].includes(profile.plan)
      ? checkoutUrl(profile.plan as any, profile.email)
      : null;

  return (
    <div className="dgs-scene">
      <div className="dgs-glow" style={{ left: "50%", top: "30%", transform: "translate(-50%,-50%)" }} />
      <div className="relative flex flex-col items-center w-full max-w-sm text-center">
        <Logo size={64} className="text-brand mb-6" />

        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-5">
          <LineIcon name="warning" size={24} />
        </div>

        <h1 className="text-neutral-100 text-xl font-semibold mb-2">
          {expiredByDate ? "Sua assinatura expirou" : "Seu acesso está suspenso"}
        </h1>
        <p className="text-neutral-500 text-sm leading-relaxed mb-1 max-w-xs">
          {expiredByDate && expiresLabel
            ? `Seu plano ${PLAN_LABEL[profile.plan ?? ""] ?? profile.plan} venceu em ${expiresLabel}.`
            : "Fale com o suporte se achar que isso é um engano."}
        </p>
        <p className="text-neutral-500 text-sm leading-relaxed mb-7 max-w-xs">
          Renove agora pra voltar a acessar a comunidade, o Editor de Músicas e todo o resto — sem precisar se
          cadastrar de novo, seu login continua o mesmo.
        </p>

        <div className="flex flex-col gap-3 w-full">
          {renewUrl && (
            <a href={renewUrl} className="dgs-btn-primary no-underline">
              Renovar plano {PLAN_LABEL[profile.plan ?? ""] ?? profile.plan}
            </a>
          )}
          <Link href="/planos" className="dgs-btn-ghost no-underline">
            {renewUrl ? "Ver outros planos" : "Ver planos disponíveis"}
          </Link>
        </div>

        <div className="mt-8">
          <SairLink />
        </div>
      </div>
      <div className="dgs-overlay" />
    </div>
  );
}
