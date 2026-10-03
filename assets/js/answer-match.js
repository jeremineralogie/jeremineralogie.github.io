// Réponses des jeux : tolérance sur la famille et sur l'orthographe.
//  - le nom exact, un synonyme ou le nom de la famille (« quartz » pour un quartz fumé) sont de bonnes réponses ;
//  - une seule lettre fausse, en trop, en moins ou deux lettres inversées est tolérée (noms d'au moins 5 lettres) ;
//  - le nom d'un autre minéral n'est jamais accepté, même à une lettre près (rubis ≠ saphir).
export const fold = value => String(value ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "");

// Vrai si les deux textes diffèrent d'au plus une opération (substitution, ajout, retrait ou inversion de deux lettres voisines).
export function withinOneEdit(a, b) {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i += 1;
  if (a.length === b.length) {
    if (a.slice(i + 1) === b.slice(i + 1)) return true;                                   // une lettre différente
    return a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2);  // deux lettres inversées
  }
  const [long, short] = a.length > b.length ? [a, b] : [b, a];
  return long.slice(i + 1) === short.slice(i);                                            // une lettre en trop ou en moins
}

// accepted : noms acceptés (déjà passés par fold) ; others : noms d'autres minéraux (fold) à ne jamais confondre avec la réponse.
// Résultat : "exact" | "famille" | "orthographe" | null (mauvaise réponse). family : noms de famille acceptés (fold).
export function matchAnswer(answer, { names, family = [], others = new Set() }) {
  const text = fold(answer);
  if (!text) return null;
  if (names.has(text)) return "exact";
  if (family.includes(text)) return "famille";
  if (others.has(text)) return null;
  const close = [...names, ...family].some(name => name.length >= 5 && text.length >= 4 && withinOneEdit(text, name));
  return close ? "orthographe" : null;
}
