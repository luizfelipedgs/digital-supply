"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { todayISO } from "@/lib/earnings";
import { LineIcon } from "@/components/LineIcon";

type Task = { id: string; title: string; notes: string | null; done: boolean; due_date: string | null };

export function TasksColumn({ userId }: { userId: string }) {
  const supabase = createClient();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await supabase
      .from("tasks")
      .select("id, title, notes, done, due_date")
      .order("done", { ascending: true })
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });
    setTasks((data as Task[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addTask() {
    if (!newTitle.trim()) return;
    await supabase.from("tasks").insert({
      user_id: userId,
      title: newTitle.trim(),
      due_date: newDueDate || null,
    });
    setNewTitle("");
    setNewDueDate("");
    setShowForm(false);
    load();
  }

  async function toggleTask(task: Task) {
    await supabase.from("tasks").update({ done: !task.done }).eq("id", task.id);
    load();
  }

  async function deleteTask(id: string) {
    await supabase.from("tasks").delete().eq("id", id);
    load();
  }

  const today = todayISO();

  return (
    <div className="dgs-card flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <LineIcon name="check" size={16} className="text-brand" />
        <div className="text-neutral-100 font-medium text-sm">Tarefas</div>
      </div>

      {showForm ? (
        <div className="flex flex-col gap-2">
          <input
            className="dgs-input"
            placeholder="Nova tarefa"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            autoFocus
          />
          <input
            type="date"
            className="dgs-input"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
          />
          <div className="flex gap-2">
            <button onClick={addTask} className="dgs-btn-primary w-auto px-4">
              Salvar
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setNewTitle("");
                setNewDueDate("");
              }}
              className="text-neutral-500 text-xs"
            >
              cancelar
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)} className="text-brand text-xs text-left">
          + nova tarefa
        </button>
      )}

      <div className="flex flex-col gap-1.5 mt-1">
        {loading && <div className="text-neutral-600 text-xs">Carregando…</div>}
        {!loading && tasks.length === 0 && <div className="text-neutral-600 text-xs">Nenhuma tarefa ainda.</div>}
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 border ${
              task.done ? "border-white/5 bg-white/[0.01] opacity-50" : "border-white/10 bg-white/[0.02]"
            }`}
          >
            <input type="checkbox" checked={task.done} onChange={() => toggleTask(task)} className="accent-brand" />
            <div className="flex-1 min-w-0">
              <div className={`text-sm truncate ${task.done ? "text-neutral-500 line-through" : "text-neutral-200"}`}>
                {task.title}
              </div>
              {task.due_date && (
                <div className={`text-xs ${task.due_date < today && !task.done ? "text-red-400" : "text-neutral-600"}`}>
                  {task.due_date.split("-").reverse().join("/")}
                </div>
              )}
            </div>
            <button onClick={() => deleteTask(task.id)} className="text-red-400 text-xs hover:text-red-300">
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
