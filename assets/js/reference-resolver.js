// Résolution des textes libres du formulaire spécimen vers les référentiels
// (départements, régions, minéraux, localités). Ne crée jamais de donnée : renvoie null si rien ne correspond.
export const normalizeName = value => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .replace(/[’`]/g, "'").toLowerCase().replace(/[\s-]+/g, " ").trim();

async function rows(client, table, columns) {
  const { data, error } = await client.from(table).select(columns);
  if (error) throw error;
  return data || [];
}

export function matchDepartment(departments, text) {
  const raw = String(text ?? "").trim();
  if (!raw) return null;
  const codeMatch = /^(?:.*\()?\s*(2[AB]|\d{2,3})\s*\)?$/i.exec(raw);
  if (codeMatch) {
    const code = codeMatch[1].toUpperCase();
    const byCode = departments.find(department => department.code.toUpperCase() === code);
    if (byCode) return byCode;
  }
  const name = normalizeName(raw.replace(/\s*\([^)]*\)\s*$/, ""));
  return departments.find(department => normalizeName(department.name) === name) || null;
}

function uniqueByName(list, text) {
  const wanted = normalizeName(text);
  if (!wanted) return null;
  const found = list.filter(item => normalizeName(item.name) === wanted);
  return found.length === 1 ? found[0] : null;
}

export async function resolveReferences(client, values) {
  const [departments, regions, minerals, localities] = await Promise.all([
    rows(client, "departments", "code,name,region_id"),
    rows(client, "regions", "id,name"),
    rows(client, "minerals", "id,name"),
    rows(client, "localities", "id,name,department_code")
  ]);
  const department = matchDepartment(departments, values.department);
  const localityPool = department ? localities.filter(item => item.department_code === department.code) : localities;
  return {
    department,
    regionId: uniqueByName(regions, values.region)?.id ?? null,
    mineralId: uniqueByName(minerals, values.mineral)?.id ?? null,
    localityId: (uniqueByName(localityPool, values.locality) || uniqueByName(localities, values.locality))?.id ?? null
  };
}
