// Photos libres des fiches minéraux (Wikimedia Commons, licences libres) et leurs crédits obligatoires.
// Utilisées quand une fiche n'a pas encore de photo ajoutée dans l'admin (la photo de l'admin passe toujours en priorité).
const BASE = "/assets/mineraux-photos/";
let loading = null;
const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text != null) node.textContent = text; return node; };

export function loadMineralPhotos() {
  loading ||= fetch(`${BASE}credits.json`).then(response => response.ok ? response.json() : {}).catch(() => ({}));
  return loading;
}
export const commonsPhoto = (credits, slug) => credits?.[slug] ? { ...credits[slug], src: `${BASE}${credits[slug].photo}`, thumbSrc: `${BASE}${credits[slug].thumb || credits[slug].photo}` } : null;
export const creditText = photo => `Photo : ${photo.author} — ${photo.license}, via Wikimedia Commons`;

// Ligne de crédit : auteur, licence (lien) et page d'origine sur Wikimedia Commons.
export function creditLine(photo, className = "photo-credit") {
  const line = el("p", className);
  line.append(`Photo : ${photo.author} — `);
  const license = el("a", "", photo.license); license.href = photo.licenseUrl || photo.page; license.target = "_blank"; license.rel = "noopener license";
  const source = el("a", "", "Wikimedia Commons"); source.href = photo.page; source.target = "_blank"; source.rel = "noopener";
  line.append(license, ", via ", source);
  return line;
}
