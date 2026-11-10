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
// .github/workflows/build-desktop.yml. Cada build gera uma release NOVA e
// versionada (necessário pro auto-update do programa funcionar), então em
// vez de apontar pra uma tag fixa, usamos o link "/releases/latest/..." do
// GitHub — ele redireciona sozinho pra release mais recente automaticamente,
// sem precisar gerenciar tag nenhuma aqui.
export function desktopAppDownloadUrl() {
  return "https://github.com/luizfelipedgs/digital-supply/releases/latest/download/EditorDeMusicas-Setup.exe";
}

// Mesma ideia do Windows, mas os instaladores Mac (.dmg) saem em dois
// arquivos separados — um pra Apple Silicon (M1/M2/M3/M4...) e outro pra
// Mac Intel (mais antigo) — porque são arquiteturas de processador
// diferentes (veja .github/workflows/build-desktop.yml, job "build-mac").
export function desktopAppDownloadUrlMacAppleSilicon() {
  return "https://github.com/luizfelipedgs/digital-supply/releases/latest/download/EditorDeMusicas-Mac-arm64.dmg";
}

export function desktopAppDownloadUrlMacIntel() {
  return "https://github.com/luizfelipedgs/digital-supply/releases/latest/download/EditorDeMusicas-Mac-x64.dmg";
}
