-- Gisements : point propre sur la carte (plusieurs gisements d'une même commune = plusieurs points).
-- Sans point, le gisement reste affiché au point de sa commune.
alter table public.mines
  add column if not exists latitude double precision check (latitude between -90 and 90),
  add column if not exists longitude double precision check (longitude between -180 and 180);
