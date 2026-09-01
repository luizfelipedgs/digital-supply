import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/DashboardHeader";
import { LineIcon } from "@/components/LineIcon";
import { TrilhaClient } from "./TrilhaClient";
import { MAX_VIDEOS_PER_BATCH, BATCH_RETENTION_HOURS } from "@/lib/video-batch-config";

export default async function TrilhaPage() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("status, is_admin, video_credits")
    .eq("id", userData.user.id)
    .single();

  if (!profile || profile.status !== "active") redirect("/aguardando");

  return (
    <div className="min-h-screen bg-ink-900 p-6 sm:p-8">
      <div className="max-w-3xl mx-auto">
        <DashboardHeader backHref="/dashboard" />

        <div className="mb-5">
          <h1 className="text-neutral-100 text-xl font-medium">Trilha em Massa</h1>
          <p className="text-neutral-500 text-sm mt-1">
            Envie vários vídeos de uma vez, escolha uma música e eu coloco ela em todos automaticamente — som
            original mudo, música no volume cheio e cortada certinho no tamanho de cada vídeo.
          </p>
        </div>

        <div className="rounded-lg border border-orange-700/30 bg-orange-700/5 px-4 py-3 mb-3 flex items-start gap-2.5">
          <span className="shrink-0 mt-0.5 text-orange-500">
            <LineIcon name="warning" size={14} />
          </span>
          <p className="text-neutral-400 text-xs leading-relaxed">
            Cada vídeo processado consome 1 crédito. Você pode enviar até {MAX_VIDEOS_PER_BATCH} vídeos por vez. Os
            arquivos ficam disponíveis pra download por {BATCH_RETENTION_HOURS} horas — depois disso são apagados
            automaticamente.
          </p>
        </div>

        <TrilhaClient initialCredits={profile.video_credits ?? 0} initialIsAdmin={!!profile.is_admin} userId={userData.user.id} />
      </div>
    </div>
  );
}
