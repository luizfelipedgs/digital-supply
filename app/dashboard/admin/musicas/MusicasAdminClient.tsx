"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LineIcon } from "@/components/LineIcon";

type Track = { id: string; title: string; storage_path: string; order_index: number };

export function MusicasAdminClient({ initialTracks }: { initialTracks: Track[] }) {
  const supabase = createClient();

  const [tracks, setTracks] = useState<Track[]>(initialTracks);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  async function refreshTracks() {
    const { data } = await supabase
      .from("music_library")
      .select("id, title, storage_path, order_index")
      .order("order_index", { ascending: true });
    setTracks(data ?? []);
  }

  function publicUrl(path: string) {
    return supabase.storage.from("music-library").getPublicUrl(path).data.publicUrl;
  }

  async function uploadTrack() {
    if (!file || !title.trim()) return;
    setUploading(true);
    setError(null);

    const ext = file.name.split(".").pop() || "mp3";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("music-library")
      .upload(path, file, { contentType: file.type || "audio/mpeg" });

    if (uploadError) {
      setUploading(false);
      setError(`Não foi possível enviar o arquivo: ${uploadError.message}`);
      return;
    }

    const { error: insertError } = await supabase
      .from("music_library")
      .insert({ title: title.trim(), storage_path: path, order_index: tracks.length });

    setUploading(false);

    if (insertError) {
      setError(`Não foi possível salvar: ${insertError.message}`);
      return;
    }

    setTitle("");
    setFile(null);
    refreshTracks();
  }

  async function saveRename(id: string) {
    if (!renameValue.trim()) return;
    await supabase.from("music_library").update({ title: renameValue.trim() }).eq("id", id);
    setRenamingId(null);
    refreshTracks();
  }

  async function deleteTrack(track: Track) {
    if (!confirm(`Apagar "${track.title}"? Isso remove ela da biblioteca de todos os alunos.`)) return;
    await supabase.storage.from("music-library").remove([track.storage_path]);
    await supabase.from("music_library").delete().eq("id", track.id);
    refreshTracks();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="dgs-card flex flex-col gap-3">
        <div className="text-neutral-100 font-medium text-sm">Enviar nova música</div>
        <input
          className="dgs-input"
          placeholder="Nome da música (ex: Trap Motivacional 01)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          type="file"
          accept="audio/mpeg,audio/mp3,.mp3"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="dgs-file"
        />
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <button
          onClick={uploadTrack}
          disabled={!file || !title.trim() || uploading}
          className="dgs-btn-primary w-auto px-5 self-start"
        >
          {uploading ? "Enviando…" : "Adicionar à biblioteca"}
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {tracks.map((t) => (
          <div key={t.id} className="dgs-card flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-brand/10 flex items-center justify-center text-brand shrink-0">
                  <LineIcon name="music" size={15} />
                </div>
                {renamingId === t.id ? (
                  <input
                    className="dgs-input"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    autoFocus
                  />
                ) : (
                  <div className="text-neutral-200 text-sm truncate">{t.title}</div>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                {renamingId === t.id ? (
                  <>
                    <button onClick={() => saveRename(t.id)} className="dgs-btn-primary w-auto px-3">
                      salvar
                    </button>
                    <button onClick={() => setRenamingId(null)} className="dgs-btn-ghost">
                      cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setRenamingId(t.id);
                        setRenameValue(t.title);
                      }}
                      className="dgs-btn-ghost"
                    >
                      renomear
                    </button>
                    <button onClick={() => deleteTrack(t)} className="dgs-btn-danger">
                      excluir
                    </button>
                  </>
                )}
              </div>
            </div>
            <audio src={publicUrl(t.storage_path)} controls className="w-full h-8" />
          </div>
        ))}
        {tracks.length === 0 && <div className="text-neutral-600 text-sm">Nenhuma música na biblioteca ainda.</div>}
      </div>
    </div>
  );
}
