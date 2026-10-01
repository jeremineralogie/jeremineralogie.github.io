// Coordonnées des communes françaises via l'API officielle geo.api.gouv.fr (centre de la commune).
const API = "https://geo.api.gouv.fr/communes";
export const foldCommune = value => String(value ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
  .replace(/\b(st|ste)\b\.?/g, match => match.startsWith("ste") ? "sainte" : "saint").replace(/[^a-z0-9]+/g, "");

export async function searchCommunes(name, departmentCode) {
  const params = new URLSearchParams({ nom: String(name || "").trim(), fields: "nom,code,codesPostaux,centre,codeDepartement", boost: "population", limit: "15" });
  if (departmentCode) params.set("codeDepartement", departmentCode);
  if (!params.get("nom")) return [];
  const response = await fetch(`${API}?${params}`);
  if (!response.ok) throw new Error(`Service des communes indisponible (${response.status}).`);
  const rows = await response.json();
  return (rows || []).filter(row => row.centre?.coordinates).map(row => ({
    name: row.nom, insee: row.code, postalCodes: row.codesPostaux || [], department: row.codeDepartement,
    longitude: row.centre.coordinates[0], latitude: row.centre.coordinates[1]
  }));
}

// Variantes d'écriture : apostrophe typographique, espaces au lieu de tirets, « St » pour « Saint »…
function spellings(name) {
  const base = String(name || "").trim().replace(/[’‘`´]/g, "'").replace(/\s+/g, " ");
  const hyphen = base.replace(/\s*-\s*/g, "-").replace(/ /g, "-");
  const saint = hyphen.replace(/^St(e?)[-.]/i, (match, e) => e ? "Sainte-" : "Saint-");
  return [...new Set([base, hyphen, saint, saint.replace(/'/g, " ")])];
}

export async function findCommune(name, departmentCode) {
  const wanted = foldCommune(name);
  const seen = new Map();
  for (const department of departmentCode ? [departmentCode, ""] : [""]) {
    for (const spelling of spellings(name)) {
      (await searchCommunes(spelling, department)).filter(row => foldCommune(row.name) === wanted).forEach(row => seen.set(row.insee, row));
      if (seen.size) return [...seen.values()];
    }
  }
  return [];
}

// Département d'une commune saisie à la main (si le nom ne désigne qu'un seul département).
export async function departmentOfCommune(name) {
  if (!String(name || "").trim()) return null;
  try {
    const matches = await findCommune(name);
    const codes = [...new Set(matches.map(row => row.department))];
    return codes.length === 1 ? codes[0] : null;
  } catch { return null; }
}

export const communeLabel = row => `${row.name} — ${row.postalCodes[0] || row.insee} (${row.department})`;

export function communeUpdate(match, knownDepartment) {
  return {
    latitude: match.latitude, longitude: match.longitude, insee_code: match.insee, postal_code: match.postalCodes[0] || null,
    ...(knownDepartment ? {} : { department_code: match.department })
  };
}

// Complète les communes enregistrées sans coordonnées. Les homonymes (plusieurs communes du même nom) sont laissés à choisir à la main.
export async function backfillLocalities(client) {
  const { data, error } = await client.from("localities").select("id,name,department_code").is("latitude", null);
  if (error) throw error;
  const summary = { located: [], ambiguous: [], notFound: [] };
  for (const row of data || []) {
    try {
      const matches = await findCommune(row.name, row.department_code);
      if (matches.length === 1) {
        const { error: updateError } = await client.from("localities").update(communeUpdate(matches[0], row.department_code)).eq("id", row.id);
        if (updateError) throw updateError;
        summary.located.push(row.name);
      } else if (matches.length > 1) summary.ambiguous.push(row.name);
      else summary.notFound.push(row.name);
    } catch (problem) {
      console.error(`Localisation de la commune « ${row.name} » :`, problem);
    }
  }
  return summary;
}
