import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/DashboardHeader";
import { CampanhasAdminClient } from "./CampanhasAdminClient";

export default async function AdminCampanhasPage() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", userData.user.id).single();
  if (!profile?.is_admin) redirect("/dashboard");

  const { data: campaignsRaw } = await supabase
    .from("campaigns")
    .select("id, title, cover_path, start_date, end_date, prize_label, link_url, created_at")
    .order("start_date", { ascending: false });

  const campaigns = (campaignsRaw ?? []).map((c) => ({
    ...c,
    coverUrl: c.cover_path ? supabase.storage.from("content-covers").getPublicUrl(c.cover_path).data.publicUrl : null,
  }));

  return (
    <div className="min-h-screen bg-ink-900 p-6 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <DashboardHeader backHref="/dashboard/admin" />
        <h1 className="text-neutral-100 text-xl font-medium mb-6">Campanhas exclusivas</h1>
        <CampanhasAdminClient initialCampaigns={campaigns} userId={userData.user.id} />
      </div>
    </div>
  );
}
