alter table public.specimens
  add column country text,
  add column site_type text,
  add column keywords text,
  add constraint specimens_site_type_check
    check (
      site_type is null
      or site_type in (
        'mine',
        'carriere',
        'alluvion',
        'affleurement',
        'travaux_publics',
        'tranchee',
        'autre'
      )
    );
