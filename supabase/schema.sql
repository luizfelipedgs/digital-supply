-- ============================================================
-- Digital Supply (DGS) — schema inicial
-- Rode este arquivo no SQL Editor do Supabase (painel do projeto)
-- ============================================================

-- Extensão usada para gerar UUIDs
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- Tabela de perfis (1 linha por aluno, ligada ao auth.users)
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  email text not null,
  status text not null default 'pending'
    check (status in ('pending', 'active', 'suspended', 'canceled')),
  plan text
    check (plan in ('mensal', 'trimestral', 'anual')),
  plan_activated_at timestamptz,
  plan_expires_at timestamptz,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Um aluno só pode ver e editar o próprio perfil
alter table public.profiles enable row level security;

create policy "Aluno vê o próprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Aluno edita o próprio perfil (campos não sensíveis)"
  on public.profiles for update
  using (auth.uid() = id);

-- Cria automaticamente um perfil "pending" quando alguém se cadastra
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, phone, status)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone',
    'pending'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ------------------------------------------------------------
-- Log de eventos recebidos da Cakto (auditoria + depuração)
-- ------------------------------------------------------------
create table if not exists public.cakto_events (
  id uuid primary key default gen_random_uuid(),
  received_at timestamptz not null default now(),
  event_type text,
  product_id text,
  buyer_email text,
  matched_user_id uuid references auth.users(id),
  processed boolean not null default false,
  raw_payload jsonb not null
);

alter table public.cakto_events enable row level security;
-- Só o backend (service role) acessa essa tabela — nenhuma policy pra usuário comum.

-- ------------------------------------------------------------
-- Lançamentos de faturamento por plataforma (dashboard do aluno)
-- ------------------------------------------------------------
create table if not exists public.earnings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('instagram', 'tiktok', 'youtube')),
  views bigint not null default 0,
  videos_posted integer not null default 0,
  amount numeric(10,2) not null default 0,
  entry_date date not null default current_date,
  created_at timestamptz not null default now()
);

alter table public.earnings enable row level security;

create policy "Aluno vê os próprios lançamentos"
  on public.earnings for select
  using (auth.uid() = user_id);

create policy "Aluno cria os próprios lançamentos"
  on public.earnings for insert
  with check (auth.uid() = user_id);

create policy "Aluno edita os próprios lançamentos"
  on public.earnings for update
  using (auth.uid() = user_id);

create policy "Aluno apaga os próprios lançamentos"
  on public.earnings for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- Metas do aluno
-- ------------------------------------------------------------
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  target_value numeric(12,2),
  current_value numeric(12,2) not null default 0,
  deadline date,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.goals enable row level security;

create policy "Aluno gerencia as próprias metas"
  on public.goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ------------------------------------------------------------
-- Anotações e tarefas do aluno
-- ------------------------------------------------------------
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  notes text,
  done boolean not null default false,
  due_date date,
  created_at timestamptz not null default now()
);

alter table public.tasks enable row level security;

create policy "Aluno gerencia as próprias tarefas"
  on public.tasks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
