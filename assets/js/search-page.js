import { departmentUrl } from "./clean-urls.js";
import { shopItemName, publicMediaUrl } from "./content-repository.js";
import { commonsPhoto, loadMineralPhotos } from "./mineral-photos.js";
import { getSupabase } from "./supabase-client.js";
import { normalizeName, categoryLabel } from "./reference-resolver.js";
import { ficheUrl } from "./entity-links.js";
import { pieceUrl, articleUrl, documentUrl, specimenUrl } from "./detail-nav.js";

const query = (new URLSearchParams(location.search).get("q") || "").trim();
const status = document.querySelector("#search-status");
const grid = document.querySelector("#search-results");
const client = getSupabase();
const media = table => `media:${table}(bucket_id,storage_path,alt_text,position)`;
// Première photo publique d'une fiche (ordre choisi dans l'admin).
const firstImage = rows => {
  const image = (rows || []).filter(item => item.bucket_id === "site-media-public" && item.storage_path).sort((a, b) => (a.position ?? 0) - (b.position ?? 0))[0];
  return image ? { src: publicMediaUrl(client, image), alt: image.alt_text } : null;
};
let commons = {};

// Sélections publiques uniquement : le RLS ne renvoie que le contenu publié.
const sources = [
  { type: "Spécimen", table: "specimens", select: `slug,mineral_name,provenance,locality_name,department_name,country,keywords,description,mineral:minerals!specimens_mineral_id_fkey(name),${media("specimen_media")}`,
    map: r => ({ title: r.mineral_name ?? r.mineral?.name ?? "Spécimen", meta: [r.provenance, r.locality_name, r.department_name].filter(Boolean).join(" · "), href: specimenUrl({ id: r.slug }), image: firstImage(r.media), haystack: [r.mineral_name, r.mineral?.name, r.provenance, r.locality_name, r.department_name, r.country, r.keywords, r.description] }) },
  { type: "Boutique", table: "shop_items", select: `slug,reference,title,mineral_name,provenance,description,keywords,mineral:minerals!shop_items_mineral_id_fkey(name),mine:mines!shop_items_mine_id_fkey(name),${media("shop_item_media")}`, filter: q => q.eq("sale_status", "available"),
    map: r => ({ title: shopItemName(r), meta: [r.mine?.name || r.provenance, r.reference].filter(Boolean).join(" · "), href: pieceUrl(r), image: firstImage(r.media), haystack: [r.reference, r.mineral_name, r.mineral?.name, r.mine?.name, r.provenance, r.keywords, r.description] }) },
  { type: "Article", table: "articles", select: `slug,title,excerpt,category,${media("article_media")}`, wide: true,
    map: r => ({ title: r.title, meta: categoryLabel(r.category), href: articleUrl(r), image: firstImage(r.media), haystack: [r.title, r.excerpt, r.category] }) },
  { type: "Archive", table: "archive_documents", select: "slug,title,description,category,cover_bucket,cover_path", wide: true,
    map: r => ({ title: r.title, meta: categoryLabel(r.category), href: documentUrl(r), image: r.cover_path ? { src: client.storage.from(r.cover_bucket || "site-media-public").getPublicUrl(r.cover_path).data.publicUrl } : null, haystack: [r.title, r.description, r.category] }) },
  { type: "Mine / gisement", table: "mines", select: "name,slug,description,locality:localities(department_code)",
    map: r => ({ title: r.name, meta: "", href: ficheUrl("mine", r.slug), haystack: [r.name, r.description] }) },
  { type: "Commune", table: "localities", select: "name,slug,department_code,notes",
    map: r => ({ title: r.name, meta: r.department_code || "", href: ficheUrl("locality", r.slug), haystack: [r.name, r.notes] }) },
  { type: "Minéral", table: "minerals", select: `name,slug,formula,${media("mineral_media")}`,
    map: r => ({ title: r.name, meta: r.formula || "", href: ficheUrl("mineral", r.slug), image: firstImage(r.media) || mineralCommons(r.slug), haystack: [r.name, r.formula] }) },
  { type: "Département", table: "departments", select: "code,name",
    map: r => ({ title: `${r.name} (${r.code})`, meta: "", href: departmentUrl(r.code), haystack: [r.name, r.code] }) },
  { type: "Région", table: "regions", select: "name",
    map: r => ({ title: r.name, meta: "", href: "departement.html", haystack: [r.name] }) }
];

// Fiche minéral sans photo ajoutée dans l'admin : photo libre (Wikimedia Commons) en vignette.
function mineralCommons(slug) {
  const photo = commonsPhoto(commons, slug);
  return photo ? { src: photo.thumbSrc } : null;
}

export function matches(haystack, terms) {
  const text = normalizeName(haystack.filter(Boolean).join(" "));
  return terms.every(term => text.includes(term));
}

function card(result) {
  const element = document.createElement(result.href ? "a" : "div");
  element.className = result.wide ? "card card-wide" : "card";
  if (result.href) element.href = result.href;
  if (result.image?.src) {
    const image = document.createElement("img");
    image.src = result.image.src; image.alt = result.image.alt || result.title; image.loading = "lazy";
    element.append(image);
  }
  const body = document.createElement("div"); body.className = "card-body";
  const kicker = document.createElement("div"); kicker.className = "kicker"; kicker.textContent = result.type;
  const title = document.createElement("h3"); title.textContent = result.title;
  body.append(kicker, title);
  if (result.meta) { const meta = document.createElement("div"); meta.className = "meta"; meta.textContent = result.meta; body.append(meta); }
  element.append(body);
  return element;
}

async function run() {
  if (!query) return;
  status.hidden = false; status.textContent = "Recherche en cours…";
  if (!client) { status.textContent = "La recherche est momentanément indisponible."; return; }
  const terms = normalizeName(query).split(" ").filter(Boolean);
  commons = await loadMineralPhotos();
  const settled = await Promise.allSettled(sources.map(async source => {
    let request = client.from(source.table).select(source.select);
    if (source.filter) request = source.filter(request);
    const { data, error } = await request;
    if (error) throw error;
    return (data || []).map(row => ({ type: source.type, wide: source.wide, ...source.map(row) })).filter(result => matches(result.haystack, terms));
  }));
  const failed = settled.filter(item => item.status === "rejected");
  failed.forEach(item => console.error("Recherche — source indisponible :", item.reason));
  const results = settled.flatMap(item => item.status === "fulfilled" ? item.value : []);
  grid.replaceChildren(...results.map(card));
  status.textContent = (results.length ? `${results.length} résultat${results.length > 1 ? "s" : ""}.` : "Aucun résultat pour cette recherche.")
    + (failed.length ? " Certaines sources n’ont pas pu être interrogées." : "");
}
await run();
