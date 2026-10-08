import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/DashboardHeader";
import { CampanhasList } from "./CampanhasList";

export default async function CampanhasPage() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("status").eq("id", userData.user.id).single();
  if (!profile || profile.status === "pending") redirect("/aguardando");
  if (profile.status !== "active") redirect("/login");

  const { data: campaignsRaw } = await supabase
    .from("campaigns")
    .select("id, title, cover_path, start_date, end_date, prize_label, link_url")
    .order("start_date", { ascending: false });

  const campaigns = (campaignsRaw ?? []).map((c) => ({
    ...c,
    coverUrl: c.cover_path ? supabase.storage.from("content-covers").getPublicUrl(c.cover_path).data.publicUrl : null,
  }));

  return (
    <div className="min-h-screen bg-ink-900 p-6 sm:p-8">
      <div className="max-w-3xl mx-auto">
        <DashboardHeader backHref="/dashboard" />
        <h1 className="text-neutral-100 text-xl font-medium mb-1">Campanhas exclusivas</h1>
        <p className="text-neutral-500 text-sm mb-6">
          Participe de competições privadas em plataformas parceiras da comunidade.
        </p>
        <CampanhasList campaigns={campaigns} />
      </div>
    </div>
  );
}
