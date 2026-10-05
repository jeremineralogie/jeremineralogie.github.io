// Logique de « Plus dur ou moins dur ? » (sans affichage) : choix des paires et difficulté.
import { EASY_RARITIES, rarityOf } from "./rarity.js";

const fr = value => Number(value).toLocaleString("fr-FR", { maximumFractionDigits: 2 });

// Écart minimal de dureté entre les deux minéraux, selon le numéro de la manche (0 = première).
export const gapFor = round => round < 4 ? 3 : round < 8 ? 2 : round < 13 ? 1.5 : 1;
// Les 4 premières manches n'utilisent que des minéraux très connus.
export const poolFor = (pool, round) => { const easy = pool.filter(item => EASY_RARITIES.has(rarityOf(item))); return round < 4 && easy.length >= 8 ? easy : pool; };

// Minéraux jouables : une dureté renseignée, pas un groupe, nom présent. (lo, hi) = fourchette de dureté, mid = milieu.
export function prepare(rows) {
  return (rows || []).filter(row => row.name && !row.is_group && row.hardness != null && Number.isFinite(Number(row.hardness)))
    .map(row => { const lo = Number(row.hardness), hi = Number(row.hardness_max ?? row.hardness); return { ...row, lo, hi, mid: (lo + hi) / 2 }; });
}

// Tire une paire { hard, soft } pour la manche donnée : aucune fourchette qui se chevauche, écart suffisant, jamais un minéral déjà vu.
// Renvoie null si aucune paire n'existe.
export function makePair(allPool, round, used = new Set(), random = Math.random) {
  const pool = poolFor(allPool, round).filter(item => !used.has(item.slug));
  const gap = gapFor(round);
  const first = pool[Math.floor(random() * pool.length)];
  const tries = [...pool].sort(() => random() - 0.5);
  for (const a of [first, ...tries].filter(Boolean)) {
    const partners = poolFor(allPool, round).filter(b => b.slug !== a.slug && !used.has(b.slug) && (b.lo > a.hi || b.hi < a.lo) && Math.abs(b.mid - a.mid) >= gap);
    // Le partenaire le plus proche de l'écart voulu : la difficulté suit la manche.
    const close = partners.filter(b => Math.abs(b.mid - a.mid) < gap + 1.5);
    const chosen = (close.length ? close : partners)[Math.floor(random() * (close.length ? close.length : partners.length))];
    if (chosen) return a.mid > chosen.mid ? { hard: a, soft: chosen } : { hard: chosen, soft: a };
  }
  return null;
}

export const durete = item => item.hi !== item.lo ? `${fr(item.lo)} à ${fr(item.hi)}` : fr(item.lo);

