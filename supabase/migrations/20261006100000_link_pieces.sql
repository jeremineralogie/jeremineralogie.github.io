-- Tout peut être lié à tout : les articles et les archives peuvent désormais être liés aux pièces de la boutique
-- (les liaisons avec les spécimens de la collection existaient déjà : article_specimens, archive_specimens).
create table public.article_shop_items (
 article_id uuid not null references public.articles(id) on delete cascade,
 shop_item_id uuid not null references public.shop_items(id) on delete cascade,
 primary key(article_id,shop_item_id)
);
create table public.archive_shop_items (
 archive_id uuid not null references public.archive_documents(id) on delete cascade,
 shop_item_id uuid not null references public.shop_items(id) on delete cascade,
 primary key(archive_id,shop_item_id)
);
create index article_shop_items_shop_item_idx on public.article_shop_items(shop_item_id);
create index archive_shop_items_shop_item_idx on public.archive_shop_items(shop_item_id);

do $$
declare t text;
begin
 foreach t in array array['article_shop_items','archive_shop_items'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from anon, authenticated',t);
  execute format('grant select on public.%I to anon, authenticated',t);
  execute format('grant insert,update,delete on public.%I to authenticated',t);
  execute format('create policy %I on public.%I for select to authenticated using ((select private.is_admin()))',t||'_admin_select',t);
  execute format('create policy %I on public.%I for insert to authenticated with check ((select private.is_admin()))',t||'_admin_insert',t);
  execute format('create policy %I on public.%I for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()))',t||'_admin_update',t);
  execute format('create policy %I on public.%I for delete to authenticated using ((select private.is_admin()))',t||'_admin_delete',t);
 end loop;
end $$;

create policy article_shop_items_public_read on public.article_shop_items for select to anon,authenticated using(exists(select 1 from public.articles a where a.id=article_id and a.publication_status='published'));
create policy archive_shop_items_public_read on public.archive_shop_items for select to anon,authenticated using(exists(select 1 from public.archive_documents d where d.id=archive_id and d.publication_status='published'));
