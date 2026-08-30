"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DashboardHeader } from "@/components/DashboardHeader";

type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  nickname: string | null;
  status: string;
  plan: string | null;
  plan_expires_at: string | null;
  created_at: string;
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

export function AlunosClient({ initialProfiles }: { initialProfiles: Profile[] }) {
  const supabase = createClient();
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
  const [filter, setFilter] = useState<"all" | "pending" | "active" | "suspended">("pending");
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<"mensal" | "trimestral" | "anual">("mensal");
  const [saving, setSaving] = useState(false);

  async function refresh() {
    const { data } = await supabase
      .from("profiles")
      .select("id, email, full_name, nickname, status, plan, plan_expires_at, created_at")
      .order("created_at", { ascending: false });
    setProfiles(data ?? []);
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

  const filtered = useMemo(() => {
    if (filter === "all") return profiles;
    return profiles.filter((p) => p.status === filter);
  }, [profiles, filter]);

  const counts = useMemo(
    () => ({
      pending: profiles.filter((p) => p.status === "pending").length,
      active: profiles.filter((p) => p.status === "active").length,
      suspended: profiles.filter((p) => p.status === "suspended").length,
    }),
    [profiles]
  );

  return (
    <div className="min-h-screen bg-ink-900 p-6 sm:p-8">
      <div className="max-w-3xl mx-auto">
        <DashboardHeader backHref="/dashboard/admin" backLabel="Voltar ao painel admin" />
        <h1 className="text-neutral-100 text-xl font-medium mb-2">Alunos</h1>
        <p className="text-neutral-500 text-sm mb-6">
          Aprovação manual — use quando o webhook da Cakto falhar ou um aluno pedir acesso direto.
        </p>

        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { id: "pending", label: `Pendentes (${counts.pending})` },
            { id: "active", label: `Ativos (${counts.active})` },
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
        </div>

        <div className="flex flex-col gap-2">
          {filtered.length === 0 && <div className="text-neutral-600 text-sm">Nenhum aluno nesse filtro.</div>}

          {filtered.map((p) => (
            <div key={p.id} className="dgs-card flex flex-col gap-3">
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
                    <span className="text-[10px] px-2 py-1 rounded-full border border-white/10 text-neutral-400">
                      {p.plan}
                      {p.plan_expires_at ? ` · até ${new Date(p.plan_expires_at).toLocaleDateString("pt-BR")}` : ""}
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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
