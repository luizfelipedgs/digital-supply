-- ============================================================
-- Trilha em Massa — créditos e lote de vídeos com música
-- Rode isso no SQL Editor do Supabase (seu projeto já existente).
-- Só precisa rodar uma vez. Não rode o schema.sql inteiro de novo —
-- ele vai dar erro de "policy already exists" nas tabelas que já existem.
-- ============================================================

-- ------------------------------------------------------------
-- Créditos de vídeo no perfil do aluno (1 crédito = 1 vídeo processado)
-- ------------------------------------------------------------
alter table public.profiles add column if not exists video_credits integer not null default 0;
alter table public.profiles add column if not exists free_credits_granted boolean not null default false;

-- Concede os 10 créditos grátis pra quem JÁ está ativo na comunidade hoje.
-- Protegido por "free_credits_granted = false", então é seguro rodar esse
-- arquivo mais de uma vez sem duplicar créditos.
update public.profiles
  set video_credits = video_credits + 10, free_credits_granted = true
  where status = 'active' and free_credits_granted = false;

-- A partir de agora, todo cadastro novo já nasce com 10 créditos grátis.
-- Isso substitui a função criada no schema.sql original (mesmo nome).
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

-- Débito atômico de 1 crédito (usado pelo backend antes de processar cada
-- vídeo). Admin não passa por aqui — a rota da API já ignora o crédito
-- quando profiles.is_admin = true, igual ao Mestre das Legendas.
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

-- ------------------------------------------------------------
-- Lote de vídeos enviados pra colocar música (Trilha em Massa)
-- ------------------------------------------------------------
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

drop policy if exists "Aluno vê os próprios lotes" on public.video_batch_jobs;
create policy "Aluno vê os próprios lotes"
  on public.video_batch_jobs for select
  using (auth.uid() = user_id);
-- Sem policy de insert/update pra authenticated de propósito: só o backend
-- (service role, nas rotas da API) cria e atualiza essas linhas. Isso evita
-- que o aluno manipule status/contadores direto pelo client do Supabase.

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

drop policy if exists "Aluno vê os próprios itens de lote" on public.video_batch_items;
create policy "Aluno vê os próprios itens de lote"
  on public.video_batch_items for select
  using (auth.uid() = user_id);

-- Incrementa os contadores do lote de forma atômica (evita perder contagem
-- quando vários vídeos do mesmo lote terminam de processar ao mesmo tempo).
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

-- ------------------------------------------------------------
-- Bucket de storage privado pros vídeos, música e resultados do lote.
-- Estrutura de pastas: {user_id}/{job_id}/raw/..., /music.*, /processed/...
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('video-batch', 'video-batch', false)
on conflict (id) do nothing;

drop policy if exists "Aluno lê os próprios arquivos da trilha em massa" on storage.objects;
create policy "Aluno lê os próprios arquivos da trilha em massa"
  on storage.objects for select
  using (bucket_id = 'video-batch' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Aluno envia os próprios arquivos da trilha em massa" on storage.objects;
create policy "Aluno envia os próprios arquivos da trilha em massa"
  on storage.objects for insert
  with check (bucket_id = 'video-batch' and (storage.foldername(name))[1] = auth.uid()::text);
-- Update/delete de objetos não é liberado pro aluno: o processamento e a
-- limpeza (12h) rodam só pelo backend com a service role.
