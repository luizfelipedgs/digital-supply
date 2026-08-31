"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LineIcon } from "@/components/LineIcon";

type Note = { id: string; title: string; body: string | null; updated_at: string };

export function NotesColumn({ userId }: { userId: string }) {
  const supabase = createClient();
  const [notes, setNotes] = useState<Note[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await supabase
      .from("notes")
      .select("id, title, body, updated_at")
      .order("updated_at", { ascending: false });
    setNotes((data as Note[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startNew() {
    setCreating(true);
    setOpenId(null);
    setTitle("");
    setBody("");
  }

  function openNote(note: Note) {
    setOpenId(note.id);
    setCreating(false);
    setTitle(note.title);
    setBody(note.body ?? "");
  }

  async function save() {
    if (!title.trim()) return;
    if (openId) {
      await supabase.from("notes").update({ title, body, updated_at: new Date().toISOString() }).eq("id", openId);
    } else {
      await supabase.from("notes").insert({ user_id: userId, title: title.trim(), body });
    }
    setCreating(false);
    setOpenId(null);
    load();
  }

  async function deleteNote(id: string) {
    await supabase.from("notes").delete().eq("id", id);
    if (openId === id) {
      setOpenId(null);
    }
    load();
  }

  const editing = creating || openId;

  return (
    <div className="dgs-card flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <LineIcon name="note" size={16} className="text-brand" />
        <div className="text-neutral-100 font-medium text-sm">Anotações</div>
      </div>

      {editing ? (
        <div className="flex flex-col gap-2">
          <input className="dgs-input" placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea
            className="dgs-input"
            rows={5}
            placeholder="Escreva aqui…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <div className="flex gap-2">
            <button onClick={save} className="dgs-btn-primary w-auto px-4">
              Salvar
            </button>
            <button
              onClick={() => {
                setCreating(false);
                setOpenId(null);
              }}
              className="text-neutral-500 text-xs"
            >
              cancelar
            </button>
          </div>
        </div>
      ) : (
        <button onClick={startNew} className="text-brand text-xs text-left">
          + nova anotação
        </button>
      )}

      <div className="flex flex-col gap-1.5 mt-1">
        {loading && <div className="text-neutral-600 text-xs">Carregando…</div>}
        {!loading && notes.length === 0 && <div className="text-neutral-600 text-xs">Nenhuma anotação ainda.</div>}
        {notes.map((note) => (
          <div
            key={note.id}
            className="rounded-lg border border-white/10 bg-white/[0.02] p-3 cursor-pointer hover:bg-white/[0.04] transition-colors"
            onClick={() => openNote(note)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="text-neutral-200 text-sm">{note.title}</div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNote(note.id);
                }}
                className="text-red-400 text-xs shrink-0"
              >
                ×
              </button>
            </div>
            {note.body && <div className="text-neutral-500 text-xs mt-1 line-clamp-2">{note.body}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
