// Copie este arquivo pra "env.js" (mesma pasta) e preencha com os valores
// REAIS do seu projeto Supabase — os mesmos que já estão em
// NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY na Vercel.
// A "anon key" é pública por natureza (é a mesma usada no site) — não tem
// problema ela ir dentro do programa que os alunos baixam.
//
// "env.js" está no .gitignore de propósito: não é pra commitar ele com os
// valores reais. Quem builda o instalador automaticamente é o GitHub
// Actions (veja .github/workflows/build-desktop.yml na raiz do repo) — ele
// gera esse arquivo sozinho a partir de dois "Secrets" do repositório
// (DESKTOP_SUPABASE_URL e DESKTOP_SUPABASE_ANON_KEY). Esse arquivo local só
// é necessário se você quiser testar o programa manualmente no seu
// computador antes de publicar.
module.exports = {
  SUPABASE_URL: "https://SEU-PROJETO.supabase.co",
  SUPABASE_ANON_KEY: "sua-anon-key-aqui",
};
