"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import JSZip from "jszip";
import { createClient } from "@/lib/supabase/client";
import { LineIcon } from "@/components/LineIcon";
import { MAX_VIDEOS_PER_BATCH, MAX_VIDEO_SIZE_MB, MAX_MUSIC_SIZE_MB, PROCESS_CONCURRENCY } from "@/lib/video-batch-config";

type ItemStatus = "queued" | "uploading" | "processing" | "done" | "failed";

type BatchItem = {
  id: string;
  file: File;
  name: string;
  status: ItemStatus;
  error?: string;
  processedPath?: string;
};

type Phase = "idle" | "running" | "done";

function formatTime(s: number) {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function extOf(name: string) {
  const m = /\.([a-zA-Z0-9]+)$/.exec(name);
  return m ? m[1].toLowerCase() : "";
}

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
}

function baseName(name: string) {
  return name.replace(/\.[a-zA-Z0-9]+$/, "");
}

async function runPool<T>(items: T[], concurrency: number, worker: (item: T) => Promise<void>) {
  let idx = 0;
  async function next(): Promise<void> {
    const i = idx++;
    if (i >= items.length) return;
    await worker(items[i]);
    return next();
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => next()));
}

const STATUS_LABEL: Record<ItemStatus, string> = {
  queued: "na fila",
  uploading: "enviando…",
  processing: "processando…",
  done: "pronto",
  failed: "falhou",
};

export function EditorMusicasClient({
  initialCredits,
  initialIsAdmin,
  userId,
}: {
  initialCredits: number;
  initialIsAdmin: boolean;
  userId: string;
}) {
  const supabase = createClient();

  const [credits, setCredits] = useState(initialCredits);
  const [isAdmin, setIsAdmin] = useState(initialIsAdmin);

  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [musicUrl, setMusicUrl] = useState<string | null>(null);
  const [musicDuration, setMusicDuration] = useState(0);
  const [musicCurrentTime, setMusicCurrentTime] = useState(0);
  const [musicStart, setMusicStart] = useState(0);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [videos, setVideos] = useState<BatchItem[]>([]);
  const itemsRef = useRef<Record<string, BatchItem>>({});

  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [zipping, setZipping] = useState(false);
  const [processedCount, setProcessedCount] = useState({ done: 0, failed: 0 });

  useEffect(() => {
    return () => {
      if (musicUrl) URL.revokeObjectURL(musicUrl);
    };
  }, [musicUrl]);

  function updateItem(id: string, patch: Partial<BatchItem>) {
    // Atualiza a "fonte da verdade" (itemsRef) NA HORA, de forma síncrona —
    // não dentro do callback do setState, porque o React pode adiar a
    // execução desse callback pra depois do ponto em que o código de
    // startBatch já foi ler itemsRef.current (ex: pra montar a lista de
    // vídeos prontos pra processar), e aí um vídeo processado com sucesso
    // podia "sumir" do lote por causa dessa corrida.
    const current = itemsRef.current[id];
    if (!current) return;
    const updated = { ...current, ...patch };
    itemsRef.current[id] = updated;
    setVideos((prev) => prev.map((v) => (v.id === id ? updated : v)));
  }

  function handleMusicFile(f: File | null) {
    if (!f) return;
    if (f.size > MAX_MUSIC_SIZE_MB * 1024 * 1024) {
      setError(`A música precisa ter até ${MAX_MUSIC_SIZE_MB}MB.`);
      return;
    }
    if (musicUrl) URL.revokeObjectURL(musicUrl);
    setMusicFile(f);
    setMusicUrl(URL.createObjectURL(f));
    setMusicDuration(0);
    setMusicCurrentTime(0);
    setMusicStart(0);
    setPlaying(false);
    setError(null);
  }

  function togglePlay() {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
  }

  function handleVideoFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError(null);

    const incoming = Array.from(fileList);
    const room = MAX_VIDEOS_PER_BATCH - videos.length;

    if (room <= 0) {
      setError(`Você já selecionou o máximo de ${MAX_VIDEOS_PER_BATCH} vídeos.`);
      return;
    }

    const accepted: BatchItem[] = [];
    let oversized = 0;

    for (const f of incoming.slice(0, room)) {
      if (f.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
        oversized++;
        continue;
      }
      accepted.push({ id: crypto.randomUUID(), file: f, name: f.name, status: "queued" });
    }

    if (incoming.length > room) {
      setError(`Só cabiam mais ${room} vídeo(s) nesse lote (máximo de ${MAX_VIDEOS_PER_BATCH}) — o restante foi ignorado.`);
    } else if (oversized > 0) {
      setError(`${oversized} vídeo(s) passaram de ${MAX_VIDEO_SIZE_MB}MB e foram ignorados.`);
    }

    accepted.forEach((a) => (itemsRef.current[a.id] = a));
    setVideos((prev) => [...prev, ...accepted]);
  }

  function removeVideo(id: string) {
    setVideos((prev) => prev.filter((v) => v.id !== id));
    delete itemsRef.current[id];
  }

  async function refreshCredits() {
    const { data } = await supabase.from("profiles").select("video_credits, is_admin").eq("id", userId).single();
    if (data) {
      setCredits(data.video_credits ?? 0);
      setIsAdmin(!!data.is_admin);
    }
  }

  const startBatch = useCallback(async () => {
    if (!musicFile || videos.length === 0) return;
    setError(null);
    setPhase("running");
    setProcessedCount({ done: 0, failed: 0 });

    const jobId = crypto.randomUUID();
    const musicPath = `${userId}/${jobId}/music.${extOf(musicFile.name) || "mp3"}`;

    const plannedItems = videos.map((v) => ({
      id: v.id,
      originalPath: `${userId}/${jobId}/raw/${v.id}-${sanitizeFilename(v.name)}`,
      originalFilename: v.name,
    }));

    // 1) registra o lote no banco ANTES de subir qualquer arquivo — assim,
    // se algo der errado no envio, não sobra arquivo órfão sem registro.
    const createRes = await fetch("/api/video-batch/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId, musicPath, musicStartSeconds: musicStart, items: plannedItems }),
    }).catch(() => null);

    if (!createRes || !createRes.ok) {
      const msg = await createRes?.json().catch(() => null);
      setError(msg?.error || "Não consegui criar o lote. Tente novamente.");
      setPhase("idle");
      return;
    }

    // 2) sobe a música
    const { error: musicUploadError } = await supabase.storage
      .from("video-batch")
      .upload(musicPath, musicFile, { contentType: musicFile.type || "audio/mpeg" });

    if (musicUploadError) {
      setError(`Não consegui enviar a música: ${musicUploadError.message}`);
      videos.forEach((v) => updateItem(v.id, { status: "failed", error: "Falha ao enviar a música." }));
      setPhase("done");
      return;
    }

    // 3) sobe os vídeos (com concorrência limitada)
    await runPool(videos, 4, async (v) => {
      updateItem(v.id, { status: "uploading" });
      const planned = plannedItems.find((p) => p.id === v.id)!;
      const { error: uploadError } = await supabase.storage
        .from("video-batch")
        .upload(planned.originalPath, v.file, { contentType: v.file.type || "video/mp4" });

      if (uploadError) {
        updateItem(v.id, { status: "failed", error: "Falha ao enviar o vídeo." });
      } else {
        updateItem(v.id, { status: "queued" });
      }
    });

    // 4) processa (troca o áudio) os que subiram com sucesso
    const toProcess = Object.values(itemsRef.current).filter((v) => v.status === "queued");

    await runPool(toProcess, PROCESS_CONCURRENCY, async (v) => {
      updateItem(v.id, { status: "processing" });
      try {
        const res = await fetch("/api/video-batch/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId: v.id }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          updateItem(v.id, { status: "failed", error: data?.error || "Falha ao processar." });
          setProcessedCount((c) => ({ ...c, failed: c.failed + 1 }));
        } else {
          updateItem(v.id, { status: "done", processedPath: data.processedPath });
          setProcessedCount((c) => ({ ...c, done: c.done + 1 }));
        }
      } catch {
        updateItem(v.id, { status: "failed", error: "Erro de rede ao processar." });
        setProcessedCount((c) => ({ ...c, failed: c.failed + 1 }));
      }
    });

    await refreshCredits();
    setPhase("done");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [musicFile, musicStart, videos, userId]);

  async function downloadZip() {
    const doneItems = Object.values(itemsRef.current).filter((v) => v.status === "done" && v.processedPath);
    if (doneItems.length === 0) return;

    setZipping(true);
    setError(null);
    try {
      const zip = new JSZip();
      for (const item of doneItems) {
        const { data, error: downloadError } = await supabase.storage.from("video-batch").download(item.processedPath!);
        if (downloadError || !data) continue;
        zip.file(`${baseName(item.name)}.mp4`, data);
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `editor-de-musicas-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch (err: any) {
      setError(err?.message || "Não consegui montar o .zip.");
    } finally {
      setZipping(false);
    }
  }

  function resetBatch() {
    if (musicUrl) URL.revokeObjectURL(musicUrl);
    setMusicFile(null);
    setMusicUrl(null);
    setMusicDuration(0);
    setMusicCurrentTime(0);
    setMusicStart(0);
    setPlaying(false);
    setVideos([]);
    itemsRef.current = {};
    setPhase("idle");
    setError(null);
    setProcessedCount({ done: 0, failed: 0 });
  }

  const canStart = !!musicFile && videos.length > 0 && phase === "idle" && (isAdmin || credits > 0);
  const total = videos.length;
  const finished = processedCount.done + processedCount.failed;

  return (
    <div className="flex flex-col gap-4">
      <div className="dgs-card flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm">
          {isAdmin ? (
            <span className="text-brand font-medium">Créditos ilimitados (admin)</span>
          ) : (
            <span className="text-neutral-300">
              <span className="text-brand font-medium">{credits}</span> crédito{credits === 1 ? "" : "s"} disponível
              {credits === 1 ? "" : "eis"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {phase === "done" && (
            <button onClick={resetBatch} className="dgs-btn-ghost">
              + novo lote
            </button>
          )}
          <Link href="/dashboard/creditos" className="dgs-btn-ghost no-underline">
            Comprar créditos
          </Link>
        </div>
      </div>

      {!isAdmin && credits <= 0 && (
        <div className="rounded-lg border border-orange-700/30 bg-orange-700/5 px-4 py-3 flex items-start gap-2.5">
          <span className="shrink-0 mt-0.5 text-orange-500">
            <LineIcon name="warning" size={14} />
          </span>
          <div className="text-neutral-400 text-xs leading-relaxed flex-1">
            Acabaram os seus créditos grátis. Escolha um pacote de créditos pra continuar processando vídeos.
          </div>
          <Link href="/dashboard/creditos" className="dgs-btn-primary w-auto px-4 whitespace-nowrap no-underline">
            Ver pacotes
          </Link>
        </div>
      )}

      {!isAdmin && credits > 0 && videos.length > credits && phase === "idle" && (
        <p className="text-neutral-500 text-xs -mt-1">
          Você tem {credits} créditos, mas selecionou {videos.length} vídeos — só os {credits} primeiros vão ser
          processados nesse lote.
        </p>
      )}

      <div className="dgs-card flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <LineIcon name="music" size={16} className="text-brand" />
          <div className="text-neutral-100 font-medium text-sm">1. Escolha a música</div>
        </div>

        {!musicFile ? (
          <input
            type="file"
            accept="audio/*"
            disabled={phase !== "idle"}
            onChange={(e) => handleMusicFile(e.target.files?.[0] ?? null)}
            className="dgs-file"
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-neutral-300 text-sm">
              <span className="truncate">{musicFile.name}</span>
              {phase === "idle" && (
                <button onClick={() => handleMusicFile(null)} className="dgs-btn-ghost ml-auto shrink-0">
                  trocar
                </button>
              )}
            </div>

            <audio
              ref={audioRef}
              src={musicUrl ?? undefined}
              onLoadedMetadata={(e) => setMusicDuration(e.currentTarget.duration)}
              onTimeUpdate={(e) => setMusicCurrentTime(e.currentTarget.currentTime)}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={() => setPlaying(false)}
            />

            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="w-9 h-9 rounded-full bg-brand/10 text-brand flex items-center justify-center shrink-0 hover:bg-brand/20 transition-colors"
                aria-label={playing ? "Pausar" : "Tocar"}
              >
                <LineIcon name={playing ? "pause" : "play"} size={16} />
              </button>
              <input
                type="range"
                min={0}
                max={musicDuration || 0}
                step={0.1}
                value={Math.min(musicCurrentTime, musicDuration || 0)}
                onChange={(e) => {
                  const t = Number(e.target.value);
                  if (audioRef.current) audioRef.current.currentTime = t;
                  setMusicCurrentTime(t);
                }}
                className="flex-1 accent-brand"
              />
              <span className="text-neutral-500 text-xs shrink-0 w-20 text-right">
                {formatTime(musicCurrentTime)} / {formatTime(musicDuration)}
              </span>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setMusicStart(musicCurrentTime)}
                disabled={phase !== "idle"}
                className="dgs-btn-ghost w-auto"
              >
                Marcar início aqui
              </button>
              <span className="text-neutral-500 text-xs">
                Início escolhido: <span className="text-neutral-300">{formatTime(musicStart)}</span> — o refrão (ou a
                parte que quiser) começa a tocar a partir daqui em todos os vídeos.
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="dgs-card flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <LineIcon name="video" size={16} className="text-brand" />
          <div className="text-neutral-100 font-medium text-sm">
            2. Escolha os vídeos {videos.length > 0 && <span className="text-neutral-500 font-normal">({videos.length}/{MAX_VIDEOS_PER_BATCH})</span>}
          </div>
        </div>

        {phase === "idle" && (
          <input
            type="file"
            accept="video/*"
            multiple
            onChange={(e) => {
              handleVideoFiles(e.target.files);
              e.target.value = "";
            }}
            className="dgs-file"
          />
        )}

        {videos.length > 0 && (
          <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto pr-1">
            {videos.map((v) => (
              <div
                key={v.id}
                className="flex items-center gap-2 bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-xs"
              >
                <span className="text-neutral-300 truncate flex-1">{v.name}</span>
                {phase === "idle" ? (
                  <button onClick={() => removeVideo(v.id)} className="text-neutral-500 hover:text-red-400 shrink-0">
                    remover
                  </button>
                ) : (
                  <span
                    className={`shrink-0 ${
                      v.status === "done"
                        ? "text-brand"
                        : v.status === "failed"
                          ? "text-red-400"
                          : "text-neutral-500"
                    }`}
                  >
                    {STATUS_LABEL[v.status]}
                    {v.status === "failed" && v.error ? ` — ${v.error}` : ""}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/25 bg-red-500/5 px-4 py-3 text-red-400 text-xs leading-relaxed">
          {error}
        </div>
      )}

      {phase !== "done" && (
        <button onClick={startBatch} disabled={!canStart} className="dgs-btn-primary">
          {phase === "running" ? `Processando… (${finished}/${total})` : "Iniciar processamento"}
        </button>
      )}

      {phase === "done" && (
        <div className="dgs-card flex flex-col gap-3">
          <p className="text-neutral-300 text-sm">
            {processedCount.done} de {total} vídeo{total === 1 ? "" : "s"} processado{processedCount.done === 1 ? "" : "s"}{" "}
            com sucesso{processedCount.failed > 0 ? ` — ${processedCount.failed} falharam` : ""}.
          </p>
          {processedCount.done > 0 && (
            <button onClick={downloadZip} disabled={zipping} className="dgs-btn-primary flex items-center justify-center gap-1.5">
              <LineIcon name="download" size={15} />
              {zipping ? "Montando o .zip…" : "Baixar .zip com os vídeos prontos"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
