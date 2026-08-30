import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";
import { DashboardHeader } from "@/components/DashboardHeader";
import { TodayEarningsCard } from "./TodayEarningsCard";
import { PLAN_LABEL, checkoutUrl } from "@/lib/plans";
import { dailySeries, sumInRange, subtractDays, todayISO } from "@/lib/earnings";

const WEEKDAY_LABEL = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("status, full_name, nickname, plan, plan_expires_at, is_admin, email")
    .eq("id", userData.user.id)
    .single();

  if (!profile || profile.status === "pending") redirect("/aguardando");
  if (profile.status !== "active") redirect("/login");

  const { data: settings } = await supabase.from("site_settings").select("cover_path").eq("id", "main").maybeSingle();
  const coverUrl = settings?.cover_path
    ? supabase.storage.from("content-covers").getPublicUrl(settings.cover_path).data.publicUrl
    : null;

  const displayName = (profile.nickname || profile.full_name || "aluno").split(" ")[0];

  let expiresLabel: string | null = null;
  let daysRemaining: number | null = null;
  if (profile.plan_expires_at) {
    const expiresDate = new Date(profile.plan_expires_at);
    expiresLabel = expiresDate.toLocaleDateString("pt-BR");
    daysRemaining = Math.ceil((expiresDate.getTime() - Date.now()) / 86400000);
  }

  const showRenewalWarning = daysRemaining !== null && daysRemaining <= 3 && daysRemaining >= 0;
  const renewUrl =
    profile.plan && ["mensal", "trimestral", "anual"].includes(profile.plan)
      ? checkoutUrl(profile.plan as any, profile.email)
      : null;

  // Faturamento dos últimos 7 dias, pro mini-gráfico da home
  const today = todayISO();
  const weekStart = subtractDays(today, 6);
  const { data: recentEarnings } = await supabase
    .from("earnings")
    .select("entry_date, amount")
    .eq("user_id", userData.user.id)
    .gte("entry_date", weekStart)
    .lte("entry_date", today);

  const earningsEntries = recentEarnings ?? [];
  const todayTotal = sumInRange(earningsEntries, today, today);
  const weekSeries = dailySeries(earningsEntries, weekStart, today).map((d) => ({
    ...d,
    label: WEEKDAY_LABEL[new Date(d.date + "T00:00:00Z").getUTCDay()],
  }));

  const sections = [
    {
      href: "/dashboard/faturamento",
      icon: "💰",
      title: "Faturamento",
      description: "Lance seus ganhos por plataforma e acompanhe sua evolução com gráficos e comparativos.",
    },
    {
      href: "/dashboard/produtividade",
      icon: "🎯",
      title: "Anotações, tarefas e metas",
      description: "Organize sua rotina diária, defina metas de performance e guarde ideias e anotações.",
    },
    {
      href: "/dashboard/conteudos",
      icon: "📚",
      title: "Conteúdos",
      description: "Aulas em texto, áudio e vídeo, organizadas por módulo, com acompanhamento de progresso.",
    },
  ];

  return (
    <div className="min-h-screen bg-ink-900 p-6 sm:p-10 flex flex-col">
      <div className="max-w-5xl w-full mx-auto">
        <DashboardHeader
          left={
            <div className="flex items-center gap-3">
              <Logo size={36} className="text-brand" />
              <div>
                <div className="text-neutral-100 font-medium text-sm">Olá, {displayName}</div>
                <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                  Assinatura {PLAN_LABEL[profile.plan ?? ""] ?? profile.plan}
                  {expiresLabel ? ` · Ativa até ${expiresLabel}` : " · ativa"}
                </div>
              </div>
            </div>
          }
          extraRight={
            profile.is_admin ? (
              <Link href="/dashboard/admin" className="dgs-btn-ghost no-underline">
                Painel admin
              </Link>
            ) : undefined
          }
        />
      </div>

      <div className="max-w-5xl w-full mx-auto mb-2">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt=""
            className="w-full h-32 sm:h-44 object-cover rounded-2xl border border-white/10"
          />
        ) : (
          <div className="w-full h-32 sm:h-44 rounded-2xl border border-white/10 bg-gradient-to-br from-brand/10 via-white/[0.02] to-transparent" />
        )}
      </div>

      <div className="max-w-5xl w-full mx-auto">
        {showRenewalWarning && renewUrl && (
          <div className="dgs-card border-brand/30 bg-brand/5 flex items-center justify-between gap-4 mb-8 mt-6 flex-wrap">
            <div>
              <div className="text-neutral-100 text-sm font-medium mb-1">
                {daysRemaining === 0 ? "Sua assinatura expira hoje" : `Sua assinatura expira em ${daysRemaining} dia${daysRemaining === 1 ? "" : "s"}`}
              </div>
              <div className="text-neutral-500 text-xs">Renove agora pra não perder o acesso à comunidade.</div>
            </div>
            <a href={renewUrl} className="dgs-btn-primary w-auto px-5 whitespace-nowrap">
              Renovar assinatura
            </a>
          </div>
        )}

        <div className="mb-8 mt-6">
          <div className="text-neutral-100 text-lg font-medium mb-1">Bem-vindo de volta</div>
          <div className="text-neutral-500 text-sm">Escolha uma área pra continuar.</div>
        </div>

        <TodayEarningsCard series={weekSeries} todayTotal={todayTotal} />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {sections.map((s) => (
            <Link key={s.href} href={s.href} className="dgs-card dgs-hover-card no-underline flex flex-col gap-4">
              <div className="w-11 h-11 rounded-xl bg-brand/10 flex items-center justify-center text-xl">{s.icon}</div>
              <div>
                <div className="text-neutral-100 font-medium mb-1.5">{s.title}</div>
                <div className="text-neutral-500 text-sm leading-relaxed">{s.description}</div>
              </div>
              <div className="text-brand text-xs mt-auto pt-1">Acessar →</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
