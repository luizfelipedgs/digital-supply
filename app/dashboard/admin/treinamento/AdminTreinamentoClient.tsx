"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { RichTextEditor } from "@/components/RichTextEditor";
import { DashboardHeader } from "@/components/DashboardHeader";
import { LineIcon } from "@/components/LineIcon";

type Lesson = {
  id: string;
  title: string;
  subtitle: string | null;
  content_type: string;
  body_text: string | null;
  video_url: string | null;
  is_bonus: boolean;
  order_index: number;
};

const emptyForm = {
  id: null as string | null,
  title: "",
  subtitle: "",
  contentType: "video" as "text" | "video",
  bodyHtml: "",
  videoUrl: "",
  isBonus: false,
};

export function AdminTreinamentoClient({ initialLessons }: { initialLessons: Lesson[] }) {
  const supabase = createClient();
  const [lessons, setLessons] = useState<Lesson[]>(
    [...initialLessons].sort((a, b) => a.order_index - b.order_index)
  );
  const [form, setForm] = useState<typeof emptyForm | null>(null);
  const [saving, setSaving] = useState(false);

  async function refresh() {
    const { data } = await supabase
      .from("treinamento_licoes")
      .select("id, title, subtitle, content_type, body_text, video_url, is_bonus, order_index")
      .order("order_index", { ascending: true });
    setLessons((data as Lesson[]) ?? []);
  }

  async function save() {
    if (!form || !form.title.trim()) return;
    setSaving(true);

    const payload = {
      title: form.title,
      subtitle: form.subtitle || null,
      content_type: form.contentType,
      body_text: form.contentType === "text" ? form.bodyHtml : null,
      video_url: form.contentType === "video" ? form.videoUrl : null,
      is_bonus: form.isBonus,
    };

    if (form.id) {
      await supabase.from("treinamento_licoes").update(payload).eq("id", form.id);
    } else {
      const maxOrder = lessons.reduce((max, l) => Math.max(max, l.order_index), 0);
      await supabase.from("treinamento_licoes").insert({ ...payload, order_index: maxOrder + 1 });
    }

    setForm(null);
    setSaving(false);
    refresh();
  }

  async function remove(id: string) {
    if (!confirm("Apagar esta aula do treinamento gratuito?")) return;
    await supabase.from("treinamento_licoes").delete().eq("id", id);
    refresh();
  }

  // Troca a posição da aula com a vizinha (acima ou abaixo), trocando os
  // order_index das duas — mesma lógica de reordenar por setas usada em
  // outras listas simples do painel admin.
  async function move(id: string, direction: "up" | "down") {
    const idx = lessons.findIndex((l) => l.id === id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (idx === -1 || swapIdx < 0 || swapIdx >= lessons.length) return;

    const current = lessons[idx];
    const swapWith = lessons[swapIdx];

    await Promise.all([
      supabase.from("treinamento_licoes").update({ order_index: swapWith.order_index }).eq("id", current.id),
      supabase.from("treinamento_licoes").update({ order_index: current.order_index }).eq("id", swapWith.id),
    ]);

    refresh();
  }

  function openEdit(lesson: Lesson) {
    setForm({
      id: lesson.id,
      title: lesson.title,
      subtitle: lesson.subtitle ?? "",
      contentType: lesson.content_type as any,
      bodyHtml: lesson.body_text ?? "",
      videoUrl: lesson.video_url ?? "",
      isBonus: lesson.is_bonus,
    });
  }

  return (
    <div className="min-h-screen bg-ink-900 p-6 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <DashboardHeader backHref="/dashboard/admin" backLabel="Voltar ao painel admin" />

        <div className="flex items-center gap-3 mt-6 mb-2">
          <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
            <LineIcon name="target" size={18} />
          </div>
          <h1 className="text-neutral-100 text-xl font-medium">Treinamento gratuito</h1>
        </div>
        <p className="text-neutral-500 text-sm mb-8">
          Aulas públicas em <span className="text-neutral-300">/treinamento</span>, sem necessidade de login — usadas
          como captação pra Comunidade DGS PRO.
        </p>

        <div className="flex flex-col gap-6">
          {form ? (
            <div className="dgs-card flex flex-col gap-3">
              <div className="text-neutral-100 font-medium text-sm mb-1">{form.id ? "Editar aula" : "Nova aula"}</div>
              <input
                className="dgs-input"
                placeholder="Título da aula"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <input
                className="dgs-input"
                placeholder="Subtítulo curto (opcional)"
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              />
              <select
                className="dgs-input"
                value={form.contentType}
                onChange={(e) => setForm({ ...form, contentType: e.target.value as any })}
              >
                <option value="video">Vídeo (YouTube/Vimeo não-listado, link de embed)</option>
                <option value="text">Texto (editor rico)</option>
              </select>
              {form.contentType === "video" && (
                <input
                  className="dgs-input"
                  placeholder="https://www.youtube.com/embed/..."
                  value={form.videoUrl}
                  onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                />
              )}
              {form.contentType === "text" && (
                <RichTextEditor
                  initialValue={form.bodyHtml}
                  onSave={(html) => setForm((f) => (f ? { ...f, bodyHtml: html } : f))}
                />
              )}
              <label className="flex items-center gap-2 text-neutral-400 text-sm">
                <input
                  type="checkbox"
                  checked={form.isBonus}
                  onChange={(e) => setForm({ ...form, isBonus: e.target.checked })}
                />
                Marcar como aula bônus
              </label>
              <div className="flex gap-2 mt-1">
                <button onClick={save} disabled={saving} className="dgs-btn-primary w-auto px-5">
                  Salvar aula
                </button>
                <button onClick={() => setForm(null)} className="dgs-btn-ghost">
                  cancelar
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setForm({ ...emptyForm })} className="dgs-btn-primary w-auto px-5 self-start">
              + nova aula
            </button>
          )}

          <div className="flex flex-col gap-2">
            {lessons.map((lesson, i) => (
              <div
                key={lesson.id}
                className="flex items-center justify-between gap-3 text-sm py-3 px-4 rounded-lg bg-white/[0.02] border border-white/5"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-neutral-500 shrink-0">
                    <LineIcon
                      name={lesson.is_bonus ? "gift" : lesson.content_type === "video" ? "play" : "note"}
                      size={15}
                    />
                  </span>
                  <div className="min-w-0">
                    <div className="text-neutral-200 truncate">{lesson.title}</div>
                    {lesson.subtitle && <div className="text-neutral-600 text-xs truncate">{lesson.subtitle}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => move(lesson.id, "up")}
                    disabled={i === 0}
                    className="dgs-btn-ghost !px-2 disabled:opacity-30"
                    title="Mover pra cima"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => move(lesson.id, "down")}
                    disabled={i === lessons.length - 1}
                    className="dgs-btn-ghost !px-2 disabled:opacity-30"
                    title="Mover pra baixo"
                  >
                    ↓
                  </button>
                  <button onClick={() => openEdit(lesson)} className="dgs-btn-ghost">
                    editar
                  </button>
                  <button onClick={() => remove(lesson.id)} className="dgs-btn-danger">
                    excluir
                  </button>
                </div>
              </div>
            ))}
            {lessons.length === 0 && <div className="text-neutral-600 text-xs">Nenhuma aula cadastrada ainda.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
