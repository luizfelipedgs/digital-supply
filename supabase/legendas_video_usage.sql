-- ============================================================
-- Mestre das Legendas — cota diária de vídeos
-- Rode isso no SQL Editor do Supabase (seu projeto já existente).
-- Só precisa rodar uma vez. Não rode o schema.sql inteiro de novo —
-- ele vai dar erro de "policy already exists" nas tabelas que já existem.
-- ============================================================

create table if not exists public.legendas_video_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null,
  count integer not null default 0,
  primary key (user_id, usage_date)
);

alter table public.legendas_video_usage enable row level security;

drop policy if exists "Aluno vê o próprio uso do Mestre das Legendas" on public.legendas_video_usage;
create policy "Aluno vê o próprio uso do Mestre das Legendas"
  on public.legendas_video_usage for select
  using (auth.uid() = user_id);

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
