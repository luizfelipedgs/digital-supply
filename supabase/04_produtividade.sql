-- ============================================================
-- Digital Supply (DGS) — Anotações gerais
-- Rode este arquivo no SQL Editor do Supabase (depois dos anteriores)
-- As tabelas "goals" e "tasks" já existem desde o schema.sql principal.
-- ============================================================

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.notes enable row level security;

create policy "Aluno gerencia as próprias anotações"
  on public.notes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
