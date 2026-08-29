import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PerfilClient } from "./PerfilClient";

export default async function PerfilPage() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, nickname, avatar_path, email")
    .eq("id", userData.user.id)
    .single();

  return (
    <div className="min-h-screen bg-ink-900 p-6 sm:p-8">
      <PerfilClient
        initialNickname={profile?.nickname ?? ""}
        fullName={profile?.full_name ?? ""}
        email={profile?.email ?? userData.user.email ?? ""}
        avatarPath={profile?.avatar_path ?? null}
        userId={userData.user.id}
      />
    </div>
  );
}
