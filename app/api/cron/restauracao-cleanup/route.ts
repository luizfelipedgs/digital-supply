import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { RESTAURACAO_BUCKET, RESTAURACAO_RETENCAO_DIAS } from "@/lib/restauracao";

// Rodado pela Vercel Cron (veja vercel.json) — apaga as fotos enviadas pelo site
// de restauração depois de RESTAURACAO_RETENCAO_DIAS dias (LGPD / Política de Privacidade).
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const admin = createAdminClient();
  const limite = Date.now() - RESTAURACAO_RETENCAO_DIAS * 24 * 60 * 60 * 1000;

  // Junta as pastas (uma por pedido) antes de apagar, porque apagar muda a paginação.
  const pastas: string[] = [];
  for (let offset = 0; offset < 5000; offset += 100) {
    const { data, error } = await admin.storage.from(RESTAURACAO_BUCKET).list("", { limit: 100, offset });
    if (error) {
      // Bucket ainda não existe (nenhum pedido com fotos): nada a limpar.
      return NextResponse.json({ ok: true, removedFiles: 0, note: error.message });
    }
    if (!data || data.length === 0) break;
    for (const p of data) if (p?.name) pastas.push(p.name);
    if (data.length < 100) break;
  }

  let removedFiles = 0;
  for (const pasta of pastas) {
    try {
      const { data: arquivos } = await admin.storage.from(RESTAURACAO_BUCKET).list(pasta, { limit: 100 });
      const velhos = (arquivos ?? [])
        .filter((a: any) => a?.name && a?.created_at && new Date(a.created_at).getTime() < limite)
        .map((a: any) => `${pasta}/${a.name}`);
      if (velhos.length > 0) {
        await admin.storage.from(RESTAURACAO_BUCKET).remove(velhos);
        removedFiles += velhos.length;
      }
    } catch (e) {
      console.error("[cron/restauracao-cleanup] falha na pasta", pasta, e);
    }
  }
  return NextResponse.json({ ok: true, folders: pastas.length, removedFiles });
}
