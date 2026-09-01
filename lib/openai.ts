// Cliente mínimo pra chat completions da OpenAI (sem SDK — só fetch).
// Usado pelo agente "Mestre das Legendas".

export type ChatContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string | ChatContentPart[];
};

// gpt-4o foi descontinuado — gpt-5.6-luna é o modelo atual mais barato da OpenAI
// com suporte a imagem/vídeo (frames). Ajustável via OPENAI_MODEL sem mexer no código.
const DEFAULT_MODEL = "gpt-5.6-luna";

export async function callOpenAIChat(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY não configurada no ambiente do servidor.");
  }

  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.85,
      // Modelos atuais da OpenAI (gpt-5.6-*) não aceitam mais "max_tokens" —
      // é "max_completion_tokens" agora. Se um dia trocar pra um modelo mais
      // antigo que ainda use "max_tokens", ajuste aqui.
      max_completion_tokens: 1500,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Falha na chamada à OpenAI (${res.status}): ${errText.slice(0, 500)}`);
  }

  const data = await res.json();
  const reply = data?.choices?.[0]?.message?.content;

  if (typeof reply !== "string" || !reply.trim()) {
    throw new Error("A OpenAI retornou uma resposta vazia.");
  }

  return reply;
}
