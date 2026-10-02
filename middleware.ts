import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

// Garante que ninguém continue acessando o dashboard (ou qualquer página
// dentro dele) depois que a assinatura expirou ou foi suspensa — sem
// depender só do webhook da Cakto ou de alguém suspender manualmente pelo
// painel admin. Roda em TODA navegação dentro de /dashboard, antes mesmo da
// página carregar.
//
// Checagens, nessa ordem:
// 1) Sem sessão → /login
// 2) Cadastro ainda pendente de aprovação → /aguardando
// 3) Assinatura vencida (mesmo que o status no banco ainda esteja "active" —
//    cobre o caso de o webhook de cancelamento nunca ter chegado) OU já
//    suspensa → /assinatura-expirada, com aviso e botão de renovação
// 4) Admin nunca é barrado por data de vencimento (contas internas não têm
//    assinatura de verdade)
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("status, plan_expires_at, is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.status === "pending") {
    return NextResponse.redirect(new URL("/aguardando", request.url));
  }

  const expiredByDate =
    !profile.is_admin && !!profile.plan_expires_at && new Date(profile.plan_expires_at).getTime() < Date.now();

  if (!profile.is_admin && (profile.status === "suspended" || expiredByDate)) {
    return NextResponse.redirect(new URL("/assinatura-expirada", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
