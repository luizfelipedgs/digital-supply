import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const versionData = {
    version: "2.4.2",
    release_date: "2026-11-25",
    app_name: "Central DGS",
    release_notes: [
      "Hotfix v2.4.2: Disparo imediato instantâneo ao clicar em 'Postar Agora' (processamento assíncrono em segundo plano sem travar o motor).",
      "Correção de Compatibilidade run_proactor: Suporte universal para funções síncronas de API direta da Meta e do TikTok.",
      "Inicialização Automática do Serviço: Motor de publicação agora sobe 100% ativo e saudável no boot.",
      "Nova Conexão Oficial Meta Graph API: Conecte contas do Instagram Business e Criador em 1 clique sem robôs ou risco de shadowban."
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
