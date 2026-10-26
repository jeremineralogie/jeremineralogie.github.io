-- Statistiques d'engagement : temps passé et défilement par page, langue et fuseau horaire, clics de navigation,
-- photos en plein écran, réponses aux jeux, fiches ouvertes après une erreur, liens d'articles, joueurs qui reviennent,
-- séries et badges des comptes, ventes de la boutique.
-- Comme le reste de la mesure : aucune adresse IP, aucun cookie. Les visiteurs déposent seulement des lignes ; seul l'administrateur lit.

-- 1. Nouveaux types d'événements et identifiant de joueur anonyme (aléatoire, gardé sur l'appareil, uniquement pour les jeux).
alter table public.site_events drop constraint if exists site_events_kind_check;
alter table public.site_events add constraint site_events_kind_check
  check (kind in ('start', 'end', 'share', 'click', 'empty_search', 'read', 'engage', 'scroll', 'env', 'answer'));
alter table public.site_events add column if not exists player_id uuid;
create index if not exists site_events_player_idx on public.site_events(player_id) where player_id is not null;

-- 2. Ventes de la boutique : chiffre d'affaires. Table réservée à l'administrateur (les prix de vente ne doivent pas être lisibles publiquement).
create table if not exists public.shop_sales (
  id bigint generated always as identity primary key,
  shop_item_id uuid references public.shop_items(id) on delete set null,
  reference text,
  label text,
  price_cents integer not null check (price_cents >= 0),
  sold_on date not null default current_date,
  created_at timestamptz not null default now()
);
create index if not exists shop_sales_sold_on_idx on public.shop_sales(sold_on desc);
alter table public.shop_sales enable row level security;
revoke all on public.shop_sales from anon, authenticated;
grant select, insert, update, delete on public.shop_sales to authenticated;
drop policy if exists shop_sales_admin_all on public.shop_sales;
create policy shop_sales_admin_all on public.shop_sales for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- 3. Agrégats d'engagement (période choisie).
create or replace function public.admin_engagement_stats(p_from timestamptz, p_to timestamptz)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with e as (
    select * from public.site_events where created_at >= p_from and created_at < p_to
  ),
  players as (
    select player_id, (created_at at time zone 'Europe/Paris')::date as d
    from e where kind = 'end' and player_id is not null group by 1, 2
  )
  select jsonb_build_object(
    'time_pages', (select coalesce(jsonb_agg(jsonb_build_object('page', page, 'n', n, 'avg', avg_s, 'median', med_s) order by n desc), '[]'::jsonb)
                   from (select name as page, count(*) as n, round(avg(value)::numeric, 1) as avg_s,
                                round((percentile_cont(0.5) within group (order by value))::numeric, 1) as med_s
                         from e where kind = 'engage' and name is not null and value is not null group by name) s),
    'scroll_pages', (select coalesce(jsonb_agg(jsonb_build_object('page', page, 'n', n, 'avg', avg_p, 'p50', p50, 'p90', p90) order by n desc), '[]'::jsonb)
                     from (select name as page, count(*) as n, round(avg(value)::numeric, 0) as avg_p,
                                  count(*) filter (where value >= 50) as p50, count(*) filter (where value >= 90) as p90
                           from e where kind = 'scroll' and name is not null and value is not null group by name) s),
    'time_entities', (select coalesce(jsonb_agg(jsonb_build_object('page', page, 'slug', slug, 'n', n, 'avg', avg_s) order by n desc), '[]'::jsonb)
                      from (select name as page, detail as slug, count(*) as n, round(avg(value)::numeric, 1) as avg_s
                            from e where kind = 'engage' and name in ('specimen', 'article', 'piece') and detail is not null and value is not null
                            group by 1, 2 order by 3 desc limit 80) s),
    'scroll_entities', (select coalesce(jsonb_agg(jsonb_build_object('page', page, 'slug', slug, 'n', n, 'avg', avg_p, 'p90', p90) order by n desc), '[]'::jsonb)
                        from (select name as page, detail as slug, count(*) as n, round(avg(value)::numeric, 0) as avg_p, count(*) filter (where value >= 90) as p90
                              from e where kind = 'scroll' and name in ('specimen', 'article', 'piece') and detail is not null and value is not null
                              group by 1, 2 order by 3 desc limit 80) s),
    'langs', (select coalesce(jsonb_agg(jsonb_build_object('lang', lang, 'n', n) order by n desc), '[]'::jsonb)
              from (select lower(left(name, 2)) as lang, count(*) as n from e where kind = 'env' and name is not null group by 1 order by 2 desc limit 20) s),
    'timezones', (select coalesce(jsonb_agg(jsonb_build_object('tz', tz, 'n', n) order by n desc), '[]'::jsonb)
                  from (select detail as tz, count(*) as n from e where kind = 'env' and detail is not null group by 1 order by 2 desc limit 40) s),
    'menu', (select coalesce(jsonb_agg(jsonb_build_object('name', name, 'detail', detail, 'n', n) order by n desc), '[]'::jsonb)
             from (select name, detail, count(*) as n from e where kind = 'click' and name in ('menu', 'fiche-nav', 'fil-ariane') and detail is not null group by 1, 2 order by 3 desc limit 40) s),
    'fullscreen', (select coalesce(jsonb_agg(jsonb_build_object('detail', detail, 'n', n) order by n desc), '[]'::jsonb)
                   from (select detail, count(*) as n from e where kind = 'click' and name = 'plein-ecran' and detail is not null group by 1 order by 2 desc limit 60) s),
    'answers', (select coalesce(jsonb_agg(jsonb_build_object('game', game, 'key', key, 'n', n, 'ok', ok) order by n desc), '[]'::jsonb)
                from (select name as game, detail as key, count(*) as n, count(*) filter (where value >= 1) as ok
                      from e where kind = 'answer' and name is not null and detail is not null group by 1, 2 order by 3 desc limit 600) s),
    'after_error', (select coalesce(jsonb_agg(jsonb_build_object('game', game, 'target', target, 'n', n) order by n desc), '[]'::jsonb)
                    from (select split_part(detail, '|', 1) as game, split_part(detail, '|', 2) as target, count(*) as n
                          from e where kind = 'click' and name = 'fiche-apres-erreur' and detail is not null group by 1, 2 order by 3 desc limit 60) s),
    'after_error_total', (select count(*) from e where kind = 'click' and name = 'fiche-apres-erreur'),
    'errors_total', (select count(*) from e where kind = 'answer' and value < 1),
    'article_links', (select coalesce(jsonb_agg(jsonb_build_object('slug', slug, 'target', target, 'n', n) order by n desc), '[]'::jsonb)
                      from (select split_part(detail, '|', 1) as slug, split_part(detail, '|', 2) as target, count(*) as n
                            from e where kind = 'click' and name = 'lien-article' and detail is not null group by 1, 2 order by 3 desc limit 60) s),
    'replay', jsonb_build_object(
      'players', (select count(distinct player_id) from players),
      'multi_day', (select count(*) from (select player_id from players group by 1 having count(*) >= 2) s),
      'next_day', (select count(distinct p.player_id) from players p where exists (select 1 from players q where q.player_id = p.player_id and q.d = p.d + 1)),
      'single_day', (select count(*) from (select player_id from players group by 1 having count(*) = 1) s))
  );
$$;

-- 4. Séries et badges des comptes joueurs (lecture des progressions : réservée à l'administrateur).
create or replace function public.admin_progress_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare today date := (now() at time zone 'Europe/Paris')::date; result jsonb;
begin
  if not (select private.is_admin()) then raise exception 'Réservé à l''administrateur'; end if;
  with prog as (select user_id, data from public.player_progress),
  keys as (
    select user_id, k from (
      select user_id, jsonb_object_keys(data -> 'mineral') as k from prog where jsonb_typeof(data -> 'mineral') = 'object'
      union all select user_id, jsonb_object_keys(data -> 'quiz') from prog where jsonb_typeof(data -> 'quiz') = 'object'
      union all select user_id, jsonb_object_keys(data -> 'geo') from prog where jsonb_typeof(data -> 'geo') = 'object') x
    where k ~ '^\d{4}-\d{2}-\d{2}$'
  ),
  days as (select distinct user_id, k::date as d from keys),
  runs as (select user_id, d, d - (row_number() over (partition by user_id order by d))::int as grp from days),
  streaks as (select user_id, count(*) as len, max(d) as last_d from runs group by user_id, grp),
  best as (select user_id, max(len) as best, coalesce(max(len) filter (where last_d >= today - 1), 0) as current from streaks group by user_id),
  badges as (select badge, count(*) as n from prog, lateral jsonb_object_keys(case when jsonb_typeof(data -> 'badges') = 'object' then data -> 'badges' else '{}'::jsonb end) as badge group by 1),
  per_user as (select user_id, (select count(*) from jsonb_object_keys(case when jsonb_typeof(data -> 'badges') = 'object' then data -> 'badges' else '{}'::jsonb end)) as nb from prog)
  select jsonb_build_object(
    'accounts', (select count(*) from prog),
    'with_days', (select count(*) from best),
    'best_streak', (select coalesce(max(best), 0) from best),
    'avg_best', (select round(coalesce(avg(best), 0)::numeric, 1) from best),
    'running', (select count(*) from best where current >= 1),
    'streak_buckets', (select coalesce(jsonb_agg(jsonb_build_object('label', label, 'n', n) order by ord), '[]'::jsonb)
                       from (select case when best = 1 then '1 jour' when best <= 3 then '2 à 3 jours' when best <= 6 then '4 à 6 jours' when best <= 13 then '7 à 13 jours' else '14 jours et plus' end as label,
                                    min(best) as ord, count(*) as n from best group by 1) s),
    'badges', (select coalesce(jsonb_agg(jsonb_build_object('id', badge, 'n', n) order by n desc), '[]'::jsonb) from badges),
    'avg_badges', (select round(coalesce(avg(nb), 0)::numeric, 1) from per_user)
  ) into result;
  return result;
end;
$$;

revoke all on function public.admin_engagement_stats(timestamptz, timestamptz) from public, anon;
revoke all on function public.admin_progress_stats() from public, anon;
grant execute on function public.admin_engagement_stats(timestamptz, timestamptz) to authenticated;
grant execute on function public.admin_progress_stats() to authenticated;
