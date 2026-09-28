create schema if not exists private;

create or replace function private.is_admin()
returns boolean language sql stable set search_path = ''
as $$ select coalesce((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false); $$;
revoke all on function private.is_admin() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;

create or replace function public.is_admin()
returns boolean language sql stable set search_path = ''
as $$ select private.is_admin(); $$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = ''
as $$ begin new.updated_at = now(); return new; end; $$;
revoke all on function public.touch_updated_at() from public, anon, authenticated;

create table public.regions (
 id uuid primary key default gen_random_uuid(), name text not null unique, slug text not null unique,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.departments (
 code text primary key, name text not null, region_id uuid references public.regions(id) on delete set null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.localities (
 id uuid primary key default gen_random_uuid(), department_code text references public.departments(code) on delete set null,
 name text not null, slug text not null unique, notes text not null default '',
 publication_status text not null default 'draft' check (publication_status in ('draft','published')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.mines (
 id uuid primary key default gen_random_uuid(), locality_id uuid references public.localities(id) on delete set null,
 name text not null, slug text not null unique, description text not null default '',
 publication_status text not null default 'draft' check (publication_status in ('draft','published')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.minerals (
 id uuid primary key default gen_random_uuid(), name text not null unique, slug text not null unique,
 formula text, crystal_system text, hardness numeric(4,2), density numeric(6,3), colors text[] not null default '{}',
 luster text, cleavage text, habit text, formation text,
 publication_status text not null default 'draft' check (publication_status in ('draft','published')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.specimens (
 id uuid primary key default gen_random_uuid(), slug text not null unique,
 mineral_id uuid not null references public.minerals(id) on delete restrict,
 provenance text not null default '', locality_id uuid references public.localities(id) on delete set null,
 department_code text references public.departments(code) on delete set null,
 dimensions text not null default '', weight_grams numeric(10,3), description text not null default '',
 history text not null default '', discovered_on date, discovery_year smallint check (discovery_year is null or discovery_year between 1000 and 2100),
 publication_status text not null default 'draft' check (publication_status in ('draft','published')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check (discovered_on is null or discovery_year is null)
);
create table public.specimen_associations (
 specimen_id uuid not null references public.specimens(id) on delete cascade,
 mineral_id uuid not null references public.minerals(id) on delete restrict, primary key (specimen_id,mineral_id)
);
create table public.specimen_media (
 id uuid primary key default gen_random_uuid(), specimen_id uuid not null references public.specimens(id) on delete cascade,
 bucket_id text not null default 'site-media-public', storage_path text not null,
 role text not null default 'general', alt_text text not null default '', position integer not null default 0,
 created_at timestamptz not null default now(), unique(bucket_id,storage_path)
);
create table public.shop_items (
 id uuid primary key default gen_random_uuid(), reference text not null unique, slug text not null unique,
 title text not null, mineral_id uuid references public.minerals(id) on delete set null,
 provenance text not null default '', locality_id uuid references public.localities(id) on delete set null,
 department_code text references public.departments(code) on delete set null,
 dimensions text not null default '', weight_grams numeric(10,3), description text not null default '',
 price_cents integer not null check(price_cents >= 0), currency char(3) not null default 'EUR',
 sale_status text not null default 'available' check(sale_status in ('available','sold','hidden')),
 publication_status text not null default 'draft' check(publication_status in ('draft','published')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.shop_item_media (
 id uuid primary key default gen_random_uuid(), shop_item_id uuid not null references public.shop_items(id) on delete cascade,
 bucket_id text not null default 'site-media-public', storage_path text not null, alt_text text not null default '',
 position integer not null default 0, unique(bucket_id,storage_path)
);
create table public.articles (
 id uuid primary key default gen_random_uuid(), slug text not null unique, title text not null,
 category text not null check(category in ('mineralogie','geologie','cristallographie','mines-histoire','decouvertes','identification','collection','pedagogie')),
 excerpt text not null default '', body jsonb not null default '[]'::jsonb, published_on date,
 publication_status text not null default 'draft' check(publication_status in ('draft','published')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.article_media (
 id uuid primary key default gen_random_uuid(), article_id uuid not null references public.articles(id) on delete cascade,
 bucket_id text not null default 'site-media-public', storage_path text not null,
 alt_text text not null default '', caption text not null default '', position integer not null default 0,
 unique(bucket_id,storage_path)
);
create table public.article_specimens (
 article_id uuid not null references public.articles(id) on delete cascade,
 specimen_id uuid not null references public.specimens(id) on delete cascade,
 primary key(article_id,specimen_id)
);
create table public.article_mines (
 article_id uuid not null references public.articles(id) on delete cascade,
 mine_id uuid not null references public.mines(id) on delete cascade,
 primary key(article_id,mine_id)
);
create table public.article_localities (
 article_id uuid not null references public.articles(id) on delete cascade,
 locality_id uuid not null references public.localities(id) on delete cascade,
 primary key(article_id,locality_id)
);
create table public.article_minerals (
 article_id uuid not null references public.articles(id) on delete cascade,
 mineral_id uuid not null references public.minerals(id) on delete cascade,
 primary key(article_id,mineral_id)
);
create table public.archive_documents (
 id uuid primary key default gen_random_uuid(), slug text not null unique, title text not null,
 category text not null check(category in ('mine-gisement','archive-historique','plan-carte','histoire-exploitation','publication-scientifique','catalogue','bibliographie','photographie-ancienne')),
 description text not null default '', document_date date, rights_note text not null default '',
 bucket_id text not null default 'admin-staging', storage_path text,
 publication_status text not null default 'draft' check(publication_status in ('draft','published')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.archive_specimens (archive_id uuid references public.archive_documents(id) on delete cascade, specimen_id uuid references public.specimens(id) on delete cascade, primary key(archive_id,specimen_id));
create table public.archive_articles (archive_id uuid references public.archive_documents(id) on delete cascade, article_id uuid references public.articles(id) on delete cascade, primary key(archive_id,article_id));
create table public.archive_mines (archive_id uuid references public.archive_documents(id) on delete cascade, mine_id uuid references public.mines(id) on delete cascade, primary key(archive_id,mine_id));
create table public.archive_localities (archive_id uuid references public.archive_documents(id) on delete cascade, locality_id uuid references public.localities(id) on delete cascade, primary key(archive_id,locality_id));
create table public.archive_minerals (archive_id uuid references public.archive_documents(id) on delete cascade, mineral_id uuid references public.minerals(id) on delete cascade, primary key(archive_id,mineral_id));
create table public.mineral_occurrences (
 id uuid primary key default gen_random_uuid(),
 mineral_id uuid not null references public.minerals(id) on delete cascade,
 department_code text not null references public.departments(code) on delete cascade,
 locality_id uuid references public.localities(id) on delete set null,
 source_note text not null default ''
);
create unique index mineral_occurrences_unique_with_locality
 on public.mineral_occurrences(mineral_id,department_code,locality_id) where locality_id is not null;
create unique index mineral_occurrences_unique_without_locality
 on public.mineral_occurrences(mineral_id,department_code) where locality_id is null;
create table public.site_settings (
 key text primary key, value jsonb not null default '{}'::jsonb, is_public boolean not null default false,
 updated_at timestamptz not null default now()
);

create index specimens_publication_idx on public.specimens(publication_status);
create index shop_items_publication_idx on public.shop_items(publication_status,sale_status);
create index articles_publication_idx on public.articles(publication_status,published_on desc);
create index archives_publication_idx on public.archive_documents(publication_status);
create index localities_department_idx on public.localities(department_code);

do $$
declare t text;
begin
  foreach t in array array['regions','departments','localities','mines','minerals','specimens','specimen_associations','specimen_media','shop_items','shop_item_media','articles','article_media','article_specimens','article_mines','article_localities','article_minerals','archive_documents','archive_specimens','archive_articles','archive_mines','archive_localities','archive_minerals','mineral_occurrences','site_settings'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from anon, authenticated',t);
  execute format('grant select on public.%I to anon, authenticated',t);
  execute format('grant insert,update,delete on public.%I to authenticated',t);
  execute format('create policy %I on public.%I for select to authenticated using ((select private.is_admin()))',t||'_admin_select',t);
  execute format('create policy %I on public.%I for insert to authenticated with check ((select private.is_admin()))',t||'_admin_insert',t);
  execute format('create policy %I on public.%I for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()))',t||'_admin_update',t);
  execute format('create policy %I on public.%I for delete to authenticated using ((select private.is_admin()))',t||'_admin_delete',t);
 end loop;
end $$;

create policy regions_public_read on public.regions for select to anon,authenticated using(true);
create policy departments_public_read on public.departments for select to anon,authenticated using(true);
create policy localities_public_read on public.localities for select to anon,authenticated using(publication_status='published');
create policy mines_public_read on public.mines for select to anon,authenticated using(publication_status='published');
create policy minerals_public_read on public.minerals for select to anon,authenticated using(publication_status='published');
create policy specimens_public_read on public.specimens for select to anon,authenticated using(publication_status='published');
create policy specimen_associations_public_read on public.specimen_associations for select to anon,authenticated using(exists(select 1 from public.specimens s where s.id=specimen_id and s.publication_status='published'));
create policy specimen_media_public_read on public.specimen_media for select to anon,authenticated using(bucket_id='site-media-public' and exists(select 1 from public.specimens s where s.id=specimen_id and s.publication_status='published'));
create policy shop_items_public_read on public.shop_items for select to anon,authenticated using(publication_status='published' and sale_status='available');
create policy shop_item_media_public_read on public.shop_item_media for select to anon,authenticated using(bucket_id='site-media-public' and exists(select 1 from public.shop_items p where p.id=shop_item_id and p.publication_status='published' and p.sale_status='available'));
create policy articles_public_read on public.articles for select to anon,authenticated using(publication_status='published');
create policy article_media_public_read on public.article_media for select to anon,authenticated using(bucket_id='site-media-public' and exists(select 1 from public.articles a where a.id=article_id and a.publication_status='published'));
create policy article_specimens_public_read on public.article_specimens for select to anon,authenticated using(exists(select 1 from public.articles a where a.id=article_id and a.publication_status='published'));
create policy article_mines_public_read on public.article_mines for select to anon,authenticated using(exists(select 1 from public.articles a where a.id=article_id and a.publication_status='published'));
create policy article_localities_public_read on public.article_localities for select to anon,authenticated using(exists(select 1 from public.articles a where a.id=article_id and a.publication_status='published'));
create policy article_minerals_public_read on public.article_minerals for select to anon,authenticated using(exists(select 1 from public.articles a where a.id=article_id and a.publication_status='published'));
create policy archives_public_read on public.archive_documents for select to anon,authenticated using(publication_status='published' and bucket_id='site-media-public');
create policy archive_specimens_public_read on public.archive_specimens for select to anon,authenticated using(exists(select 1 from public.archive_documents d where d.id=archive_id and d.publication_status='published'));
create policy archive_articles_public_read on public.archive_articles for select to anon,authenticated using(exists(select 1 from public.archive_documents d where d.id=archive_id and d.publication_status='published'));
create policy archive_mines_public_read on public.archive_mines for select to anon,authenticated using(exists(select 1 from public.archive_documents d where d.id=archive_id and d.publication_status='published'));
create policy archive_localities_public_read on public.archive_localities for select to anon,authenticated using(exists(select 1 from public.archive_documents d where d.id=archive_id and d.publication_status='published'));
create policy archive_minerals_public_read on public.archive_minerals for select to anon,authenticated using(exists(select 1 from public.archive_documents d where d.id=archive_id and d.publication_status='published'));
create policy mineral_occurrences_public_read on public.mineral_occurrences for select to anon,authenticated using(exists(select 1 from public.minerals m where m.id=mineral_id and m.publication_status='published'));
create policy site_settings_public_read on public.site_settings for select to anon,authenticated using(is_public=true);

do $$
declare t text;
begin
 foreach t in array array['regions','departments','localities','mines','minerals','specimens','shop_items','articles','archive_documents','site_settings'] loop
  execute format('create trigger %I before update on public.%I for each row execute function public.touch_updated_at()',t||'_touch_updated_at',t);
 end loop;
end $$;

-- Create buckets through the Storage UI/SDK; do not write to storage schema tables.
create policy content_media_admin_insert on storage.objects for insert to authenticated with check(bucket_id in ('site-media-public','admin-staging') and (select private.is_admin()));
create policy content_media_admin_update on storage.objects for update to authenticated using(bucket_id in ('site-media-public','admin-staging') and (select private.is_admin())) with check(bucket_id in ('site-media-public','admin-staging') and (select private.is_admin()));
create policy content_media_admin_delete on storage.objects for delete to authenticated using(bucket_id in ('site-media-public','admin-staging') and (select private.is_admin()));
create policy admin_staging_admin_read on storage.objects for select to authenticated using(bucket_id='admin-staging' and (select private.is_admin()));
