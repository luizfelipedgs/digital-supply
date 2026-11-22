import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const versionData = {
    version: "2.1.0",
    release_date: "2026-11-22",
    app_name: "Central DGS",
    release_notes: [
      "Edição completa de agendamentos pendentes ou com falha na fila (data/hora de Brasília, conta, título, legenda, @ e hashtags).",
      "Publicação direta no Instagram Reels restaurada para total compatibilidade com contas sem restrições de agendamento na Meta.",
      "Novo instalador automático completo para Windows com atalhos de inicialização rápida na Área de Trabalho e Menu Iniciar.",
      "Sistema de auto-atualização contínua integrado: novas melhorias e correções são baixadas em 1 clique preservando 100% dos seus dados, contas e agendamentos."
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
