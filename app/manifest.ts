import type { MetadataRoute } from "next";

// Next.js detecta esse arquivo automaticamente e gera /manifest.webmanifest.
// É esse arquivo que permite ao navegador oferecer "instalar app".
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Comunidade DGS — Digital Supply",
    short_name: "DGS",
    description: "Área de membros da Comunidade DGS: conteúdos, faturamento e mais.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#050503",
    theme_color: "#050503",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
