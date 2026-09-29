-- Preserve arbitrary specimen form values independently from legacy reference
-- tables and numeric/date columns. Existing IDs and values are left untouched.
alter table public.specimens
  add column if not exists mineral_name text,
  add column if not exists region_name text,
  add column if not exists department_name text,
  add column if not exists locality_name text,
  add column if not exists weight_text text,
  add column if not exists discovery_date_text text;

-- The admin's site type is descriptive free text, not a closed vocabulary.
alter table public.specimens
  drop constraint if exists specimens_site_type_check;

comment on column public.specimens.mineral_name is 'Mineral name as entered in the specimen form; independent from the optional minerals reference.';
comment on column public.specimens.region_name is 'Region as entered in the specimen form; independent from the optional regions reference.';
comment on column public.specimens.department_name is 'Department as entered in the specimen form; independent from the optional departments reference.';
comment on column public.specimens.locality_name is 'Locality as entered in the specimen form; independent from the optional localities reference.';
comment on column public.specimens.weight_text is 'Weight as entered in the specimen form, including its original text representation.';
comment on column public.specimens.discovery_date_text is 'Discovery or collection-entry date as entered, preserving its original precision and text.';

-- Make public pages react to row changes. Add each table only once, if the
-- standard Supabase Realtime publication is present on this project.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'specimens'
    ) then
      alter publication supabase_realtime add table public.specimens;
    end if;
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'specimen_media'
    ) then
      alter publication supabase_realtime add table public.specimen_media;
    end if;
  end if;
end $$;
