import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const versionData = {
    version: "2.2.0",
    release_date: "2026-11-23",
    app_name: "Central DGS",
    release_notes: [
      "Instalação 100% automática e autônoma pelo Launcher oficial em C:\\Central_DGS.",
      "Atalho oficial criado na Área de Trabalho com abertura silenciosa.",
      "Nova janela dedicada de conexão para Instagram, TikTok e YouTube sem conflitos de portas.",
      "Fallback em cascata com suporte nativo ao Microsoft Edge e navegadores padrão do Windows.",
      "Novo método de conexão instantânea por Cookie: conecte suas redes sociais em 15 segundos sem depender de automação.",
      "Correção definitiva no monitor de autenticação e proteção de integridade do banco de dados."
    ],
    download_url: "https://digitalsupply.pro/downloads/Launcher_Central_DGS.exe",
    launcher_url: "https://digitalsupply.pro/downloads/Launcher_Central_DGS.exe",
    core_url: "https://digitalsupply.pro/downloads/Central_DGS_Core.zip",
    patch_url: "https://digitalsupply.pro/downloads/Central_DGS_Core.zip",
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
