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
  video_credits integer not null default 0,
  free_credits_granted boolean not null default false,
  desktop_app_purchased boolean not null default false,
  desktop_app_purchased_at timestamptz,
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
  insert into public.profiles (id, email, full_name, phone, status, video_credits, free_credits_granted)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone',
    'pending',
    10,
    true
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

-- ------------------------------------------------------------
-- Uso diário do agente "Mestre das Legendas" (limite de vídeos/dia)
-- ------------------------------------------------------------
create table if not exists public.legendas_video_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null,
  count integer not null default 0,
  primary key (user_id, usage_date)
);

alter table public.legendas_video_usage enable row level security;

-- Aluno só pode LER a própria contagem (pra mostrar "restam X vídeos hoje" na tela).
-- A escrita só acontece pela função abaixo (security definer) — nunca direto pelo cliente.
create policy "Aluno vê o próprio uso do Mestre das Legendas"
  on public.legendas_video_usage for select
  using (auth.uid() = user_id);

-- Consome 1 vídeo da cota diária do usuário autenticado, de forma atômica
-- (usa "for update" pra travar a linha contra chamadas simultâneas).
-- Retorna allowed=false quando o limite do dia já foi atingido (não incrementa nesse caso).
-- O dia considerado é sempre o calendário de Brasília (America/Sao_Paulo), não UTC.
create or replace function public.consume_legendas_video_quota(daily_limit integer default 5)
returns table(allowed boolean, remaining integer)
language plpgsql
security definer
as $$
declare
  v_user uuid := auth.uid();
  v_date date := (timezone('America/Sao_Paulo', now()))::date;
  v_count integer;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  insert into public.legendas_video_usage (user_id, usage_date, count)
  values (v_user, v_date, 0)
  on conflict (user_id, usage_date) do nothing;

  select count into v_count
    from public.legendas_video_usage
    where user_id = v_user and usage_date = v_date
    for update;

  if v_count >= daily_limit then
    return query select false, greatest(daily_limit - v_count, 0);
  else
    update public.legendas_video_usage
      set count = count + 1
      where user_id = v_user and usage_date = v_date;
    return query select true, (daily_limit - (v_count + 1));
  end if;
end;
$$;

grant execute on function public.consume_legendas_video_quota(integer) to authenticated;

-- ------------------------------------------------------------
-- Trilha em Massa — débito de créditos e lote de vídeos com música
-- ------------------------------------------------------------
create or replace function public.consume_video_credit()
returns table(allowed boolean, remaining integer)
language plpgsql
security definer
as $$
declare
  v_user uuid := auth.uid();
  v_credits integer;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  select video_credits into v_credits
    from public.profiles
    where id = v_user
    for update;

  if v_credits is null then
    v_credits := 0;
  end if;

  if v_credits <= 0 then
    return query select false, 0;
  else
    update public.profiles set video_credits = video_credits - 1 where id = v_user;
    return query select true, (v_credits - 1);
  end if;
end;
$$;

grant execute on function public.consume_video_credit() to authenticated;

create table if not exists public.video_batch_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'processing' check (status in ('processing', 'done', 'failed', 'expired')),
  music_path text not null,
  music_start_seconds numeric not null default 0,
  total_videos integer not null default 0,
  done_videos integer not null default 0,
  failed_videos integer not null default 0,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '12 hours')
);

create index if not exists video_batch_jobs_expires_at_idx on public.video_batch_jobs(expires_at);

alter table public.video_batch_jobs enable row level security;

create policy "Aluno vê os próprios lotes"
  on public.video_batch_jobs for select
  using (auth.uid() = user_id);

create table if not exists public.video_batch_items (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.video_batch_jobs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  original_filename text not null,
  original_path text not null,
  processed_path text,
  status text not null default 'pending' check (status in ('pending', 'processing', 'done', 'failed')),
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists video_batch_items_job_id_idx on public.video_batch_items(job_id);

alter table public.video_batch_items enable row level security;

create policy "Aluno vê os próprios itens de lote"
  on public.video_batch_items for select
  using (auth.uid() = user_id);

create or replace function public.bump_video_batch_job_counts(
  p_job_id uuid, p_done_delta integer, p_failed_delta integer
)
returns void
language sql
security definer
as $$
  update public.video_batch_jobs
    set done_videos = done_videos + p_done_delta,
        failed_videos = failed_videos + p_failed_delta
    where id = p_job_id;
$$;

grant execute on function public.bump_video_batch_job_counts(uuid, integer, integer) to authenticated;

insert into storage.buckets (id, name, public)
values ('video-batch', 'video-batch', false)
on conflict (id) do nothing;

create policy "Aluno lê os próprios arquivos da trilha em massa"
  on storage.objects for select
  using (bucket_id = 'video-batch' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Aluno envia os próprios arquivos da trilha em massa"
  on storage.objects for insert
  with check (bucket_id = 'video-batch' and (storage.foldername(name))[1] = auth.uid()::text);

-- Nota: o instalador da Trilha em Massa Desktop (.exe) NÃO fica no Supabase
-- Storage (o plano Free tem limite de 50 MB e o instalador passa disso).
-- Ele é publicado como GitHub Release — veja lib/desktop-app.ts e
-- .github/workflows/build-desktop.yml.
