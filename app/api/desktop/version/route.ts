import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const versionData = {
    version: "2.3.4",
    release_date: "2026-11-24",
    app_name: "Central DGS",
    release_notes: [
      "Finalização automática inteligente: ao fechar a janela da Central, todos os processos em segundo plano são encerrados de forma limpa.",
      "Proteção anti-duplicação: previne abertura de múltiplos processos do Python em segundo plano e elimina conflitos de fila.",
      "Novo botão 'Encerrar Central DGS' no menu e na barra lateral para desligamento imediato com 1 clique.",
      "Motor de postagens 100% autônomo e invisível: execução sem janelas do robô.",
      "Otimização no fluxo de agendamento e sincronização com banco de dados."
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
