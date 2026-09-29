-- 1) L'admin doit pouvoir lire (download) les objets du bucket public : sans cette
--    politique, le passage publié -> brouillon d'un spécimen/produit échoue car
--    storage.download() passe par la route authentifiée soumise au RLS.
--    (La lecture publique des URLs /object/public/ n'est pas concernée.)
create policy content_media_admin_read on storage.objects for select to authenticated
  using (bucket_id in ('site-media-public','admin-staging') and (select private.is_admin()));

-- 2) Realtime : les pages publiques écoutent ces tables, mais seules specimens et
--    specimen_media étaient publiées. Ajout idempotent des autres.
do $$
declare t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['shop_items','shop_item_media','articles','article_media','archive_documents',
                             'regions','departments','localities','mines','minerals','mineral_occurrences'] loop
      if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename=t) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end $$;
