"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { todayISO } from "@/lib/earnings";

export type EarningEntry = {
  id: string;
  entry_date: string;
  platform: "instagram" | "tiktok" | "youtube";
  title: string;
  amount: number;
  screenshot_path: string | null;
};

const PLATFORMS = [
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "youtube", label: "YouTube" },
] as const;

export function EarningForm({
  editing,
  onSaved,
  onCancel,
}: {
  editing?: EarningEntry | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const supabase = createClient();
  const [date, setDate] = useState(editing?.entry_date ?? todayISO());
  const [platform, setPlatform] = useState<(typeof PLATFORMS)[number]["id"]>(editing?.platform ?? "instagram");
  const [title, setTitle] = useState(editing?.title ?? "");
  const [amount, setAmount] = useState(editing ? String(editing.amount) : "");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const numericAmount = Number(amount.replace(",", "."));
    if (!title.trim() || !numericAmount || numericAmount <= 0) {
      setError("Preencha o nome e um valor válido.");
      return;
    }

    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setSaving(false);
      return;
    }

    let screenshotPath = editing?.screenshot_path ?? null;

    if (file) {
      const ext = file.name.split(".").pop();
      const path = `${userData.user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("earnings-screenshots")
        .upload(path, file);
      if (uploadError) {
        setError("Não foi possível enviar o print. Tente novamente.");
        setSaving(false);
        return;
      }
      screenshotPath = path;
    }

    const payload = {
      user_id: userData.user.id,
      entry_date: date,
      platform,
      title: title.trim(),
      amount: numericAmount,
      screenshot_path: screenshotPath,
    };

    const { error: saveError } = editing
      ? await supabase.from("earnings").update(payload).eq("id", editing.id)
      : await supabase.from("earnings").insert(payload);

    setSaving(false);
    if (saveError) {
      setError("Não foi possível salvar. Tente novamente.");
      return;
    }
    onSaved();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-white/10 bg-white/[0.03] p-5 flex flex-col gap-3">
      <div className="text-neutral-100 font-medium text-sm mb-1">
        {editing ? "Editar lançamento" : "Novo lançamento"}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <input type="date" className="dgs-input" value={date} onChange={(e) => setDate(e.target.value)} />
        <select className="dgs-input" value={platform} onChange={(e) => setPlatform(e.target.value as any)}>
          {PLATFORMS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      <input
        type="text"
        placeholder="Nome (ex: campanha, vídeo, artista)"
        className="dgs-input"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <input
        type="text"
        inputMode="decimal"
        placeholder="Valor recebido (ex: 150,00)"
        className="dgs-input"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <div>
        <label className="text-neutral-500 text-xs block mb-1.5">
          Print de comprovação {editing?.screenshot_path && "(enviar um novo substitui o atual)"}
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="dgs-file"
        />
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <div className="flex gap-2 mt-1">
        <button type="submit" disabled={saving} className="dgs-btn-primary w-auto px-5">
          {saving ? "Salvando…" : "Salvar"}
        </button>
        <button type="button" onClick={onCancel} className="text-neutral-500 text-sm">
          cancelar
        </button>
      </div>
    </form>
  );
}
