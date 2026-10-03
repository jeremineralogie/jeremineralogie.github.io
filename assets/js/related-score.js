// Minéraux similaires : même famille chimique, puis même système cristallin, couleurs communes et dureté proche.
// Les minéraux de la même famille (groupe) sont déjà listés à part. Fonction partagée avec le générateur de pages (tools/seo/build.mjs).
const RANK = { tres_commun: 0, commun: 1, rare: 2, tres_rare: 3 };
const rank = mineral => RANK[mineral.rarity] ?? RANK.rare;

export function similarMinerals(mineral, all, limit = 6) {
  if (!mineral?.chemical_class) return [];
  const colors = new Set((mineral.colors || []).map(color => String(color).toLowerCase()));
  const hardness = mineral.hardness == null ? null : Number(mineral.hardness);
  const scored = all
    .filter(other => other.slug !== mineral.slug && !other.is_group && other.chemical_class === mineral.chemical_class
      && !(mineral.mineral_group && other.mineral_group === mineral.mineral_group))
    .map(other => {
      let score = 0;
      if (mineral.crystal_system && other.crystal_system === mineral.crystal_system) score += 2;
      if ((other.colors || []).some(color => colors.has(String(color).toLowerCase()))) score += 1;
      if (hardness != null && other.hardness != null && Math.abs(Number(other.hardness) - hardness) <= 1) score += 1;
      return { other, score };
    });
  return scored.sort((a, b) => b.score - a.score || rank(a.other) - rank(b.other) || String(a.other.name).localeCompare(String(b.other.name), "fr"))
    .slice(0, limit).map(entry => entry.other);
}
