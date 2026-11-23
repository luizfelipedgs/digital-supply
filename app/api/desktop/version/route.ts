import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const versionData = {
    version: "2.2.0",
    release_date: "2026-11-23",
    app_name: "Central DGS",
    release_notes: [
      "Nova janela dedicada de conexão para Instagram, TikTok e YouTube sem conflitos de portas.",
      "Fallback em cascata com suporte nativo total ao Microsoft Edge e navegadores padrão do Windows.",
      "Novo método de conexão instantânea por Cookie: conecte suas redes sociais em 15 segundos sem depender da automação do navegador.",
      "Correção definitiva no monitor de autenticação e proteção de estabilidade do servidor local."
    ],
    download_url: "https://digitalsupply.pro/downloads/Central_DGS_Instalador_Windows.zip",
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
