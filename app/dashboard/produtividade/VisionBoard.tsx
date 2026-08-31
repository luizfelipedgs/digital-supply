"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LineIcon } from "@/components/LineIcon";

export function VisionBoard({ userId, initialPhotoPath }: { userId: string; initialPhotoPath: string | null }) {
  const supabase = createClient();
  const [preview, setPreview] = useState<string | null>(
    initialPhotoPath ? supabase.storage.from("vision-board").getPublicUrl(initialPhotoPath).data.publicUrl : null
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | null) {
    if (!file) return;
    setSaving(true);
    setError(null);
    setPreview(URL.createObjectURL(file));

    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/vision-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("vision-board")
      .upload(path, file, { contentType: file.type || "image/jpeg" });

    if (uploadError) {
      setSaving(false);
      setError(`Não foi possível enviar a foto: ${uploadError.message}`);
      return;
    }

    await supabase.from("profiles").update({ vision_photo_path: path }).eq("id", userId);
    setSaving(false);
  }

  return (
    <div className="dgs-card flex flex-col gap-3 md:col-span-3">
      <div className="flex items-center gap-2">
        <LineIcon name="sparkles" size={16} className="text-brand" />
        <div className="text-neutral-100 font-medium text-sm">Quadro de visão</div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <label className="relative shrink-0 w-full sm:w-40 h-40 rounded-xl border border-dashed border-white/15 bg-white/[0.02] flex items-center justify-center cursor-pointer overflow-hidden hover:border-brand/40 transition-colors">
          {preview ? (
            <img src={preview} alt="Sua meta visual" className="w-full h-full object-cover" />
          ) : (
            <span className="text-neutral-500 text-xs text-center px-3">+ foto do que você sonha conquistar</span>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
          {saving && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs">
              Enviando…
            </div>
          )}
        </label>

        <div className="flex-1">
          <p className="text-neutral-400 text-xs leading-relaxed mb-2">
            Coloque uma foto de algo que você sonha conquistar — um carro, uma viagem, uma casa — e deixe ela bem
            visível toda vez que entrar aqui.
          </p>
          <p className="text-neutral-500 text-xs leading-relaxed">
            A ciência do comportamento mostra algo interessante: só "sonhar acordado" com a conquista, sozinho, não
            sustenta o foco — às vezes até acomoda. O que realmente funciona é colocar esse sonho lado a lado com
            metas concretas e um plano pra chegar lá. Por isso o quadro de visão fica bem em cima das suas metas, não
            separado delas: toda vez que você abrir essa tela, o sonho e o próximo passo pra alcançá-lo aparecem
            juntos.
          </p>
          {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
        </div>
      </div>
    </div>
  );
}
