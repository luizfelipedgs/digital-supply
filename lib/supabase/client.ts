import { createBrowserClient } from "@supabase/ssr";

// Cliente usado em componentes do lado do navegador (formulários de login, cadastro, etc.)
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
