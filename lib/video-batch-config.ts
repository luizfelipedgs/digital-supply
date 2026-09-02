// Configuração do "Editor de Músicas" (adicionar música em lote nos vídeos).
// Editar só este arquivo pra mudar os limites — não precisa mexer nas rotas
// da API nem no componente do cliente.

export const MAX_VIDEOS_PER_BATCH = 50;
export const MAX_VIDEO_SIZE_MB = 300;
export const MAX_MUSIC_SIZE_MB = 30;
export const BATCH_RETENTION_HOURS = 12;
export const FREE_VIDEO_CREDITS = 10;

// Quantos vídeos processar em paralelo no navegador do aluno. Cada um vira
// uma chamada pra /api/video-batch/process — mais concorrência = lote mais
// rápido, mas também mais funções da Vercel rodando ao mesmo tempo.
export const PROCESS_CONCURRENCY = 3;
