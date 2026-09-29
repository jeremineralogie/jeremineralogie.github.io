import { getSupabase } from "./supabase-client.js";
import { normalizeName, categoryLabel } from "./reference-resolver.js";
import { ficheUrl } from "./entity-links.js";

const query = (new URLSearchParams(location.search).get("q") || "").trim();
const status = document.querySelector("#search-status");
const grid = document.querySelector("#search-results");
const client = getSupabase();

// Sélections publiques uniquement : le RLS ne renvoie que le contenu publié.
const sources = [
  { type: "Spécimen", table: "specimens", select: "slug,mineral_name,provenance,locality_name,department_name,country,keywords,description,mineral:minerals!specimens_mineral_id_fkey(name)",
    map: r => ({ title: r.mineral_name ?? r.mineral?.name ?? "Spécimen", meta: [r.provenance, r.locality_name, r.department_name].filter(Boolean).join(" · "), href: `specimen.html?id=${encodeURIComponent(r.slug)}`, haystack: [r.mineral_name, r.mineral?.name, r.provenance, r.locality_name, r.department_name, r.country, r.keywords, r.description] }) },
  { type: "Boutique", table: "shop_items", select: "reference,title,provenance,description", filter: q => q.eq("sale_status", "available"),
    map: r => ({ title: r.title, meta: [r.reference, r.provenance].filter(Boolean).join(" · "), href: `boutique.html#${encodeURIComponent(r.reference)}`, haystack: [r.reference, r.title, r.provenance, r.description] }) },
  { type: "Article", table: "articles", select: "slug,title,excerpt,category",
    map: r => ({ title: r.title, meta: categoryLabel(r.category), href: `articles.html#${encodeURIComponent(r.slug)}`, haystack: [r.title, r.excerpt, r.category] }) },
  { type: "Archive", table: "archive_documents", select: "slug,title,description,category",
    map: r => ({ title: r.title, meta: categoryLabel(r.category), href: `archives.html#${encodeURIComponent(r.slug)}`, haystack: [r.title, r.description, r.category] }) },
  { type: "Mine / gisement", table: "mines", select: "name,slug,description,locality:localities(department_code)",
    map: r => ({ title: r.name, meta: "", href: ficheUrl("mine", r.slug), haystack: [r.name, r.description] }) },
  { type: "Localité", table: "localities", select: "name,slug,department_code,notes",
    map: r => ({ title: r.name, meta: r.department_code || "", href: ficheUrl("locality", r.slug), haystack: [r.name, r.notes] }) },
  { type: "Minéral", table: "minerals", select: "name,slug,formula",
    map: r => ({ title: r.name, meta: r.formula || "", href: ficheUrl("mineral", r.slug), haystack: [r.name, r.formula] }) },
  { type: "Département", table: "departments", select: "code,name",
    map: r => ({ title: `${r.name} (${r.code})`, meta: "", href: `departement.html?dep=${encodeURIComponent(r.code)}`, haystack: [r.name, r.code] }) },
  { type: "Région", table: "regions", select: "name",
    map: r => ({ title: r.name, meta: "", href: "departement.html", haystack: [r.name] }) }
];

export function matches(haystack, terms) {
  const text = normalizeName(haystack.filter(Boolean).join(" "));
  return terms.every(term => text.includes(term));
}

function card(result) {
  const element = document.createElement(result.href ? "a" : "div");
  element.className = "card";
  if (result.href) element.href = result.href;
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
  if (!client) { status.textContent = "La connexion à Supabase n’est pas configurée."; return; }
  const terms = normalizeName(query).split(" ").filter(Boolean);
  const settled = await Promise.allSettled(sources.map(async source => {
    let request = client.from(source.table).select(source.select);
    if (source.filter) request = source.filter(request);
    const { data, error } = await request;
    if (error) throw error;
    return (data || []).map(row => ({ type: source.type, ...source.map(row) })).filter(result => matches(result.haystack, terms));
  }));
  const failed = settled.filter(item => item.status === "rejected");
  failed.forEach(item => console.error("Recherche — source indisponible :", item.reason));
  const results = settled.flatMap(item => item.status === "fulfilled" ? item.value : []);
  grid.replaceChildren(...results.map(card));
  status.textContent = (results.length ? `${results.length} résultat${results.length > 1 ? "s" : ""}.` : "Aucun résultat pour cette recherche.")
    + (failed.length ? " Certaines sources n’ont pas pu être interrogées." : "");
}
await run();
