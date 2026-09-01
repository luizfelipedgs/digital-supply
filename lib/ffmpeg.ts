// Wrapper mínimo pro ffmpeg (binário estático via "ffmpeg-static") — usado
// pela Trilha em Massa pra trocar o áudio de cada vídeo pela música
// escolhida, sem reprocessar (recodificar) a imagem do vídeo.
import { spawn } from "child_process";
// @ts-ignore — ffmpeg-static não tem types próprios
import ffmpegPath from "ffmpeg-static";

export function runFfmpeg(args: string[], timeoutMs = 170_000): Promise<void> {
  return new Promise((resolve, reject) => {
    const bin = ffmpegPath as unknown as string;
    if (!bin) {
      reject(new Error("Binário do ffmpeg não encontrado (pacote ffmpeg-static)."));
      return;
    }

    const proc = spawn(bin, args);
    let stderr = "";
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      proc.kill("SIGKILL");
      reject(new Error("ffmpeg excedeu o tempo limite de processamento."));
    }, timeoutMs);

    proc.stderr?.on("data", (d) => {
      stderr += d.toString();
      if (stderr.length > 4000) stderr = stderr.slice(-4000);
    });

    proc.on("error", (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(err);
    });

    proc.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg terminou com erro (código ${code}): ${stderr.slice(-800)}`));
    });
  });
}

// Monta os argumentos pra: silenciar o áudio original, usar só a música
// escolhida (a partir de "musicStartSeconds", pra pegar o refrão), no
// volume cheio, cortada automaticamente no tamanho do vídeo. A imagem do
// vídeo é copiada sem recodificar (rápido e sem perda de qualidade).
export function buildMusicOverlayArgs(opts: {
  videoPath: string;
  musicPath: string;
  musicStartSeconds: number;
  outputPath: string;
}): string[] {
  const { videoPath, musicPath, musicStartSeconds, outputPath } = opts;
  return [
    "-y",
    "-i",
    videoPath,
    "-ss",
    String(Math.max(0, musicStartSeconds || 0)),
    "-i",
    musicPath,
    "-map",
    "0:v:0",
    "-map",
    "1:a:0",
    "-c:v",
    "copy",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-shortest",
    "-movflags",
    "+faststart",
    outputPath,
  ];
}
