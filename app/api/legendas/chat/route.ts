import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callOpenAIChat, type ChatContentPart, type ChatMessage } from "@/lib/openai";
import { MESTRE_DAS_LEGENDAS_SYSTEM_PROMPT } from "@/lib/legendas-prompt";

// Dá tempo suficiente pra respostas com imagem/frames de vídeo (ajuste no
// plano da Vercel pode ser necessário — veja o README).
export const maxDuration = 60;

const MAX_MESSAGES = 24; // ~12 idas e vindas de conversa
const MAX_TEXT_CHARS = 6000;
const MAX_IMAGES_PER_MESSAGE = 8;

type IncomingPart = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };
type IncomingMessage = { role: "user" | "assistant"; content: string | IncomingPart[] };

function validateAndNormalize(messages: unknown): ChatMessage[] {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error("Nenhuma mensagem enviada.");
  }
  if (messages.length > MAX_MESSAGES) {
    throw new Error("Conversa muito longa — inicie uma nova conversa.");
  }

  return (messages as IncomingMessage[]).map((m) => {
    if (m.role !== "user" && m.role !== "assistant") {
      throw new Error("Mensagem com papel inválido.");
    }

    if (typeof m.content === "string") {
      if (m.content.length > MAX_TEXT_CHARS) {
        throw new Error("Mensagem de texto muito longa.");
      }
      return { role: m.role, content: m.content } satisfies ChatMessage;
    }

    if (!Array.isArray(m.content)) {
      throw new Error("Formato de mensagem inválido.");
    }

    const imageParts = m.content.filter((p) => p?.type === "image_url");
    if (imageParts.length > MAX_IMAGES_PER_MESSAGE) {
      throw new Error(`No máximo ${MAX_IMAGES_PER_MESSAGE} imagens/frames por mensagem.`);
    }

    const parts: ChatContentPart[] = m.content.map((p) => {
      if (p.type === "text") {
        if (p.text.length > MAX_TEXT_CHARS) throw new Error("Mensagem de texto muito longa.");
        return { type: "text", text: p.text };
      }
      if (p.type === "image_url" && typeof p.image_url?.url === "string" && p.image_url.url.startsWith("data:image/")) {
        return { type: "image_url", image_url: { url: p.image_url.url } };
      }
      throw new Error("Formato de conteúdo inválido.");
    });

    return { role: m.role, content: parts } satisfies ChatMessage;
  });
}

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

    let history: ChatMessage[];
    try {
      history = validateAndNormalize(body.messages);
    } catch (validationError: any) {
      return NextResponse.json({ error: validationError.message }, { status: 400 });
    }

    const messages: ChatMessage[] = [
      { role: "system", content: MESTRE_DAS_LEGENDAS_SYSTEM_PROMPT },
      ...history,
    ];

    const reply = await callOpenAIChat(messages);

    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error("[/api/legendas/chat]", err);
    return NextResponse.json({ error: err?.message || "Erro inesperado ao falar com o agente." }, { status: 500 });
  }
}
