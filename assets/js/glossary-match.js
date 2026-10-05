// Correspondance entre un texte et les termes du glossaire (commune aux pages affichées par JavaScript et au générateur de pages pour Google).
// Dans un bloc de texte, la première occurrence de chaque terme du glossaire peut devenir un lien.
// Les termes trop généraux (minéral, roche, couleur…) ne sont pas reliés pour ne pas surcharger les textes.
export const GENERIC = new Set(["mineral", "roche", "cristal", "couleur", "densite", "trait", "mine", "face", "arete", "serie", "variete", "specimen",
  "cube", "prisme", "gisement", "gite", "formule chimique", "transparent", "translucide", "opaque", "durete", "eclat", "carriere", "puits",
  "galerie", "minerai", "croute", "manteau", "lave", "magma", "fossile", "erosion", "alteration", "symetrie", "cassure", "inclusion", "nodule",
  "concretion", "encroutement", "fibreux", "lamellaire", "tabulaire", "prismatique", "etiquette", "nettoyage", "matrice", "affleurement",
  "faille", "pli", "fluide", "datation", "silicate", "carbonate", "sulfure", "gemme", "synthetique", "traitement", "flexible", "elastique",
  "groupe mineral", "espece minerale", "systeme cristallin", "cubique", "quadratique", "hexagonal", "trigonal", "orthorhombique", "monoclinique",
  "triclinique", "amorphe", "couleur", "zonage", "calcaire", "argile", "gres", "grotte", "alluvion",
  "massif", "pyramide", "enduit", "grenu", "granulaire", "cristallisation"]);
// Mots trop courants dans leur autre sens (« la taille des cristaux ») : jamais reliés automatiquement.
const NEVER = new Set(["taille"]);
export const isWordChar = character => Boolean(character) && /[\p{L}\p{N}]/u.test(character);
export const foldChar = character => character.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[’`]/g, "'").replace(/-/g, " ");
export const foldText = text => [...String(text ?? "")].map(foldChar).join("");

export function matcher(terms, { includeGeneric = false } = {}) {
  const keys = [];
  terms.forEach(term => {
    const base = foldText(term.term.trim());
    if (base.length < 4 || NEVER.has(base) || (!includeGeneric && GENERIC.has(base))) return;
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

// ----- Propriétés d'une fiche minéral : libellés et valeurs précises reliés à leur terme (même règle dans la page affichée et dans la page pour Google) -----
const slugOfText = value => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const LABEL_TERMS = { "Système cristallin": "systeme-cristallin", "Dureté (Mohs)": "echelle-de-mohs", "Dureté": "echelle-de-mohs", "Densité": "densite", "Trait": "trait", "Éclat": "eclat", "Clivage": "clivage", "Cassure": "cassure", "Habitus": "habitus", "Fluorescence": "fluorescence" };
// Famille chimique -> terme (« Silicates (nésosilicates) » -> nésosilicate, « Oxydes et hydroxydes » -> oxyde et hydroxyde…).
const FAMILY_SLUGS = [["nesosilicate", "nesosilicate"], ["sorosilicate", "sorosilicate"], ["cyclosilicate", "cyclosilicate"], ["inosilicate", "inosilicate"], ["phyllosilicate", "phyllosilicate"], ["tectosilicate", "tectosilicate"], ["carbonate", "carbonate"], ["sulfure", "sulfure"], ["oxyde", "oxyde-et-hydroxyde"], ["sulfate", "sulfate"], ["phosphate", "phosphate"], ["halogenure", "halogenure"], ["element natif", "element-natif"], ["borate", "borate"], ["compose organique", "compose-organique"]];
// Qualités reconnues dans un champ (mot replié -> terme) ; le plus précis d'abord.
const QUALIFIERS = {
  "Éclat": [["submetallique", "eclat-submetallique"], ["metallique", "eclat-metallique"], ["adamantin", "eclat-adamantin"], ["nacre", "eclat-nacre"], ["resineux", "eclat-resineux"], ["soyeux", "eclat-soyeux"], ["vitreux", "eclat-vitreux"], ["cireux", "eclat-cireux"], ["terreux", "eclat-terreux"], ["gras", "eclat-gras"], ["mat", "eclat-mat"]],
  "Cassure": [["subconchoidale", "cassure-subconchoidale"], ["conchoidale", "cassure-conchoidale"], ["irreguliere", "cassure-irreguliere"], ["esquilleuse", "cassure-esquilleuse"], ["terreuse", "cassure-terreuse"]],
  "Clivage": [["parfait", "clivage-parfait"], ["distinct", "clivage-distinct"], ["imparfait", "clivage-imparfait"], ["basal", "clivage-basal"], ["rhomboedrique", "clivage-rhomboedrique"], ["octaedrique", "clivage-octaedrique"]]
};
// Champs dont le texte est relié aux termes même « généraux » (cube, croûte, fibreux, transparent…), car précis dans ce contexte.
export const PRECISE_LABELS = new Set(["Habitus", "Cassure", "Clivage", "Éclat", "Transparence"]);
// Découpe la valeur d'une propriété en [{ text }] ou [{ text, term }] ; « used » (slugs déjà reliés sur la page) est complété. Retourne null si le champ n'a pas de terme précis.
export function propertyParts(label, value, termsBySlug, used) {
  const text = String(value);
  const folded = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const whole = row => { if (!row || used.has(row.slug)) return [{ text }]; used.add(row.slug); return [{ text, term: row }]; };
  if (label === "Système cristallin") return whole(termsBySlug.get(slugOfText(text)));
  if (label === "Famille chimique") { const hit = FAMILY_SLUGS.find(([word]) => folded.includes(word)); return hit ? whole(termsBySlug.get(hit[1])) : null; }
  const list = QUALIFIERS[label];
  if (!list) return null;
  const hits = [];
  for (const match of text.matchAll(/[\p{L}]+/gu)) {
    const word = match[0].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const entry = list.find(([key]) => key === word);
    const row = entry && termsBySlug.get(entry[1]);
    if (row && !used.has(row.slug) && !hits.some(hit => hit.term === row)) { used.add(row.slug); hits.push({ start: match.index, end: match.index + match[0].length, term: row }); }
  }
  if (!hits.length) return null;
  const parts = []; let cursor = 0;
  hits.forEach(hit => { if (hit.start > cursor) parts.push({ text: text.slice(cursor, hit.start) }); parts.push({ text: text.slice(hit.start, hit.end), term: hit.term }); cursor = hit.end; });
  if (cursor < text.length) parts.push({ text: text.slice(cursor) });
  return parts;
}
