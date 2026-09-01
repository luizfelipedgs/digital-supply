import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/DashboardHeader";
import { CreditosClient } from "./CreditosClient";

export default async function CreditosPage() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("status, is_admin, video_credits, email")
    .eq("id", userData.user.id)
    .single();

  if (!profile || profile.status !== "active") redirect("/aguardando");

  return (
    <div className="min-h-screen bg-ink-900 p-6 sm:p-8">
      <div className="max-w-3xl mx-auto">
        <DashboardHeader backHref="/dashboard/trilha" />

        <div className="mb-6">
          <h1 className="text-neutral-100 text-xl font-medium">Créditos de vídeo</h1>
          <p className="text-neutral-500 text-sm mt-1">
            1 crédito = 1 vídeo processado na Trilha em Massa. Compre um pacote avulso — os créditos não expiram e
            somam com o que você já tem.
          </p>
        </div>

        <CreditosClient
          currentCredits={profile.video_credits ?? 0}
          isAdmin={!!profile.is_admin}
          email={profile.email}
        />
      </div>
    </div>
  );
}
