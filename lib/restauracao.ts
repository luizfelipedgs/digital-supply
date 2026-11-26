// Configuração do site "Restaurando Fotografias" (digitalsupply.pro/restauracao).
// As fotos que o cliente escolhe no site vão direto do navegador para o Storage
// do Supabase (bucket abaixo) e os links entram na mensagem do WhatsApp.
export const RESTAURACAO_BUCKET = "restauracao-pedidos";
// Fotos enviadas pelo site são apagadas automaticamente depois desse prazo
// (cron em /api/cron/restauracao-cleanup). Mantenha igual à Política de Privacidade.
export const RESTAURACAO_RETENCAO_DIAS = 8;
export const RESTAURACAO_MAX_FOTOS = 20;
export const RESTAURACAO_MAX_BYTES = 25 * 1024 * 1024;
export const RESTAURACAO_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
};
export const RESTAURACAO_ORIGENS = ["https://digitalsupply.pro", "https://www.digitalsupply.pro"];
