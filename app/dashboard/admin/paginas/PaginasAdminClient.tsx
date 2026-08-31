"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DashboardHeader } from "@/components/DashboardHeader";
import { toYoutubeEmbedUrl } from "@/lib/youtube";
import { LineIcon } from "@/components/LineIcon";

type PaginaLink = {
  id: string;
  category: "portugues" | "gringas";
  name: string;
  link: string;
  description: string | null;
  order_index: number;
};

const CATEGORY_LABEL: Record<string, string> = {
  portugues: "Páginas em Português",
  gringas: "Páginas Gringas",
};

export function PaginasAdminClient({
  initialTutorialUrl,
  initialDescription,
  initialLinks,
}: {
  initialTutorialUrl: string;
  initialDescription: string;
  initialLinks: PaginaLink[];
}) {
  const supabase = createClient();

  const [tutorialUrl, setTutorialUrl] = useState(initialTutorialUrl);
  const [description, setDescription] = useState(initialDescription);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const [links, setLinks] = useState<PaginaLink[]>(initialLinks);
  const [activeCategory, setActiveCategory] = useState<"portugues" | "gringas">("portugues");
  const [form, setForm] = useState<{ id: string | null; name: string; link: string; description: string } | null>(
    null
  );
  const [savingLink, setSavingLink] = useState(false);

  async function saveSettings() {
    setSavingSettings(true);
    await supabase
      .from("paginas_settings")
      .update({ tutorial_video_url: tutorialUrl || null, description: description || null, updated_at: new Date().toISOString() })
      .eq("id", "main");
    setSavingSettings(false);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  }

  async function refreshLinks() {
    const { data } = await supabase
      .from("paginas_links")
      .select("id, category, name, link, description, order_index")
      .order("order_index", { ascending: true });
    setLinks((data as PaginaLink[]) ?? []);
  }

  async function saveLink() {
    if (!form || !form.name.trim() || !form.link.trim()) return;
    setSavingLink(true);

    const payload = {
      category: activeCategory,
      name: form.name.trim(),
      link: form.link.trim(),
      description: form.description || null,
    };

    if (form.id) {
      await supabase.from("paginas_links").update(payload).eq("id", form.id);
    } else {
      const countInCategory = links.filter((l) => l.category === activeCategory).length;
      await supabase.from("paginas_links").insert({ ...payload, order_index: countInCategory });
    }

    setForm(null);
    setSavingLink(false);
    refreshLinks();
  }

  async function deleteLink(id: string) {
    if (!confirm("Apagar esta página da lista?")) return;
    await supabase.from("paginas_links").delete().eq("id", id);
    refreshLinks();
  }

  const previewEmbed = tutorialUrl ? toYoutubeEmbedUrl(tutorialUrl) : null;
  const linksInCategory = links.filter((l) => l.category === activeCategory);

  return (
    <div className="min-h-screen bg-ink-900 p-6 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <DashboardHeader backHref="/dashboard/paginas" backLabel="Voltar à lista de páginas" />
        <h1 className="text-neutral-100 text-xl font-medium mb-6">Gerenciar Lista de Páginas</h1>

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
            placeholder="Explique como encontrar e baixar os vídeos dessas páginas, orientações gerais, etc."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <button onClick={saveSettings} disabled={savingSettings} className="dgs-btn-primary w-auto px-5 self-start flex items-center justify-center gap-1.5">
            {savingSettings ? "Salvando…" : settingsSaved ? (
              <>
                <LineIcon name="check" size={14} /> Salvo
              </>
            ) : (
              "Salvar"
            )}
          </button>
        </div>

        {/* Abas de categoria */}
        <div className="flex gap-2 mb-4">
          {(["portugues", "gringas"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                setForm(null);
              }}
              className={`text-xs rounded-lg px-3 py-1.5 border transition-colors ${
                activeCategory === cat
                  ? "bg-brand/10 border-brand/30 text-brand"
                  : "border-white/10 text-neutral-400 hover:bg-white/5"
              }`}
            >
              {CATEGORY_LABEL[cat]}
            </button>
          ))}
        </div>

        {/* Form de novo/editar link */}
        {form ? (
          <div className="dgs-card flex flex-col gap-3 mb-6">
            <div className="text-neutral-100 font-medium text-sm">{form.id ? "Editar página" : "Nova página"}</div>
            <input
              className="dgs-input"
              placeholder="Nome (ex: @paginaexemplo)"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              className="dgs-input"
              placeholder="Link do Instagram"
              value={form.link}
              onChange={(e) => setForm({ ...form, link: e.target.value })}
            />
            <textarea
              className="dgs-input"
              rows={2}
              placeholder="Descrição (opcional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <div className="flex gap-2">
              <button onClick={saveLink} disabled={savingLink} className="dgs-btn-primary w-auto px-5">
                Salvar página
              </button>
              <button onClick={() => setForm(null)} className="dgs-btn-ghost">
                cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setForm({ id: null, name: "", link: "", description: "" })}
            className="dgs-btn-primary w-auto px-5 mb-6"
          >
            + nova página em &quot;{CATEGORY_LABEL[activeCategory]}&quot;
          </button>
        )}

        {/* Lista de links da categoria ativa */}
        <div className="flex flex-col gap-2">
          {linksInCategory.map((l) => (
            <div key={l.id} className="dgs-card flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-neutral-200 text-sm truncate">{l.name}</div>
                <div className="text-neutral-600 text-xs truncate">{l.link}</div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() =>
                    setForm({ id: l.id, name: l.name, link: l.link, description: l.description ?? "" })
                  }
                  className="dgs-btn-ghost"
                >
                  editar
                </button>
                <button onClick={() => deleteLink(l.id)} className="dgs-btn-danger">
                  excluir
                </button>
              </div>
            </div>
          ))}
          {linksInCategory.length === 0 && (
            <div className="text-neutral-600 text-sm">Nenhuma página em &quot;{CATEGORY_LABEL[activeCategory]}&quot; ainda.</div>
          )}
        </div>
      </div>
    </div>
  );
}
