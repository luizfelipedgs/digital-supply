-- ============================================================
-- Digital Supply (DGS) — Editor de conteúdos avançado
-- Rode este arquivo no SQL Editor do Supabase (depois dos anteriores)
-- ============================================================

-- Capa do módulo
alter table public.content_modules add column if not exists cover_image_path text;

-- ------------------------------------------------------------
-- Bucket de storage PÚBLICO pras capas dos módulos
-- (público porque é conteúdo de vitrine, não informação sensível do aluno —
-- diferente do bucket de prints de faturamento, que é privado)
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('content-covers', 'content-covers', true)
on conflict (id) do nothing;

create policy "Admin envia capas"
  on storage.objects for insert
  with check (
    bucket_id = 'content-covers'
    and exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.is_admin = true)
  );

create policy "Admin atualiza capas"
  on storage.objects for update
  using (
    bucket_id = 'content-covers'
    and exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.is_admin = true)
  );

create policy "Admin apaga capas"
  on storage.objects for delete
  using (
    bucket_id = 'content-covers'
    and exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.is_admin = true)
  );

-- Nota: o campo content_lessons.body_text passa a guardar HTML (produzido pelo
-- editor de texto rico), não mais texto puro. Nenhuma migração de coluna é
-- necessária — é o mesmo campo, só muda o que a aplicação grava nele.
