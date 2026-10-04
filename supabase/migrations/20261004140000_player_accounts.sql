-- Comptes joueurs : progression des jeux enregistrée sur le serveur (identifiant + mot de passe, ou Google).
-- Les identifiants sont convertis en adresses fictives « identifiant@joueurs.jeremineralogie.fr » (aucun e-mail réel, aucun envoi).
-- Pré-requis dans Authentication : inscriptions activées, « Confirm email » désactivé.
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.player_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.player_progress enable row level security;
create policy player_progress_select_own on public.player_progress for select to authenticated using (user_id = (select auth.uid()));
create policy player_progress_insert_own on public.player_progress for insert to authenticated with check (user_id = (select auth.uid()));
create policy player_progress_update_own on public.player_progress for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select, insert, update on public.player_progress to authenticated;

-- Codes de secours : jamais lisibles depuis le site (aucune politique) ; seules les fonctions ci-dessous y touchent.
create table if not exists public.player_recovery (
  user_id uuid primary key references auth.users(id) on delete cascade,
  code_hash text not null,
  failed_attempts int not null default 0,
  locked_until timestamptz
);
alter table public.player_recovery enable row level security;

create or replace function public.set_recovery_code(p_code text)
returns void language plpgsql security definer set search_path = public, extensions, auth as $$
begin
  if auth.uid() is null then raise exception 'non connecté'; end if;
  if length(coalesce(p_code, '')) < 10 then raise exception 'code trop court'; end if;
  insert into public.player_recovery(user_id, code_hash) values (auth.uid(), crypt(upper(p_code), gen_salt('bf')))
  on conflict (user_id) do update set code_hash = excluded.code_hash, failed_attempts = 0, locked_until = null;
end $$;
revoke all on function public.set_recovery_code(text) from public, anon;
grant execute on function public.set_recovery_code(text) to authenticated;

create or replace function public.reset_password_with_code(p_username text, p_code text, p_new_password text)
returns boolean language plpgsql security definer set search_path = public, extensions, auth as $$
declare uid uuid; rec public.player_recovery;
begin
  if length(coalesce(p_new_password, '')) < 8 then raise exception 'mot de passe trop court'; end if;
  select id into uid from auth.users where email = lower(p_username) || '@joueurs.jeremineralogie.fr';
  if uid is null then perform pg_sleep(1); return false; end if;
  select * into rec from public.player_recovery where user_id = uid;
  if rec.user_id is null then perform pg_sleep(1); return false; end if;
  if rec.locked_until is not null and rec.locked_until > now() then raise exception 'trop d''essais, réessayez plus tard'; end if;
  if rec.code_hash = crypt(upper(p_code), rec.code_hash) then
    update auth.users set encrypted_password = crypt(p_new_password, gen_salt('bf')), updated_at = now() where id = uid;
    delete from auth.refresh_tokens where user_id = uid::text;
    update public.player_recovery set failed_attempts = 0, locked_until = null where user_id = uid;
    return true;
  end if;
  update public.player_recovery set failed_attempts = failed_attempts + 1,
    locked_until = case when failed_attempts + 1 >= 5 then now() + interval '30 minutes' else null end
    where user_id = uid;
  perform pg_sleep(1);
  return false;
end $$;
revoke all on function public.reset_password_with_code(text, text, text) from public;
grant execute on function public.reset_password_with_code(text, text, text) to anon, authenticated;
