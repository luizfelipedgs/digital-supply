import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DesktopTutorialAdminClient } from "./DesktopTutorialAdminClient";

export default async function AdminDesktopTutorialPage() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", userData.user.id).single();
  if (!profile?.is_admin) redirect("/dashboard");

  const { data: settings } = await supabase
    .from("desktop_app_settings")
    .select("tutorial_video_url")
    .eq("id", "main")
    .maybeSingle();

  return <DesktopTutorialAdminClient initialTutorialUrl={settings?.tutorial_video_url ?? ""} />;
}
