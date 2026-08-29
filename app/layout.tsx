import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Comunidade DGS | Digital Supply",
  description: "Área de membros da Comunidade DGS — clipagem, campanhas musicais e performance.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-ink-900 text-neutral-100 min-h-screen antialiased">{children}</body>
    </html>
  );
}
