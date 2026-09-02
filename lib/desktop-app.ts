// Editor de Músicas Desktop — pagamento único, sem sistema de créditos (o
// processamento roda no computador do próprio aluno).
export const DESKTOP_APP_PRICE_LABEL = "R$ 127,90";
export const DESKTOP_APP_CHECKOUT_URL = "https://pay.cakto.com.br/365g7ht_1079049";

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
  return "https://github.com/luizfelipedgs/digital-supply/releases/download/desktop-latest/EditorDeMusicas-Setup.exe";
}
