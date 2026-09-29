import { getSupabase } from "./supabase-client.js";

const specimenSelect = [
  "id", "slug", "provenance", "department_code", "region_id", "dimensions", "weight_grams",
  "description", "history", "discovered_on", "discovery_year", "discovery_month",
  "mineral:minerals!specimens_mineral_id_fkey(name)",
  "specimenRegion:regions!specimens_region_id_fkey(name)",
  "department:departments!specimens_department_code_fkey(name,region:regions!departments_region_id_fkey(name))",
  "locality:localities!specimens_locality_id_fkey(name)",
  "associations:specimen_associations(mineral:minerals(name))",
  "media:specimen_media(bucket_id,storage_path,alt_text,role,position)"
].join(",");

function mapSpecimen(client, row) {
  const photos = (row.media || [])
    .filter(media => media.bucket_id === "site-media-public")
    .sort((a, b) => a.position - b.position)
    .map(media => client.storage.from(media.bucket_id).getPublicUrl(media.storage_path).data.publicUrl);
  const mineral = row.mineral || {};
  return {
    id: row.slug, mineral: row.mineral?.name || "", provenance: row.provenance || "",
    locality: row.locality?.name || "", department: row.department?.name || "", departmentCode: row.department_code || "",
    region: row.specimenRegion?.name || row.department?.region?.name || "", dimensions: row.dimensions || "",
    weight: row.weight_grams == null ? "" : row.weight_grams + " g",
    associations: (row.associations || []).map(item => item.mineral?.name).filter(Boolean),
    description: row.description || "", history: row.history || "",
    discoveryDate: row.discovered_on || (row.discovery_year && row.discovery_month
      ? `${String(row.discovery_month).padStart(2, "0")}/${row.discovery_year}`
      : row.discovery_year || ""), photos,
    scientific: {
      formula: mineral.formula, crystalSystem: mineral.crystal_system, hardness: mineral.hardness,
      density: mineral.density, colors: mineral.colors, luster: mineral.luster,
      cleavage: mineral.cleavage, habit: mineral.habit, formation: mineral.formation
    }
  };
}

export async function listPublishedSpecimens() {
  const client = getSupabase();
  if (!client) throw new Error("La connexion à Supabase n’est pas configurée.");
  const { data, error } = await client.from("specimens").select(specimenSelect)
    .eq("publication_status", "published").order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(row => mapSpecimen(client, row));
}

export async function getPublishedSpecimen(slug) {
  const client = getSupabase();
  if (!client) throw new Error("La connexion à Supabase n’est pas configurée.");
  const { data, error } = await client.from("specimens").select(specimenSelect)
    .eq("slug", slug).eq("publication_status", "published").maybeSingle();
  if (error) throw error;
  return data ? mapSpecimen(client, data) : null;
}
