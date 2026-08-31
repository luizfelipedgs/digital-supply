"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DashboardHeader } from "@/components/DashboardHeader";
import { LineIcon } from "@/components/LineIcon";

export function IndiqueAdminClient({
  initialLink,
  initialTitle,
  initialCommissionHeadline,
  initialCommissionNote,
  initialIntro,
}: {
  initialLink: string;
  initialTitle: string;
  initialCommissionHeadline: string;
  initialCommissionNote: string;
  initialIntro: string;
}) {
  const supabase = createClient();
  const [link, setLink] = useState(initialLink);
  const [title, setTitle] = useState(initialTitle);
  const [commissionHeadline, setCommissionHeadline] = useState(initialCommissionHeadline);
  const [commissionNote, setCommissionNote] = useState(initialCommissionNote);
  const [intro, setIntro] = useState(initialIntro);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    await supabase
      .from("affiliate_settings")
      .update({
        affiliate_link: link || null,
        title: title || null,
        commission_headline: commissionHeadline || null,
        commission_note: commissionNote || null,
        intro_text: intro || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", "main");
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="min-h-screen bg-ink-900 p-6 sm:p-8">
      <div className="max-w-xl mx-auto">
        <DashboardHeader backHref="/dashboard/indique" backLabel="Voltar ao indique e ganhe" />
        <h1 className="text-neutral-100 text-xl font-medium mb-6">Gerenciar Indique e Ganhe</h1>

        <div className="dgs-card flex flex-col gap-3">
          <div>
            <label className="text-neutral-500 text-xs block mb-1.5">Título</label>
            <input className="dgs-input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="text-neutral-500 text-xs block mb-1.5">Descrição</label>
            <textarea className="dgs-input" rows={3} value={intro} onChange={(e) => setIntro(e.target.value)} />
          </div>
          <div>
            <label className="text-neutral-500 text-xs block mb-1.5">Faixa de comissão (destaque grande)</label>
            <input
              className="dgs-input"
              placeholder="Ex: 25% até 40%"
              value={commissionHeadline}
              onChange={(e) => setCommissionHeadline(e.target.value)}
            />
          </div>
          <div>
            <label className="text-neutral-500 text-xs block mb-1.5">Explicação da comissão (texto menor, abaixo)</label>
            <textarea
              className="dgs-input"
              rows={2}
              value={commissionNote}
              onChange={(e) => setCommissionNote(e.target.value)}
            />
          </div>
          <div>
            <label className="text-neutral-500 text-xs block mb-1.5">Link de afiliação (Cakto)</label>
            <input className="dgs-input" value={link} onChange={(e) => setLink(e.target.value)} />
          </div>
          <button onClick={save} disabled={saving} className="dgs-btn-primary w-auto px-5 self-start flex items-center justify-center gap-1.5">
            {saving ? "Salvando…" : saved ? (
              <>
                <LineIcon name="check" size={14} /> Salvo
              </>
            ) : (
              "Salvar"
            )}
          </button>
        </div>

        <p className="text-neutral-600 text-xs mt-4">
          O passo a passo (como virar afiliado na Cakto) fica fixo no código, já que raramente muda. Se precisar
          ajustar esse texto, me avise que eu edito direto.
        </p>
      </div>
    </div>
  );
}
