-- Articles : départements et régions liés (comme les minéraux, gisements et communes liés).
create table public.article_departments (
  article_id uuid not null references public.articles(id) on delete cascade,
  department_code text not null references public.departments(code) on delete cascade,
  primary key (article_id, department_code)
);
create table public.article_regions (
  article_id uuid not null references public.articles(id) on delete cascade,
  region_id uuid not null references public.regions(id) on delete cascade,
  primary key (article_id, region_id)
);

do $$
declare t text;
begin
  foreach t in array array['article_departments', 'article_regions'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('grant insert, update, delete on public.%I to authenticated', t);
    execute format('create policy %I on public.%I for select to anon, authenticated using (exists (select 1 from public.articles a where a.id = article_id and a.publication_status = ''published''))', t || '_public_read', t);
    execute format('create policy %I on public.%I for select to authenticated using ((select private.is_admin()))', t || '_admin_select', t);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select private.is_admin()))', t || '_admin_insert', t);
    execute format('create policy %I on public.%I for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()))', t || '_admin_update', t);
    execute format('create policy %I on public.%I for delete to authenticated using ((select private.is_admin()))', t || '_admin_delete', t);
  end loop;
end $$;
