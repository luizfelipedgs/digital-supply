/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // "ffmpeg-static" encontra o binário calculando o caminho a partir de
    // __dirname no momento que o pacote é importado. Se o Next.js empacotar
    // (webpack) esse pacote junto com o código da rota, __dirname deixa de
    // apontar pra pasta real do node_modules/ffmpeg-static — e o binário
    // não é mais encontrado em produção (erro "ENOENT" ao rodar o ffmpeg).
    // Isso aqui mantém "ffmpeg-static" fora do empacotamento (usa o
    // require() nativo do Node em vez de ser incluído no bundle da rota).
    serverComponentsExternalPackages: ["ffmpeg-static"],
    // E isso garante que o binário do ffmpeg realmente vá junto no bundle
    // da função serverless da Vercel que processa os vídeos da Trilha em
    // Massa — sem isso a Vercel pode "podar" o arquivo por não detectar
    // automaticamente que ele é usado em tempo de execução.
    outputFileTracingIncludes: {
      "/api/video-batch/process": ["./node_modules/ffmpeg-static/**"],
    },
  },
};

module.exports = nextConfig;
