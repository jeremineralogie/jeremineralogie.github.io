-- Statistiques par rubrique (admin) : pages vues par jour pour chaque rubrique, termes du glossaire consultés, joueurs distincts.
-- Même principe que les autres agrégats : exécutés avec les droits de l'appelant, seul l'administrateur voit des lignes.
create or replace function public.admin_section_stats(p_from timestamptz, p_to timestamptz)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with v as (
    select * from public.page_views where created_at >= p_from and created_at < p_to
  ),
  s as (
    select v.*,
           case
             when page in ('boutique', 'piece') then 'boutique'
             when page in ('collection', 'specimen') or (page = 'fiche' and entity_type = 'mineral') then 'collection'
             when page in ('articles', 'article') then 'articles'
             when page in ('archives', 'document') then 'archives'
             when page in ('apprendre', 'identification') then 'outils'
             when page = 'jeux' then 'jeux'
           end as section
    from v
  ),
  t as (
    select split_part(path, '/', 3) as slug, visit_id from v where path ~ '^/glossaire/[^/]+/?$'
  )
  select jsonb_build_object(
    'daily', (select coalesce(jsonb_agg(jsonb_build_object('t', d, 's', section, 'views', views) order by d), '[]'::jsonb)
              from (select (created_at at time zone 'Europe/Paris')::date as d, section, count(*) as views
                    from s where section is not null group by 1, 2) x),
    'terms', (select coalesce(jsonb_agg(jsonb_build_object('slug', slug, 'views', views, 'visits', visits) order by views desc), '[]'::jsonb)
              from (select slug, count(*) as views, count(distinct visit_id) as visits from t group by 1 order by 2 desc limit 30) x),
    'terms_total', (select count(*) from t),
    'players', (select count(distinct visit_id) from public.site_events
                where created_at >= p_from and created_at < p_to and kind in ('start', 'end') and name is not null)
  );
$$;

revoke all on function public.admin_section_stats(timestamptz, timestamptz) from public, anon;
grant execute on function public.admin_section_stats(timestamptz, timestamptz) to authenticated;
