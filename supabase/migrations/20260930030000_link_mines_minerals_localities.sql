-- Liens gisement / minéral / commune entre spécimens, boutique et référentiels.
alter table public.specimens  add column if not exists mine_id uuid references public.mines(id) on delete set null;
alter table public.shop_items add column if not exists mine_id uuid references public.mines(id) on delete set null;
create index if not exists specimens_mine_id_idx      on public.specimens(mine_id);
create index if not exists specimens_mineral_id_idx   on public.specimens(mineral_id);
create index if not exists specimens_locality_id_idx  on public.specimens(locality_id);
create index if not exists shop_items_mine_id_idx     on public.shop_items(mine_id);
create index if not exists shop_items_mineral_id_idx  on public.shop_items(mineral_id);
create index if not exists shop_items_locality_id_idx on public.shop_items(locality_id);

-- Rattrapage des données existantes (texte libre -> référentiels). Idempotent, sans rien inventer :
-- seules les valeurs déjà saisies sur les spécimens sont reprises.
create or replace function pg_temp.slugify(t text) returns text language sql immutable as $$
  select btrim(regexp_replace(translate(lower(btrim(t)), 'àâäéèêëîïôöùûüç', 'aaaeeeeiioouuuc'), '[^a-z0-9]+', '-', 'g'), '-')
$$;

insert into public.minerals(name, slug, colors, publication_status)
select distinct on (lower(btrim(s.mineral_name))) btrim(s.mineral_name), pg_temp.slugify(s.mineral_name), '{}', 'published'
from public.specimens s
where s.mineral_id is null and btrim(coalesce(s.mineral_name,'')) <> ''
  and not exists (select 1 from public.minerals m where lower(m.name) = lower(btrim(s.mineral_name)))
on conflict do nothing;
update public.specimens s set mineral_id = m.id from public.minerals m
where s.mineral_id is null and lower(m.name) = lower(btrim(coalesce(s.mineral_name,'')));

insert into public.localities(name, slug, department_code, notes, publication_status)
select distinct on (lower(btrim(s.locality_name))) btrim(s.locality_name), pg_temp.slugify(s.locality_name), s.department_code, '', 'published'
from public.specimens s
where s.locality_id is null and btrim(coalesce(s.locality_name,'')) <> ''
  and not exists (select 1 from public.localities l where lower(l.name) = lower(btrim(s.locality_name)))
on conflict do nothing;
update public.specimens s set locality_id = l.id from public.localities l
where s.locality_id is null and lower(l.name) = lower(btrim(coalesce(s.locality_name,'')));

insert into public.mines(name, slug, locality_id, description, publication_status)
select distinct on (lower(btrim(s.provenance))) btrim(s.provenance), pg_temp.slugify(s.provenance), s.locality_id, '', 'published'
from public.specimens s
where btrim(coalesce(s.provenance,'')) <> ''
  and not exists (select 1 from public.mines m where lower(m.name) = lower(btrim(s.provenance)))
on conflict do nothing;
update public.specimens s set mine_id = m.id from public.mines m
where s.mine_id is null and lower(m.name) = lower(btrim(coalesce(s.provenance,'')));
update public.shop_items p set mine_id = m.id from public.mines m
where p.mine_id is null and lower(m.name) = lower(btrim(coalesce(p.provenance,'')));
