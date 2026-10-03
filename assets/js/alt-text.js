// Textes alternatifs des photos (invisibles : lecteurs d'écran et moteurs de recherche) construits à partir de toutes les informations d'une fiche.
// Fonctions pures, partagées avec le générateur de pages (tools/seo/build.mjs).
const clean = value => String(value ?? "").trim();
const uniq = list => { const seen = new Set(); return list.map(clean).filter(item => { const key = item.toLocaleLowerCase("fr"); if (!item || seen.has(key)) return false; seen.add(key); return true; }); };
const MAX = 300;
const cut = text => text.length <= MAX ? text : `${text.slice(0, MAX - 1).replace(/[\s,;—:(-]+\S*$/, "")}…`;

// Un texte alternatif saisi à la main est conservé ; un nom de fichier (IMG_1087.jpeg, UUID.png…) n'en est pas un.
export const isFileNameAlt = text => { const value = clean(text); return !value || /\.(jpe?g|png|webp|gif|avif|heic)\b/i.test(value) || /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(value); };
const shot = (index, total) => total > 1 ? `photo ${index + 1} sur ${total}` : "";

// Pièce de la boutique ou spécimen de la collection : minéral, provenance complète, minéraux associés, dimensions, poids, référence, mots-clés, date.
// info = { mineral, associated[], mine, locality, department, departmentCode, region, country, dimensions, weight, reference, keywords, discovery }
export function specimenAlt(info, index = 0, total = 1, manual = "") {
  if (!isFileNameAlt(manual) && clean(manual).split(/\s+/).length >= 4) return clean(manual);
  const department = clean(info.department) && (clean(info.departmentCode) && /^(2[AB]|\d{2,3})$/i.test(clean(info.departmentCode)) ? `${clean(info.department)} (${clean(info.departmentCode)})` : clean(info.department));
  const where = uniq([info.mine, info.locality, department, info.region, info.country]);
  const associated = uniq(info.associated || []);
  const parts = [
    `${clean(info.mineral) || "Spécimen"}${where.length ? ` de ${where.join(", ")}` : ""}`,
    associated.length ? `associé à ${associated.join(", ")}` : "",
    clean(info.dimensions), clean(info.weight),
    clean(info.reference) ? `réf. ${clean(info.reference)}` : "",
    clean(info.keywords), clean(info.discovery) ? `découvert ${clean(info.discovery)}` : "",
    shot(index, total)
  ].filter(Boolean);
  return cut(parts.join(" — "));
}

// Fiche minéral : nom, formule et les informations les plus recherchées (famille, système cristallin, dureté, couleurs).
export function mineralAlt(mineral, index = 0, total = 1, manual = "") {
  if (!isFileNameAlt(manual) && clean(manual).split(/\s+/).length >= 4) return clean(manual);
  const num = value => Number(value).toLocaleString("fr-FR", { maximumFractionDigits: 2 });
  const hardness = mineral.hardness == null ? "" : `dureté ${mineral.hardness_max != null && Number(mineral.hardness_max) !== Number(mineral.hardness) ? `${num(mineral.hardness)} à ${num(mineral.hardness_max)}` : num(mineral.hardness)} (Mohs)`;
  const colors = (mineral.colors || []).length ? `couleurs : ${mineral.colors.join(", ")}` : "";
  const parts = [
    `${clean(mineral.name)}${clean(mineral.formula) ? ` (${clean(mineral.formula)})` : ""} : minéral${clean(mineral.chemical_class) ? ` de la famille « ${clean(mineral.chemical_class).toLocaleLowerCase("fr")} »` : ""}`,
    clean(mineral.crystal_system) ? `système ${clean(mineral.crystal_system).toLocaleLowerCase("fr")}` : "", hardness, colors,
    shot(index, total)
  ].filter(Boolean);
  return cut(parts.join(", ").replace(", photo", " — photo"));
}
