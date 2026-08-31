import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/DashboardHeader";
import { toYoutubeEmbedUrl } from "@/lib/youtube";
import { LineIcon } from "@/components/LineIcon";

export default async function PaginasPage() {
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
    .from("paginas_settings")
    .select("tutorial_video_url, description")
    .eq("id", "main")
    .maybeSingle();

  const embedUrl = settings?.tutorial_video_url ? toYoutubeEmbedUrl(settings.tutorial_video_url) : null;

  return (
    <div className="min-h-screen bg-ink-900 p-6 sm:p-8">
      <div className="max-w-3xl mx-auto">
        <DashboardHeader backHref="/dashboard" />

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-neutral-100 text-xl font-medium">Lista de Páginas</h1>
          {profile.is_admin && (
            <Link href="/dashboard/admin/paginas" className="text-brand text-sm no-underline">
              + Gerenciar
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Link
            href="/dashboard/paginas/portugues"
            className="dgs-card dgs-hover-card no-underline flex flex-col gap-3"
          >
            <div className="w-11 h-11 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
              <LineIcon name="globe" />
            </div>
            <div>
              <div className="text-neutral-100 font-medium mb-1">Páginas em Português</div>
              <div className="text-neutral-500 text-sm leading-relaxed">
                Contas brasileiras pra buscar vídeos com potencial de viralização.
              </div>
            </div>
            <div className="text-brand text-xs mt-auto pt-1">Ver lista →</div>
          </Link>

          <Link href="/dashboard/paginas/gringas" className="dgs-card dgs-hover-card no-underline flex flex-col gap-3">
            <div className="w-11 h-11 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
              <LineIcon name="globe" />
            </div>
            <div>
              <div className="text-neutral-100 font-medium mb-1">Páginas Gringas</div>
              <div className="text-neutral-500 text-sm leading-relaxed">
                Contas internacionais pra buscar vídeos com potencial de viralização.
              </div>
            </div>
            <div className="text-brand text-xs mt-auto pt-1">Ver lista →</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
