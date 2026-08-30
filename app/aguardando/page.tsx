"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";

// Confere periodicamente se o status do aluno já mudou pra "active"
// (o webhook da Cakto atualiza isso em segundo plano)
export default function AguardandoPage() {
  const supabase = createClient();
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  async function checkStatus() {
    setChecking(true);
    const { data: userData, error: userError } = await supabase.auth.getUser();

    // Sessão caiu (ex: token expirou) — manda de volta pro login em vez de
    // ficar girando pra sempre sem fazer nada.
    if (userError || !userData.user) {
      router.push("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("status")
      .eq("id", userData.user.id)
      .single();

    setChecking(false);
    if (profile?.status === "active") {
      router.push("/dashboard");
    }
  }

  useEffect(() => {
    checkStatus(); // confere imediatamente ao carregar a página
    const interval = setInterval(checkStatus, 8000); // e depois a cada 8 segundos
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="dgs-scene">
      <div className="dgs-glow" style={{ left: "50%", top: "38%", transform: "translate(-50%,-50%)", width: 240, height: 240 }} />
      <div className="relative flex flex-col items-center">
        <Logo size={48} className="text-brand mb-8" />
        <svg width="52" height="52" viewBox="0 0 52 52" className="mb-6 animate-spin" style={{ animationDuration: "2.2s" }}>
          <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5" />
          <circle
            cx="26" cy="26" r="22" fill="none" stroke="#9ACD32" strokeWidth="2.5"
            strokeLinecap="round" strokeDasharray="34 200"
          />
        </svg>
        <div className="text-neutral-100 text-lg font-medium mb-2.5 text-center">
          Confirmando seu pagamento
        </div>
        <div className="text-neutral-500 text-[13px] text-center max-w-xs leading-relaxed mb-6">
          Assim que a Cakto confirmar sua assinatura, seu acesso é liberado automaticamente.
          Isso costuma levar poucos minutos.
        </div>
        <div className="flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-full px-4 py-2">
          <div className="w-1.5 h-1.5 rounded-full bg-brand" />
          <span className="text-neutral-300 text-xs">
            {checking ? "Verificando…" : "Status: aguardando confirmação"}
          </span>
        </div>
      </div>
    </div>
  );
}
