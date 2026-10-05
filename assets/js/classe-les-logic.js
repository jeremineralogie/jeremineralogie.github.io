// Logique de « Classe-les ! » (sans affichage) : choix du critère, tirage de cinq minéraux bien distincts, correction.
import { EASY_RARITIES, rarityOf } from "./rarity.js";

const fr = value => Number(value).toLocaleString("fr-FR", { maximumFractionDigits: 2 });
// Critères : clé, intitulé du classement, unité, lecture d'une fourchette [bas, haut] et écart minimal entre deux voisins selon la manche.
export const CRITERIA = {
  durete: { label: "du plus tendre au plus dur", labelDesc: "du plus dur au plus tendre", unit: "sur l’échelle de Mohs", lo: row => Number(row.hardness), hi: row => Number(row.hardness_max ?? row.hardness), gap: round => round < 3 ? 1.5 : round < 7 ? 1 : 0.7 },
  densite: { label: "du moins dense au plus dense", labelDesc: "du plus dense au moins dense", unit: "g/cm³", lo: row => Number(row.density), hi: row => Number(row.density_max ?? row.density), gap: round => round < 3 ? 1 : round < 7 ? 0.6 : 0.4 }
};
export const COUNT = 5;

export const isUsable = (row, key) => row.name && !row.is_group && Number.isFinite(CRITERIA[key].lo(row)) && (row.hardness != null || key !== "durete") && (row.density != null || key !== "densite");
export function prepare(rows, key) {
  const c = CRITERIA[key];
  return (rows || []).filter(row => isUsable(row, key)).map(row => { const lo = c.lo(row), hi = c.hi(row); return { ...row, lo, hi, mid: (lo + hi) / 2 }; });
}
export const valueText = item => item.hi !== item.lo ? `${fr(item.lo)} à ${fr(item.hi)}` : fr(item.lo);

// Tire un défi : { key, desc, items (dans le bon ordre), shuffled }. Les fourchettes ne se chevauchent pas et deux voisins sont séparés d'au moins l'écart de la manche.
// Renvoie null si aucun tirage n'est possible.
export function makeChallenge(rows, round, used = new Set(), random = Math.random) {
  const order = ["durete", "densite"].sort(() => random() - 0.5);
  for (const key of order) {
    const c = CRITERIA[key], gap = c.gap(round);
    const all = prepare(rows, key).filter(item => !used.has(item.slug));
    const easy = all.filter(item => EASY_RARITIES.has(rarityOf(item)));
    for (let attempt = 0; attempt < 60; attempt += 1) {
      const pool = round < 3 && easy.length >= 8 ? easy : all;
      if (pool.length < COUNT) break;
      const sorted = [];
      const candidates = [...pool].sort(() => random() - 0.5);
      for (const item of candidates) {
        if (sorted.every(other => (item.lo > other.hi || item.hi < other.lo) && Math.abs(item.mid - other.mid) >= gap)) sorted.push(item);
        if (sorted.length === COUNT) break;
      }
      if (sorted.length < COUNT) continue;
      const items = sorted.sort((a, b) => a.mid - b.mid);
      const desc = random() < 0.5;
      const ordered = desc ? [...items].reverse() : items;
      let shuffled = [...ordered]; for (let i = 0; i < 20 && shuffled.every((item, index) => item === ordered[index]); i += 1) shuffled = [...ordered].sort(() => random() - 0.5);
      return { key, desc, items: ordered, shuffled };
    }
  }
  return null;
}
export const titleOf = challenge => `Classe ces minéraux ${challenge.desc ? CRITERIA[challenge.key].labelDesc : CRITERIA[challenge.key].label}`;
// Correction : tableau de booléens (la carte à cette position est à la bonne place) et réussite complète.
export const check = (challenge, current) => { const marks = current.map((item, index) => item === challenge.items[index]); return { marks, perfect: marks.every(Boolean) }; };
