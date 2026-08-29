"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { RichTextEditor } from "@/components/RichTextEditor";
import { DashboardHeader } from "@/components/DashboardHeader";

type Lesson = {
  id: string;
  title: string;
  description: string | null;
  content_type: string;
  body_text: string | null;
  video_url: string | null;
  audio_url: string | null;
  order_index: number;
};
type Module = {
  id: string;
  title: string;
  description: string | null;
  cover_image_path: string | null;
  order_index: number;
  content_lessons: Lesson[];
};

const emptyLessonForm = {
  id: null as string | null,
  moduleId: null as string | null,
  title: "",
  description: "",
  contentType: "video" as "text" | "video" | "audio",
  bodyHtml: "",
  videoUrl: "",
  audioUrl: "",
};

function coverUrl(path: string | null) {
  if (!path) return null;
  const supabase = createClient();
  return supabase.storage.from("content-covers").getPublicUrl(path).data.publicUrl;
}

export function AdminConteudosClient({ initialModules }: { initialModules: Module[] }) {
  const supabase = createClient();
  const [modules, setModules] = useState<Module[]>(initialModules);

  const [moduleForm, setModuleForm] = useState<{
    id: string | null;
    title: string;
    description: string;
    coverFile: File | null;
  } | null>(null);
  const [savingModule, setSavingModule] = useState(false);

  const [lessonForm, setLessonForm] = useState<typeof emptyLessonForm | null>(null);
  const [savingLesson, setSavingLesson] = useState(false);

  async function refresh() {
    const { data } = await supabase
      .from("content_modules")
      .select("id, title, description, cover_image_path, order_index, content_lessons(id, title, description, content_type, body_text, video_url, audio_url, order_index)")
      .order("order_index", { ascending: true });
    setModules((data as Module[]) ?? []);
  }

  async function saveModule() {
    if (!moduleForm || !moduleForm.title.trim()) return;
    setSavingModule(true);

    let coverPath: string | undefined;
    if (moduleForm.coverFile) {
      const ext = moduleForm.coverFile.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("content-covers").upload(path, moduleForm.coverFile);
      if (!error) coverPath = path;
    }

    if (moduleForm.id) {
      await supabase
        .from("content_modules")
        .update({
          title: moduleForm.title,
          description: moduleForm.description,
          ...(coverPath ? { cover_image_path: coverPath } : {}),
        })
        .eq("id", moduleForm.id);
    } else {
      await supabase.from("content_modules").insert({
        title: moduleForm.title,
        description: moduleForm.description,
        cover_image_path: coverPath ?? null,
        order_index: modules.length,
      });
    }

    setModuleForm(null);
    setSavingModule(false);
    refresh();
  }

  async function deleteModule(id: string) {
    if (!confirm("Apagar este módulo e todas as aulas dentro dele?")) return;
    await supabase.from("content_modules").delete().eq("id", id);
    refresh();
  }

  async function saveLesson() {
    if (!lessonForm || !lessonForm.moduleId || !lessonForm.title.trim()) return;
    setSavingLesson(true);

    const payload = {
      module_id: lessonForm.moduleId,
      title: lessonForm.title,
      description: lessonForm.description || null,
      content_type: lessonForm.contentType,
      body_text: lessonForm.contentType === "text" ? lessonForm.bodyHtml : null,
      video_url: lessonForm.contentType === "video" ? lessonForm.videoUrl : null,
      audio_url: lessonForm.contentType === "audio" ? lessonForm.audioUrl : null,
    };

    if (lessonForm.id) {
      await supabase.from("content_lessons").update(payload).eq("id", lessonForm.id);
    } else {
      await supabase.from("content_lessons").insert({ ...payload, order_index: 0 });
    }

    setLessonForm(null);
    setSavingLesson(false);
    refresh();
  }

  async function deleteLesson(id: string) {
    if (!confirm("Apagar esta aula?")) return;
    await supabase.from("content_lessons").delete().eq("id", id);
    refresh();
  }

  function openEditLesson(moduleId: string, lesson: Lesson) {
    setLessonForm({
      id: lesson.id,
      moduleId,
      title: lesson.title,
      description: lesson.description ?? "",
      contentType: lesson.content_type as any,
      bodyHtml: lesson.body_text ?? "",
      videoUrl: lesson.video_url ?? "",
      audioUrl: lesson.audio_url ?? "",
    });
  }

  return (
    <div className="min-h-screen bg-ink-900 p-6 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <DashboardHeader backHref="/dashboard/conteudos" backLabel="Voltar aos conteúdos" />

        <div className="flex items-center gap-3 mt-6 mb-8">
          <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-lg">📚</div>
          <h1 className="text-neutral-100 text-xl font-medium">Gerenciar conteúdos</h1>
        </div>

        <div className="flex flex-col gap-6">
        {moduleForm ? (
          <div className="dgs-card flex flex-col gap-3">
            <div className="text-neutral-100 font-medium text-sm mb-1">
              {moduleForm.id ? "Editar módulo" : "Novo módulo"}
            </div>
            <input
              className="dgs-input"
              placeholder="Título do módulo"
              value={moduleForm.title}
              onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
            />
            <textarea
              className="dgs-input"
              rows={2}
              placeholder="Descrição curta (opcional)"
              value={moduleForm.description}
              onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
            />
            <div>
              <label className="text-neutral-500 text-xs block mb-2">Foto de capa</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setModuleForm({ ...moduleForm, coverFile: e.target.files?.[0] ?? null })}
                className="dgs-file"
              />
            </div>
            <div className="flex gap-2 mt-1">
              <button onClick={saveModule} disabled={savingModule} className="dgs-btn-primary w-auto px-5">
                Salvar módulo
              </button>
              <button onClick={() => setModuleForm(null)} className="dgs-btn-ghost">
                cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setModuleForm({ id: null, title: "", description: "", coverFile: null })}
            className="dgs-btn-primary w-auto px-5 self-start"
          >
            + novo módulo
          </button>
        )}

        {modules.map((mod) => (
          <div key={mod.id} className="dgs-card !p-0 overflow-hidden">
            {mod.cover_image_path && (
              <img src={coverUrl(mod.cover_image_path) ?? ""} alt="" className="w-full h-32 object-cover" />
            )}
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="text-neutral-100 font-medium text-sm">{mod.title}</div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setModuleForm({ id: mod.id, title: mod.title, description: mod.description ?? "", coverFile: null })
                    }
                    className="dgs-btn-ghost"
                  >
                    editar
                  </button>
                  <button onClick={() => deleteModule(mod.id)} className="dgs-btn-danger">
                    excluir
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 mb-4">
                {mod.content_lessons?.map((l) => (
                  <div key={l.id} className="flex items-center justify-between text-sm py-2 px-3 rounded-lg bg-white/[0.02] border border-white/5">
                    <span className="text-neutral-300">
                      {l.content_type === "video" ? "🎬" : l.content_type === "audio" ? "🎧" : "📄"} {l.title}
                    </span>
                    <div className="flex gap-2">
                      <button onClick={() => openEditLesson(mod.id, l)} className="dgs-btn-ghost">
                        editar
                      </button>
                      <button onClick={() => deleteLesson(l.id)} className="dgs-btn-danger">
                        excluir
                      </button>
                    </div>
                  </div>
                ))}
                {(!mod.content_lessons || mod.content_lessons.length === 0) && (
                  <div className="text-neutral-600 text-xs">Nenhuma aula ainda.</div>
                )}
              </div>

              {lessonForm?.moduleId === mod.id ? (
                <div className="flex flex-col gap-2.5 border-t border-white/10 pt-4">
                  <input
                    className="dgs-input"
                    placeholder="Título da aula"
                    value={lessonForm.title}
                    onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  />
                  <input
                    className="dgs-input"
                    placeholder="Descrição curta (opcional)"
                    value={lessonForm.description}
                    onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                  />
                  <select
                    className="dgs-input"
                    value={lessonForm.contentType}
                    onChange={(e) => setLessonForm({ ...lessonForm, contentType: e.target.value as any })}
                  >
                    <option value="video">Vídeo (YouTube/Vimeo não-listado, link de embed)</option>
                    <option value="audio">Áudio (link direto do arquivo)</option>
                    <option value="text">Texto (editor rico)</option>
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
                    <RichTextEditor
                      initialValue={lessonForm.bodyHtml}
                      onSave={(html) => setLessonForm((f) => (f ? { ...f, bodyHtml: html } : f))}
                    />
                  )}
                  <div className="flex gap-2 mt-1">
                    <button onClick={saveLesson} disabled={savingLesson} className="dgs-btn-primary w-auto px-5">
                      Salvar aula
                    </button>
                    <button onClick={() => setLessonForm(null)} className="dgs-btn-ghost">
                      cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setLessonForm({ ...emptyLessonForm, moduleId: mod.id })}
                  className="text-brand text-xs"
                >
                  + adicionar aula
                </button>
              )}
            </div>
          </div>
        ))}
        </div>
      </div>
    </div>
  );
}
