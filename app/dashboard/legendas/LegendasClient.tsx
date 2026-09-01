"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LineIcon } from "@/components/LineIcon";
import { DAILY_VIDEO_LIMIT } from "@/lib/legendas-config";

type DisplayMessage = {
  role: "user" | "assistant";
  text: string;
  images?: string[]; // frames extraídos do vídeo, só presentes na mensagem que anexou o vídeo
  attachmentLabel?: string;
  hasVideo?: boolean;
};

type PendingVideo = {
  label: string;
  images: string[]; // frames já extraídos, prontos pra enviar
};

const WELCOME: DisplayMessage = {
  role: "assistant",
  text:
    "Manda um vídeo (com ou sem um texto explicando o que você quer) que eu devolvo uma legenda pronta pra " +
    "publicar, com contexto e, quando fizer sentido, headlines.",
};

function todaySaoPauloISO() {
  // yyyy-mm-dd no fuso de Brasília, independente do fuso do navegador do aluno
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

function seekTo(video: HTMLVideoElement, time: number) {
  return new Promise<void>((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      video.removeEventListener("seeked", onSeeked);
      resolve();
    };
    const onSeeked = () => finish();
    video.addEventListener("seeked", onSeeked);
    video.currentTime = time;
    setTimeout(finish, 8000);
  });
}

async function extractVideoFrames(file: File, frameCount = 6, maxWidth = 960): Promise<string[]> {
  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.src = url;

    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("Não foi possível ler esse arquivo de vídeo."));
      setTimeout(() => reject(new Error("Tempo esgotado ao carregar o vídeo.")), 15000);
    });

    const duration = video.duration;
    if (!isFinite(duration) || duration <= 0) {
      throw new Error("Vídeo inválido ou sem duração legível.");
    }

    const scale = Math.min(1, maxWidth / (video.videoWidth || maxWidth));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round((video.videoWidth || maxWidth) * scale));
    canvas.height = Math.max(1, Math.round((video.videoHeight || maxWidth) * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas não suportado neste navegador.");

    const frames: string[] = [];
    const margin = Math.min(duration * 0.05, 1);
    const usable = Math.max(duration - margin * 2, 0.01);

    for (let i = 0; i < frameCount; i++) {
      const t = margin + (frameCount === 1 ? usable / 2 : (i / (frameCount - 1)) * usable);
      await seekTo(video, t);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      frames.push(canvas.toDataURL("image/jpeg", 0.72));
    }

    return frames;
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Monta as mensagens pra API. Só a mensagem MAIS RECENTE com vídeo mantém os
// frames de fato — mensagens de vídeo mais antigas viram um texto curto, pra
// não reenviar (e recobrar) as mesmas imagens em todo turno de uma conversa longa.
function toApiMessages(conversation: DisplayMessage[]) {
  const lastVideoIndex = (() => {
    for (let i = conversation.length - 1; i >= 0; i--) {
      if (conversation[i].images?.length) return i;
    }
    return -1;
  })();

  return conversation.map((m, i) => {
    if (m.images && m.images.length > 0) {
      if (i === lastVideoIndex) {
        return {
          role: m.role,
          content: [
            { type: "text", text: m.text || "Analise este vídeo e escreva a legenda." },
            ...m.images.map((url) => ({ type: "image_url", image_url: { url } })),
          ],
        };
      }
      return {
        role: m.role,
        content: `[vídeo enviado anteriormente nesta conversa — já analisado acima]${m.text ? " " + m.text : ""}`,
      };
    }
    return { role: m.role, content: m.text };
  });
}

export function LegendasClient({
  initialRemaining,
  initialMessages,
}: {
  // usados só pra pré-visualização de layout — a tela real nunca passa isso,
  // então o comportamento em produção (busca a cota real, começa só com o
  // WELCOME) fica igual ao de antes.
  initialRemaining?: number;
  initialMessages?: DisplayMessage[];
} = {}) {
  const supabase = createClient();
  const [messages, setMessages] = useState<DisplayMessage[]>(initialMessages ?? [WELCOME]);
  const [inputText, setInputText] = useState("");
  const [pendingVideo, setPendingVideo] = useState<PendingVideo | null>(null);
  const [processingVideo, setProcessingVideo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [remaining, setRemaining] = useState<number | null>(initialRemaining ?? null);

  const videoInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialRemaining !== undefined) return; // pré-visualização — não busca do Supabase

    async function loadQuota() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const { data } = await supabase
        .from("legendas_video_usage")
        .select("count")
        .eq("user_id", userData.user.id)
        .eq("usage_date", todaySaoPauloISO())
        .maybeSingle();
      setRemaining(DAILY_VIDEO_LIMIT - (data?.count ?? 0));
    }
    loadQuota();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function scrollToBottom() {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  }

  async function onPickVideo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (remaining !== null && remaining <= 0) {
      setError(`Você já usou seus ${DAILY_VIDEO_LIMIT} vídeos de hoje. Volta amanhã!`);
      return;
    }
    if (file.size > 300 * 1024 * 1024) {
      setError("Vídeo muito grande (máx. 300MB).");
      return;
    }
    setError(null);
    setProcessingVideo(true);
    try {
      const images = await extractVideoFrames(file, 6);
      setPendingVideo({ label: `vídeo — ${images.length} frames extraídos`, images });
    } catch (err: any) {
      setError(err?.message || "Não foi possível processar o vídeo.");
    } finally {
      setProcessingVideo(false);
    }
  }

  async function handleSend() {
    const trimmed = inputText.trim();
    if (!trimmed && !pendingVideo) return;
    if (loading || processingVideo) return;

    setError(null);

    const userMsg: DisplayMessage = {
      role: "user",
      text: trimmed,
      images: pendingVideo?.images,
      attachmentLabel: pendingVideo?.label,
      hasVideo: !!pendingVideo,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputText("");
    setPendingVideo(null);
    setLoading(true);
    scrollToBottom();

    try {
      const conversation = newMessages.filter((m) => m !== WELCOME);
      const res = await fetch("/api/legendas/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: toApiMessages(conversation) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Erro ao falar com o agente.");

      if (typeof data.remaining === "number") setRemaining(data.remaining);

      setMessages((prev) => [...prev, { role: "assistant", text: data.reply }]);
      scrollToBottom();
    } catch (err: any) {
      setError(err?.message || "Erro inesperado ao falar com o agente.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  async function copyToClipboard(text: string, index: number) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex((v) => (v === index ? null : v)), 2000);
    } catch {
      // ambiente sem clipboard API — ignora silenciosamente
    }
  }

  function newConversation() {
    setMessages([WELCOME]);
    setPendingVideo(null);
    setError(null);
  }

  const busy = loading || processingVideo;
  const quotaExhausted = remaining !== null && remaining <= 0;

  return (
    <div className="dgs-card flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="text-xs text-neutral-500">
          {remaining === null ? (
            "Carregando sua cota do dia…"
          ) : (
            <>
              <span className={quotaExhausted ? "text-red-400" : "text-brand"}>{Math.max(remaining, 0)}</span> de{" "}
              {DAILY_VIDEO_LIMIT} vídeos disponíveis hoje
            </>
          )}
        </div>
        <button onClick={newConversation} className="text-neutral-500 text-xs hover:text-neutral-300 transition-colors">
          + nova conversa
        </button>
      </div>

      <div
        ref={scrollRef}
        className="flex flex-col gap-3 overflow-y-auto pr-0.5"
        style={{ minHeight: 220, maxHeight: "52vh" }}
      >
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-brand/10 border border-brand/25 text-neutral-100"
                  : "bg-white/[0.03] border border-white/10 text-neutral-200"
              }`}
            >
              {m.images && m.images.length > 0 && (
                <div className="flex gap-1.5 flex-wrap mb-2">
                  {m.images.slice(0, 6).map((src, j) => (
                    <img key={j} src={src} alt="" className="w-14 h-14 object-cover rounded-lg border border-white/10" />
                  ))}
                </div>
              )}
              {m.attachmentLabel && !m.text && (
                <div className="text-xs text-neutral-500 mb-1">{m.attachmentLabel}</div>
              )}
              {m.text && <div>{m.text}</div>}

              {m.role === "assistant" && m !== WELCOME && (
                <button
                  onClick={() => copyToClipboard(m.text, i)}
                  className="mt-2 text-brand text-xs flex items-center gap-1"
                >
                  <LineIcon name="check" size={12} />
                  {copiedIndex === i ? "Copiado!" : "Copiar"}
                </button>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl text-neutral-500 text-sm px-4 py-3">
              Editando…
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="text-red-400 text-xs flex items-center gap-1.5">
          <LineIcon name="warning" size={13} />
          {error}
        </div>
      )}

      {pendingVideo && (
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
          <div className="flex gap-1">
            {pendingVideo.images.slice(0, 3).map((src, i) => (
              <img key={i} src={src} alt="" className="w-8 h-8 object-cover rounded border border-white/10" />
            ))}
          </div>
          <div className="text-neutral-400 text-xs flex-1">{pendingVideo.label}</div>
          <button onClick={() => setPendingVideo(null)} className="text-neutral-500 hover:text-neutral-300 text-xs">
            remover
          </button>
        </div>
      )}

      {processingVideo && <div className="text-neutral-500 text-xs">Processando vídeo…</div>}

      <div className="flex flex-col gap-2 pt-1 border-t border-white/10">
        <div className="flex items-center gap-2 pt-2">
          <input ref={videoInputRef} type="file" accept="video/*" hidden onChange={onPickVideo} />

          <button
            onClick={() => videoInputRef.current?.click()}
            disabled={busy || quotaExhausted}
            title={quotaExhausted ? "Limite diário de vídeos atingido" : "Anexar vídeo"}
            className="w-11 h-11 shrink-0 rounded-lg border border-white/10 bg-white/[0.03] flex items-center justify-center text-neutral-400 hover:text-brand hover:border-brand/30 transition-colors disabled:opacity-40 disabled:hover:text-neutral-400 disabled:hover:border-white/10"
          >
            <LineIcon name="video" size={18} />
          </button>

          <textarea
            className="dgs-input resize-none flex-1 min-w-0"
            rows={1}
            placeholder="Escreva sua legenda, ideia ou pergunta…"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={busy}
          />
        </div>

        <button
          onClick={handleSend}
          disabled={busy || (!inputText.trim() && !pendingVideo)}
          className="dgs-btn-primary"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
