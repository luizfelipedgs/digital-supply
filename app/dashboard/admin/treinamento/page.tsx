import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminTreinamentoClient } from "./AdminTreinamentoClient";

export default async function AdminTreinamentoPage() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", userData.user.id).single();
  if (!profile?.is_admin) redirect("/dashboard");

  const { data: licoes } = await supabase
    .from("treinamento_licoes")
    .select("id, title, subtitle, content_type, body_text, video_url, is_bonus, order_index")
    .order("order_index", { ascending: true });

  return <AdminTreinamentoClient initialLessons={licoes ?? []} />;
}
