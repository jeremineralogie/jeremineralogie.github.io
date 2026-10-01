-- Boutique : région, mots-clés et date de découverte (comme pour la collection).
alter table public.shop_items
  add column if not exists region_id uuid references public.regions(id) on delete set null,
  add column if not exists keywords text,
  add column if not exists discovery_date_text text;
