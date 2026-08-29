"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DashboardHeader } from "@/components/DashboardHeader";

type Announcement = { id: string; title: string; body: string | null; created_at: string };

export function AvisosClient({
  initialAnnouncements,
  userId,
}: {
  initialAnnouncements: Announcement[];
  userId: string;
}) {
  const supabase = createClient();
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  async function refresh() {
    const { data } = await supabase
      .from("announcements")
      .select("id, title, body, created_at")
      .order("created_at", { ascending: false });
    setAnnouncements(data ?? []);
  }

  async function publish() {
    if (!title.trim()) return;
    setSaving(true);
    await supabase.from("announcements").insert({ title: title.trim(), body: body || null, created_by: userId });
    setTitle("");
    setBody("");
    setSaving(false);
    refresh();
  }

  async function remove(id: string) {
    if (!confirm("Apagar este aviso?")) return;
    await supabase.from("announcements").delete().eq("id", id);
    refresh();
  }

  return (
    <div className="min-h-screen bg-ink-900 p-6 sm:p-8">
      <div className="max-w-xl mx-auto">
        <DashboardHeader backHref="/dashboard" />
        <h1 className="text-neutral-100 text-xl font-medium mb-6">Avisos para os alunos</h1>

        <div className="flex flex-col gap-6">
        <div className="dgs-card flex flex-col gap-3">
          <div className="text-neutral-100 font-medium text-sm">Publicar novo aviso</div>
          <input className="dgs-input" placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea
            className="dgs-input"
            rows={3}
            placeholder="Mensagem (opcional)"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <button onClick={publish} disabled={saving} className="dgs-btn-primary w-auto px-5 self-start">
            {saving ? "Publicando…" : "Publicar aviso"}
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {announcements.map((a) => (
            <div key={a.id} className="dgs-card flex items-start justify-between gap-3">
              <div>
                <div className="text-neutral-200 text-sm mb-1">{a.title}</div>
                {a.body && <div className="text-neutral-500 text-xs leading-relaxed mb-1">{a.body}</div>}
                <div className="text-neutral-600 text-[10px]">
                  {new Date(a.created_at).toLocaleString("pt-BR")}
                </div>
              </div>
              <button onClick={() => remove(a.id)} className="dgs-btn-danger shrink-0">
                excluir
              </button>
            </div>
          ))}
          {announcements.length === 0 && <div className="text-neutral-600 text-xs">Nenhum aviso publicado ainda.</div>}
        </div>
        </div>
      </div>
    </div>
  );
}
