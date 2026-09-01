import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { MAX_VIDEOS_PER_BATCH, BATCH_RETENTION_HOURS } from "@/lib/video-batch-config";

// Cria o lote (job) e os itens no banco. Os arquivos (vídeos + música) já
// foram enviados direto do navegador pro Storage antes dessa chamada — aqui
// só registramos os caminhos, então o corpo da requisição é pequeno.
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("status")
      .eq("id", userData.user.id)
      .single();

    if (!profile || profile.status !== "active") {
      return NextResponse.json({ error: "Assinatura inativa." }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
    }

    const jobId: string = body.jobId;
    const musicPath: string = body.musicPath;
    const musicStartSeconds: number = Number(body.musicStartSeconds) || 0;
    const items: { id: string; originalPath: string; originalFilename: string }[] = body.items;

    const userPrefix = `${userData.user.id}/`;

    if (typeof jobId !== "string" || typeof musicPath !== "string" || !musicPath.startsWith(userPrefix)) {
      return NextResponse.json({ error: "Dados do lote inválidos." }, { status: 400 });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Envie pelo menos um vídeo." }, { status: 400 });
    }

    if (items.length > MAX_VIDEOS_PER_BATCH) {
      return NextResponse.json(
        { error: `No máximo ${MAX_VIDEOS_PER_BATCH} vídeos por lote.` },
        { status: 400 }
      );
    }

    for (const item of items) {
      if (
        typeof item.id !== "string" ||
        typeof item.originalPath !== "string" ||
        typeof item.originalFilename !== "string" ||
        !item.originalPath.startsWith(userPrefix)
      ) {
        return NextResponse.json({ error: "Item do lote inválido." }, { status: 400 });
      }
    }

    // Daqui pra frente usamos a service role: o aluno não tem (e não precisa
    // ter) permissão de insert/update nessas tabelas — só o backend escreve.
    const admin = createAdminClient();

    const expiresAt = new Date(Date.now() + BATCH_RETENTION_HOURS * 60 * 60 * 1000).toISOString();

    const { error: jobError } = await admin.from("video_batch_jobs").insert({
      id: jobId,
      user_id: userData.user.id,
      status: "processing",
      music_path: musicPath,
      music_start_seconds: musicStartSeconds,
      total_videos: items.length,
      expires_at: expiresAt,
    });

    if (jobError) {
      console.error("[/api/video-batch/create] job insert error", jobError);
      return NextResponse.json({ error: "Não consegui criar o lote." }, { status: 500 });
    }

    const { error: itemsError } = await admin.from("video_batch_items").insert(
      items.map((item) => ({
        id: item.id,
        job_id: jobId,
        user_id: userData.user.id,
        original_filename: item.originalFilename,
        original_path: item.originalPath,
        status: "pending",
      }))
    );

    if (itemsError) {
      console.error("[/api/video-batch/create] items insert error", itemsError);
      return NextResponse.json({ error: "Não consegui registrar os vídeos do lote." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, jobId, expiresAt });
  } catch (err: any) {
    console.error("[/api/video-batch/create]", err);
    return NextResponse.json({ error: err?.message || "Erro inesperado ao criar o lote." }, { status: 500 });
  }
}
