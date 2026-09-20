import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";
import { MarkTreinamentoComplete } from "@/components/TreinamentoProgress";

export async function generateMetadata({ params }: { params: { lessonId: string } }): Promise<Metadata> {
  const supabase = createClient();
  const { data: lesson } = await supabase
    .from("treinamento_licoes")
    .select("title")
    .eq("id", params.lessonId)
    .maybeSingle();

  return { title: lesson ? `${lesson.title} — Treinamento Digital Supply` : "Treinamento Digital Supply" };
}

export default async function TreinamentoLessonPage({ params }: { params: { lessonId: string } }) {
  const supabase = createClient();

  const { data: lesson } = await supabase
    .from("treinamento_licoes")
    .select("id, title, subtitle, content_type, body_text, video_url, is_bonus, order_index")
    .eq("id", params.lessonId)
    .maybeSingle();

  if (!lesson) notFound();

  const { data: allLessons } = await supabase
    .from("treinamento_licoes")
    .select("id, title, order_index")
    .order("order_index", { ascending: true });

  const ordered = allLessons ?? [];
  const idx = ordered.findIndex((l) => l.id === lesson.id);
  const prev = idx > 0 ? ordered[idx - 1] : null;
  const next = idx >= 0 && idx < ordered.length - 1 ? ordered[idx + 1] : null;

  return (
    <div className="min-h-screen bg-ink-900 text-neutral-100">
      <header className="border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 no-underline">
            <Logo size={30} />
            <span className="text-sm font-semibold tracking-wide text-neutral-100">DIGITAL SUPPLY</span>
          </Link>
          <Link href="/cadastro" className="dgs-btn-primary w-auto px-4 py-2 text-xs no-underline">
            Conhecer a DGS PRO
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8 sm:py-10">
        <Link href="/treinamento" className="text-neutral-500 text-sm no-underline hover:text-neutral-300 transition-colors">
          ← Voltar pro treinamento
        </Link>

        <div className="mt-6">
          {lesson.is_bonus && (
            <div className="text-brand text-xs tracking-widest font-medium mb-2">BÔNUS</div>
          )}
          <h1 className="text-neutral-100 text-xl sm:text-2xl font-medium mb-2">{lesson.title}</h1>
          {lesson.subtitle && <p className="text-neutral-500 text-sm mb-6">{lesson.subtitle}</p>}

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

          {lesson.content_type === "video" && !lesson.video_url && (
            <div className="dgs-card text-neutral-500 text-sm mb-6">O vídeo dessa aula ainda vai ser publicado.</div>
          )}

          {lesson.content_type === "text" && lesson.body_text && (
            <div
              className="text-neutral-300 text-sm leading-relaxed mb-6 whitespace-pre-wrap [&_blockquote]:border-l-2 [&_blockquote]:border-brand/50 [&_blockquote]:pl-3 [&_blockquote]:text-neutral-400 [&_blockquote]:italic [&_a]:text-brand [&_a]:underline"
              dangerouslySetInnerHTML={{ __html: lesson.body_text }}
            />
          )}

          {lesson.content_type === "text" && !lesson.body_text && (
            <div className="dgs-card text-neutral-500 text-sm mb-6">O conteúdo dessa aula ainda vai ser publicado.</div>
          )}

          <MarkTreinamentoComplete lessonId={lesson.id} />

          <div className="flex items-center justify-between gap-3 mt-8 pt-6 border-t border-white/10">
            {prev ? (
              <Link href={`/treinamento/${prev.id}`} className="dgs-btn-ghost no-underline">
                ← Aula anterior
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link href={`/treinamento/${next.id}`} className="dgs-btn-primary w-auto px-5 py-2.5 no-underline">
                Próxima aula →
              </Link>
            ) : (
              <Link href="/treinamento#dgs-pro" className="dgs-btn-primary w-auto px-5 py-2.5 no-underline">
                Ver a Comunidade DGS PRO →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
