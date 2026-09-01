// Trilha em Massa Desktop — pagamento único, sem sistema de créditos (o
// processamento roda no computador do próprio aluno).
//
// ⚠️ PREENCHA depois de criar o produto/oferta na Cakto: o preço abaixo é só
// um placeholder e o link de checkout precisa ser trocado pelo real, senão a
// página de compra vai levar pra um link que não existe.
export const DESKTOP_APP_PRICE_LABEL = "R$ 118,90";
export const DESKTOP_APP_CHECKOUT_URL = "https://pay.cakto.com.br/SEU-LINK-AQUI";

export function desktopAppCheckoutUrl(email?: string | null) {
  if (!email) return DESKTOP_APP_CHECKOUT_URL;
  const params = new URLSearchParams({ email, confirmEmail: email });
  return `${DESKTOP_APP_CHECKOUT_URL}?${params.toString()}`;
}

// Bucket público no Supabase Storage — o GitHub Actions sobe o instalador
// aqui automaticamente a cada build (veja .github/workflows/build-desktop.yml).
export function desktopAppDownloadUrl() {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${base}/storage/v1/object/public/desktop-app/TrilhaEmMassa-Setup.exe`;
}
