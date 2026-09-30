-- Onglet « Apprendre » : fiches minéraux génériques (référentiel minerals enrichi) et glossaire.
alter table public.minerals
  add column if not exists chemical_class text,
  add column if not exists hardness_max numeric,
  add column if not exists density_max numeric,
  add column if not exists streak text,
  add column if not exists transparency text,
  add column if not exists fracture text,
  add column if not exists fluorescence text,
  add column if not exists etymology text,
  add column if not exists varieties text,
  add column if not exists confusions text,
  add column if not exists description text;

create table public.glossary_terms (
  id uuid primary key default gen_random_uuid(),
  term text not null check (char_length(btrim(term)) between 1 and 120),
  slug text not null unique,
  domain text not null check (domain in ('mineralogie', 'geologie', 'cristallographie')),
  definition text not null default '',
  see_also text[] not null default '{}',
  related_minerals text[] not null default '{}',
  publication_status text not null default 'published' check (publication_status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index glossary_terms_term_idx on public.glossary_terms(term);

alter table public.glossary_terms enable row level security;
revoke all on public.glossary_terms from anon, authenticated;
grant select on public.glossary_terms to anon, authenticated;
grant insert, update, delete on public.glossary_terms to authenticated;
create policy glossary_terms_public_read on public.glossary_terms for select to anon, authenticated using (publication_status = 'published');
create policy glossary_terms_admin_select on public.glossary_terms for select to authenticated using ((select private.is_admin()));
create policy glossary_terms_admin_insert on public.glossary_terms for insert to authenticated with check ((select private.is_admin()));
create policy glossary_terms_admin_update on public.glossary_terms for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy glossary_terms_admin_delete on public.glossary_terms for delete to authenticated using ((select private.is_admin()));
create trigger glossary_terms_touch_updated_at before update on public.glossary_terms for each row execute function public.touch_updated_at();
