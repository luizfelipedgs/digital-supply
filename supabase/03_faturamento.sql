-- ============================================================
-- Digital Supply (DGS) — Dashboard de Faturamento
-- Rode este arquivo no SQL Editor do Supabase (depois dos anteriores)
-- ============================================================

-- Ajusta a tabela earnings pra guardar nome do lançamento e o print (screenshot)
alter table public.earnings add column if not exists title text not null default '';
alter table public.earnings add column if not exists screenshot_path text;

-- ------------------------------------------------------------
-- Bucket de storage privado pros prints de comprovação
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('earnings-screenshots', 'earnings-screenshots', false)
on conflict (id) do nothing;

-- Cada aluno só acessa arquivos dentro da própria pasta (nomeada com o próprio user_id)
create policy "Aluno lê os próprios prints"
  on storage.objects for select
  using (bucket_id = 'earnings-screenshots' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Aluno envia os próprios prints"
  on storage.objects for insert
  with check (bucket_id = 'earnings-screenshots' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Aluno apaga os próprios prints"
  on storage.objects for delete
  using (bucket_id = 'earnings-screenshots' and (storage.foldername(name))[1] = auth.uid()::text);
