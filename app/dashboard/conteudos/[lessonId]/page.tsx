import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MarkCompleteButton } from "./MarkCompleteButton";

export default async function LessonPage({ params }: { params: { lessonId: string } }) {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("status")
    .eq("id", userData.user.id)
    .single();

  if (!profile || profile.status !== "active") redirect("/aguardando");

  const { data: lesson } = await supabase
    .from("content_lessons")
    .select("id, title, description, content_type, body_text, video_url, audio_url, module_id")
    .eq("id", params.lessonId)
    .single();

  if (!lesson) notFound();

  const { data: progress } = await supabase
    .from("lesson_progress")
    .select("lesson_id")
    .eq("user_id", userData.user.id)
    .eq("lesson_id", lesson.id)
    .maybeSingle();

  return (
    <div className="min-h-screen bg-ink-900 p-6 sm:p-8">
      <Link href="/dashboard/conteudos" className="text-neutral-500 text-sm no-underline">
        ← Voltar aos conteúdos
      </Link>

      <div className="max-w-2xl mt-6">
        <h1 className="text-neutral-100 text-xl font-medium mb-2">{lesson.title}</h1>
        {lesson.description && <p className="text-neutral-500 text-sm mb-6">{lesson.description}</p>}

        {lesson.content_type === "video" && lesson.video_url && (
          <div className="aspect-video rounded-xl overflow-hidden border border-white/10 mb-6">
            <iframe
              src={lesson.video_url}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        {lesson.content_type === "audio" && lesson.audio_url && (
          <audio controls className="w-full mb-6">
            <source src={lesson.audio_url} />
          </audio>
        )}

        {lesson.content_type === "text" && lesson.body_text && (
          <div className="text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap mb-6">
            {lesson.body_text}
          </div>
        )}

        <MarkCompleteButton lessonId={lesson.id} initiallyCompleted={!!progress} />
      </div>
    </div>
  );
}
