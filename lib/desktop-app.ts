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

// O instalador (96 MB) é grande demais pro limite de 50 MB do Supabase
// Storage no plano Free, então ele é publicado como um GitHub Release
// (repositório público) em vez de subir pro Supabase — veja
// .github/workflows/build-desktop.yml. A tag "desktop-latest" é sempre
// reaproveitada, então esse link nunca muda, mesmo quando sai uma build nova.
export function desktopAppDownloadUrl() {
  return "https://github.com/luizfelipedgs/digital-supply/releases/download/desktop-latest/TrilhaEmMassa-Setup.exe";
}
