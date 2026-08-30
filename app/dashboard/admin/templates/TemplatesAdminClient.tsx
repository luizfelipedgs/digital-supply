"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DashboardHeader } from "@/components/DashboardHeader";
import { toYoutubeEmbedUrl } from "@/lib/youtube";

type Template = { id: string; name: string; canva_url: string; description: string | null; order_index: number };

export function TemplatesAdminClient({
  initialTutorialUrl,
  initialDescription,
  initialTemplates,
}: {
  initialTutorialUrl: string;
  initialDescription: string;
  initialTemplates: Template[];
}) {
  const supabase = createClient();

  const [tutorialUrl, setTutorialUrl] = useState(initialTutorialUrl);
  const [description, setDescription] = useState(initialDescription);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const [templates, setTemplates] = useState<Template[]>(initialTemplates);
  const [form, setForm] = useState<{ id: string | null; name: string; canva_url: string; description: string } | null>(
    null
  );
  const [savingTemplate, setSavingTemplate] = useState(false);

  async function saveSettings() {
    setSavingSettings(true);
    await supabase
      .from("templates_settings")
      .update({ tutorial_video_url: tutorialUrl || null, description: description || null, updated_at: new Date().toISOString() })
      .eq("id", "main");
    setSavingSettings(false);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  }

  async function refreshTemplates() {
    const { data } = await supabase
      .from("templates")
      .select("id, name, canva_url, description, order_index")
      .order("order_index", { ascending: true });
    setTemplates(data ?? []);
  }

  async function saveTemplate() {
    if (!form || !form.name.trim() || !form.canva_url.trim()) return;
    setSavingTemplate(true);

    const payload = {
      name: form.name.trim(),
      canva_url: form.canva_url.trim(),
      description: form.description || null,
    };

    if (form.id) {
      await supabase.from("templates").update(payload).eq("id", form.id);
    } else {
      await supabase.from("templates").insert({ ...payload, order_index: templates.length });
    }

    setForm(null);
    setSavingTemplate(false);
    refreshTemplates();
  }

  async function deleteTemplate(id: string) {
    if (!confirm("Apagar este template?")) return;
    await supabase.from("templates").delete().eq("id", id);
    refreshTemplates();
  }

  const previewEmbed = tutorialUrl ? toYoutubeEmbedUrl(tutorialUrl) : null;

  return (
    <div className="min-h-screen bg-ink-900 p-6 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <DashboardHeader backHref="/dashboard/templates" backLabel="Voltar aos templates" />
        <h1 className="text-neutral-100 text-xl font-medium mb-6">Gerenciar templates</h1>

        {/* Vídeo tutorial + texto */}
        <div className="dgs-card flex flex-col gap-3 mb-6">
          <div className="text-neutral-100 font-medium text-sm">Vídeo tutorial (YouTube)</div>
          <input
            className="dgs-input"
            placeholder="https://www.youtube.com/watch?v=..."
            value={tutorialUrl}
            onChange={(e) => setTutorialUrl(e.target.value)}
          />
          {tutorialUrl && !previewEmbed && (
            <p className="text-red-400 text-xs">Não consegui reconhecer esse link como um vídeo do YouTube.</p>
          )}
          {previewEmbed && (
            <div className="aspect-video rounded-lg overflow-hidden border border-white/10">
              <iframe src={previewEmbed} className="w-full h-full" allowFullScreen />
            </div>
          )}

          <div className="text-neutral-100 font-medium text-sm mt-2">Texto explicativo</div>
          <textarea
            className="dgs-input"
            rows={4}
            placeholder="Explique como usar os templates, orientações gerais, etc."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <button onClick={saveSettings} disabled={savingSettings} className="dgs-btn-primary w-auto px-5 self-start">
            {savingSettings ? "Salvando…" : settingsSaved ? "✓ Salvo" : "Salvar"}
          </button>
        </div>

        {/* Form de novo/editar template */}
        {form ? (
          <div className="dgs-card flex flex-col gap-3 mb-6">
            <div className="text-neutral-100 font-medium text-sm">{form.id ? "Editar template" : "Novo template"}</div>
            <input
              className="dgs-input"
              placeholder="Nome (ex: Template 1 - Morpheus)"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              className="dgs-input"
              placeholder="Link do Canva"
              value={form.canva_url}
              onChange={(e) => setForm({ ...form, canva_url: e.target.value })}
            />
            <input
              className="dgs-input"
              placeholder="Descrição curta (opcional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <div className="flex gap-2">
              <button onClick={saveTemplate} disabled={savingTemplate} className="dgs-btn-primary w-auto px-5">
                Salvar template
              </button>
              <button onClick={() => setForm(null)} className="dgs-btn-ghost">
                cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setForm({ id: null, name: "", canva_url: "", description: "" })}
            className="dgs-btn-primary w-auto px-5 mb-6"
          >
            + novo template
          </button>
        )}

        {/* Lista de templates */}
        <div className="flex flex-col gap-2">
          {templates.map((t) => (
            <div key={t.id} className="dgs-card flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-neutral-200 text-sm truncate">{t.name}</div>
                <div className="text-neutral-600 text-xs truncate">{t.canva_url}</div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() =>
                    setForm({ id: t.id, name: t.name, canva_url: t.canva_url, description: t.description ?? "" })
                  }
                  className="dgs-btn-ghost"
                >
                  editar
                </button>
                <button onClick={() => deleteTemplate(t.id)} className="dgs-btn-danger">
                  excluir
                </button>
              </div>
            </div>
          ))}
          {templates.length === 0 && <div className="text-neutral-600 text-sm">Nenhum template ainda.</div>}
        </div>
      </div>
    </div>
  );
}
