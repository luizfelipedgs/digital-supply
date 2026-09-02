import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/DashboardHeader";
import { MusicasAdminClient } from "./MusicasAdminClient";

export default async function MusicasAdminPage() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", userData.user.id).single();
  if (!profile?.is_admin) redirect("/dashboard");

  const { data: tracks } = await supabase
    .from("music_library")
    .select("id, title, storage_path, order_index")
    .order("order_index", { ascending: true });

  return (
    <div className="min-h-screen bg-ink-900 p-6 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <DashboardHeader backHref="/dashboard/admin" backLabel="Voltar ao painel admin" />
        <h1 className="text-neutral-100 text-xl font-medium mb-1">Biblioteca de Músicas</h1>
        <p className="text-neutral-500 text-sm mb-6">
          As músicas que você enviar aqui aparecem pra todos os alunos escolherem direto no Editor de Músicas, sem
          precisar baixar nenhum arquivo.
        </p>

        <MusicasAdminClient initialTracks={tracks ?? []} />
      </div>
    </div>
  );
}
