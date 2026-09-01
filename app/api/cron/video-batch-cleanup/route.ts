import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// Rodado pela Vercel Cron (veja vercel.json) — apaga lotes da Trilha em
// Massa (vídeos, música e resultados) depois de 12h, pra não acumular
// custo de Storage indefinidamente.
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  // A Vercel assina chamadas de cron com esse header quando CRON_SECRET
  // está configurado — confirma que a chamada é mesmo da Vercel Cron.
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: expiredJobs, error } = await admin
    .from("video_batch_jobs")
    .select("id, user_id")
    .lt("expires_at", new Date().toISOString())
    .limit(200);

  if (error) {
    console.error("[cron/video-batch-cleanup]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let removedJobs = 0;
  let removedFiles = 0;

  for (const job of expiredJobs ?? []) {
    const prefix = `${job.user_id}/${job.id}`;
    try {
      // Lista e apaga tudo que estiver dentro da pasta do lote (raw/, music.*, processed/)
      const foldersToCheck = ["", "raw", "processed"];
      for (const sub of foldersToCheck) {
        const { data: files } = await admin.storage.from("video-batch").list(`${prefix}${sub ? "/" + sub : ""}`);
        if (files && files.length > 0) {
          const paths = files
            .filter((f: any) => f.name)
            .map((f: any) => `${prefix}${sub ? "/" + sub : ""}/${f.name}`);
          if (paths.length > 0) {
            await admin.storage.from("video-batch").remove(paths);
            removedFiles += paths.length;
          }
        }
      }

      // As linhas de video_batch_items somem sozinhas (on delete cascade)
      await admin.from("video_batch_jobs").delete().eq("id", job.id);
      removedJobs += 1;
    } catch (cleanupErr) {
      console.error("[cron/video-batch-cleanup] falha ao limpar lote", job.id, cleanupErr);
    }
  }

  return NextResponse.json({ ok: true, removedJobs, removedFiles });
}
