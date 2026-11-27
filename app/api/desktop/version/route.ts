import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const versionData = {
    version: "2.6.2",
    release_date: "2026-11-27",
    app_name: "Central DGS",
    release_notes: [
      "Radar Viral Oficial Definitivo: Capas 100% reais, originais e autênticas sem repetição.",
      "Scraper Nativo Autônomo para Instagram Reels: Busca por qualquer palavra-chave ou @perfil com extração direta.",
      "Scraper Nativo para TikTok: Coleta de vídeos verticais reais independente de quotas ou limites de API.",
      "Inicialização Blindada: Resolução automática de caminhos dinâmicos em C:\\Central_DGS sem falhas de disco."
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
