"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";

export default function EsqueciSenhaPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError("Digite seu email.");
      return;
    }

    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    setLoading(false);

    // Por segurança, o Supabase não informa se o email existe ou não —
    // sempre mostramos a mesma mensagem de sucesso.
    if (resetError) {
      setError("Não foi possível enviar o email agora. Tente novamente em instantes.");
      return;
    }
    setSent(true);
  }

  return (
    <div className="dgs-scene">
      <div className="dgs-glow" style={{ left: "50%", top: "32%", transform: "translate(-50%,-50%)" }} />
      <div className="relative flex flex-col items-center w-full max-w-sm">
        <Logo size={56} className="text-brand mb-4" />
        <div className="text-neutral-100 text-lg font-medium mb-2">Recuperar senha</div>

        {sent ? (
          <div className="text-center">
            <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
              Se esse email estiver cadastrado, você vai receber um link pra criar uma senha nova em
              instantes. Confira também a caixa de spam.
            </p>
            <Link href="/login" className="text-brand text-sm">
              Voltar pro login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3 mt-4">
            <p className="text-neutral-500 text-xs text-center mb-1">
              Digite o email da sua conta e enviaremos um link pra redefinir a senha.
            </p>
            <input
              type="email"
              placeholder="seu@email.com"
              className="dgs-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button type="submit" disabled={loading} className="dgs-btn-primary mt-1">
              {loading ? "Enviando…" : "Enviar link de recuperação"}
            </button>
            <p className="text-center text-xs text-neutral-500 mt-1">
              <Link href="/login" className="text-brand">
                Voltar pro login
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
