import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const versionData = {
    version: "2.3.5",
    release_date: "2026-11-24",
    app_name: "Central DGS",
    release_notes: [
      "Novo Calendário de Publicações no estilo Creator Studio: visualização mensal e semanal completa por dia e horário.",
      "Redirecionamento automático inteligente: ao agendar após edição de música e filtro, você é direcionado diretamente para a Agenda & Calendário.",
      "Pills visuais com status, horário e ícone oficial de cada rede (Instagram, TikTok e YouTube).",
      "Novo modal de visualização e gerenciamento de publicações por dia com ações rápidas de disparo e edição.",
      "Filtros instantâneos por conta e status de postagem na barra superior do calendário."
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
