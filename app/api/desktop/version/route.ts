import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const versionData = {
    version: "2.3.3",
    release_date: "2026-11-24",
    app_name: "Central DGS",
    release_notes: [
      "Motor de postagens 100% autônomo e invisível: execução em background sem exibir janelas do robô.",
      "Correção e otimização completa no TikTok: espera inteligente de upload, seleção de capa e inclusão de músicas.",
      "Pacing humano e cadência aprimorada para dar tempo de carregar todas as ferramentas das redes sociais.",
      "Motor nativo e resiliente para apresentações e anotações do Canva (.pptx).",
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
