alter table public.specimens
  add column discovery_month smallint,
  add constraint specimens_discovery_month_range_check
    check (discovery_month is null or discovery_month between 1 and 12),
  add constraint specimens_discovery_month_requires_year_check
    check (discovery_month is null or discovery_year is not null);
