import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const versionData = {
    version: "2.3.0",
    release_date: "2026-11-23",
    app_name: "Central DGS",
    release_notes: [
      "Nova ferramenta oficial: Download em Massa para TikTok e Instagram Reels integrado à Central DGS.",
      "Mineração e curadoria viral por métricas reais (Mais Visualizados, Mais Curtidos e Maior Engajamento).",
      "Otimização no carregamento de miniaturas e visualização dos vídeos minerados.",
      "Acesso simplificado e direto às pastas da extensão e dos vídeos salvos no seu computador.",
      "Melhorias contínuas de estabilidade, velocidade de processamento e segurança em todo o estúdio."
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
