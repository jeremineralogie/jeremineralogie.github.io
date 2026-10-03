// Générateur nocturne pour le référencement (lancé par .github/workflows/seo.yml).
// Il lit les fiches publiées dans Supabase (clé publique, lecture seule) et fabrique :
//  - une page « déjà remplie » par fiche (minéraux, pièces, spécimens, articles, archives, termes du glossaire),
//    identique à la fiche habituelle mais lisible immédiatement par Google et les réseaux sociaux ;
//  - le plan du site sitemap.xml.
// Rien n'est écrit dans la base. En cas d'erreur de lecture, les pages existantes sont conservées.
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mineralTitle, pieceTitle, specimenTitle, articleTitle, documentTitle, termTitle } from "../../assets/js/seo-titles.js";
import { categoryLabel } from "../../assets/js/reference-resolver.js";
import { blocksToText } from "../../assets/js/article-content.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SITE = "https://jeremineralogie.fr";
const DEFAULT_IMAGE = `${SITE}/assets/hero-specimen.jpeg`;
const FOLDERS = { mineral: "mineraux", piece: "pieces", specimen: "specimens", article: "lire", archive: "documents", term: "glossaire" };
const DOMAINS = { mineralogie: "minéralogie", geologie: "géologie", cristallographie: "cristallographie" };
const STATIC_PAGES = ["", "boutique.html", "collection.html", "articles.html", "archives.html", "carte.html", "apprendre.html", "identification.html", "reseaux.html", "contact.html", "legal.html"];

const esc = value => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const clean = value => String(value ?? "").replace(/\s+/g, " ").trim();
const slugify = value => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const num = value => String(Number(value)).replace(".", ",");
const span = (min, max) => min == null ? "" : max != null && Number(max) !== Number(min) ? `${num(min)} à ${num(max)}` : num(min);
const day = value => value ? String(value).slice(0, 10) : null;
function cut(text, max = 158) {
  const value = clean(text);
  if (value.length <= max) return value;
  const slice = value.slice(0, max - 1);
  return `${slice.slice(0, slice.lastIndexOf(" ") > 80 ? slice.lastIndexOf(" ") : slice.length).replace(/[\s,;:.–—-]+$/, "")}…`;
}

async function config() {
  const source = await readFile(path.join(ROOT, "assets/js/supabase-config.js"), "utf8");
  const url = /url:\s*"([^"]+)"/.exec(source)?.[1];
  const key = /publishableKey:\s*"([^"]+)"/.exec(source)?.[1];
  if (!url || !key) throw new Error("Configuration Supabase introuvable dans assets/js/supabase-config.js");
  return { url, key };
}

async function fetchRows({ url, key }, name, query) {
  if (process.env.SEO_FIXTURES) return JSON.parse(await readFile(path.join(process.env.SEO_FIXTURES, `${name}.json`), "utf8"));
  const response = await fetch(`${url}/rest/v1/${query}`, { headers: { apikey: key, Accept: "application/json" } });
  if (!response.ok) throw new Error(`Lecture de « ${name} » impossible (${response.status}) : ${await response.text()}`);
  return response.json();
}

const MEDIA = "bucket_id,storage_path,position";
function photoUrl({ url }, media) {
  const first = (media || []).filter(item => item.bucket_id === "site-media-public" && item.storage_path).sort((a, b) => a.position - b.position)[0];
  if (!first) return null;
  return `${url}/storage/v1/object/public/${first.bucket_id}/${first.storage_path.split("/").map(encodeURIComponent).join("/")}`;
}
const jsonLd = data => `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", ...data }).replace(/</g, "\\u003c")}</script>`;

// Copie d'une page modèle avec titre, description, aperçus de partage et paramètres de la fiche.
function renderPage(template, page) {
  const head = [
    `<title>${esc(page.title)}</title>`,
    `<meta name="description" content="${esc(page.description)}">`,
    `<link rel="canonical" href="${esc(page.url)}">`,
    `<meta property="og:site_name" content="Jeremineralogie">`, `<meta property="og:locale" content="fr_FR">`,
    `<meta property="og:type" content="${esc(page.ogType || "website")}">`,
    `<meta property="og:title" content="${esc(page.title)}">`, `<meta property="og:description" content="${esc(page.description)}">`,
    `<meta property="og:url" content="${esc(page.url)}">`, `<meta property="og:image" content="${esc(page.image || DEFAULT_IMAGE)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    page.jsonld ? jsonLd(page.jsonld) : "",
    `<script>window.JM_PARAMS=${JSON.stringify(page.params)};window.JM_PAGE=${JSON.stringify(page.page)};${page.tab ? `window.JM_TAB=${JSON.stringify(page.tab)};` : ""}</script>`
  ].filter(Boolean).join("");
  let html = template;
  if (!/<meta charset="utf-8">/i.test(html) || !/<title>[\s\S]*?<\/title>/.test(html) || !/<main>/.test(html)) throw new Error(`Modèle inattendu pour ${page.url}`);
  // Les balises de la page fixe (description, aperçus, adresse canonique) sont remplacées par celles de la fiche.
  html = html.replace(/<meta (?:name="(?:description|robots|twitter:[^"]+)"|property="og:[^"]+")[^>]*>/g, "").replace(/<link rel="canonical"[^>]*>/g, "").replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, "");
  html = html.replace(/<meta charset="utf-8">/i, match => `${match}<base href="/">`);
  html = html.replace(/<title>[\s\S]*?<\/title>/, head);
  html = html.replace("<main>", `<main><div class="visually-hidden" data-seo>${page.hidden}</div>`);
  return html;
}
const block = (heading, ...paragraphs) => `<h2>${esc(heading)}</h2>${paragraphs.filter(Boolean).map(text => `<p>${esc(text)}</p>`).join("")}`;

async function main() {
  const cfg = await config();
  const read = (name, query) => fetchRows(cfg, name, query);
  const [minerals, pieces, specimens, articles, archives, terms] = await Promise.all([
    read("minerals", `minerals?select=slug,name,formula,chemical_class,crystal_system,hardness,hardness_max,density,density_max,streak,luster,description,formation,updated_at,media:mineral_media(${MEDIA})&publication_status=eq.published&order=slug`),
    read("shop_items", `shop_items?select=slug,reference,title,mineral_name,provenance,price_cents,currency,description,dimensions,updated_at,mineral:minerals!shop_items_mineral_id_fkey(name),mine:mines!shop_items_mine_id_fkey(name),department:departments!shop_items_department_code_fkey(name),media:shop_item_media(${MEDIA})&publication_status=eq.published&sale_status=eq.available&order=reference`),
    read("specimens", `specimens?select=slug,mineral_name,provenance,locality_name,department_name,country,description,updated_at,mineral:minerals!specimens_mineral_id_fkey(name),media:specimen_media(${MEDIA})&publication_status=eq.published&order=slug`),
    read("articles", `articles?select=slug,title,category,excerpt,body,published_on,updated_at,media:article_media(${MEDIA})&publication_status=eq.published&order=slug`),
    read("archive_documents", `archive_documents?select=slug,title,category,description,summary,cover_bucket,cover_path,document_date,updated_at&publication_status=eq.published&bucket_id=eq.site-media-public&order=slug`),
    read("glossary_terms", `glossary_terms?select=slug,term,domain,definition,updated_at&publication_status=eq.published&order=slug`)
  ]);
  const templates = Object.fromEntries(await Promise.all([["fiche", "fiche.html"], ["piece", "piece.html"], ["specimen", "specimen.html"], ["article", "article.html"], ["document", "document.html"], ["apprendre", "apprendre.html"]]
    .map(async ([key, file]) => [key, await readFile(path.join(ROOT, file), "utf8")])));

  const pages = [];
  const add = (type, id, page) => { const folder = slugify(id); if (folder) pages.push({ type, folder, ...page, url: `${SITE}/${FOLDERS[type]}/${folder}/` }); };

  // Photos libres des fiches minéraux (Wikimedia Commons) : image d'aperçu quand la fiche n'a pas de photo dans l'admin.
  const commons = JSON.parse(await readFile(path.join(ROOT, "assets/mineraux-photos/credits.json"), "utf8").catch(() => "{}"));
  const commonsUrl = slug => commons[slug] ? `${SITE}/assets/mineraux-photos/${commons[slug].photo}` : null;
  minerals.forEach(item => {
    const facts = [item.chemical_class, item.crystal_system && `système ${item.crystal_system.toLowerCase()}`, item.hardness != null && `dureté ${span(item.hardness, item.hardness_max)}`, item.density != null && `densité ${span(item.density, item.density_max)}`].filter(Boolean).join(", ");
    add("mineral", item.slug, {
      template: "fiche", page: "fiche", params: `type=mineral&id=${item.slug}`, lastmod: day(item.updated_at), image: photoUrl(cfg, item.media) || commonsUrl(item.slug),
      title: mineralTitle(item), description: cut(`${item.name}${item.formula ? ` (${item.formula})` : ""} : ${facts}. ${item.description || ""}`),
      hidden: block(item.name, [item.formula, facts].filter(Boolean).join(" — "), item.description, item.formation)
    });
  });
  pieces.forEach(item => {
    const name = clean(item.mineral_name || item.mineral?.name) || clean(item.title) || "Spécimen";
    const mine = clean(item.mine?.name);
    const price = new Intl.NumberFormat("fr-FR", { style: "currency", currency: item.currency || "EUR" }).format((item.price_cents ?? 0) / 100).replace(/\u202f|\u00a0/g, " ");
    const where = [mine, clean(item.department?.name)].filter(Boolean).join(", ");
    const url = `${SITE}/${FOLDERS.piece}/${slugify(item.reference || item.slug)}/`;
    const image = photoUrl(cfg, item.media);
    add("piece", item.reference || item.slug, {
      template: "piece", page: "piece", params: `ref=${item.reference || item.slug}`, lastmod: day(item.updated_at), image, ogType: "product",
      title: pieceTitle(name, mine), description: cut(`${name}${where ? ` de ${where}` : ""} — ${price}. ${item.description || "Spécimen disponible dans la boutique Jeremineralogie."}`),
      hidden: block(name, [where, item.dimensions, price].filter(Boolean).join(" — "), item.description),
      jsonld: { "@type": "Product", name: `${name}${mine ? ` — ${mine}` : ""}`, sku: item.reference || undefined, description: cut(item.description || name, 500), image: image ? [image] : undefined,
        offers: { "@type": "Offer", price: ((item.price_cents ?? 0) / 100).toFixed(2), priceCurrency: item.currency || "EUR", availability: "https://schema.org/InStock", url } }
    });
  });
  specimens.forEach(item => {
    const name = clean(item.mineral_name || item.mineral?.name) || "Spécimen";
    const place = clean(item.provenance || item.locality_name);
    const where = [place, clean(item.department_name), clean(item.country)].filter(Boolean).join(", ");
    add("specimen", item.slug, {
      template: "specimen", page: "specimen", params: `id=${item.slug}`, lastmod: day(item.updated_at), image: photoUrl(cfg, item.media),
      title: specimenTitle(name, place), description: cut(`${name}${where ? ` de ${where}` : ""}. ${item.description || "Spécimen de la collection Jeremineralogie."}`),
      hidden: block(name, where, item.description)
    });
  });
  articles.forEach(item => {
    const paragraphs = blocksToText(item.body);
    const image = photoUrl(cfg, item.media);
    add("article", item.slug, {
      template: "article", page: "article", params: `slug=${item.slug}`, lastmod: day(item.updated_at), image, ogType: "article",
      title: articleTitle(item.title), description: cut(item.excerpt || paragraphs[0] || item.title),
      hidden: block(item.title, categoryLabel(item.category), ...paragraphs),
      jsonld: { "@type": "Article", headline: item.title, datePublished: item.published_on || undefined, dateModified: day(item.updated_at) || undefined, image: image ? [image] : undefined, author: { "@type": "Organization", name: "Jeremineralogie" } }
    });
  });
  archives.forEach(item => {
    add("archive", item.slug, {
      template: "document", page: "document", params: `slug=${item.slug}`, lastmod: day(item.updated_at),
      image: item.cover_path ? photoUrl(cfg, [{ bucket_id: item.cover_bucket || "site-media-public", storage_path: item.cover_path, position: 0 }]) : null,
      title: documentTitle(item.title), description: cut(item.summary || item.description || `${item.title} — ${categoryLabel(item.category)}, archives et documentation Jeremineralogie.`),
      hidden: block(item.title, categoryLabel(item.category), item.description)
    });
  });
  terms.forEach(item => {
    add("term", item.slug, {
      template: "apprendre", page: "apprendre", params: `terme=${item.slug}`, tab: "glossaire", lastmod: day(item.updated_at),
      title: termTitle(item.term), description: cut(`${item.term} (${DOMAINS[item.domain] || "glossaire"}) : ${item.definition}`),
      hidden: block(item.term, item.definition),
      jsonld: { "@type": "DefinedTerm", name: item.term, description: item.definition, inDefinedTermSet: `${SITE}/apprendre.html#glossaire` }
    });
  });

  if (!pages.length) throw new Error("Aucune fiche publiée n'a été lue : génération annulée pour ne pas effacer les pages existantes.");
  const seen = new Set();
  const unique = pages.filter(page => { const key = `${page.type}/${page.folder}`; if (seen.has(key)) return false; seen.add(key); return true; });

  for (const folder of Object.values(FOLDERS)) await rm(path.join(ROOT, folder), { recursive: true, force: true });
  for (const page of unique) {
    const dir = path.join(ROOT, FOLDERS[page.type], page.folder);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, "index.html"), renderPage(templates[page.template], page));
  }
  const urls = [...STATIC_PAGES.map(file => ({ loc: `${SITE}/${file}` })), ...unique.map(page => ({ loc: page.url, lastmod: page.lastmod }))];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(entry => `  <url><loc>${esc(entry.loc)}</loc>${entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ""}</url>`).join("\n")}\n</urlset>\n`;
  await writeFile(path.join(ROOT, "sitemap.xml"), sitemap);
  const counts = Object.keys(FOLDERS).map(type => `${type}: ${unique.filter(page => page.type === type).length}`).join(", ");
  console.log(`Pages générées : ${unique.length} (${counts}). Plan du site : ${urls.length} adresses.`);
}

main().catch(error => { console.error(error); process.exit(1); });
