import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/DashboardHeader";
import { TasksColumn } from "./TasksColumn";
import { GoalsColumn } from "./GoalsColumn";
import { NotesColumn } from "./NotesColumn";
import { VisionBoard } from "./VisionBoard";

export default async function ProdutividadePage() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("status, vision_photo_path")
    .eq("id", userData.user.id)
    .single();

  if (!profile || profile.status !== "active") redirect("/aguardando");

  return (
    <div className="min-h-screen bg-ink-900 p-6 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <DashboardHeader backHref="/dashboard" />
        <h1 className="text-neutral-100 text-xl font-medium mb-6">Anotações, tarefas e metas</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <VisionBoard userId={userData.user.id} initialPhotoPath={profile.vision_photo_path} />
          <GoalsColumn userId={userData.user.id} />
          <TasksColumn userId={userData.user.id} />
          <NotesColumn userId={userData.user.id} />
        </div>
      </div>
    </div>
  );
}
