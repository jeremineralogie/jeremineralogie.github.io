-- Photos des fiches minéraux de l'onglet « Apprendre » (ajoutées au fil de l'eau depuis l'admin).
create table public.mineral_media (
  id uuid primary key default gen_random_uuid(),
  mineral_id uuid not null references public.minerals(id) on delete cascade,
  bucket_id text not null default 'site-media-public',
  storage_path text not null,
  alt_text text not null default '',
  position integer not null default 0,
  unique (bucket_id, storage_path)
);
create index mineral_media_mineral_idx on public.mineral_media(mineral_id, position);

alter table public.mineral_media enable row level security;
revoke all on public.mineral_media from anon, authenticated;
grant select on public.mineral_media to anon, authenticated;
grant insert, update, delete on public.mineral_media to authenticated;
create policy mineral_media_public_read on public.mineral_media for select to anon, authenticated
  using (bucket_id = 'site-media-public' and exists (select 1 from public.minerals m where m.id = mineral_id and m.publication_status = 'published'));
create policy mineral_media_admin_select on public.mineral_media for select to authenticated using ((select private.is_admin()));
create policy mineral_media_admin_insert on public.mineral_media for insert to authenticated with check ((select private.is_admin()));
create policy mineral_media_admin_update on public.mineral_media for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy mineral_media_admin_delete on public.mineral_media for delete to authenticated using ((select private.is_admin()));
