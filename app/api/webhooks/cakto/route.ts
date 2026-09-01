import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// Duração de cada plano, em dias
const PLAN_DURATIONS: Record<string, number> = {
  mensal: 30,
  trimestral: 90,
  anual: 365,
};

// Mapeia o ID da OFERTA na Cakto pro nome do plano no nosso sistema.
// Como o produto é uma assinatura única com 3 ofertas (mensal/trimestral/anual),
// o webhook identifica o plano pelo ID da oferta, não do produto.
// IMPORTANTE: preencha esses IDs no .env (veja .env.example) com os IDs reais
// das 3 ofertas cadastradas dentro do produto na Cakto.
function resolvePlan(offerId: string | undefined): string | null {
  if (!offerId) return null;
  if (offerId === process.env.CAKTO_OFFER_ID_MENSAL) return "mensal";
  if (offerId === process.env.CAKTO_OFFER_ID_TRIMESTRAL) return "trimestral";
  if (offerId === process.env.CAKTO_OFFER_ID_ANUAL) return "anual";
  return null;
}

// Pacotes de crédito da Trilha em Massa (compra avulsa, não é assinatura).
// Cada pacote é uma OFERTA diferente dentro do mesmo produto na Cakto —
// mesmo padrão já usado acima pros planos mensal/trimestral/anual: o ID
// depois da "/" no link de checkout é o mesmo ID que a Cakto manda em
// data.offer.id no webhook.
const CREDIT_PACKAGES: Record<string, number> = {
  [process.env.CAKTO_OFFER_ID_CREDITS_BOOST ?? ""]: 200,
  [process.env.CAKTO_OFFER_ID_CREDITS_TURBO ?? ""]: 600,
  [process.env.CAKTO_OFFER_ID_CREDITS_PRO ?? ""]: 1300,
  [process.env.CAKTO_OFFER_ID_CREDITS_ESCALA ?? ""]: 2500,
};
delete CREDIT_PACKAGES[""];

function resolveCreditPackage(offerId: string | undefined): number | null {
  if (!offerId) return null;
  return CREDIT_PACKAGES[offerId] ?? null;
}

// Trilha em Massa Desktop — pagamento único (não é assinatura nem crédito),
// libera o download + uso do programa desktop pra sempre.
function isDesktopAppOffer(offerId: string | undefined): boolean {
  return !!offerId && !!process.env.CAKTO_OFFER_ID_DESKTOP_APP && offerId === process.env.CAKTO_OFFER_ID_DESKTOP_APP;
}

// Eventos que devem liberar/renovar o acesso do aluno.
// Para assinaturas, o primeiro pagamento normalmente dispara "purchase_approved"
// e as renovações mensais/trimestrais/anuais seguintes disparam "subscription_renewed".
// Confirme os nomes exatos na aba Webhooks > Eventos do seu produto.
const GRANT_ACCESS_EVENTS = ["purchase_approved", "subscription_renewed", "subscription_created"];

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
  const offerId: string | undefined = data.offer?.id;

  // Registra o evento bruto pra auditoria/depuração, independente do resultado
  const { data: logRow } = await supabase
    .from("cakto_events")
    .insert({
      event_type: event,
      product_id: offerId ?? null,
      buyer_email: buyerEmail ?? null,
      raw_payload: payload,
    })
    .select()
    .single();

  if (GRANT_ACCESS_EVENTS.includes(event)) {
    // Compra avulsa de créditos (Trilha em Massa) — não mexe em status/plano,
    // só soma créditos no perfil do aluno.
    const creditsAmount = resolveCreditPackage(offerId);
    if (creditsAmount) {
      if (!buyerEmail) {
        return NextResponse.json({ ok: true, warning: "Evento de créditos registrado mas sem e-mail" });
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, video_credits")
        .ilike("email", buyerEmail)
        .maybeSingle();

      if (!profile) {
        return NextResponse.json({ ok: true, warning: "Nenhum aluno encontrado com esse e-mail (créditos)" });
      }

      await supabase
        .from("profiles")
        .update({ video_credits: (profile.video_credits ?? 0) + creditsAmount })
        .eq("id", profile.id);

      if (logRow) {
        await supabase
          .from("cakto_events")
          .update({ matched_user_id: profile.id, processed: true })
          .eq("id", logRow.id);
      }

      return NextResponse.json({ ok: true, creditsGranted: creditsAmount });
    }

    // Compra do programa desktop (pagamento único) — não mexe em
    // status/plano/créditos, só libera o download + login dentro do programa.
    if (isDesktopAppOffer(offerId)) {
      if (!buyerEmail) {
        return NextResponse.json({ ok: true, warning: "Evento do desktop registrado mas sem e-mail" });
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .ilike("email", buyerEmail)
        .maybeSingle();

      if (!profile) {
        return NextResponse.json({ ok: true, warning: "Nenhum aluno encontrado com esse e-mail (desktop)" });
      }

      await supabase
        .from("profiles")
        .update({ desktop_app_purchased: true, desktop_app_purchased_at: new Date().toISOString() })
        .eq("id", profile.id);

      if (logRow) {
        await supabase
          .from("cakto_events")
          .update({ matched_user_id: profile.id, processed: true })
          .eq("id", logRow.id);
      }

      return NextResponse.json({ ok: true, desktopAppGranted: true });
    }

    const plan = resolvePlan(offerId);

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
      // Estorno/chargeback de um produto separado (desktop) não deve
      // suspender a assinatura da comunidade — só tira o acesso ao programa.
      if (isDesktopAppOffer(offerId)) {
        await supabase.from("profiles").update({ desktop_app_purchased: false }).eq("id", profile.id);
      } else {
        await supabase.from("profiles").update({ status: "suspended" }).eq("id", profile.id);
      }

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
