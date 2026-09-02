// Mesma lógica de app/lib/ffmpeg.ts (versão web), adaptada pra rodar local
// no processo principal do Electron — troca o áudio do vídeo pela música
// escolhida (mudo original, música 100%, cortada no tamanho do vídeo).
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const { app } = require("electron");

function resolveFfmpegPath() {
  // Dentro do .asar o binário do ffmpeg não roda direto (não é um arquivo
  // executável de verdade dentro do pacote) — o electron-builder desempacota
  // automaticamente qualquer coisa que esteja em node_modules/**/*.exe (ou
  // sem extensão, em outras plataformas) pra fora do asar. Aqui a gente só
  // troca "app.asar" por "app.asar.unpacked" no caminho quando o app está
  // empacotado (rodando o instalador), e usa o caminho normal em dev.
  const ffmpegStatic = require("ffmpeg-static");
  if (!app.isPackaged) return ffmpegStatic;
  return ffmpegStatic.replace("app.asar", "app.asar.unpacked");
}

function runFfmpeg(args, onLog) {
  return new Promise((resolve, reject) => {
    const bin = resolveFfmpegPath();
    if (!bin || !fs.existsSync(bin)) {
      reject(new Error(`Binário do ffmpeg não encontrado em: ${bin}`));
      return;
    }

    const proc = spawn(bin, args, { windowsHide: true });
    let stderr = "";

    proc.stderr?.on("data", (d) => {
      stderr += d.toString();
      if (stderr.length > 4000) stderr = stderr.slice(-4000);
      if (onLog) onLog(d.toString());
    });

    proc.on("error", (err) => reject(err));

    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg terminou com erro (código ${code}): ${stderr.slice(-800)}`));
    });
  });
}

function buildMusicOverlayArgs({ videoPath, musicPath, musicStartSeconds, outputPath }) {
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

function uniqueOutputPath(outputFolder, originalName) {
  const ext = path.extname(originalName) || ".mp4";
  const base = path.basename(originalName, path.extname(originalName));
  let candidate = path.join(outputFolder, `${base}${ext}`);
  let i = 1;
  while (fs.existsSync(candidate)) {
    candidate = path.join(outputFolder, `${base} (${i})${ext}`);
    i++;
  }
  return candidate;
}

module.exports = { runFfmpeg, buildMusicOverlayArgs, uniqueOutputPath };
