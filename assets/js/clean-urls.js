// Adresses propres des fiches : /mineraux/quartz/, /pieces/jmquec1/, /specimens/…/, /lire/…/, /documents/…/, /glossaire/…/.
// Ces pages sont fabriquées chaque nuit par tools/seo/build.mjs (mêmes dossiers, même transformation de l'identifiant).
// Une fiche créée dans la journée n'a pas encore sa page : 404.html la redirige alors vers la fiche habituelle.
export const FOLDERS = { mineral: "mineraux", piece: "pieces", specimen: "specimens", article: "lire", archive: "documents", term: "glossaire" };
export const slugOf = value => String(value ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const cleanUrl = (type, id) => { const slug = slugOf(id); return slug ? `/${FOLDERS[type]}/${slug}/` : null; };

// Adresse « technique » équivalente (utilisée par 404.html et pour la balise canonique des anciennes adresses).
export const LEGACY = {
  mineraux: slug => `fiche.html?type=mineral&id=${encodeURIComponent(slug)}`,
  pieces: slug => `piece.html?ref=${encodeURIComponent(slug)}`,
  specimens: slug => `specimen.html?id=${encodeURIComponent(slug)}`,
  lire: slug => `article.html?slug=${encodeURIComponent(slug)}`,
  documents: slug => `document.html?slug=${encodeURIComponent(slug)}`,
  glossaire: slug => `apprendre.html?terme=${encodeURIComponent(slug)}#glossaire`
};

// Sur une adresse technique (fiche.html?…), indique à Google l'adresse propre comme adresse de référence.
export function setCanonical(type, id) {
  if (window.JM_PARAMS) return;                       // page propre : sa balise canonique est déjà la bonne
  const path = cleanUrl(type, id);
  if (!path) return;
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) { link = document.createElement("link"); link.rel = "canonical"; document.head.append(link); }
  link.href = `${location.origin}${path}`;
}
