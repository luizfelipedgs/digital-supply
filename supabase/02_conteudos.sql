-- ============================================================
-- Digital Supply (DGS) — módulo de Conteúdos
-- Rode este arquivo no SQL Editor do Supabase (depois do schema.sql principal)
-- ============================================================

-- ------------------------------------------------------------
-- Módulos (ex: "Fundamentos", "Campanhas Avançadas")
-- ------------------------------------------------------------
create table if not exists public.content_modules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.content_modules enable row level security;

-- Qualquer aluno com acesso ativo pode ver os módulos
create policy "Aluno ativo vê os módulos"
  on public.content_modules for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.status = 'active'
    )
  );

-- Só admin cria/edita/apaga módulos
create policy "Admin gerencia módulos"
  on public.content_modules for all
  using (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.is_admin = true)
  )
  with check (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.is_admin = true)
  );

-- ------------------------------------------------------------
-- Aulas (texto, áudio ou vídeo) dentro de cada módulo
-- ------------------------------------------------------------
create table if not exists public.content_lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.content_modules(id) on delete cascade,
  title text not null,
  description text,
  content_type text not null check (content_type in ('text', 'video', 'audio')),
  body_text text,        -- usado quando content_type = 'text'
  video_url text,        -- usado quando content_type = 'video' (link embed do YouTube/Vimeo não-listado)
  audio_url text,        -- usado quando content_type = 'audio'
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.content_lessons enable row level security;

create policy "Aluno ativo vê as aulas"
  on public.content_lessons for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.status = 'active'
    )
  );

create policy "Admin gerencia aulas"
  on public.content_lessons for all
  using (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.is_admin = true)
  )
  with check (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.is_admin = true)
  );

-- ------------------------------------------------------------
-- Progresso do aluno (quais aulas ele já concluiu)
-- ------------------------------------------------------------
create table if not exists public.lesson_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.content_lessons(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

alter table public.lesson_progress enable row level security;

create policy "Aluno gerencia o próprio progresso"
  on public.lesson_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
