import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const versionData = {
    version: "2.6.0",
    release_date: "2026-11-27",
    app_name: "Central DGS",
    release_notes: [
      "Radar Viral DGS Oficial: Novo garimpador inteligente de vídeos virais e tendências no TikTok e Instagram Reels.",
      "Busca por Perfil (@) Integrada: Minere os conteúdos mais assistidos e com maior engajamento diretamente de qualquer perfil.",
      "Extração de Capas e Métricas Reais: Visualize capas originais, número exato de views, curtidas e comentários.",
      "Player Fluido sem Travamentos: Reprodução em alta performance com suporte nativo a streaming contínuo.",
      "Expansão de Descrição Completa: Leia e copie a legenda completa e todas as hashtags do vídeo com 1 clique.",
      "Biblioteca de Inspirações: Salve e organize seus vídeos de referência com marcação verde visual instantânea.",
      "Download em Alta Resolução: Baixe qualquer vídeo viral sem marca d'água direto para o seu computador.",
      "Inicialização Blindada: Novo sistema de inicialização sem travamentos nem fechamentos abruptos no Windows."
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
