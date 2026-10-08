import { getSupabase } from "./supabase-client.js";
import { thumbPathOf } from "./image-variants.js";

const specimenSelect = [
  "id", "slug", "provenance", "department_code", "region_id", "dimensions", "weight_grams",
  "description", "history", "discovered_on", "discovery_year", "discovery_month",
  "mineral_name", "country", "region_name", "department_name", "locality_name", "site_type",
  "weight_text", "keywords", "discovery_date_text",
  "mineral:minerals!specimens_mineral_id_fkey(name,slug,formula,crystal_system,hardness,density,colors,luster,cleavage,habit,formation)",
  "mine:mines!specimens_mine_id_fkey(name,slug)",
  "specimenRegion:regions!specimens_region_id_fkey(name)",
  "department:departments!specimens_department_code_fkey(name,region:regions!departments_region_id_fkey(name))",
  "locality:localities!specimens_locality_id_fkey(name,slug)",
  "associations:specimen_associations(mineral:minerals(name))",
  "media:specimen_media(bucket_id,storage_path,alt_text,role,position)"
].join(",");

function mapSpecimen(client, row) {
  const media = (row.media || []).filter(item => item.bucket_id === "site-media-public").sort((a, b) => a.position - b.position);
  const urlOf = (item, path) => client.storage.from(item.bucket_id).getPublicUrl(path).data.publicUrl;
  const photos = media.map(item => urlOf(item, item.storage_path));
  // Vignettes pour les listes (la photo elle-même tant qu'elle n'a pas été allégée).
  const thumbs = media.map(item => urlOf(item, thumbPathOf(item.storage_path) || item.storage_path));
  const mineral = row.mineral || {};
  return {
    mineralSlug: mineral.slug || "", mineSlug: row.mine?.slug || "", localitySlug: row.locality?.slug || "",
    id: row.slug, mineral: row.mineral_name ?? mineral.name ?? "", country: row.country ?? "",
    provenance: row.provenance ?? "", locality: row.locality_name ?? row.locality?.name ?? "",
    department: row.department_name ?? row.department?.name ?? "", departmentCode: row.department_code || "",
    region: row.region_name ?? row.specimenRegion?.name ?? row.department?.region?.name ?? "",
    siteType: row.site_type ?? "", dimensions: row.dimensions ?? "",
    weight: row.weight_text ?? (row.weight_grams == null ? "" : `${row.weight_grams} g`),
    keywords: row.keywords ?? "",
    associations: (row.associations || []).map(item => item.mineral?.name).filter(Boolean),
    description: row.description || "", history: row.history || "",
    discoveryDate: row.discovery_date_text ?? (row.discovered_on || (row.discovery_year && row.discovery_month
      ? `${String(row.discovery_month).padStart(2, "0")}/${row.discovery_year}`
      : row.discovery_year || "")), photos, thumbs,
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
