"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DashboardHeader } from "@/components/DashboardHeader";

export function PerfilClient({
  initialNickname,
  fullName,
  email,
  avatarPath,
  userId,
}: {
  initialNickname: string;
  fullName: string;
  email: string;
  avatarPath: string | null;
  userId: string;
}) {
  const supabase = createClient();
  const [nickname, setNickname] = useState(initialNickname);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(
    avatarPath ? supabase.storage.from("avatars").getPublicUrl(avatarPath).data.publicUrl : null
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleFile(f: File | null) {
    setFile(f);
    if (f) setPreview(URL.createObjectURL(f));
  }

  async function save() {
    setSaving(true);
    setSaved(false);

    let avatarPathToSave = avatarPath;
    if (file) {
      const ext = file.name.split(".").pop();
      const path = `${userId}/avatar.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (!error) avatarPathToSave = path;
    }

    await supabase.from("profiles").update({ nickname: nickname || null, avatar_path: avatarPathToSave }).eq("id", userId);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="max-w-md mx-auto">
      <DashboardHeader backHref="/dashboard" backLabel="Voltar" />

      <div className="dgs-card flex flex-col items-center gap-5">
        <div className="relative">
          {preview ? (
            <img src={preview} alt="" className="w-24 h-24 rounded-full object-cover border border-white/10" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-brand/10 border border-white/10 flex items-center justify-center text-brand text-2xl font-medium">
              {(nickname || fullName || "A").charAt(0).toUpperCase()}
            </div>
          )}
          <label className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-brand flex items-center justify-center cursor-pointer text-xs">
            ✏️
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
          </label>
        </div>

        <div className="w-full flex flex-col gap-3">
          <div>
            <label className="text-neutral-500 text-xs block mb-1.5">Apelido</label>
            <input
              className="dgs-input"
              placeholder={fullName || "Como quer ser chamado"}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>
          <div>
            <label className="text-neutral-500 text-xs block mb-1.5">Nome completo</label>
            <div className="dgs-input opacity-50">{fullName}</div>
          </div>
          <div>
            <label className="text-neutral-500 text-xs block mb-1.5">Email</label>
            <div className="dgs-input opacity-50">{email}</div>
          </div>
        </div>

        <button onClick={save} disabled={saving} className="dgs-btn-primary">
          {saving ? "Salvando…" : saved ? "✓ Salvo" : "Salvar alterações"}
        </button>
      </div>
    </div>
  );
}
