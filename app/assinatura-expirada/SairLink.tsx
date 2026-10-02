"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Link discreto de "sair" — a página de assinatura expirada é server
// component (precisa consultar o perfil com segurança), então o botão de
// logout em si fica isolado aqui num pedacinho client.
export function SairLink() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="text-neutral-600 text-xs hover:text-neutral-400 transition-colors"
    >
      {loading ? "Saindo…" : "Sair e entrar com outra conta"}
    </button>
  );
}
