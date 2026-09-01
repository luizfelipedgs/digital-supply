"use client";

import { useRef, useState } from "react";
import { LineIcon } from "@/components/LineIcon";

type DisplayMessage = {
  role: "user" | "assistant";
  text: string;
  images?: string[];
  attachmentLabel?: string;
};

type PendingAttachment = {
  kind: "image" | "video";
  label: string;
  images: string[]; // já comprimidas/extraídas, prontas pra enviar
};

const WELCOME: DisplayMessage = {
  role: "assistant",
  text:
    "Sou o Mestre das Legendas. Me manda um vídeo, uma imagem, uma legenda pra revisar ou só uma pergunta — eu devolvo conteúdo pronto pra publicar no Instagram, com contexto e, quando fizer sentido, headlines.\n\nObs: em vídeos eu analiso frames extraídos automaticamente — ainda não escuto áudio/narração.",
};

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

async function fileToCompressedDataUrl(file: File, maxWidth = 1280, quality = 0.82): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = document.createElement("img");
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Não foi possível ler essa imagem."));
      img.src = url;
    });

    const scale = Math.min(1, maxWidth / (img.naturalWidth || maxWidth));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round((img.naturalWidth || maxWidth) * scale));
    canvas.height = Math.max(1, Math.round((img.naturalHeight || maxWidth) * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas não suportado neste navegador.");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function toApiMessage(m: DisplayMessage) {
  if (m.images && m.images.length > 0) {
    return {
      role: m.role,
      content: [
        { type: "text", text: m.text || "Analise o conteúdo enviado e escreva a legenda." },
        ...m.images.map((url) => ({ type: "image_url", image_url: { url } })),
      ],
    };
  }
  return { role: m.role, content: m.text };
}

export function LegendasClient() {
  const [messages, setMessages] = useState<DisplayMessage[]>([WELCOME]);
  const [inputText, setInputText] = useState("");
  const [pendingAttachment, setPendingAttachment] = useState<PendingAttachment | null>(null);
  const [processingAttachment, setProcessingAttachment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  function scrollToBottom() {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  }

  async function onPickImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    if (files.length > 6) {
      setError("Selecione no máximo 6 imagens por vez.");
      return;
    }
    setError(null);
    setProcessingAttachment(true);
    try {
      const images = await Promise.all(files.map((f) => fileToCompressedDataUrl(f)));
      setPendingAttachment({ kind: "image", label: `${files.length} imagem${files.length > 1 ? "ns" : ""}`, images });
    } catch (err: any) {
      setError(err?.message || "Não foi possível processar as imagens.");
    } finally {
      setProcessingAttachment(false);
    }
  }

  async function onPickVideo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 300 * 1024 * 1024) {
      setError("Vídeo muito grande (máx. 300MB).");
      return;
    }
    setError(null);
    setProcessingAttachment(true);
    try {
      const images = await extractVideoFrames(file, 6);
      setPendingAttachment({ kind: "video", label: `vídeo — ${images.length} frames extraídos`, images });
    } catch (err: any) {
      setError(err?.message || "Não foi possível processar o vídeo.");
    } finally {
      setProcessingAttachment(false);
    }
  }

  async function handleSend() {
    const trimmed = inputText.trim();
    if (!trimmed && !pendingAttachment) return;
    if (loading || processingAttachment) return;

    setError(null);

    const userMsg: DisplayMessage = {
      role: "user",
      text: trimmed,
      images: pendingAttachment?.images,
      attachmentLabel: pendingAttachment?.label,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputText("");
    setPendingAttachment(null);
    setLoading(true);
    scrollToBottom();

    try {
      // primeira mensagem da lista é a boas-vindas local — não faz parte da conversa enviada
      const conversation = newMessages.filter((m) => m !== WELCOME);
      const res = await fetch("/api/legendas/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: conversation.map(toApiMessage) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Erro ao falar com o agente.");

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
    setPendingAttachment(null);
    setError(null);
  }

  const busy = loading || processingAttachment;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex justify-end mb-2">
        <button onClick={newConversation} className="text-neutral-500 text-xs hover:text-neutral-300 transition-colors">
          + nova conversa
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-3 pb-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-brand/10 border border-brand/25 text-neutral-100"
                  : "dgs-card text-neutral-200"
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
            <div className="dgs-card text-neutral-500 text-sm px-4 py-3">Editando…</div>
          </div>
        )}
      </div>

      {error && (
        <div className="text-red-400 text-xs mb-2 flex items-center gap-1.5">
          <LineIcon name="warning" size={13} />
          {error}
        </div>
      )}

      {pendingAttachment && (
        <div className="flex items-center gap-2 mb-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
          <div className="flex gap-1">
            {pendingAttachment.images.slice(0, 3).map((src, i) => (
              <img key={i} src={src} alt="" className="w-8 h-8 object-cover rounded border border-white/10" />
            ))}
          </div>
          <div className="text-neutral-400 text-xs flex-1">{pendingAttachment.label}</div>
          <button onClick={() => setPendingAttachment(null)} className="text-neutral-500 hover:text-neutral-300 text-xs">
            remover
          </button>
        </div>
      )}

      {processingAttachment && (
        <div className="text-neutral-500 text-xs mb-2">Processando arquivo…</div>
      )}

      <div className="flex items-end gap-2">
        <input ref={imageInputRef} type="file" accept="image/*" multiple hidden onChange={onPickImages} />
        <input ref={videoInputRef} type="file" accept="video/*" hidden onChange={onPickVideo} />

        <button
          onClick={() => imageInputRef.current?.click()}
          disabled={busy}
          title="Anexar imagem"
          className="w-10 h-10 shrink-0 rounded-lg border border-white/10 bg-white/[0.03] flex items-center justify-center text-neutral-400 hover:text-brand hover:border-brand/30 transition-colors disabled:opacity-50"
        >
          <LineIcon name="image" size={17} />
        </button>

        <button
          onClick={() => videoInputRef.current?.click()}
          disabled={busy}
          title="Anexar vídeo"
          className="w-10 h-10 shrink-0 rounded-lg border border-white/10 bg-white/[0.03] flex items-center justify-center text-neutral-400 hover:text-brand hover:border-brand/30 transition-colors disabled:opacity-50"
        >
          <LineIcon name="video" size={17} />
        </button>

        <textarea
          className="dgs-input resize-none"
          rows={1}
          placeholder="Escreva sua legenda, ideia ou pergunta…"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={busy}
        />

        <button
          onClick={handleSend}
          disabled={busy || (!inputText.trim() && !pendingAttachment)}
          className="dgs-btn-primary w-auto px-5 h-10 shrink-0"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
