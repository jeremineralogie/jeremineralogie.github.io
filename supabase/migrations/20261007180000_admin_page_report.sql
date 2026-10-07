-- Statistiques détaillées par page (admin) : pour chaque rubrique du site (et pour le site entier), tout ce que la mesure permet de dire.
-- Chiffres : pages vues, visiteurs, arrivées, sorties, visites d'une seule page, pages par visiteur, durée estimée.
-- Répartitions : par jour, par heure, par jour de la semaine, appareils, provenance, page précédente et page suivante, fiches les plus vues, recherches.
-- Comme les autres agrégats : exécuté avec les droits de l'appelant, seul l'administrateur voit des lignes.
create or replace function public.admin_page_report(p_from timestamptz, p_to timestamptz)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with v as (
    select pv.*,
           case
             when page = 'index' then 'accueil'
             when page in ('boutique', 'piece') then 'boutique'
             when page in ('collection', 'specimen') then 'collection'
             when page in ('articles', 'article') then 'articles'
             when page in ('archives', 'document') then 'archives'
             when page = 'carte' then 'carte'
             when page in ('apprendre', 'fiche', 'departement', 'theme') then 'apprendre'
             when page = 'identification' then 'identification'
             when page = 'jeux' then 'jeux'
             else 'autres'
           end as grp
    from public.page_views pv
    where created_at >= p_from and created_at < p_to
  ),
  r as (
    select v.*,
           lag(page) over w as prev_page, lead(page) over w as next_page,
           count(*) over (partition by visit_id) as visit_views
    from v
    window w as (partition by visit_id order by created_at, id)
  ),
  visit as (
    select visit_id, count(*) as views,
           extract(epoch from (max(created_at) - min(created_at))) as seconds,
           coalesce((array_agg(source) filter (where is_entry))[1], 'Accès direct') as src
    from v group by visit_id
  ),
  groups(g) as (values ('all'), ('accueil'), ('boutique'), ('collection'), ('articles'), ('archives'), ('carte'), ('apprendre'), ('identification'), ('jeux'), ('autres'))
  select jsonb_object_agg(g, obj) from (
    select gx.g, jsonb_build_object(
      'views', (select count(*) from r where gx.g = 'all' or r.grp = gx.g),
      'visits', (select count(distinct visit_id) from r where gx.g = 'all' or r.grp = gx.g),
      'entries', (select count(distinct visit_id) from r where (gx.g = 'all' or r.grp = gx.g) and is_entry),
      'exits', (select count(*) from r where (gx.g = 'all' or r.grp = gx.g) and next_page is null),
      'single', (select count(*) from r where (gx.g = 'all' or r.grp = gx.g) and is_entry and next_page is null),
      'avg_views', (select round(avg(vv.views)::numeric, 2) from visit vv where vv.visit_id in (select visit_id from r where gx.g = 'all' or r.grp = gx.g)),
      'avg_seconds', (select round(avg(vv.seconds)::numeric, 0) from visit vv where vv.views > 1 and vv.visit_id in (select visit_id from r where gx.g = 'all' or r.grp = gx.g)),
      'daily', (select coalesce(jsonb_agg(jsonb_build_object('d', d, 'views', views, 'visits', visits) order by d), '[]'::jsonb)
                from (select (created_at at time zone 'Europe/Paris')::date as d, count(*) as views, count(distinct visit_id) as visits from r where gx.g = 'all' or r.grp = gx.g group by 1) x),
      'hours', (select coalesce(jsonb_agg(jsonb_build_object('h', h, 'views', views, 'visits', visits) order by h), '[]'::jsonb)
                from (select extract(hour from created_at at time zone 'Europe/Paris')::int as h, count(*) as views, count(distinct visit_id) as visits from r where gx.g = 'all' or r.grp = gx.g group by 1) x),
      'weekdays', (select coalesce(jsonb_agg(jsonb_build_object('dow', dow, 'views', views, 'visits', visits) order by dow), '[]'::jsonb)
                   from (select extract(isodow from created_at at time zone 'Europe/Paris')::int as dow, count(*) as views, count(distinct visit_id) as visits from r where gx.g = 'all' or r.grp = gx.g group by 1) x),
      'devices', (select coalesce(jsonb_agg(jsonb_build_object('device', device, 'visits', visits) order by visits desc), '[]'::jsonb)
                  from (select coalesce(device, 'ordinateur') as device, count(distinct visit_id) as visits from r where gx.g = 'all' or r.grp = gx.g group by 1) x),
      'sources', (select coalesce(jsonb_agg(jsonb_build_object('source', src, 'visits', visits) order by visits desc), '[]'::jsonb)
                  from (select vv.src, count(*) as visits from visit vv where vv.visit_id in (select visit_id from r where gx.g = 'all' or r.grp = gx.g) group by 1) x),
      'referrers', (select coalesce(jsonb_agg(jsonb_build_object('host', host, 'visits', visits) order by visits desc), '[]'::jsonb)
                    from (select referrer_host as host, count(distinct visit_id) as visits from r where (gx.g = 'all' or r.grp = gx.g) and is_entry and referrer_host is not null group by 1 order by 2 desc limit 20) x),
      'previous', (select coalesce(jsonb_agg(jsonb_build_object('page', page, 'n', n) order by n desc), '[]'::jsonb)
                   from (select coalesce(prev_page, '(arrivée sur le site)') as page, count(*) as n from r where (gx.g = 'all' or r.grp = gx.g) and gx.g <> 'all' group by 1 order by 2 desc limit 12) x),
      'next', (select coalesce(jsonb_agg(jsonb_build_object('page', page, 'n', n) order by n desc), '[]'::jsonb)
               from (select coalesce(next_page, '(sortie du site)') as page, count(*) as n from r where (gx.g = 'all' or r.grp = gx.g) and gx.g <> 'all' group by 1 order by 2 desc limit 12) x),
      'pages', (select coalesce(jsonb_agg(jsonb_build_object('page', page, 'views', views, 'visits', visits, 'entries', entries, 'exits', exits) order by views desc), '[]'::jsonb)
                from (select page, count(*) as views, count(distinct visit_id) as visits, count(*) filter (where is_entry) as entries, count(*) filter (where next_page is null) as exits
                      from r where gx.g = 'all' or r.grp = gx.g group by 1) x),
      'entities', (select coalesce(jsonb_agg(jsonb_build_object('type', entity_type, 'slug', entity_slug, 'views', views, 'visits', visits) order by views desc), '[]'::jsonb)
                   from (select entity_type, entity_slug, count(*) as views, count(distinct visit_id) as visits from r
                         where (gx.g = 'all' or r.grp = gx.g) and entity_slug is not null and entity_slug <> '' group by 1, 2 order by 3 desc limit 60) x),
      'searches', (select coalesce(jsonb_agg(jsonb_build_object('query', q, 'n', n) order by n desc), '[]'::jsonb)
                   from (select lower(btrim(search_query)) as q, count(*) as n from r where (gx.g = 'all' or r.grp = gx.g) and search_query is not null and btrim(search_query) <> '' group by 1 order by 2 desc limit 40) x),
      'broken', (select coalesce(jsonb_agg(jsonb_build_object('path', path, 'n', n) order by n desc), '[]'::jsonb)
                 from (select path, count(*) as n from r where page = 'introuvable' and (gx.g = 'all' or r.grp = gx.g) group by 1 order by 2 desc limit 30) x),
      'heat', case when gx.g = 'all' then (select coalesce(jsonb_agg(jsonb_build_object('dow', dow, 'h', h, 'views', n)), '[]'::jsonb)
                from (select extract(isodow from created_at at time zone 'Europe/Paris')::int as dow, extract(hour from created_at at time zone 'Europe/Paris')::int as h, count(*) as n from r group by 1, 2) x) else '[]'::jsonb end
    ) as obj
    from groups gx
  ) s;
$$;

revoke all on function public.admin_page_report(timestamptz, timestamptz) from public, anon;
grant execute on function public.admin_page_report(timestamptz, timestamptz) to authenticated;
