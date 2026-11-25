import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const versionData = {
    version: "2.4.1",
    release_date: "2026-11-25",
    app_name: "Central DGS",
    release_notes: [
      "Hotfix v2.4.1: Correção definitiva da inicialização e hidratação do painel (eliminação do estado de carregamento infinito).",
      "Nova Conexão Oficial Meta Graph API: Conecte contas do Instagram Business e Criador em 1 clique sem robôs ou risco de shadowban.",
      "Suporte a Portfólios Empresariais: Detecção automática de Páginas e Contas do Instagram dentro do Meta Business Suite.",
      "Nova Conexão Oficial TikTok Content Posting API v2: Upload binário direto aos servidores do TikTok para envio de vídeos e reels.",
      "Interface Otimizada & Descontinuação do Motor Local: Remoção dos cards manuais de motor e botões desnecessários para inicialização instantânea e menor consumo de memória.",
      "Topo de Janela Unificado: Identidade limpa DIGITAL SUPPLY — Central DGS."
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
