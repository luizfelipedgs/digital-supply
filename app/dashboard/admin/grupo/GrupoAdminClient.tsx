"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DashboardHeader } from "@/components/DashboardHeader";
import { LineIcon } from "@/components/LineIcon";

type Regra = { id: string; text: string; order_index: number };

export function GrupoAdminClient({
  initialLink,
  initialTitle,
  initialDescription,
  initialRegras,
}: {
  initialLink: string;
  initialTitle: string;
  initialDescription: string;
  initialRegras: Regra[];
}) {
  const supabase = createClient();
  const [link, setLink] = useState(initialLink);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const [regras, setRegras] = useState<Regra[]>(initialRegras);
  const [newRegra, setNewRegra] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  async function saveSettings() {
    setSavingSettings(true);
    await supabase
      .from("grupo_settings")
      .update({
        group_link: link || null,
        title: title || null,
        description: description || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", "main");
    setSavingSettings(false);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  }

  async function refreshRegras() {
    const { data } = await supabase
      .from("grupo_regras")
      .select("id, text, order_index")
      .order("order_index", { ascending: true });
    setRegras((data as Regra[]) ?? []);
  }

  async function addRegra() {
    if (!newRegra.trim()) return;
    await supabase.from("grupo_regras").insert({ text: newRegra.trim(), order_index: regras.length });
    setNewRegra("");
    refreshRegras();
  }

  async function saveEdit(id: string) {
    if (!editingText.trim()) return;
    await supabase.from("grupo_regras").update({ text: editingText.trim() }).eq("id", id);
    setEditingId(null);
    refreshRegras();
  }

  async function deleteRegra(id: string) {
    if (!confirm("Apagar esta regra?")) return;
    await supabase.from("grupo_regras").delete().eq("id", id);
    refreshRegras();
  }

  async function moveRegra(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= regras.length) return;
    const a = regras[index];
    const b = regras[target];
    await supabase.from("grupo_regras").update({ order_index: b.order_index }).eq("id", a.id);
    await supabase.from("grupo_regras").update({ order_index: a.order_index }).eq("id", b.id);
    refreshRegras();
  }

  return (
    <div className="min-h-screen bg-ink-900 p-6 sm:p-8">
      <div className="max-w-xl mx-auto">
        <DashboardHeader backHref="/dashboard/grupo" backLabel="Voltar ao Grupo DGS" />
        <h1 className="text-neutral-100 text-xl font-medium mb-6">Gerenciar Grupo DGS</h1>

        {/* Configurações principais */}
        <div className="dgs-card flex flex-col gap-3 mb-6">
          <div>
            <label className="text-neutral-500 text-xs block mb-1.5">Nome</label>
            <input className="dgs-input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="text-neutral-500 text-xs block mb-1.5">Descrição</label>
            <textarea className="dgs-input" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="text-neutral-500 text-xs block mb-1.5">Link do grupo</label>
            <input
              className="dgs-input"
              placeholder="https://chat.whatsapp.com/... ou https://discord.gg/..."
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
          </div>
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

        {/* Regras */}
        <div className="dgs-card flex flex-col gap-3">
          <div className="text-neutral-100 font-medium text-sm">Regras da comunidade</div>

          <div className="flex gap-2">
            <input
              className="dgs-input"
              placeholder="Nova regra"
              value={newRegra}
              onChange={(e) => setNewRegra(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addRegra()}
            />
            <button onClick={addRegra} className="dgs-btn-primary w-auto px-4 whitespace-nowrap">
              + adicionar
            </button>
          </div>

          <div className="flex flex-col gap-2 mt-1">
            {regras.map((regra, i) => (
              <div key={regra.id} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                {editingId === regra.id ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      className="dgs-input"
                      rows={2}
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(regra.id)} className="dgs-btn-primary w-auto px-4">
                        Salvar
                      </button>
                      <button onClick={() => setEditingId(null)} className="dgs-btn-ghost">
                        cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-brand/10 text-brand text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <div className="text-neutral-300 text-sm flex-1">{regra.text}</div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <div className="flex gap-1.5">
                        <button onClick={() => moveRegra(i, -1)} disabled={i === 0} className="dgs-btn-ghost disabled:opacity-30">
                          ↑
                        </button>
                        <button onClick={() => moveRegra(i, 1)} disabled={i === regras.length - 1} className="dgs-btn-ghost disabled:opacity-30">
                          ↓
                        </button>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => {
                            setEditingId(regra.id);
                            setEditingText(regra.text);
                          }}
                          className="dgs-btn-ghost"
                        >
                          editar
                        </button>
                        <button onClick={() => deleteRegra(regra.id)} className="dgs-btn-danger">
                          excluir
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {regras.length === 0 && <div className="text-neutral-600 text-xs">Nenhuma regra cadastrada ainda.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
