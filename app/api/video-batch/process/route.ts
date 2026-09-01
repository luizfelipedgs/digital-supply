import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { buildMusicOverlayArgs, runFfmpeg } from "@/lib/ffmpeg";

// Processa UM vídeo do lote: baixa o vídeo original + a música do Storage,
// troca o áudio (mudo original, música 100%, cortada no tamanho do vídeo)
// e sobe o resultado. O cliente chama essa rota uma vez por vídeo (com
// concorrência limitada — veja PROCESS_CONCURRENCY), então cada chamada
// precisa terminar dentro do maxDuration abaixo.
export const maxDuration = 180;

export async function POST(req: NextRequest) {
  let admin: ReturnType<typeof createAdminClient> | null = null;
  let itemId: string | undefined;
  let jobId: string | undefined;
  let creditConsumed = false;

  try {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("status, is_admin")
      .eq("id", userData.user.id)
      .single();

    if (!profile || profile.status !== "active") {
      return NextResponse.json({ error: "Assinatura inativa." }, { status: 403 });
    }

    const isAdmin = !!profile.is_admin;

    const body = await req.json().catch(() => null);
    itemId = body?.itemId;
    if (!itemId || typeof itemId !== "string") {
      return NextResponse.json({ error: "itemId ausente." }, { status: 400 });
    }

    admin = createAdminClient();

    const { data: item } = await admin
      .from("video_batch_items")
      .select("id, job_id, user_id, original_path, status")
      .eq("id", itemId)
      .maybeSingle();

    if (!item || item.user_id !== userData.user.id) {
      return NextResponse.json({ error: "Vídeo não encontrado." }, { status: 404 });
    }

    jobId = item.job_id;

    const { data: job } = await admin
      .from("video_batch_jobs")
      .select("id, music_path, music_start_seconds")
      .eq("id", jobId)
      .single();

    if (!job) {
      return NextResponse.json({ error: "Lote não encontrado." }, { status: 404 });
    }

    await admin.from("video_batch_items").update({ status: "processing", error_message: null }).eq("id", itemId);

    if (!isAdmin) {
      const { data: quota, error: quotaError } = await supabase.rpc("consume_video_credit").single();
      if (quotaError) {
        throw new Error(`Falha ao checar créditos: ${quotaError.message}`);
      }
      const q = quota as { allowed: boolean; remaining: number } | null;
      if (!q || !q.allowed) {
        await admin
          .from("video_batch_items")
          .update({ status: "failed", error_message: "Sem créditos suficientes." })
          .eq("id", itemId);
        await admin.rpc("bump_video_batch_job_counts", { p_job_id: jobId, p_done_delta: 0, p_failed_delta: 1 });
        return NextResponse.json(
          { error: "Você não tem créditos suficientes. Compre um pacote pra continuar.", code: "NO_CREDITS" },
          { status: 402 }
        );
      }
      creditConsumed = true;
    }

    // Baixa vídeo + música pra um diretório temporário local
    const workDir = await fs.mkdtemp(path.join(os.tmpdir(), "trilha-"));
    const videoLocal = path.join(workDir, "input" + (path.extname(item.original_path) || ".mp4"));
    const musicLocal = path.join(workDir, "music" + (path.extname(job.music_path) || ".mp3"));
    const outputLocal = path.join(workDir, "output.mp4");

    try {
      const [videoBlob, musicBlob] = await Promise.all([
        admin.storage.from("video-batch").download(item.original_path),
        admin.storage.from("video-batch").download(job.music_path),
      ]);

      if (videoBlob.error || !videoBlob.data) throw new Error("Não consegui baixar o vídeo original.");
      if (musicBlob.error || !musicBlob.data) throw new Error("Não consegui baixar a música.");

      await fs.writeFile(videoLocal, Buffer.from(await videoBlob.data.arrayBuffer()));
      await fs.writeFile(musicLocal, Buffer.from(await musicBlob.data.arrayBuffer()));

      await runFfmpeg(
        buildMusicOverlayArgs({
          videoPath: videoLocal,
          musicPath: musicLocal,
          musicStartSeconds: Number(job.music_start_seconds) || 0,
          outputPath: outputLocal,
        })
      );

      const outputBuffer = await fs.readFile(outputLocal);
      const processedPath = `${userData.user.id}/${jobId}/processed/${itemId}.mp4`;

      const { error: uploadError } = await admin.storage
        .from("video-batch")
        .upload(processedPath, outputBuffer, { contentType: "video/mp4", upsert: true });

      if (uploadError) throw new Error(`Não consegui salvar o vídeo processado: ${uploadError.message}`);

      await admin
        .from("video_batch_items")
        .update({ status: "done", processed_path: processedPath, error_message: null })
        .eq("id", itemId);
      await admin.rpc("bump_video_batch_job_counts", { p_job_id: jobId, p_done_delta: 1, p_failed_delta: 0 });

      return NextResponse.json({ ok: true, processedPath });
    } finally {
      await fs.rm(workDir, { recursive: true, force: true }).catch(() => {});
    }
  } catch (err: any) {
    console.error("[/api/video-batch/process]", err);
    const message = err?.message || "Erro inesperado ao processar o vídeo.";

    if (admin && itemId) {
      await admin.from("video_batch_items").update({ status: "failed", error_message: message }).eq("id", itemId);
      if (jobId) {
        await admin.rpc("bump_video_batch_job_counts", { p_job_id: jobId, p_done_delta: 0, p_failed_delta: 1 });
      }
      // Se o crédito já tinha sido debitado antes do ffmpeg falhar, devolve —
      // o aluno não deve pagar por um vídeo que não foi processado.
      if (creditConsumed) {
        const { data: item } = await admin
          .from("video_batch_items")
          .select("user_id")
          .eq("id", itemId)
          .maybeSingle();
        if (item) {
          const { data: prof } = await admin.from("profiles").select("video_credits").eq("id", item.user_id).single();
          if (prof) {
            await admin
              .from("profiles")
              .update({ video_credits: (prof.video_credits ?? 0) + 1 })
              .eq("id", item.user_id);
          }
        }
      }
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
