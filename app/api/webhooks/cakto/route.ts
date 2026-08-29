import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// Duração de cada plano, em dias
const PLAN_DURATIONS: Record<string, number> = {
  mensal: 30,
  trimestral: 90,
  anual: 365,
};

// Mapeia o ID do produto na Cakto pro nome do plano no nosso sistema.
// IMPORTANTE: preencha esses IDs no .env (veja .env.example) com os IDs reais
// dos 3 produtos cadastrados no painel da Cakto.
function resolvePlan(productId: string | undefined): string | null {
  if (!productId) return null;
  if (productId === process.env.CAKTO_PRODUCT_ID_MENSAL) return "mensal";
  if (productId === process.env.CAKTO_PRODUCT_ID_TRIMESTRAL) return "trimestral";
  if (productId === process.env.CAKTO_PRODUCT_ID_ANUAL) return "anual";
  return null;
}

// Eventos que devem liberar/renovar o acesso do aluno.
// A Cakto usa "purchase_approved" para pagamento aprovado; para assinaturas
// pode haver variações (ex: subscription_renewed) — confirme os nomes exatos
// na aba Webhooks > Eventos do seu produto e ajuste esta lista se necessário.
const GRANT_ACCESS_EVENTS = ["purchase_approved", "subscription_renewed"];

// Eventos que devem suspender o acesso do aluno.
const REVOKE_ACCESS_EVENTS = ["subscription_canceled", "chargeback", "refund"];

export async function POST(req: NextRequest) {
  const supabase = createAdminClient();
  let payload: any;

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  // A Cakto envia um campo "secret" no corpo do payload (definido por você
  // ao criar o webhook no painel). Confirme que bate com o que você configurou.
  if (payload.secret !== process.env.CAKTO_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
  }

  const event: string = payload.event;
  const data = payload.data ?? {};
  const buyerEmail: string | undefined = data.customer?.email?.toLowerCase().trim();
  const productId: string | undefined = data.product?.id;

  // Registra o evento bruto pra auditoria/depuração, independente do resultado
  const { data: logRow } = await supabase
    .from("cakto_events")
    .insert({
      event_type: event,
      product_id: productId ?? null,
      buyer_email: buyerEmail ?? null,
      raw_payload: payload,
    })
    .select()
    .single();

  if (GRANT_ACCESS_EVENTS.includes(event)) {
    const plan = resolvePlan(productId);

    if (!buyerEmail || !plan) {
      // Sem e-mail ou produto não reconhecido — fica logado pra revisão manual
      return NextResponse.json({ ok: true, warning: "Evento registrado mas não processado automaticamente" });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .ilike("email", buyerEmail)
      .maybeSingle();

    if (!profile) {
      // Nenhum cadastro pendente com esse e-mail — cai na fila de aprovação manual
      return NextResponse.json({ ok: true, warning: "Nenhum aluno encontrado com esse e-mail" });
    }

    const durationDays = PLAN_DURATIONS[plan];
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

    await supabase
      .from("profiles")
      .update({
        status: "active",
        plan,
        plan_activated_at: new Date().toISOString(),
        plan_expires_at: expiresAt,
      })
      .eq("id", profile.id);

    if (logRow) {
      await supabase
        .from("cakto_events")
        .update({ matched_user_id: profile.id, processed: true })
        .eq("id", logRow.id);
    }

    return NextResponse.json({ ok: true });
  }

  if (REVOKE_ACCESS_EVENTS.includes(event)) {
    if (!buyerEmail) {
      return NextResponse.json({ ok: true, warning: "Evento sem e-mail do comprador" });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .ilike("email", buyerEmail)
      .maybeSingle();

    if (profile) {
      await supabase.from("profiles").update({ status: "suspended" }).eq("id", profile.id);
      if (logRow) {
        await supabase
          .from("cakto_events")
          .update({ matched_user_id: profile.id, processed: true })
          .eq("id", logRow.id);
      }
    }

    return NextResponse.json({ ok: true });
  }

  // Evento que não tratamos (ex: boleto gerado, pix gerado) — só fica registrado no log
  return NextResponse.json({ ok: true, ignored: true });
}
