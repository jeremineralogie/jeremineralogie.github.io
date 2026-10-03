// Rareté des minéraux (colonne minerals.rarity) : sert à doser la difficulté des jeux.
//   « Trouve le minéral » (facile) : très commun + commun ; quiz du jour (intermédiaire) : très commun + commun + rare.
// Une fiche sans rareté renseignée compte comme « rare ».
export const RARITIES = [["tres_commun", "Très commun"], ["commun", "Commun"], ["rare", "Rare"], ["tres_rare", "Très rare"]];
export const rarityOf = mineral => mineral?.rarity || "rare";
export const EASY_RARITIES = new Set(["tres_commun", "commun"]);
export const QUIZ_RARITIES = new Set(["tres_commun", "commun", "rare"]);
// Filtre une liste de minéraux sur les raretés admises ; si la sélection devient trop petite (base pas encore classée), on garde tout.
export function byRarity(minerals, allowed, minimum = 12) {
  const kept = minerals.filter(item => allowed.has(rarityOf(item)));
  return kept.length >= minimum ? kept : minerals;
}

// Groupes (familles) : la valeur de minerals.mineral_group est l'identifiant (slug) de la fiche parente du groupe.
export const MINERAL_GROUPS = ["quartz", "calcedoine", "opale", "feldspath", "mica", "grenat", "tourmaline", "beryl", "corindon", "pyroxene", "amphibole", "zeolite", "olivine", "topaze", "chrysoberyl", "serpentine", "talc", "gypse", "zoisite", "calcite", "azurite", "uraninite", "sphalerite", "hematite", "apatite"];
