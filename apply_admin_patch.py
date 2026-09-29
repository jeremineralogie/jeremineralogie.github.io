#!/usr/bin/env python3
"""Applique les modifications de assets/js/admin.js (échoue sans rien écrire si un ancrage n'est pas unique)."""
import sys
path = sys.argv[1] if len(sys.argv) > 1 else "assets/js/admin.js"
s = open(path, encoding="utf-8").read()
edits = [
 ('import { getSupabase } from "./supabase-client.js";\n',
  'import { getSupabase } from "./supabase-client.js";\nimport { resolveReferences } from "./reference-resolver.js";\n'),
 ('  let slug = "";\n  let saved;\n',
  '  let slug = "";\n  let saved;\n  let unresolvedDepartment = false;\n'),
 ('    if (isUpdate) {\n      const result = await client.from("specimens").update(record)',
  '    const resolved = await resolveReferences(client, values);\n'
  '    record.mineral_id = record.mineral_id ?? resolved.mineralId;\n'
  '    record.region_id = record.region_id ?? resolved.regionId;\n'
  '    record.locality_id = record.locality_id ?? resolved.localityId;\n'
  '    if (resolved.department) { record.department_code = resolved.department.code; record.department_name = resolved.department.name; }\n'
  '    else if (values.department.trim() && !record.department_code) unresolvedDepartment = true;\n'
  '    if (isUpdate) {\n      const result = await client.from("specimens").update(record)'),
 ('  const secondaryErrors = [];\n  if (id && editingSpecimen?.publication_status',
  '  const secondaryErrors = [];\n'
  '  if (unresolvedDepartment) secondaryErrors.push("Département non reconnu dans le référentiel : la fiche est enregistrée, mais sans lien vers la page département (saisissez le nom exact ou le code, ex. « Puy-de-Dôme » ou « 63 »).");\n'
  '  if (id && editingSpecimen?.publication_status'),
]
for old, new in edits:
    if s.count(old) != 1:
        sys.exit(f"Ancrage introuvable ou non unique ({s.count(old)}): {old[:60]!r}")
    s = s.replace(old, new)
open(path, "w", encoding="utf-8").write(s)
print("admin.js modifié")
