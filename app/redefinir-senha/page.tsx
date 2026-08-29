"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";
import { PasswordInput } from "@/components/PasswordInput";

// Esta página é aberta a partir do link enviado por email (resetPasswordForEmail).
// O Supabase já autentica o usuário temporariamente via o token do link.
export default function RedefinirSenhaPage() {
  const supabase = createClient();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Confirma que existe uma sessão válida vinda do link de recuperação
    supabase.auth.getSession().then(({ data }) => {
      setReady(!!data.session);
    });
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError("Não foi possível atualizar a senha. O link pode ter expirado — solicite um novo.");
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/login"), 2500);
  }

  return (
    <div className="dgs-scene">
      <div className="dgs-glow" style={{ left: "50%", top: "32%", transform: "translate(-50%,-50%)" }} />
      <div className="relative flex flex-col items-center w-full max-w-sm">
        <Logo size={56} className="text-brand mb-4" />
        <div className="text-neutral-100 text-lg font-medium mb-6">Criar nova senha</div>

        {done ? (
          <p className="text-brand text-sm text-center">Senha atualizada! Redirecionando pro login…</p>
        ) : !ready ? (
          <p className="text-neutral-500 text-sm text-center">
            Link inválido ou expirado. Solicite um novo em{" "}
            <a href="/esqueci-senha" className="text-brand">
              esqueci minha senha
            </a>
            .
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
            <PasswordInput value={password} onChange={setPassword} placeholder="Nova senha" />
            <PasswordInput value={confirmPassword} onChange={setConfirmPassword} placeholder="Confirmar nova senha" />
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button type="submit" disabled={loading} className="dgs-btn-primary mt-1">
              {loading ? "Salvando…" : "Salvar nova senha"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
