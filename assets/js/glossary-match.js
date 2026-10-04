// Correspondance entre un texte et les termes du glossaire (commune aux pages affichées par JavaScript et au générateur de pages pour Google).
// Dans un bloc de texte, la première occurrence de chaque terme du glossaire peut devenir un lien.
// Les termes trop généraux (minéral, roche, couleur…) ne sont pas reliés pour ne pas surcharger les textes.
export const GENERIC = new Set(["mineral", "roche", "cristal", "couleur", "densite", "trait", "mine", "face", "arete", "serie", "variete", "specimen",
  "cube", "prisme", "gisement", "gite", "formule chimique", "transparent", "translucide", "opaque", "durete", "eclat", "carriere", "puits",
  "galerie", "minerai", "croute", "manteau", "lave", "magma", "fossile", "erosion", "alteration", "symetrie", "cassure", "inclusion", "nodule",
  "concretion", "encroutement", "fibreux", "lamellaire", "tabulaire", "prismatique", "etiquette", "nettoyage", "matrice", "affleurement",
  "faille", "pli", "fluide", "datation", "silicate", "carbonate", "sulfure", "gemme", "synthetique", "traitement", "flexible", "elastique",
  "groupe mineral", "espece minerale", "systeme cristallin", "cubique", "quadratique", "hexagonal", "trigonal", "orthorhombique", "monoclinique",
  "triclinique", "amorphe", "couleur", "zonage", "calcaire", "argile", "gres", "grotte", "alluvion"]);
export const isWordChar = character => Boolean(character) && /[\p{L}\p{N}]/u.test(character);
export const foldChar = character => character.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[’`]/g, "'").replace(/-/g, " ");
export const foldText = text => [...String(text ?? "")].map(foldChar).join("");

export function matcher(terms) {
  const keys = [];
  terms.forEach(term => {
    const base = foldText(term.term.trim());
    if (base.length < 4 || GENERIC.has(base)) return;
    const forms = new Set([base]);
    if (!base.includes(" ")) { forms.add(`${base}s`); if (base.endsWith("al")) forms.add(`${base.slice(0, -2)}aux`); }
    else { const [first, ...rest] = base.split(" "); forms.add([`${first}s`, ...rest].join(" ")); }
    forms.forEach(form => keys.push({ form, term }));
  });
  return keys.sort((a, b) => b.form.length - a.form.length);
}

// Termes repérés dans un texte : [{ start, end, term }] (indices dans le texte d'origine). « used » (slugs déjà reliés) est complété.
export function termHits(source, keys, used) {
  let folded = ""; const map = [];
  [...source].forEach((character, index) => { for (const piece of foldChar(character)) { folded += piece; map.push(index); } });
  const found = [];
  for (const { form, term } of keys) {
    if (used.has(term.slug)) continue;
    let from = 0;
    while (from <= folded.length) {
      const start = folded.indexOf(form, from);
      if (start < 0) break;
      const end = start + form.length;
      if (!isWordChar(folded[start - 1]) && !isWordChar(folded[end]) && !found.some(hit => start < hit.end && end > hit.start)) {
        found.push({ start, end, term }); used.add(term.slug); break;
      }
      from = start + 1;
    }
  }
  const chars = [...source];
  return found.sort((a, b) => a.start - b.start).map(hit => ({ start: map[hit.start], end: map[hit.end - 1] + 1, term: hit.term })).filter((hit, index, list) => !index || hit.start >= list[index - 1].end).map(hit => ({ ...hit, chars }));
}

// Texte découpé : [{ text }] ou [{ text, term }].
export function glossaryParts(source, keys, used) {
  const hits = termHits(String(source ?? ""), keys, used);
  if (!hits.length) return [{ text: String(source ?? "") }];
  const chars = hits[0].chars; const parts = []; let cursor = 0;
  hits.forEach(hit => { if (hit.start > cursor) parts.push({ text: chars.slice(cursor, hit.start).join("") }); parts.push({ text: chars.slice(hit.start, hit.end).join(""), term: hit.term }); cursor = hit.end; });
  if (cursor < chars.length) parts.push({ text: chars.slice(cursor).join("") });
  return parts;
}
