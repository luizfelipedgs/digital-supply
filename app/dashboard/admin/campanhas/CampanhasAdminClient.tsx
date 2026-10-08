"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { campaignStatus, CAMPAIGN_STATUS_LABEL, formatDateBR, type CampaignStatus } from "@/lib/campaigns";

type Campaign = {
  id: string;
  title: string;
  cover_path: string | null;
  coverUrl: string | null;
  start_date: string;
  end_date: string;
  prize_label: string | null;
  link_url: string;
  created_at: string;
};

type Draft = {
  id: string | null;
  title: string;
  start_date: string;
  end_date: string;
  prize_label: string;
  link_url: string;
  coverPath: string | null;
  coverPreview: string | null;
};

const EMPTY_DRAFT: Draft = {
  id: null,
  title: "",
  start_date: "",
  end_date: "",
  prize_label: "",
  link_url: "",
  coverPath: null,
  coverPreview: null,
};

const STATUS_CHIP_CLASS: Record<CampaignStatus, string> = {
  andamento: "bg-brand/15 text-[#c3e67a]",
  aguardando: "bg-violet-500/15 text-violet-300",
  encerrada: "bg-white/5 text-neutral-500",
};

export function CampanhasAdminClient({ initialCampaigns, userId }: { initialCampaigns: Campaign[]; userId: string }) {
  const supabase = createClient();
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [formOpen, setFormOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const { data } = await supabase
      .from("campaigns")
      .select("id, title, cover_path, start_date, end_date, prize_label, link_url, created_at")
      .order("start_date", { ascending: false });
    const withUrls = (data ?? []).map((c) => ({
      ...c,
      coverUrl: c.cover_path ? supabase.storage.from("content-covers").getPublicUrl(c.cover_path).data.publicUrl : null,
    }));
    setCampaigns(withUrls);
  }

  function openNew() {
    setDraft(EMPTY_DRAFT);
    setFile(null);
    setError(null);
    setFormOpen(true);
  }

  function openEdit(c: Campaign) {
    setDraft({
      id: c.id,
      title: c.title,
      start_date: c.start_date,
      end_date: c.end_date,
      prize_label: c.prize_label ?? "",
      link_url: c.link_url,
      coverPath: c.cover_path,
      coverPreview: c.coverUrl,
    });
    setFile(null);
    setError(null);
    setFormOpen(true);
  }

  function handleFile(f: File | null) {
    setFile(f);
    if (f) setDraft((d) => ({ ...d, coverPreview: URL.createObjectURL(f) }));
  }

  async function save() {
    if (!draft.title.trim() || !draft.start_date || !draft.end_date || !draft.link_url.trim()) {
      setError("Preenche nome, período (início e término) e link da campanha.");
      return;
    }
    if (draft.end_date < draft.start_date) {
      setError("A data de término não pode ser antes da data de início.");
      return;
    }

    setSaving(true);
    setError(null);

    let coverPath = draft.coverPath;
    if (file) {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `campaigns/cover-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("content-covers")
        .upload(path, file, { contentType: file.type || "image/jpeg" });
      if (uploadError) {
        setSaving(false);
        setError(`Não foi possível enviar a capa: ${uploadError.message}`);
        return;
      }
      coverPath = path;
    }

    const payload = {
      title: draft.title.trim(),
      cover_path: coverPath,
      start_date: draft.start_date,
      end_date: draft.end_date,
      prize_label: draft.prize_label.trim() || null,
      link_url: draft.link_url.trim(),
    };

    const { error: saveError } = draft.id
      ? await supabase.from("campaigns").update(payload).eq("id", draft.id)
      : await supabase.from("campaigns").insert({ ...payload, created_by: userId });

    setSaving(false);

    if (saveError) {
      setError(`Não foi possível salvar: ${saveError.message}`);
      return;
    }

    setFormOpen(false);
    refresh();
  }

  async function remove(id: string) {
    if (!confirm("Apagar esta campanha? Os alunos deixam de vê-la imediatamente.")) return;
    await supabase.from("campaigns").delete().eq("id", id);
    refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <p className="text-neutral-500 text-sm max-w-sm">
          Campanhas divulgadas pro aluno em "Campanhas exclusivas", com capa, período, premiação e botão direto pro
          link de participação. O status é calculado sozinho a partir das datas.
        </p>
        {!formOpen && (
          <button onClick={openNew} className="dgs-btn-primary w-auto px-4 shrink-0">
            + Nova campanha
          </button>
        )}
      </div>

      {formOpen && (
        <div className="dgs-card flex flex-col gap-4">
          <div className="text-neutral-100 font-medium text-sm">{draft.id ? "Editar campanha" : "Nova campanha"}</div>

          <div>
            <label className="text-xs text-neutral-500 mb-1.5 block">Capa da campanha</label>
            {draft.coverPreview && (
              <img src={draft.coverPreview} alt="" className="w-full h-32 object-cover rounded-lg border border-white/10 mb-2" />
            )}
            <input type="file" accept="image/*" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} className="dgs-file" />
          </div>

          <div>
            <label className="text-xs text-neutral-500 mb-1.5 block">Nome da campanha</label>
            <input
              className="dgs-input"
              placeholder="Ex: Arrocha Nela — Alemão do Forró"
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-neutral-500 mb-1.5 block">Data de início</label>
              <input
                type="date"
                className="dgs-input"
                value={draft.start_date}
                onChange={(e) => setDraft((d) => ({ ...d, start_date: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-neutral-500 mb-1.5 block">Data de término</label>
              <input
                type="date"
                className="dgs-input"
                value={draft.end_date}
                onChange={(e) => setDraft((d) => ({ ...d, end_date: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-neutral-500 mb-1.5 block">Premiação</label>
              <input
                className="dgs-input"
                placeholder="Ex: R$ 1.000,00"
                value={draft.prize_label}
                onChange={(e) => setDraft((d) => ({ ...d, prize_label: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-neutral-500 mb-1.5 block">Link da campanha</label>
              <input
                className="dgs-input"
                placeholder="https://..."
                value={draft.link_url}
                onChange={(e) => setDraft((d) => ({ ...d, link_url: e.target.value }))}
              />
            </div>
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className="dgs-btn-primary w-auto px-5">
              {saving ? "Salvando…" : "Salvar campanha"}
            </button>
            <button onClick={() => setFormOpen(false)} className="dgs-btn-ghost">
              cancelar
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {campaigns.length === 0 && !formOpen && (
          <div className="dgs-card text-neutral-500 text-sm text-center py-10">Nenhuma campanha cadastrada ainda.</div>
        )}
        {campaigns.map((c) => {
          const status = campaignStatus(c.start_date, c.end_date);
          return (
            <div key={c.id} className="dgs-card flex items-center gap-3 flex-wrap">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/5 border border-white/10 shrink-0">
                {c.coverUrl && <img src={c.coverUrl} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-neutral-100 text-sm font-medium truncate">{c.title}</div>
                <div className="text-neutral-500 text-xs flex flex-wrap gap-3 mt-0.5">
                  <span>
                    {formatDateBR(c.start_date)} — {formatDateBR(c.end_date)}
                  </span>
                  {c.prize_label && <span>{c.prize_label}</span>}
                </div>
              </div>
              <span className={`text-[10.5px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${STATUS_CHIP_CLASS[status]}`}>
                {CAMPAIGN_STATUS_LABEL[status]}
              </span>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => openEdit(c)} className="dgs-btn-ghost">
                  editar
                </button>
                <button onClick={() => remove(c.id)} className="dgs-btn-danger">
                  excluir
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
