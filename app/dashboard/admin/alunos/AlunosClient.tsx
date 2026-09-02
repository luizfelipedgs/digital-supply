"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DashboardHeader } from "@/components/DashboardHeader";
import { PLAN_LABEL, planMonthlyEquivalent } from "@/lib/plans";

type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  nickname: string | null;
  status: string;
  plan: string | null;
  plan_expires_at: string | null;
  created_at: string;
  desktop_app_purchased: boolean;
};

const PLAN_DAYS: Record<string, number> = { mensal: 30, trimestral: 90, anual: 365 };
const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  active: "Ativo",
  suspended: "Suspenso",
  canceled: "Cancelado",
};
const STATUS_COLOR: Record<string, string> = {
  pending: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  active: "text-brand bg-brand/10 border-brand/20",
  suspended: "text-red-400 bg-red-400/10 border-red-400/20",
  canceled: "text-neutral-500 bg-white/5 border-white/10",
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function AlunosClient({
  initialProfiles,
  monthRevenue,
}: {
  initialProfiles: Profile[];
  monthRevenue: number;
}) {
  const supabase = createClient();
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
  const [filter, setFilter] = useState<"all" | "pending" | "active" | "suspended">("active");
  const [search, setSearch] = useState("");
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<"mensal" | "trimestral" | "anual">("mensal");
  const [saving, setSaving] = useState(false);

  async function refresh() {
    const { data } = await supabase
      .from("profiles")
      .select("id, email, full_name, nickname, status, plan, plan_expires_at, created_at, desktop_app_purchased")
      .order("created_at", { ascending: false });
    setProfiles(data ?? []);
  }

  async function toggleDesktopAccess(id: string, current: boolean) {
    const next = !current;
    const label = next ? "liberar" : "revogar";
    if (!confirm(`Confirma ${label} o acesso ao Editor de Músicas Desktop pra esse aluno?`)) return;
    await supabase
      .from("profiles")
      .update({
        desktop_app_purchased: next,
        desktop_app_purchased_at: next ? new Date().toISOString() : null,
      })
      .eq("id", id);
    refresh();
  }

  async function approve(id: string) {
    setSaving(true);
    const days = PLAN_DAYS[selectedPlan];
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    await supabase
      .from("profiles")
      .update({
        status: "active",
        plan: selectedPlan,
        plan_activated_at: new Date().toISOString(),
        plan_expires_at: expiresAt,
      })
      .eq("id", id);
    setSaving(false);
    setApprovingId(null);
    refresh();
  }

  async function setStatus(id: string, status: string) {
    if (!confirm(`Confirma mudar o status pra "${STATUS_LABEL[status]}"?`)) return;
    await supabase.from("profiles").update({ status }).eq("id", id);
    refresh();
  }

  const activeProfiles = useMemo(() => profiles.filter((p) => p.status === "active"), [profiles]);

  const mrr = useMemo(
    () => activeProfiles.reduce((sum, p) => sum + planMonthlyEquivalent(p.plan ?? ""), 0),
    [activeProfiles]
  );

  const planCounts = useMemo(() => {
    const counts: Record<string, number> = { mensal: 0, trimestral: 0, anual: 0 };
    for (const p of activeProfiles) {
      if (p.plan && counts[p.plan] !== undefined) counts[p.plan]++;
    }
    return counts;
  }, [activeProfiles]);

  const expiringSoonCount = useMemo(() => {
    const now = Date.now();
    const in3days = now + 3 * 24 * 60 * 60 * 1000;
    return activeProfiles.filter((p) => {
      if (!p.plan_expires_at) return false;
      const t = new Date(p.plan_expires_at).getTime();
      return t >= now && t <= in3days;
    }).length;
  }, [activeProfiles]);

  const counts = useMemo(
    () => ({
      pending: profiles.filter((p) => p.status === "pending").length,
      active: activeProfiles.length,
      suspended: profiles.filter((p) => p.status === "suspended").length,
    }),
    [profiles, activeProfiles]
  );

  const filtered = useMemo(() => {
    let list = filter === "all" ? profiles : profiles.filter((p) => p.status === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.email?.toLowerCase().includes(q) ||
          p.full_name?.toLowerCase().includes(q) ||
          p.nickname?.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      if (!a.plan_expires_at) return 1;
      if (!b.plan_expires_at) return -1;
      return new Date(a.plan_expires_at).getTime() - new Date(b.plan_expires_at).getTime();
    });
  }, [profiles, filter, search]);

  function daysUntil(iso: string) {
    return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
  }

  return (
    <div className="min-h-screen bg-ink-900 p-6 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <DashboardHeader backHref="/dashboard/admin" backLabel="Voltar ao painel admin" />
        <h1 className="text-neutral-100 text-xl font-medium mb-2">Alunos</h1>
        <p className="text-neutral-500 text-sm mb-6">
          Visão geral das assinaturas, receita recorrente e aprovação manual de fallback.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="dgs-card !p-4">
            <div className="text-neutral-500 text-xs mb-1">Assinaturas ativas</div>
            <div className="text-neutral-100 text-xl font-bold">{counts.active}</div>
          </div>
          <div className="dgs-card !p-4">
            <div className="text-neutral-500 text-xs mb-1">Receita recorrente (MRR)</div>
            <div className="text-brand text-xl font-bold">{formatCurrency(mrr)}</div>
            <div className="text-neutral-600 text-[10px] mt-0.5">estimativa mensal</div>
          </div>
          <div className="dgs-card !p-4">
            <div className="text-neutral-500 text-xs mb-1">Recebido este mês</div>
            <div className="text-neutral-100 text-xl font-bold">{formatCurrency(monthRevenue)}</div>
            <div className="text-neutral-600 text-[10px] mt-0.5">pagamentos confirmados</div>
          </div>
          <div className="dgs-card !p-4">
            <div className="text-neutral-500 text-xs mb-1">Expirando em ≤3 dias</div>
            <div className={`text-xl font-bold ${expiringSoonCount > 0 ? "text-yellow-400" : "text-neutral-100"}`}>
              {expiringSoonCount}
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {(["mensal", "trimestral", "anual"] as const).map((p) => (
            <div key={p} className="text-xs px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.02] text-neutral-400">
              {PLAN_LABEL[p]}: <span className="text-neutral-200 font-medium">{planCounts[p]}</span> ativos
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-4 flex-wrap items-center">
          {[
            { id: "active", label: `Ativos (${counts.active})` },
            { id: "pending", label: `Pendentes (${counts.pending})` },
            { id: "suspended", label: `Suspensos (${counts.suspended})` },
            { id: "all", label: "Todos" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={`text-xs rounded-lg px-3 py-1.5 border transition-colors ${
                filter === f.id ? "bg-brand/10 border-brand/30 text-brand" : "border-white/10 text-neutral-400 hover:bg-white/5"
              }`}
            >
              {f.label}
            </button>
          ))}
          <input
            className="dgs-input w-auto flex-1 min-w-[160px] ml-auto"
            placeholder="Buscar por nome ou e-mail…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          {filtered.length === 0 && <div className="text-neutral-600 text-sm">Nenhum aluno nesse filtro.</div>}

          {filtered.map((p) => {
            const days = p.plan_expires_at ? daysUntil(p.plan_expires_at) : null;
            const expiringSoon = p.status === "active" && days !== null && days <= 3 && days >= 0;
            return (
              <div key={p.id} className={`dgs-card flex flex-col gap-3 ${expiringSoon ? "border-yellow-400/30" : ""}`}>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <div className="text-neutral-200 text-sm font-medium">{p.nickname || p.full_name || "Sem nome"}</div>
                    <div className="text-neutral-500 text-xs">{p.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-1 rounded-full border ${STATUS_COLOR[p.status]}`}>
                      {STATUS_LABEL[p.status] ?? p.status}
                    </span>
                    {p.plan && (
                      <span
                        className={`text-[10px] px-2 py-1 rounded-full border ${
                          expiringSoon ? "border-yellow-400/30 text-yellow-400" : "border-white/10 text-neutral-400"
                        }`}
                      >
                        {PLAN_LABEL[p.plan] ?? p.plan}
                        {p.plan_expires_at
                          ? ` · até ${new Date(p.plan_expires_at).toLocaleDateString("pt-BR")}${
                              expiringSoon ? ` (${days}d)` : ""
                            }`
                          : ""}
                      </span>
                    )}
                  </div>
                </div>

                {p.status === "pending" && (
                  <div className="border-t border-white/10 pt-3">
                    {approvingId === p.id ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <select
                          className="dgs-input w-auto"
                          value={selectedPlan}
                          onChange={(e) => setSelectedPlan(e.target.value as any)}
                        >
                          <option value="mensal">Mensal (30 dias)</option>
                          <option value="trimestral">Trimestral (90 dias)</option>
                          <option value="anual">Anual (365 dias)</option>
                        </select>
                        <button onClick={() => approve(p.id)} disabled={saving} className="dgs-btn-primary w-auto px-4">
                          Confirmar aprovação
                        </button>
                        <button onClick={() => setApprovingId(null)} className="dgs-btn-ghost">
                          cancelar
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setApprovingId(p.id)} className="dgs-btn-primary w-auto px-4">
                        Aprovar acesso
                      </button>
                    )}
                  </div>
                )}

                {p.status === "active" && (
                  <div className="border-t border-white/10 pt-3">
                    <button onClick={() => setStatus(p.id, "suspended")} className="dgs-btn-danger">
                      Suspender acesso
                    </button>
                  </div>
                )}

                {p.status === "suspended" && (
                  <div className="border-t border-white/10 pt-3">
                    <button onClick={() => setStatus(p.id, "active")} className="dgs-btn-primary w-auto px-4">
                      Reativar acesso
                    </button>
                  </div>
                )}

                <div className="border-t border-white/10 pt-3 flex items-center justify-between gap-3 flex-wrap">
                  <span className="text-neutral-500 text-xs">
                    Editor de Músicas Desktop:{" "}
                    <span className={p.desktop_app_purchased ? "text-brand" : "text-neutral-500"}>
                      {p.desktop_app_purchased ? "liberado" : "não liberado"}
                    </span>
                  </span>
                  <button
                    onClick={() => toggleDesktopAccess(p.id, p.desktop_app_purchased)}
                    className={p.desktop_app_purchased ? "dgs-btn-danger w-auto px-4" : "dgs-btn-primary w-auto px-4"}
                  >
                    {p.desktop_app_purchased ? "Revogar acesso desktop" : "Liberar acesso desktop"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
