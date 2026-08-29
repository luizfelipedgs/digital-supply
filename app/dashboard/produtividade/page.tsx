import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TasksColumn } from "./TasksColumn";
import { GoalsColumn } from "./GoalsColumn";
import { NotesColumn } from "./NotesColumn";

export default async function ProdutividadePage() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("status")
    .eq("id", userData.user.id)
    .single();

  if (!profile || profile.status !== "active") redirect("/aguardando");

  return (
    <div className="min-h-screen bg-ink-900 p-6 sm:p-8">
      <Link href="/dashboard" className="text-neutral-500 text-sm no-underline">
        ← Voltar
      </Link>
      <h1 className="text-neutral-100 text-xl font-medium mt-4 mb-6">Anotações, tarefas e metas</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-6xl">
        <TasksColumn userId={userData.user.id} />
        <GoalsColumn userId={userData.user.id} />
        <NotesColumn userId={userData.user.id} />
      </div>
    </div>
  );
}
