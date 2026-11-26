import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/server";
import {
  RESTAURACAO_BUCKET,
  RESTAURACAO_EXT,
  RESTAURACAO_MAX_BYTES,
  RESTAURACAO_MAX_FOTOS,
  RESTAURACAO_ORIGENS,
  RESTAURACAO_RETENCAO_DIAS,
} from "@/lib/restauracao";

// Gera URLs de upload assinadas (uso único) para o site de restauração de fotos.
// O navegador envia os arquivos direto ao Supabase; aqui só validamos o pedido.
export const runtime = "nodejs";

// Limite simples por IP (melhor esforço: cada instância serverless tem a sua memória).
const acessos = new Map<string, { n: number; t: number }>();
function limitado(ip: string) {
  const agora = Date.now();
  const a = acessos.get(ip);
  if (!a || agora - a.t > 10 * 60 * 1000) {
    acessos.set(ip, { n: 1, t: agora });
    return false;
  }
  a.n += 1;
  return a.n > 8;
}

export async function POST(req: NextRequest) {
  const origem = req.headers.get("origin") || "";
  if (process.env.NODE_ENV === "production" && !RESTAURACAO_ORIGENS.includes(origem)) {
    return NextResponse.json({ error: "Origem não permitida." }, { status: 403 });
  }
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "desconhecido";
  if (limitado(ip)) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde alguns minutos." }, { status: 429 });
  }

  let corpo: any;
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }
  const arquivos: any[] = Array.isArray(corpo?.files) ? corpo.files : [];
  if (arquivos.length < 1 || arquivos.length > RESTAURACAO_MAX_FOTOS) {
    return NextResponse.json({ error: `Envie de 1 a ${RESTAURACAO_MAX_FOTOS} fotos.` }, { status: 400 });
  }
  const exts: string[] = [];
  for (const f of arquivos) {
    const ext = String(f?.name || "").split(".").pop()?.toLowerCase() || "";
    const tamanho = Number(f?.size);
    if (!RESTAURACAO_EXT[ext]) {
      return NextResponse.json({ error: "Só aceitamos fotos JPG, PNG, WEBP ou HEIC." }, { status: 400 });
    }
    if (!(tamanho > 0) || tamanho > RESTAURACAO_MAX_BYTES) {
      return NextResponse.json({ error: "Cada foto pode ter até 25 MB." }, { status: 400 });
    }
    exts.push(ext);
  }

  const admin = createAdminClient();
  const { data: bucket } = await admin.storage.getBucket(RESTAURACAO_BUCKET);
  if (!bucket) {
    // Público para leitura: os links só funcionam para quem os recebe (pasta aleatória de 96 bits).
    const { error } = await admin.storage.createBucket(RESTAURACAO_BUCKET, {
      public: true,
      fileSizeLimit: RESTAURACAO_MAX_BYTES,
    });
    if (error && !/exist/i.test(error.message || "")) {
      console.error("[restauracao/upload-url] createBucket", error);
      return NextResponse.json({ error: "Armazenamento indisponível agora." }, { status: 500 });
    }
  }

  const pedido = randomBytes(12).toString("base64url");
  const saida: { uploadUrl: string; contentType: string; publicUrl: string }[] = [];
  for (let i = 0; i < exts.length; i++) {
    const caminho = `${pedido}/${i + 1}.${exts[i]}`;
    const { data, error } = await admin.storage.from(RESTAURACAO_BUCKET).createSignedUploadUrl(caminho);
    if (error || !data) {
      console.error("[restauracao/upload-url] createSignedUploadUrl", error);
      return NextResponse.json({ error: "Não foi possível preparar o envio." }, { status: 500 });
    }
    const pub = admin.storage.from(RESTAURACAO_BUCKET).getPublicUrl(caminho).data.publicUrl;
    saida.push({ uploadUrl: data.signedUrl, contentType: RESTAURACAO_EXT[exts[i]], publicUrl: pub });
  }
  return NextResponse.json({ orderId: pedido, files: saida, retencaoDias: RESTAURACAO_RETENCAO_DIAS });
}
