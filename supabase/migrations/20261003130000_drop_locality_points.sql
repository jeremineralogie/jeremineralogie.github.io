-- Nettoyage : table et colonne jamais utilisées (les gisements sont reliés à leur commune par mines.locality_id).
alter table public.mines drop column if exists point_id;
drop table if exists public.locality_points;
