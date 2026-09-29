-- Rattache aux départements du référentiel les spécimens dont le nom de département
-- a été saisi en texte libre sans code (idempotent ; ne touche pas aux codes déjà présents).
update public.specimens s set department_code = d.code
from public.departments d
where s.department_code is null and s.department_name is not null
  and lower(regexp_replace(trim(s.department_name),'\s+',' ','g')) = lower(d.name);
