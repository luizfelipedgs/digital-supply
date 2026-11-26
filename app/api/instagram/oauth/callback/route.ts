import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams.toString();
  const localTarget = `http://localhost:8787/api/instagram/oauth/callback?${searchParams}`;

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Conectando Instagram...</title>
  <style>
    body {
      background-color: #0c0e09;
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(163, 230, 53, 0.2);
      border-top-color: #a3e635;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 20px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="spinner"></div>
  <h2 style="font-size: 18px; margin: 0 0 8px 0;">Autorização Concluída!</h2>
  <p style="font-size: 13px; color: #a3a3a3; margin: 0;">Retornando para a Central DGS...</p>
  <script>
    window.location.replace("${localTarget}");
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
