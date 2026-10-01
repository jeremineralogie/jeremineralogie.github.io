-- Plusieurs points sur la carte pour une même commune.
-- Le point principal reste celui de la commune (localities.latitude / longitude) ;
-- les points supplémentaires sont rattachés à la commune, et chaque gisement peut être inclus dans l'un d'eux.
-- Un gisement sans point choisi est affiché au point principal de sa commune. Le gisement n'a jamais de position propre.
create table if not exists public.locality_points (
  id uuid primary key default gen_random_uuid(),
  locality_id uuid not null references public.localities(id) on delete cascade,
  label text not null default '' check (char_length(label) <= 120),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  created_at timestamptz not null default now()
);
create index if not exists locality_points_locality_idx on public.locality_points(locality_id);
alter table public.locality_points enable row level security;
create policy locality_points_public_read on public.locality_points for select to anon, authenticated
  using (exists (select 1 from public.localities l where l.id = locality_id and l.publication_status = 'published'));
create policy locality_points_admin_select on public.locality_points for select to authenticated using ((select private.is_admin()));
create policy locality_points_admin_insert on public.locality_points for insert to authenticated with check ((select private.is_admin()));
create policy locality_points_admin_update on public.locality_points for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy locality_points_admin_delete on public.locality_points for delete to authenticated using ((select private.is_admin()));

-- Gisement : point de sa commune dans lequel il est inclus (aucune coordonnée propre).
alter table public.mines drop column if exists latitude, drop column if exists longitude;
alter table public.mines add column if not exists point_id uuid references public.locality_points(id) on delete set null;
create index if not exists mines_point_idx on public.mines(point_id);
