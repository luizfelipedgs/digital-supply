import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ConteudosPage() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("status, is_admin")
    .eq("id", userData.user.id)
    .single();

  if (!profile || profile.status !== "active") redirect("/aguardando");

  const { data: modules } = await supabase
    .from("content_modules")
    .select("id, title, description, order_index, content_lessons(id, title, content_type, order_index)")
    .order("order_index", { ascending: true });

  const { data: progress } = await supabase
    .from("lesson_progress")
    .select("lesson_id")
    .eq("user_id", userData.user.id);

  const completedIds = new Set((progress ?? []).map((p) => p.lesson_id));

  const typeIcon: Record<string, string> = { text: "📄", video: "🎬", audio: "🎧" };

  return (
    <div className="min-h-screen bg-ink-900 p-6 sm:p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-neutral-100 text-xl font-medium">Conteúdos</h1>
        {profile.is_admin && (
          <Link href="/dashboard/admin/conteudos" className="text-brand text-sm no-underline">
            + Gerenciar conteúdos
          </Link>
        )}
      </div>

      {(!modules || modules.length === 0) && (
        <p className="text-neutral-500 text-sm">Nenhum conteúdo publicado ainda.</p>
      )}

      <div className="flex flex-col gap-6 max-w-2xl">
        {modules?.map((mod) => {
          const lessons = [...(mod.content_lessons ?? [])].sort((a, b) => a.order_index - b.order_index);
          return (
            <div key={mod.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <div className="text-neutral-100 font-medium mb-1">{mod.title}</div>
              {mod.description && (
                <div className="text-neutral-500 text-sm mb-4">{mod.description}</div>
              )}
              <div className="flex flex-col gap-1">
                {lessons.map((lesson) => (
                  <Link
                    key={lesson.id}
                    href={`/dashboard/conteudos/${lesson.id}`}
                    className="flex items-center gap-3 py-2 px-3 rounded-lg no-underline hover:bg-white/[0.04] transition-colors"
                  >
                    <span className="text-sm">{typeIcon[lesson.content_type] ?? "📄"}</span>
                    <span className="text-neutral-200 text-sm flex-1">{lesson.title}</span>
                    {completedIds.has(lesson.id) && <span className="text-brand text-xs">concluída</span>}
                  </Link>
                ))}
                {lessons.length === 0 && (
                  <div className="text-neutral-600 text-xs px-3">Nenhuma aula neste módulo ainda.</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
