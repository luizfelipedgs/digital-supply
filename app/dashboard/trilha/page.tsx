import { redirect } from "next/navigation";

// Endereço antigo (a ferramenta se chamava "Trilha em Massa"). Mantido só
// pra não quebrar links/favoritos salvos — sempre redireciona pro endereço
// novo, /dashboard/editor-musicas.
export default function TrilhaRedirectPage() {
  redirect("/dashboard/editor-musicas");
}
