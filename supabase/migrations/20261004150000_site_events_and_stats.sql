-- Statistiques détaillées : événements d'usage (jeux, quiz, partages, clics utiles, lectures, recherches vides) + agrégats du tableau de bord.
-- Comme page_views : aucune donnée personnelle, les visiteurs déposent seulement une ligne, seul l'administrateur lit et purge.

create table if not exists public.site_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  visit_id uuid not null,
  kind text not null check (kind in ('start', 'end', 'share', 'click', 'empty_search', 'read')),
  name text check (char_length(name) <= 60),
  detail text check (char_length(detail) <= 200),
  value numeric
);

create index if not exists site_events_created_idx on public.site_events(created_at desc);
create index if not exists site_events_kind_idx on public.site_events(kind, name);

alter table public.site_events enable row level security;
revoke all on public.site_events from anon, authenticated;
grant insert on public.site_events to anon, authenticated;
grant select, delete on public.site_events to authenticated;

drop policy if exists site_events_public_insert on public.site_events;
drop policy if exists site_events_admin_select on public.site_events;
drop policy if exists site_events_admin_delete on public.site_events;
create policy site_events_public_insert on public.site_events for insert to anon, authenticated
  with check (created_at between now() - interval '5 minutes' and now() + interval '5 minutes');
create policy site_events_admin_select on public.site_events for select to authenticated using ((select private.is_admin()));
create policy site_events_admin_delete on public.site_events for delete to authenticated using ((select private.is_admin()));

-- Fréquentation détaillée : jour par jour, jours de la semaine, heures, pages d'entrée et de sortie, visites d'une seule page, liens cassés, recherches vides.
create or replace function public.admin_more_stats(p_from timestamptz, p_to timestamptz)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with v as (
    select * from public.page_views where created_at >= p_from and created_at < p_to
  ),
  visit as (
    select visit_id, count(*) as views,
           (array_agg(coalesce(source, 'Accès direct') order by created_at) filter (where is_entry))[1] as source,
           (array_agg(page order by created_at desc))[1] as last_page
    from v group by visit_id
  ),
  e as (
    select * from public.site_events where created_at >= p_from and created_at < p_to
  )
  select jsonb_build_object(
    'daily', (select coalesce(jsonb_agg(jsonb_build_object('d', d, 'views', views, 'visits', visits, 'page', top_page, 'source', top_source) order by d desc), '[]'::jsonb)
              from (select d, views, visits,
                           (select v2.page from v v2 where (v2.created_at at time zone 'Europe/Paris')::date = x.d group by v2.page order by count(*) desc limit 1) as top_page,
                           (select coalesce(v3.source, 'Accès direct') from v v3 where v3.is_entry and (v3.created_at at time zone 'Europe/Paris')::date = x.d group by 1 order by count(*) desc limit 1) as top_source
                    from (select (created_at at time zone 'Europe/Paris')::date as d, count(*) as views, count(distinct visit_id) as visits from v group by 1) x) y),
    'weekdays', (select coalesce(jsonb_agg(jsonb_build_object('dow', dow, 'views', views, 'visits', visits) order by dow), '[]'::jsonb)
                 from (select extract(isodow from created_at at time zone 'Europe/Paris')::int as dow, count(*) as views, count(distinct visit_id) as visits from v group by 1) s),
    'hours', (select coalesce(jsonb_agg(jsonb_build_object('h', h, 'views', views, 'visits', visits) order by h), '[]'::jsonb)
              from (select extract(hour from created_at at time zone 'Europe/Paris')::int as h, count(*) as views, count(distinct visit_id) as visits from v group by 1) s),
    'entries', (select coalesce(jsonb_agg(jsonb_build_object('page', page, 'type', entity_type, 'slug', entity_slug, 'visits', visits) order by visits desc), '[]'::jsonb)
                from (select page, entity_type, entity_slug, count(distinct visit_id) as visits from v where is_entry group by 1, 2, 3 order by 4 desc limit 25) s),
    'exits', (select coalesce(jsonb_agg(jsonb_build_object('page', last_page, 'visits', visits) order by visits desc), '[]'::jsonb)
              from (select last_page, count(*) as visits from visit group by 1 order by 2 desc limit 15) s),
    'bounce', jsonb_build_object(
      'visits', (select count(*) from visit), 'single', (select count(*) from visit where views = 1),
      'sources', (select coalesce(jsonb_agg(jsonb_build_object('source', source, 'visits', visits, 'single', single) order by visits desc), '[]'::jsonb)
                  from (select coalesce(source, 'Accès direct') as source, count(*) as visits, count(*) filter (where views = 1) as single from visit group by 1) s)),
    'broken', (select coalesce(jsonb_agg(jsonb_build_object('path', path, 'n', n) order by n desc), '[]'::jsonb)
               from (select path, count(*) as n from v where page = 'introuvable' group by 1 order by 2 desc limit 30) s),
    'empty_searches', (select coalesce(jsonb_agg(jsonb_build_object('query', query, 'n', n) order by n desc), '[]'::jsonb)
                       from (select lower(btrim(detail)) as query, count(*) as n from e where kind = 'empty_search' and btrim(coalesce(detail, '')) <> '' group by 1 order by 2 desc limit 30) s)
  );
$$;

-- Jeux, quiz, partages, clics utiles, lectures jusqu'au bout.
create or replace function public.admin_event_stats(p_from timestamptz, p_to timestamptz)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with e as (
    select * from public.site_events where created_at >= p_from and created_at < p_to
  )
  select jsonb_build_object(
    'games', (select coalesce(jsonb_agg(jsonb_build_object('name', name, 'starts', starts, 'ends', ends, 'avg', avg, 'players', players) order by ends desc, starts desc), '[]'::jsonb)
              from (select name, count(*) filter (where kind = 'start') as starts, count(*) filter (where kind = 'end') as ends,
                           round((avg(value) filter (where kind = 'end' and value is not null))::numeric, 2) as avg, count(distinct visit_id) as players
                    from e where kind in ('start', 'end') and name is not null group by name) g),
    'results', (select coalesce(jsonb_agg(jsonb_build_object('name', name, 'detail', detail, 'n', n) order by n desc), '[]'::jsonb)
                from (select name, detail, count(*) as n from e where kind = 'end' and detail is not null group by 1, 2 order by 3 desc limit 60) s),
    'shares', (select coalesce(jsonb_agg(jsonb_build_object('name', name, 'n', n) order by n desc), '[]'::jsonb)
               from (select name, count(*) as n from e where kind = 'share' and name is not null group by 1) s),
    'clicks', (select coalesce(jsonb_agg(jsonb_build_object('name', name, 'detail', detail, 'n', n) order by n desc), '[]'::jsonb)
               from (select name, detail, count(*) as n from e where kind = 'click' and name is not null group by 1, 2 order by 3 desc limit 40) s),
    'reads', (select coalesce(jsonb_agg(jsonb_build_object('slug', detail, 'n', n) order by n desc), '[]'::jsonb)
              from (select detail, count(*) as n from e where kind = 'read' and detail is not null group by 1 order by 2 desc limit 20) s),
    'daily', (select coalesce(jsonb_agg(jsonb_build_object('d', d, 'starts', starts, 'ends', ends) order by d desc), '[]'::jsonb)
              from (select (created_at at time zone 'Europe/Paris')::date as d, count(*) filter (where kind = 'start') as starts, count(*) filter (where kind = 'end') as ends
                    from e where kind in ('start', 'end') group by 1) s)
  );
$$;

-- Comptes joueurs (lecture de auth.users : réservée à l'administrateur).
create or replace function public.admin_account_stats(p_from timestamptz, p_to timestamptz)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  if not (select private.is_admin()) then raise exception 'Réservé à l''administrateur'; end if;
  return jsonb_build_object(
    'total', (select count(*) from auth.users),
    'identifiant', (select count(*) from auth.users where email like '%@joueurs.jeremineralogie.fr'),
    'google', (select count(distinct user_id) from auth.identities where provider = 'google'),
    'new_in_period', (select count(*) from auth.users where created_at >= p_from and created_at < p_to),
    'active_7', (select count(*) from public.player_progress where updated_at >= now() - interval '7 days'),
    'active_30', (select count(*) from public.player_progress where updated_at >= now() - interval '30 days'),
    'with_progress', (select count(*) from public.player_progress),
    'daily', (select coalesce(jsonb_agg(jsonb_build_object('d', d, 'n', n) order by d desc), '[]'::jsonb)
              from (select (created_at at time zone 'Europe/Paris')::date as d, count(*) as n from auth.users where created_at >= p_from and created_at < p_to group by 1) s)
  );
end;
$$;

revoke all on function public.admin_more_stats(timestamptz, timestamptz) from public, anon;
revoke all on function public.admin_event_stats(timestamptz, timestamptz) from public, anon;
revoke all on function public.admin_account_stats(timestamptz, timestamptz) from public, anon;
grant execute on function public.admin_more_stats(timestamptz, timestamptz) to authenticated;
grant execute on function public.admin_event_stats(timestamptz, timestamptz) to authenticated;
grant execute on function public.admin_account_stats(timestamptz, timestamptz) to authenticated;
