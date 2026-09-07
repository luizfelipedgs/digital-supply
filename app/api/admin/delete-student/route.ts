import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// Remove um cadastro por completo — usado pelo painel de Alunos quando a
// pessoa digitou algo errado no cadastro ou travou no meio da etapa de
// compra/login e nunca vai virar aluno de verdade. Apaga o usuário direto no
// Auth do Supabase (auth.users); como a tabela public.profiles referencia
// auth.users com "on delete cascade", o perfil desaparece junto
// automaticamente — não sobra registro nenhum pra trás.
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", userData.user.id)
      .single();

    if (!adminProfile?.is_admin) {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const id: string | undefined = body?.id;
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "ID inválido." }, { status: 400 });
    }

    if (id === userData.user.id) {
      return NextResponse.json({ error: "Você não pode remover o próprio cadastro." }, { status: 400 });
    }

    const admin = createAdminClient();

    // Se essa pessoa já tiver algum evento de compra da Cakto associado
    // (matched_user_id), precisa desvincular antes — essa coluna não tem
    // "on delete cascade", então apagar o usuário sem fazer isso falharia.
    // O log do evento em si continua guardado (auditoria), só perde o vínculo
    // com o usuário que acabou de ser removido.
    await admin.from("cakto_events").update({ matched_user_id: null }).eq("matched_user_id", id);

    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) {
      return NextResponse.json({ error: error.message || "Não consegui remover o cadastro." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Erro inesperado." }, { status: 500 });
  }
}
