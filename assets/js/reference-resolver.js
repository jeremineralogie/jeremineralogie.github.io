// Référentiels : comparaison de noms, départements, valeurs communes et création automatique de fiches.
export const normalizeName = value => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .replace(/[’`]/g, "'").toLowerCase().replace(/[\s-]+/g, " ").trim();

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

// ---------------------------------------------------------------------------
// Valeurs communes : « Autre », types de gisement, catégories, création automatique de fiches.
// ---------------------------------------------------------------------------
export const OTHER = "__other__";

export const slugify = value => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Types de site prévus par le cahier des charges ; toute autre valeur saisie est conservée telle quelle.
export const SITE_TYPES = [
  ["mine", "Mine"], ["tranchee", "Tranchée"], ["carriere", "Carrière"],
  ["alluvion", "Alluvion"], ["affleurement", "Affleurement"], ["travaux_publics", "Travaux publics"]
];
export const siteTypeLabel = value => SITE_TYPES.find(([key]) => key === value)?.[1] ?? value ?? "";

export const CATEGORY_LABELS = {
  mineralogie: "Minéralogie", geologie: "Géologie", cristallographie: "Cristallographie", "mines-histoire": "Mines & histoire",
  decouvertes: "Découvertes", identification: "Identification", collection: "Collection", pedagogie: "Pédagogie",
  "mine-gisement": "Mine / gisement", "archive-historique": "Archive historique", "plan-carte": "Plan / carte",
  "histoire-exploitation": "Histoire de l’exploitation", "publication-scientifique": "Publication scientifique",
  catalogue: "Catalogue", bibliographie: "Bibliographie", "photographie-ancienne": "Photographie ancienne", autre: "Autre"
};
export const categoryLabel = value => CATEGORY_LABELS[value] ?? value ?? "";

const CREATE_DEFAULTS = {
  minerals: { colors: [], publication_status: "published" },
  mines: { description: "", publication_status: "published" },
  localities: { notes: "", publication_status: "published" },
  regions: {}
};

// Retrouve une fiche par son nom (sans tenir compte de la casse, des accents ni des tirets) ou la crée.
// Renvoie { id, name, created } ou null si le nom est vide. Ne crée jamais de département.
// Département : retrouvé par nom ou numéro ; sinon créé (provinces et départements étrangers) avec un code tiré du nom.
export const isFrenchDepartmentCode = code => /^(2[AB]|\d{2,3})$/i.test(String(code ?? "").trim());
export async function ensureDepartment(client, name, regionId = null) {
  const clean = String(name ?? "").replace(/\s+/g, " ").trim();
  if (!clean) return null;
  const { data, error } = await client.from("departments").select("code,name,region_id");
  if (error) throw error;
  const found = matchDepartment(data || [], clean) || (data || []).find(row => normalizeName(row.code) === normalizeName(clean));
  if (found) return { code: found.code, name: found.name, created: false };
  const codes = new Set((data || []).map(row => row.code));
  const base = slugify(clean) || `departement-${crypto.randomUUID().slice(0, 8)}`;
  let code = base; let suffix = 2;
  while (codes.has(code)) code = `${base}-${suffix++}`;
  const { data: row, error: insertError } = await client.from("departments").insert({ code, name: clean, region_id: regionId || null }).select("code,name").single();
  if (insertError) throw insertError;
  return { code: row.code, name: row.name, created: true };
}

export async function ensureNamed(client, table, name, extra = {}) {
  const clean = String(name ?? "").replace(/\s+/g, " ").trim();
  if (!clean || !(table in CREATE_DEFAULTS)) return null;
  const columns = table === "localities" ? "id,name,slug,department_code" : "id,name,slug";
  const { data, error } = await client.from(table).select(columns);
  if (error) throw error;
  const wanted = normalizeName(clean);
  const same = (data || []).filter(row => normalizeName(row.name) === wanted);
  const found = (extra.department_code && same.find(row => row.department_code === extra.department_code)) || same[0];
  if (found) return { id: found.id, name: found.name, created: false };
  const slugs = new Set((data || []).map(row => row.slug));
  const base = slugify(clean) || `${table}-${crypto.randomUUID()}`;
  let slug = base; let suffix = 2;
  while (slugs.has(slug)) slug = `${base}-${suffix++}`;
  const { data: row, error: insertError } = await client.from(table)
    .insert({ name: clean, slug, ...CREATE_DEFAULTS[table], ...extra }).select("id,name").single();
  if (insertError) throw insertError;
  return { id: row.id, name: row.name, created: true };
}
