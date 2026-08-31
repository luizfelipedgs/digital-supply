"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LineIcon } from "@/components/LineIcon";

type Goal = {
  id: string;
  title: string;
  target_value: number | null;
  current_value: number;
  deadline: string | null;
  completed: boolean;
};

export function GoalsColumn({ userId }: { userId: string }) {
  const supabase = createClient();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await supabase
      .from("goals")
      .select("id, title, target_value, current_value, deadline, completed")
      .order("completed", { ascending: true })
      .order("created_at", { ascending: false });
    setGoals((data as Goal[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addGoal() {
    if (!title.trim()) return;
    await supabase.from("goals").insert({
      user_id: userId,
      title: title.trim(),
      target_value: target ? Number(target.replace(",", ".")) : null,
      deadline: deadline || null,
    });
    setTitle("");
    setTarget("");
    setDeadline("");
    setShowForm(false);
    load();
  }

  async function updateProgress(goal: Goal, delta: number) {
    const next = Math.max(0, Number(goal.current_value) + delta);
    const completed = goal.target_value ? next >= Number(goal.target_value) : goal.completed;
    await supabase.from("goals").update({ current_value: next, completed }).eq("id", goal.id);
    load();
  }

  async function deleteGoal(id: string) {
    await supabase.from("goals").delete().eq("id", id);
    load();
  }

  return (
    <div className="dgs-card flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <LineIcon name="target" size={16} className="text-brand" />
        <div className="text-neutral-100 font-medium text-sm">Metas</div>
      </div>

      {showForm ? (
        <div className="flex flex-col gap-2">
          <input className="dgs-input" placeholder="Nome da meta" value={title} onChange={(e) => setTitle(e.target.value)} />
          <div className="flex gap-2">
            <input
              className="dgs-input"
              placeholder="Valor alvo (opcional)"
              inputMode="decimal"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />
            <input type="date" className="dgs-input" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button onClick={addGoal} className="dgs-btn-primary w-auto px-4">
              Salvar
            </button>
            <button onClick={() => setShowForm(false)} className="text-neutral-500 text-xs">
              cancelar
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)} className="text-brand text-xs text-left">
          + nova meta
        </button>
      )}

      <div className="flex flex-col gap-3 mt-1">
        {loading && <div className="text-neutral-600 text-xs">Carregando…</div>}
        {!loading && goals.length === 0 && <div className="text-neutral-600 text-xs">Nenhuma meta ainda.</div>}
        {goals.map((goal) => {
          const pct = goal.target_value
            ? Math.min(100, (Number(goal.current_value) / Number(goal.target_value)) * 100)
            : null;
          return (
            <div key={goal.id} className={`rounded-lg border border-white/10 bg-white/[0.02] p-3 ${goal.completed ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="text-neutral-200 text-sm">{goal.title}</div>
                <button onClick={() => deleteGoal(goal.id)} className="text-red-400 text-xs shrink-0">
                  ×
                </button>
              </div>
              {goal.target_value ? (
                <>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mb-1.5">
                    <div
                      className={`h-full rounded-full ${goal.completed ? "bg-brand" : "bg-brand/70"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-neutral-500">
                    <span>
                      {Number(goal.current_value).toLocaleString("pt-BR")} / {Number(goal.target_value).toLocaleString("pt-BR")}
                    </span>
                    {!goal.completed && (
                      <div className="flex gap-1">
                        <button onClick={() => updateProgress(goal, -1)} className="px-1.5 border border-white/10 rounded">
                          −
                        </button>
                        <button onClick={() => updateProgress(goal, 1)} className="px-1.5 border border-white/10 rounded">
                          +
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-neutral-600 text-xs">sem valor numérico definido</div>
              )}
              {goal.deadline && (
                <div className="text-neutral-600 text-xs mt-1.5">até {goal.deadline.split("-").reverse().join("/")}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
