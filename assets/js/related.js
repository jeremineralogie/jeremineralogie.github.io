// Maillage entre les fiches : minéraux similaires, autres minéraux d'un même gisement.
import { similarMinerals } from "./related-score.js";
import { ficheUrl } from "./entity-links.js";

const FIELDS = "name,slug,rarity,chemical_class,crystal_system,hardness,colors,mineral_group,is_group";

// Minéraux similaires à celui dont on donne le slug (jusqu'à 6, triés par ressemblance puis par popularité).
export async function loadSimilar(client, mineralSlug, known) {
  if (!client || !mineralSlug) return [];
  try {
    const mineral = known?.chemical_class ? known : (await client.from("minerals").select(FIELDS).eq("slug", mineralSlug).eq("publication_status", "published").maybeSingle()).data;
    if (!mineral?.chemical_class) return [];
    const { data, error } = await client.from("minerals").select(FIELDS).eq("chemical_class", mineral.chemical_class).eq("publication_status", "published");
    if (error) throw error;
    return similarMinerals(mineral, data || []);
  } catch (error) { console.error("Minéraux similaires :", error); return []; }
}

// Autres minéraux présents dans le même gisement (spécimens de la collection et pièces de la boutique).
export async function loadOthersOfMine(client, mineSlug, excludeMineralSlug) {
  if (!client || !mineSlug) return [];
  try {
    const [specimens, pieces] = await Promise.all([
      client.from("specimens").select("mineral:minerals!specimens_mineral_id_fkey(name,slug),mine:mines!specimens_mine_id_fkey!inner(slug)").eq("mine.slug", mineSlug).eq("publication_status", "published"),
      client.from("shop_items").select("mineral:minerals!shop_items_mineral_id_fkey(name,slug),mine:mines!shop_items_mine_id_fkey!inner(slug)").eq("mine.slug", mineSlug).eq("publication_status", "published")
    ]);
    const all = [...(specimens.data || []), ...(pieces.data || [])].map(row => row.mineral).filter(mineral => mineral?.slug && mineral.slug !== excludeMineralSlug);
    return [...new Map(all.map(mineral => [mineral.slug, mineral])).values()].sort((a, b) => a.name.localeCompare(b.name, "fr"));
  } catch (error) { console.error("Autres minéraux du gisement :", error); return []; }
}

// Bloc « titre + liste de liens » pour les pages pièce et spécimen.
export function relatedBlock(title, minerals) {
  if (!minerals.length) return null;
  const box = document.createElement("div"); box.className = "content related-block";
  const heading = document.createElement("h2"); heading.textContent = title;
  const list = document.createElement("ul"); list.className = "fiche-list";
  minerals.forEach(mineral => { const item = document.createElement("li"); const link = document.createElement("a"); link.className = "link"; link.href = ficheUrl("mineral", mineral.slug); link.textContent = mineral.name; item.append(link); list.append(item); });
  box.append(heading, list);
  return box;
}
