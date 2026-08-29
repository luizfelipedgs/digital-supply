"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";
import { PasswordInput } from "@/components/PasswordInput";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Preencha email e senha.");
      return;
    }

    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (signInError) {
      setError("Email ou senha incorretos.");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="dgs-scene">
      <div className="dgs-glow" style={{ left: "50%", top: "32%", transform: "translate(-50%,-50%)" }} />
      <div className="relative flex flex-col items-center w-full max-w-sm">
        <Logo size={88} className="text-brand mb-5" />
        <div className="text-brand text-[13px] tracking-[6px] mb-2">COMUNIDADE DGS</div>
        <div className="text-neutral-100 text-2xl tracking-[6px] font-medium mb-4">DIGITAL SUPPLY</div>
        <div className="h-px w-16 bg-brand/50 mb-8" />

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
          <input
            type="email"
            placeholder="seu@email.com"
            className="dgs-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <PasswordInput value={password} onChange={setPassword} placeholder="Senha" />
          <div className="text-right -mt-1">
            <Link href="/esqueci-senha" className="text-neutral-500 text-xs">
              Esqueceu a senha?
            </Link>
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button type="submit" disabled={loading} className="dgs-btn-primary mt-1">
            {loading ? "Entrando…" : "Entrar"}
          </button>
          <p className="text-center text-xs text-neutral-500 mt-1">
            Ainda não faz parte?{" "}
            <Link href="/cadastro" className="text-brand">
              Cadastre-se
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
