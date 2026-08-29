"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Lesson = { id: string; title: string; content_type: string; order_index: number };
type Module = { id: string; title: string; order_index: number; content_lessons: Lesson[] };

export function AdminConteudosClient({ initialModules }: { initialModules: Module[] }) {
  const supabase = createClient();
  const [modules, setModules] = useState<Module[]>(initialModules);

  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [creatingModule, setCreatingModule] = useState(false);

  const [lessonForm, setLessonForm] = useState<{
    moduleId: string | null;
    title: string;
    contentType: "text" | "video" | "audio";
    bodyText: string;
    videoUrl: string;
    audioUrl: string;
  }>({ moduleId: null, title: "", contentType: "video", bodyText: "", videoUrl: "", audioUrl: "" });
  const [creatingLesson, setCreatingLesson] = useState(false);

  async function refresh() {
    const { data } = await supabase
      .from("content_modules")
      .select("id, title, order_index, content_lessons(id, title, content_type, order_index)")
      .order("order_index", { ascending: true });
    setModules((data as Module[]) ?? []);
  }

  async function createModule() {
    if (!newModuleTitle.trim()) return;
    setCreatingModule(true);
    await supabase.from("content_modules").insert({ title: newModuleTitle, order_index: modules.length });
    setNewModuleTitle("");
    setCreatingModule(false);
    refresh();
  }

  async function createLesson() {
    if (!lessonForm.moduleId || !lessonForm.title.trim()) return;
    setCreatingLesson(true);
    await supabase.from("content_lessons").insert({
      module_id: lessonForm.moduleId,
      title: lessonForm.title,
      content_type: lessonForm.contentType,
      body_text: lessonForm.contentType === "text" ? lessonForm.bodyText : null,
      video_url: lessonForm.contentType === "video" ? lessonForm.videoUrl : null,
      audio_url: lessonForm.contentType === "audio" ? lessonForm.audioUrl : null,
      order_index: 0,
    });
    setLessonForm({ moduleId: lessonForm.moduleId, title: "", contentType: "video", bodyText: "", videoUrl: "", audioUrl: "" });
    setCreatingLesson(false);
    refresh();
  }

  async function deleteLesson(id: string) {
    await supabase.from("content_lessons").delete().eq("id", id);
    refresh();
  }

  async function deleteModule(id: string) {
    await supabase.from("content_modules").delete().eq("id", id);
    refresh();
  }

  return (
    <div className="min-h-screen bg-ink-900 p-6 sm:p-8">
      <Link href="/dashboard/conteudos" className="text-neutral-500 text-sm no-underline">
        ← Voltar aos conteúdos
      </Link>

      <h1 className="text-neutral-100 text-xl font-medium mt-6 mb-8">Gerenciar conteúdos</h1>

      <div className="max-w-2xl flex flex-col gap-8">
        {/* Criar módulo */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <div className="text-neutral-100 font-medium mb-3 text-sm">Novo módulo</div>
          <div className="flex gap-2">
            <input
              className="dgs-input"
              placeholder="Ex: Fundamentos da clipagem"
              value={newModuleTitle}
              onChange={(e) => setNewModuleTitle(e.target.value)}
            />
            <button onClick={createModule} disabled={creatingModule} className="dgs-btn-primary w-auto px-5 whitespace-nowrap">
              Criar
            </button>
          </div>
        </div>

        {/* Lista de módulos + aulas */}
        {modules.map((mod) => (
          <div key={mod.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-neutral-100 font-medium text-sm">{mod.title}</div>
              <button onClick={() => deleteModule(mod.id)} className="text-red-400 text-xs">
                excluir módulo
              </button>
            </div>

            <div className="flex flex-col gap-1 mb-4">
              {mod.content_lessons?.map((l) => (
                <div key={l.id} className="flex items-center justify-between text-sm py-1.5 px-2 rounded bg-white/[0.02]">
                  <span className="text-neutral-300">
                    {l.content_type === "video" ? "🎬" : l.content_type === "audio" ? "🎧" : "📄"} {l.title}
                  </span>
                  <button onClick={() => deleteLesson(l.id)} className="text-red-400 text-xs">
                    excluir
                  </button>
                </div>
              ))}
              {(!mod.content_lessons || mod.content_lessons.length === 0) && (
                <div className="text-neutral-600 text-xs">Nenhuma aula ainda.</div>
              )}
            </div>

            {/* Form de nova aula pra este módulo */}
            {lessonForm.moduleId === mod.id ? (
              <div className="flex flex-col gap-2 border-t border-white/10 pt-3">
                <input
                  className="dgs-input"
                  placeholder="Título da aula"
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                />
                <select
                  className="dgs-input"
                  value={lessonForm.contentType}
                  onChange={(e) => setLessonForm({ ...lessonForm, contentType: e.target.value as any })}
                >
                  <option value="video">Vídeo (YouTube/Vimeo não-listado, link de embed)</option>
                  <option value="audio">Áudio (link direto do arquivo)</option>
                  <option value="text">Texto</option>
                </select>
                {lessonForm.contentType === "video" && (
                  <input
                    className="dgs-input"
                    placeholder="https://www.youtube.com/embed/..."
                    value={lessonForm.videoUrl}
                    onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                  />
                )}
                {lessonForm.contentType === "audio" && (
                  <input
                    className="dgs-input"
                    placeholder="https://.../aula.mp3"
                    value={lessonForm.audioUrl}
                    onChange={(e) => setLessonForm({ ...lessonForm, audioUrl: e.target.value })}
                  />
                )}
                {lessonForm.contentType === "text" && (
                  <textarea
                    className="dgs-input"
                    rows={5}
                    placeholder="Conteúdo da aula em texto"
                    value={lessonForm.bodyText}
                    onChange={(e) => setLessonForm({ ...lessonForm, bodyText: e.target.value })}
                  />
                )}
                <div className="flex gap-2">
                  <button onClick={createLesson} disabled={creatingLesson} className="dgs-btn-primary w-auto px-5">
                    Salvar aula
                  </button>
                  <button
                    onClick={() => setLessonForm({ ...lessonForm, moduleId: null })}
                    className="text-neutral-500 text-sm"
                  >
                    cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setLessonForm({ ...lessonForm, moduleId: mod.id })}
                className="text-brand text-xs"
              >
                + adicionar aula
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
