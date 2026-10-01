-- Archives : description mise en forme avec l'éditeur des articles (alignement, justification, images, liens).
-- La colonne description reste remplie en texte brut (recherche, référencement).
alter table public.archive_documents add column if not exists body jsonb not null default '[]'::jsonb;
update public.archive_documents set body = jsonb_build_array(description)
where body = '[]'::jsonb and coalesce(description, '') <> '';
