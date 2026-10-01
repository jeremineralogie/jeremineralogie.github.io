-- Collection : titre interne (visible seulement dans l'admin, comme pour la boutique).
alter table public.specimens add column if not exists title text;
