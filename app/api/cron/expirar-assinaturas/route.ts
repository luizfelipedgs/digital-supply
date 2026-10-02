import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// Rodado pela Vercel Cron (veja vercel.json), 1x por dia — deixa o status
// "suspended" no banco de fato pra quem já passou da data de vencimento e
// continua marcado como "active" (porque o webhook de cancelamento da Cakto
// nunca chegou, por exemplo). Isso é só pra manter o painel admin e os
// relatórios certos: o bloqueio de acesso em tempo real já acontece antes
// disso, no middleware do site, então ninguém fica com acesso extra
// esperando esse cron rodar.
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  // A Vercel assina chamadas de cron com esse header quando CRON_SECRET
  // está configurado — confirma que a chamada é mesmo da Vercel Cron.
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: expired, error } = await admin
    .from("profiles")
    .select("id")
    .eq("status", "active")
    .eq("is_admin", false)
    .not("plan_expires_at", "is", null)
    .lt("plan_expires_at", new Date().toISOString())
    .limit(500);

  if (error) {
    console.error("[cron/expirar-assinaturas]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const ids = (expired ?? []).map((p: { id: string }) => p.id);

  if (ids.length > 0) {
    // Suspende o acesso ao site e, junto, o acesso ao Editor de Músicas
    // Desktop (quem comprou mantém o registro da compra — só fica escondido
    // enquanto a assinatura estiver vencida, e volta sozinho na renovação).
    await admin
      .from("profiles")
      .update({ status: "suspended", desktop_app_suspended: true })
      .in("id", ids);
  }

  return NextResponse.json({ ok: true, suspended: ids.length });
}
