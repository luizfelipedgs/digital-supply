"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function CoverUploader({ initialCoverPath }: { initialCoverPath: string | null }) {
  const supabase = createClient();
  const [preview, setPreview] = useState<string | null>(
    initialCoverPath ? supabase.storage.from("content-covers").getPublicUrl(initialCoverPath).data.publicUrl : null
  );
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function handleFile(f: File | null) {
    setFile(f);
    setError(null);
    if (f) setPreview(URL.createObjectURL(f));
  }

  async function save() {
    if (!file) return;
    setSaving(true);
    setError(null);

    const ext = file.name.split(".").pop() || "jpg";
    const path = `dashboard-cover/cover-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("content-covers")
      .upload(path, file, { contentType: file.type || "image/jpeg" });

    if (uploadError) {
      setSaving(false);
      setError(`Não foi possível enviar a imagem: ${uploadError.message}`);
      return;
    }

    const { error: updateError } = await supabase
      .from("site_settings")
      .update({ cover_path: path, updated_at: new Date().toISOString() })
      .eq("id", "main");

    setSaving(false);

    if (updateError) {
      setError(`Não foi possível salvar: ${updateError.message}`);
      return;
    }

    setSaved(true);
    setFile(null);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="dgs-card flex flex-col gap-3 mb-6">
      <div className="flex items-center gap-2">
        <span className="text-base">🖼️</span>
        <div className="text-neutral-100 font-medium text-sm">Capa do dashboard</div>
      </div>
      <div className="text-neutral-500 text-xs -mt-1">
        Aparece no topo do dashboard pra todos os alunos, estilo banner de canal. Recomendado: imagem larga (ex: 1584×396).
      </div>

      {preview ? (
        <img src={preview} alt="" className="w-full h-32 object-cover rounded-lg border border-white/10" />
      ) : (
        <div className="w-full h-32 rounded-lg bg-white/[0.03] border border-white/10 flex items-center justify-center text-neutral-600 text-xs">
          Nenhuma capa definida ainda
        </div>
      )}

      <input type="file" accept="image/*" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} className="dgs-file" />

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <button onClick={save} disabled={!file || saving} className="dgs-btn-primary w-auto px-5 self-start">
        {saving ? "Salvando…" : saved ? "✓ Salvo" : "Salvar capa"}
      </button>
    </div>
  );
}
