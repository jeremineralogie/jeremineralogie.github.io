// Titres des fiches (onglet du navigateur et résultats Google), partagés entre les pages et le générateur nocturne.
const clean = value => String(value ?? "").trim();

export function mineralTitle(mineral) {
  const formula = clean(mineral.formula);
  return `${clean(mineral.name)}${formula ? ` (${formula})` : ""} : propriétés, dureté et gisements — Jeremineralogie`;
}
export function pieceTitle(name, mine) {
  return `${clean(name)}${clean(mine) ? ` de ${clean(mine)}` : ""} — Boutique Jeremineralogie`;
}
export function specimenTitle(name, place) {
  return `${clean(name) || "Spécimen"}${clean(place) ? ` de ${clean(place)}` : ""} — Collection Jeremineralogie`;
}
export function articleTitle(title) { return `${clean(title)} — Jeremineralogie`; }
export function documentTitle(title) { return `${clean(title)} — Archives Jeremineralogie`; }
export function termTitle(term) { return `${clean(term)} : définition — Glossaire de minéralogie Jeremineralogie`; }
