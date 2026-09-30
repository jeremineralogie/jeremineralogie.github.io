-- Coordonnées des communes pour la carte interactive (centre de la commune, source geo.api.gouv.fr).
alter table public.localities
  add column if not exists latitude double precision check (latitude between -90 and 90),
  add column if not exists longitude double precision check (longitude between -180 and 180),
  add column if not exists insee_code text,
  add column if not exists postal_code text;
