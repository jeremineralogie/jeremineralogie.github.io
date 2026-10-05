-- Messages et demandes d'identification rattachés au compte du joueur (facultatif) : le joueur retrouve son historique dans « Mon espace ».
-- Un visiteur sans compte peut toujours écrire (user_id vide). Un joueur connecté ne peut rattacher un message qu'à son propre compte et ne lit que ses propres messages.
alter table public.messages add column if not exists user_id uuid references auth.users(id) on delete set null;
create index if not exists messages_user_idx on public.messages(user_id, created_at desc) where user_id is not null;

drop policy if exists messages_public_insert on public.messages;
create policy messages_public_insert on public.messages for insert to anon, authenticated
  with check (status = 'nouveau' and (user_id is null or user_id = (select auth.uid())));

drop policy if exists messages_own_select on public.messages;
create policy messages_own_select on public.messages for select to authenticated
  using (user_id = (select auth.uid()));
