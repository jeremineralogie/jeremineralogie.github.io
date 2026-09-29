-- Allow drafts/records to be saved before a mineral is identified, and keep
-- region-only specimen locations without requiring a department.
alter table public.specimens
  alter column mineral_id drop not null;

alter table public.specimens
  add column if not exists region_id uuid references public.regions(id) on delete set null;

create index if not exists specimens_region_idx on public.specimens(region_id);
