import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Comunidade DGS | Digital Supply",
  description: "Área de membros da Comunidade DGS — clipagem, campanhas musicais e performance.",
  // Faz o "Adicionar à Tela de Início" do iPhone/Safari abrir em modo app
  // (tela cheia, sem barra de navegador) em vez de abrir como aba comum.
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DGS",
  },
};

export const viewport: Viewport = {
  themeColor: "#050503",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-ink-900 text-neutral-100 min-h-screen antialiased">{children}</body>
    </html>
  );
}
