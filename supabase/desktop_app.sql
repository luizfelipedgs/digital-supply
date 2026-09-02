-- ============================================================
-- Editor de Músicas Desktop — acesso ao programa (pagamento único)
-- Rode isso no SQL Editor do Supabase (seu projeto já existente).
-- Só precisa rodar uma vez. Não rode o schema.sql inteiro de novo —
-- ele vai dar erro de "policy already exists" nas tabelas que já existem.
-- ============================================================

alter table public.profiles add column if not exists desktop_app_purchased boolean not null default false;
alter table public.profiles add column if not exists desktop_app_purchased_at timestamptz;

-- Não é preciso criar bucket no Supabase Storage pro instalador: ele é
-- publicado como GitHub Release (o plano Free do Supabase limita arquivos
-- a 50 MB, e o instalador passa disso) — veja lib/desktop-app.ts e
-- .github/workflows/build-desktop.yml.
--
-- Se você já rodou uma versão antiga deste script e criou o bucket
-- "desktop-app", pode apagá-lo em Storage no painel do Supabase — ele não
-- é mais usado (não tem problema deixá-lo lá também, só fica sem uso).
