insert into public.departments(code,name) values('63','Puy-de-Dôme')
on conflict(code) do update set name=excluded.name;
insert into public.minerals(name,slug,publication_status) values
('Fluorite','fluorite','published'),('Quartz','quartz','published')
on conflict(slug) do update set publication_status=excluded.publication_status;
insert into public.specimens(slug,mineral_id,provenance,department_code,description,discovery_year,publication_status)
select 'fluorite-mine-de-la-barre-2018',m.id,'mine de la Barre','63','découverte en 2018.',2018,'published'
from public.minerals m where m.slug='fluorite'
on conflict(slug) do update set mineral_id=excluded.mineral_id,provenance=excluded.provenance,
department_code=excluded.department_code,description=excluded.description,discovery_year=excluded.discovery_year,
publication_status=excluded.publication_status;
insert into public.specimen_associations(specimen_id,mineral_id)
select s.id,m.id from public.specimens s cross join public.minerals m
where s.slug='fluorite-mine-de-la-barre-2018' and m.slug='quartz' on conflict do nothing;
insert into public.specimen_media(specimen_id,bucket_id,storage_path,role,alt_text,position)
select s.id,'site-media-public','collection/fluorite-mine-de-la-barre-2018.jpeg','general','Fluorite de la mine de la Barre',0
from public.specimens s where s.slug='fluorite-mine-de-la-barre-2018' on conflict(bucket_id,storage_path) do nothing;
