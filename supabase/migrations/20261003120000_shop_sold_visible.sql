-- Les pièces vendues restent visibles sur le site (bandeau « Vendu » dans la boutique) ; les pièces masquées ne le sont toujours pas.
drop policy if exists shop_items_public_read on public.shop_items;
create policy shop_items_public_read on public.shop_items for select to anon, authenticated
  using (publication_status = 'published' and sale_status in ('available', 'sold'));

drop policy if exists shop_item_media_public_read on public.shop_item_media;
create policy shop_item_media_public_read on public.shop_item_media for select to anon, authenticated
  using (bucket_id = 'site-media-public' and exists (select 1 from public.shop_items p where p.id = shop_item_id and p.publication_status = 'published' and p.sale_status in ('available', 'sold')));

drop policy if exists shop_item_associations_public_read on public.shop_item_associations;
create policy shop_item_associations_public_read on public.shop_item_associations for select to anon, authenticated
  using (exists (select 1 from public.shop_items p where p.id = shop_item_id and p.publication_status = 'published' and p.sale_status in ('available', 'sold')));
