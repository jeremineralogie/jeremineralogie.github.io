-- Minéraux associés (secondaires) des pièces de la boutique, sur le modèle de specimen_associations.
create table public.shop_item_associations (
  shop_item_id uuid not null references public.shop_items(id) on delete cascade,
  mineral_id uuid not null references public.minerals(id) on delete restrict,
  primary key (shop_item_id, mineral_id)
);
alter table public.shop_item_associations enable row level security;
revoke all on public.shop_item_associations from anon, authenticated;
grant select on public.shop_item_associations to anon, authenticated;
grant insert, update, delete on public.shop_item_associations to authenticated;
create policy shop_item_associations_admin_select on public.shop_item_associations for select to authenticated using ((select private.is_admin()));
create policy shop_item_associations_admin_insert on public.shop_item_associations for insert to authenticated with check ((select private.is_admin()));
create policy shop_item_associations_admin_update on public.shop_item_associations for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy shop_item_associations_admin_delete on public.shop_item_associations for delete to authenticated using ((select private.is_admin()));
create policy shop_item_associations_public_read on public.shop_item_associations for select to anon, authenticated
  using (exists (select 1 from public.shop_items p where p.id = shop_item_id and p.publication_status = 'published' and p.sale_status = 'available'));
