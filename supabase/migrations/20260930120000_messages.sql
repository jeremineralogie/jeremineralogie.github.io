-- Messages envoyés depuis les formulaires publics (Contact, Identification).
-- Les visiteurs peuvent seulement déposer une demande ; seul l'administrateur peut la lire.
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('contact', 'identification')),
  name text not null check (char_length(btrim(name)) between 1 and 200),
  email text not null check (char_length(email) between 3 and 320 and email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  subject text not null default '' check (char_length(subject) <= 200),
  reference text not null default '' check (char_length(reference) <= 100),
  details jsonb not null default '{}'::jsonb check (jsonb_typeof(details) = 'object' and pg_column_size(details) < 8000),
  body text not null default '' check (char_length(body) <= 10000),
  photo_paths text[] not null default '{}' check (cardinality(photo_paths) <= 10),
  status text not null default 'nouveau' check (status in ('nouveau', 'traite')),
  created_at timestamptz not null default now()
);

create index messages_created_idx on public.messages(created_at desc);

alter table public.messages enable row level security;
revoke all on public.messages from anon, authenticated;
grant insert on public.messages to anon, authenticated;
grant select, update, delete on public.messages to authenticated;

create policy messages_public_insert on public.messages for insert to anon, authenticated
  with check (status = 'nouveau');
create policy messages_admin_select on public.messages for select to authenticated using ((select private.is_admin()));
create policy messages_admin_update on public.messages for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy messages_admin_delete on public.messages for delete to authenticated using ((select private.is_admin()));

-- Photos d'identification : dépôt public limité au dossier messages/ du bucket privé admin-staging.
create policy messages_photo_upload on storage.objects for insert to anon, authenticated
  with check (
    bucket_id = 'admin-staging'
    and (storage.foldername(name))[1] = 'messages'
    and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
  );
