/** @type {import('next').NextConfig} */
const nextConfig = {
  // Garante que o binário do ffmpeg (pacote ffmpeg-static) vá junto no
  // bundle da função serverless da Vercel que processa os vídeos da
  // Trilha em Massa — sem isso a Vercel pode "podar" o binário por não
  // detectar automaticamente que ele é usado em tempo de execução.
  experimental: {
    outputFileTracingIncludes: {
      "/api/video-batch/process": ["./node_modules/ffmpeg-static/**"],
    },
  },
};

module.exports = nextConfig;
