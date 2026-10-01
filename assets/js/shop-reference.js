// Référence automatique des produits de la boutique : JM + minéral principal + gisement + numéro.
//   minéral : ses deux premières lettres (Fluorite → FL) ;
//   gisement : ses deux premières lettres s'il n'a qu'un mot (Crozant → CR), sinon la première lettre de chaque mot
//   (La Barre → LB, Chavaniac Lafayette → CL) ; numéro : 1, 2, 3… à la suite des références existantes de même début.
const letters = value => String(value ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();

export function referencePrefix(mineral, mine) {
  const mineralPart = letters(mineral).replace(/[^A-Z]/g, "").slice(0, 2);
  if (!mineralPart) return "";
  const words = letters(mine).split(/[^A-Z0-9]+/).filter(Boolean);
  const minePart = words.length > 1 ? words.map(word => word[0]).join("") : (words[0] || "").slice(0, 2);
  return `JM${mineralPart}${minePart}`;
}

// Prochaine référence libre pour ce début, d'après les références déjà enregistrées.
export function nextReference(prefix, existing) {
  if (!prefix) return "";
  const pattern = new RegExp(`^${prefix}(\\d+)$`, "i");
  const highest = existing.reduce((max, reference) => { const match = pattern.exec(String(reference ?? "").trim()); return match ? Math.max(max, Number(match[1])) : max; }, 0);
  return `${prefix}${highest + 1}`;
}
