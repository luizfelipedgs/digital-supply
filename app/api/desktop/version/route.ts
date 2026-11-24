import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const versionData = {
    version: "2.3.1",
    release_date: "2026-11-24",
    app_name: "Central DGS",
    release_notes: [
      "Motor de Renderização DGS autônomo e de alta performance integrado ao estúdio.",
      "Correção e otimização completa no Editor de Músicas: corte, renderização e sincronização perfeita no computador.",
      "Geração instantânea e confiável de miniaturas (thumbnails) na biblioteca e nos lotes.",
      "Verificação de atualizações em tempo real com proteção contra cache de borda.",
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
