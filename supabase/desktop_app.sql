-- ============================================================
-- Trilha em Massa Desktop — acesso ao programa (pagamento único)
-- Rode isso no SQL Editor do Supabase (seu projeto já existente).
-- Só precisa rodar uma vez. Não rode o schema.sql inteiro de novo —
-- ele vai dar erro de "policy already exists" nas tabelas que já existem.
-- ============================================================

alter table public.profiles add column if not exists desktop_app_purchased boolean not null default false;
alter table public.profiles add column if not exists desktop_app_purchased_at timestamptz;

-- Bucket PÚBLICO (diferente do "video-batch", que é privado) — o instalador
-- não é um arquivo sensível, o que protege o produto é o login + a
-- checagem de "desktop_app_purchased" DENTRO do programa antes de deixar
-- processar qualquer vídeo. Ninguém escreve nesse bucket pelo app: só o
-- GitHub Actions, usando a service role key (veja
-- .github/workflows/build-desktop.yml).
insert into storage.buckets (id, name, public)
values ('desktop-app', 'desktop-app', true)
on conflict (id) do nothing;
