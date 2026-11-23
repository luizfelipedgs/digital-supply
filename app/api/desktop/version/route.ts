import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const versionData = {
    version: "2.3.0",
    release_date: "2026-11-23",
    app_name: "Central DGS",
    release_notes: [
      "Nova ferramenta integrada: Download em Massa para TikTok e Instagram Reels com extensão oficial Manifest V3.",
      "Curadoria viral avançada por métricas reais (Top Views, Top Likes, Engajamento) e trava de segurança de até 100 vídeos.",
      "Correção de Content Security Policy (CSP) na extensão do Chrome para renderização rápida e segura de thumbnails.",
      "Botões inteligentes de acesso rápido às pastas da extensão e dos vídeos baixados direto no Windows Explorer.",
      "Auto-recuperação e migração automática do banco de dados na biblioteca de vídeos (filesize e formatos webm/mp4)."
    ],
    download_url: "https://digitalsupply.pro/downloads/Launcher_Central_DGS.exe",
    launcher_url: "https://digitalsupply.pro/downloads/Launcher_Central_DGS.exe",
    core_url: "https://digitalsupply.pro/downloads/Central_DGS_Core.zip",
    patch_url: "https://digitalsupply.pro/downloads/Central_DGS_Patch.zip",
    min_compatible_version: "2.0.0"
  };

  return NextResponse.json(versionData, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
