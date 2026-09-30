-- Mesure d'audience maison : une ligne par page vue, sans cookie ni donnée personnelle (pas d'adresse IP).
-- Les visiteurs peuvent seulement déposer une ligne ; seul l'administrateur lit, agrège et purge.
create table public.page_views (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  visit_id uuid not null,
  page text not null check (char_length(page) between 1 and 60),
  path text not null default '' check (char_length(path) <= 300),
  entity_type text check (entity_type in ('specimen', 'piece', 'mineral', 'mine', 'locality', 'article', 'archive', 'departement')),
  entity_slug text check (char_length(entity_slug) <= 200),
  search_query text check (char_length(search_query) <= 200),
  referrer_host text check (char_length(referrer_host) <= 200),
  source text check (char_length(source) <= 60),
  device text check (device in ('mobile', 'tablette', 'ordinateur')),
  is_entry boolean not null default false
);

create index page_views_created_idx on public.page_views(created_at desc);
create index page_views_entity_idx on public.page_views(entity_type, entity_slug) where entity_slug is not null;

alter table public.page_views enable row level security;
revoke all on public.page_views from anon, authenticated;
grant insert on public.page_views to anon, authenticated;
grant select, delete on public.page_views to authenticated;

create policy page_views_public_insert on public.page_views for insert to anon, authenticated
  with check (created_at between now() - interval '5 minutes' and now() + interval '5 minutes');
create policy page_views_admin_select on public.page_views for select to authenticated using ((select private.is_admin()));
create policy page_views_admin_delete on public.page_views for delete to authenticated using ((select private.is_admin()));

-- Agrégats du tableau de bord (exécutés avec les droits de l'appelant : seul l'administrateur voit des lignes).
create or replace function public.admin_page_stats(p_from timestamptz, p_to timestamptz, p_bucket text default 'day')
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with v as (
    select * from public.page_views where created_at >= p_from and created_at < p_to
  )
  select jsonb_build_object(
    'totals', (select jsonb_build_object('views', count(*), 'visits', count(distinct visit_id)) from v),
    'series', (select coalesce(jsonb_agg(jsonb_build_object('t', t, 'views', views, 'visits', visits) order by t), '[]'::jsonb)
               from (select date_trunc(case when p_bucket in ('day', 'week', 'month') then p_bucket else 'day' end, created_at at time zone 'Europe/Paris') as t,
                            count(*) as views, count(distinct visit_id) as visits
                     from v group by 1) s),
    'pages', (select coalesce(jsonb_agg(jsonb_build_object('page', page, 'views', views, 'visits', visits) order by views desc), '[]'::jsonb)
              from (select page, count(*) as views, count(distinct visit_id) as visits from v group by page) s),
    'entities', (select coalesce(jsonb_agg(jsonb_build_object('type', entity_type, 'slug', entity_slug, 'views', views, 'visits', visits) order by views desc), '[]'::jsonb)
                 from (select entity_type, entity_slug, count(*) as views, count(distinct visit_id) as visits
                       from v where entity_slug is not null and entity_slug <> '' group by 1, 2 order by 3 desc limit 300) s),
    'sources', (select coalesce(jsonb_agg(jsonb_build_object('source', source, 'visits', visits) order by visits desc), '[]'::jsonb)
                from (select coalesce(source, 'Accès direct') as source, count(distinct visit_id) as visits from v where is_entry group by 1) s),
    'referrers', (select coalesce(jsonb_agg(jsonb_build_object('host', referrer_host, 'visits', visits) order by visits desc), '[]'::jsonb)
                  from (select referrer_host, count(distinct visit_id) as visits from v where is_entry and referrer_host is not null group by 1 order by 2 desc limit 30) s),
    'devices', (select coalesce(jsonb_agg(jsonb_build_object('device', device, 'visits', visits) order by visits desc), '[]'::jsonb)
                from (select coalesce(device, 'ordinateur') as device, count(distinct visit_id) as visits from v where is_entry group by 1) s),
    'searches', (select coalesce(jsonb_agg(jsonb_build_object('query', query, 'count', n) order by n desc), '[]'::jsonb)
                 from (select lower(btrim(search_query)) as query, count(*) as n from v
                       where search_query is not null and btrim(search_query) <> '' group by 1 order by 2 desc limit 50) s)
  );
$$;

revoke all on function public.admin_page_stats(timestamptz, timestamptz, text) from public, anon;
grant execute on function public.admin_page_stats(timestamptz, timestamptz, text) to authenticated;
