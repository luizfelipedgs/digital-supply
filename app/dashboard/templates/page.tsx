import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/DashboardHeader";
import { toYoutubeEmbedUrl } from "@/lib/youtube";

export default async function TemplatesPage() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("status, is_admin")
    .eq("id", userData.user.id)
    .single();

  if (!profile || profile.status !== "active") redirect("/aguardando");

  const { data: settings } = await supabase
    .from("templates_settings")
    .select("tutorial_video_url, description")
    .eq("id", "main")
    .maybeSingle();

  const { data: templates } = await supabase
    .from("templates")
    .select("id, name, canva_url, description")
    .order("order_index", { ascending: true });

  const embedUrl = settings?.tutorial_video_url ? toYoutubeEmbedUrl(settings.tutorial_video_url) : null;

  return (
    <div className="min-h-screen bg-ink-900 p-6 sm:p-8">
      <div className="max-w-3xl mx-auto">
        <DashboardHeader backHref="/dashboard" />

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-neutral-100 text-xl font-medium">Templates Prontos</h1>
          {profile.is_admin && (
            <Link href="/dashboard/admin/templates" className="text-brand text-sm no-underline">
              + Gerenciar templates
            </Link>
          )}
        </div>

        {embedUrl && (
          <div className="aspect-video rounded-xl overflow-hidden border border-white/10 mb-6">
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        {settings?.description && (
          <div className="dgs-card mb-6">
            <p className="text-neutral-400 text-sm leading-relaxed whitespace-pre-wrap">{settings.description}</p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {(!templates || templates.length === 0) && (
            <p className="text-neutral-500 text-sm">Nenhum template disponível ainda.</p>
          )}
          {templates?.map((t) => (
            <a
              key={t.id}
              href={t.canva_url}
              target="_blank"
              rel="noreferrer"
              className="dgs-card dgs-hover-card no-underline flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="text-neutral-100 font-medium text-sm mb-0.5 truncate">{t.name}</div>
                {t.description && <div className="text-neutral-500 text-xs truncate">{t.description}</div>}
              </div>
              <div className="text-brand text-xs shrink-0">Abrir no Canva →</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
