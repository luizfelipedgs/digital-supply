"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";

export default function CadastroPage() {
  const router = useRouter();
  const supabase = createClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!fullName || !email || !phone || !password) {
      setError("Preencha todos os campos.");
      return;
    }
    if (password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone },
      },
    });
    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    // Depois de criar a conta, o aluno escolhe o plano antes de aguardar aprovação
    router.push("/planos");
  }

  return (
    <div className="dgs-scene">
      <div className="dgs-glow" style={{ left: "50%", top: "14%", transform: "translate(-50%,-50%)", width: 220, height: 220 }} />
      <div className="relative flex flex-col items-center w-full max-w-sm">
        <Logo size={56} className="text-brand mb-3" />
        <div className="text-brand text-[11px] tracking-[5px] mb-5">COMUNIDADE DGS</div>
        <div className="text-neutral-100 text-lg font-medium mb-7">Criar sua conta</div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
          <input
            type="text"
            placeholder="Nome completo"
            className="dgs-input"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <input
            type="email"
            placeholder="seu@email.com"
            className="dgs-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="tel"
            placeholder="(11) 91234-5678"
            className="dgs-input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <input
            type="password"
            placeholder="Criar senha"
            className="dgs-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button type="submit" disabled={loading} className="dgs-btn-primary mt-1">
            {loading ? "Criando conta…" : "Criar conta"}
          </button>
          <p className="text-center text-xs text-neutral-500 mt-1">
            Já tem conta?{" "}
            <Link href="/login" className="text-brand">
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
