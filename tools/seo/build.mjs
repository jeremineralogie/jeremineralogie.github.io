// Générateur nocturne pour le référencement (lancé par .github/workflows/seo.yml).
// Il lit les fiches publiées dans Supabase (clé publique, lecture seule) et fabrique :
//  - une page « déjà remplie » par fiche (minéraux, pièces, spécimens, articles, archives, termes du glossaire),
//    identique à la fiche habituelle mais lisible immédiatement par Google et les réseaux sociaux ;
//  - le plan du site sitemap.xml.
// Rien n'est écrit dans la base. En cas d'erreur de lecture, les pages existantes sont conservées.
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mineralTitle, pieceTitle, specimenTitle, articleTitle, documentTitle, termTitle, mineTitle, localityTitle, departmentTitle } from "../../assets/js/seo-titles.js";
import { categoryLabel } from "../../assets/js/reference-resolver.js";
import { blocksToText } from "../../assets/js/article-content.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SITE = "https://jeremineralogie.fr";
const DEFAULT_IMAGE = `${SITE}/assets/hero-specimen.jpeg`;
const FOLDERS = { mineral: "mineraux", piece: "pieces", specimen: "specimens", article: "lire", archive: "documents", term: "glossaire", mine: "gisements", locality: "communes", department: "departements" };
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
    page.noindex ? `<meta name="robots" content="noindex,follow">` : "",
    `<meta property="og:site_name" content="Jeremineralogie">`, `<meta property="og:locale" content="fr_FR">`,
    `<meta property="og:type" content="${esc(page.ogType || "website")}">`,
    `<meta property="og:title" content="${esc(page.title)}">`, `<meta property="og:description" content="${esc(page.description)}">`,
    `<meta property="og:url" content="${esc(page.url)}">`, `<meta property="og:image" content="${esc(page.image || DEFAULT_IMAGE)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    ...[].concat(page.jsonld || [], page.extra || []).map(jsonLd),
    `<script>window.JM_PARAMS=${JSON.stringify(page.params)};window.JM_PAGE=${JSON.stringify(page.page)};${page.tab ? `window.JM_TAB=${JSON.stringify(page.tab)};` : ""}</script>`
  ].filter(Boolean).join("");
  let html = template;
  if (page.departmentDetail) {
    // Page département : même contenu que celui construit par JavaScript, déjà en place (JavaScript le remplace par le même texte).
    html = html.replace(/(<section class="department-detail" id="department-detail">)[\s\S]*?(<\/section>)/, `$1${page.departmentDetail}$2`)
      .replace(/(<section class="department-detail" id="department-live-content" aria-live="polite") hidden>\s*<\/section>/, `$1>${page.departmentLive}</section>`);
  }
  if (!/<meta charset="utf-8">/i.test(html) || !/<title>[\s\S]*?<\/title>/.test(html) || !/<main>/.test(html)) throw new Error(`Modèle inattendu pour ${page.url}`);
  // Les balises de la page fixe (description, aperçus, adresse canonique) sont remplacées par celles de la fiche.
  html = html.replace(/<meta (?:name="(?:description|robots|twitter:[^"]+)"|property="og:[^"]+")[^>]*>/g, "").replace(/<link rel="canonical"[^>]*>/g, "").replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, "");
  html = html.replace(/<meta charset="utf-8">/i, match => `${match}<base href="/">`);
  html = html.replace(/<title>[\s\S]*?<\/title>/, head);
  // Contenu lisible dès le chargement (« data-seo » : retiré par la page quand JavaScript affiche la vraie fiche, qui a le même aspect).
  // Les termes du glossaire, affichés dans un onglet, gardent un bloc masqué.
  // Dans les pages pièce, article et document, le contenu prend la place de la zone remplie par JavaScript (même ordre d'affichage avant et après).
  if (page.visible && html.includes('<div id="detail"></div>')) html = html.replace('<div id="detail"></div>', `<div id="detail"><div data-seo>${page.visible}</div></div>`);
  else html = html.replace("<main>", page.visible ? `<main><div data-seo>${page.visible}</div>` : `<main><div class="visually-hidden" data-seo>${page.hidden}</div>`);
  if (page.visible) html = html.replace(/<p class="notice" id="(fiche-status|detail-status)"/, '<p class="notice" id="$1" hidden');
  return html;
}
const p = text => text ? `<p>${esc(text)}</p>` : "";
const dateFr = value => value ? new Intl.DateTimeFormat("fr-FR").format(new Date(`${String(value).slice(0, 10)}T00:00:00`)) : "";
const formatNum = value => Number(value).toLocaleString("fr-FR", { maximumFractionDigits: 3 });
const breadcrumb = (...items) => ({ "@type": "BreadcrumbList", itemListElement: items.map(([name, url], index) => ({ "@type": "ListItem", position: index + 1, name, item: url })) });
const crumbs = (type, name, url) => ({
  mineral: [["Accueil", `${SITE}/`], ["Apprendre", `${SITE}/apprendre.html`], ["Fiches minéraux", `${SITE}/apprendre.html#mineraux`], [name, url]],
  piece: [["Accueil", `${SITE}/`], ["Boutique", `${SITE}/boutique.html`], [name, url]],
  specimen: [["Accueil", `${SITE}/`], ["Ma collection", `${SITE}/collection.html`], [name, url]],
  article: [["Accueil", `${SITE}/`], ["Articles", `${SITE}/articles.html`], [name, url]],
  archive: [["Accueil", `${SITE}/`], ["Archives & documentation", `${SITE}/archives.html`], [name, url]],
  term: [["Accueil", `${SITE}/`], ["Apprendre", `${SITE}/apprendre.html`], ["Glossaire", `${SITE}/apprendre.html#glossaire`], [name, url]]
}[type]);
const dl = (cls, rows) => { const items = rows.filter(([, value]) => value != null && value !== ""); return items.length ? `<dl${cls ? ` class="${cls}"` : ""}>${items.map(([label, value]) => `<dt>${esc(label)}</dt><dd>${esc(value)}</dd>`).join("")}</dl>` : ""; };
const block = (heading, ...paragraphs) => `<h2>${esc(heading)}</h2>${paragraphs.filter(Boolean).map(text => `<p>${esc(text)}</p>`).join("")}`;

async function main() {
  const cfg = await config();
  const read = (name, query) => fetchRows(cfg, name, query);
  const [minerals, pieces, specimens, articles, archives, terms, mines, localities, departments, regions, occurrences, articleMines, articleLocalities, articleDepartments, archiveMines, archiveLocalities, archiveDepartments] = await Promise.all([
    read("minerals", `minerals?select=id,slug,name,formula,chemical_class,crystal_system,hardness,hardness_max,density,density_max,colors,streak,luster,transparency,cleavage,fracture,habit,fluorescence,varieties,confusions,etymology,photo_credit,mineral_group,is_group,description,formation,updated_at,media:mineral_media(${MEDIA})&publication_status=eq.published&order=slug`),
    read("shop_items", `shop_items?select=slug,reference,title,mineral_name,mineral_id,mine_id,locality_id,department_code,provenance,price_cents,currency,description,dimensions,updated_at,mineral:minerals!shop_items_mineral_id_fkey(name,slug),mine:mines!shop_items_mine_id_fkey(name),department:departments!shop_items_department_code_fkey(name),media:shop_item_media(${MEDIA})&publication_status=eq.published&sale_status=eq.available&order=reference`),
    read("specimens", `specimens?select=slug,mineral_name,mineral_id,mine_id,locality_id,department_code,provenance,locality_name,department_name,country,description,updated_at,mineral:minerals!specimens_mineral_id_fkey(name,slug),media:specimen_media(${MEDIA})&publication_status=eq.published&order=slug`),
    read("articles", `articles?select=id,slug,title,category,excerpt,body,published_on,updated_at,media:article_media(${MEDIA})&publication_status=eq.published&order=slug`),
    read("archive_documents", `archive_documents?select=id,slug,title,category,description,summary,cover_bucket,cover_path,document_date,updated_at&publication_status=eq.published&bucket_id=eq.site-media-public&order=slug`),
    read("glossary_terms", `glossary_terms?select=slug,term,domain,definition,updated_at&publication_status=eq.published&order=slug`),
    read("mines", `mines?select=id,slug,name,description,locality_id,updated_at&publication_status=eq.published&order=slug`),
    read("localities", `localities?select=id,slug,name,notes,department_code,updated_at&publication_status=eq.published&order=slug`),
    read("departments", `departments?select=code,name,region_id&order=code`),
    read("regions", `regions?select=id,name`),
    read("mineral_occurrences", `mineral_occurrences?select=mineral_id,department_code,locality_id`),
    read("article_mines", `article_mines?select=article_id,mine_id`), read("article_localities", `article_localities?select=article_id,locality_id`), read("article_departments", `article_departments?select=article_id,department_code`),
    read("archive_mines", `archive_mines?select=archive_id,mine_id`), read("archive_localities", `archive_localities?select=archive_id,locality_id`), read("archive_departments", `archive_departments?select=archive_id,department_code`)
  ]);
  const templates = Object.fromEntries(await Promise.all([["fiche", "fiche.html"], ["departement", "departement.html"], ["piece", "piece.html"], ["specimen", "specimen.html"], ["article", "article.html"], ["document", "document.html"], ["apprendre", "apprendre.html"]]
    .map(async ([key, file]) => [key, await readFile(path.join(ROOT, file), "utf8")])));

  const pages = [];
  const add = (type, id, page) => { const folder = slugify(id); if (folder) pages.push({ type, folder, ...page, url: `${SITE}/${FOLDERS[type]}/${folder}/` }); };

  // Photos libres des fiches minéraux (Wikimedia Commons) : image d'aperçu quand la fiche n'a pas de photo dans l'admin.
  const commons = JSON.parse(await readFile(path.join(ROOT, "assets/mineraux-photos/credits.json"), "utf8").catch(() => "{}"));
  const commonsUrl = slug => commons[slug] ? `${SITE}/assets/mineraux-photos/${commons[slug].photo}` : null;
  // Familles de minéraux (groupes) : même logique que la fiche affichée par JavaScript.
  const families = new Map();
  minerals.forEach(item => { if (item.mineral_group) { if (!families.has(item.mineral_group)) families.set(item.mineral_group, []); families.get(item.mineral_group).push(item); } });
  const mineralLink = item => `<a class="link" href="/${FOLDERS.mineral}/${slugify(item.slug)}/">${esc(item.name)}</a>`;
  minerals.forEach(item => {
    const photo = photoUrl(cfg, item.media) || commonsUrl(item.slug);
    const credit = photoUrl(cfg, item.media) ? (item.photo_credit ? `<p class="photo-credit">${esc(item.photo_credit)}</p>` : "")
      : commons[item.slug] ? `<p class="photo-credit">Photo : ${esc(commons[item.slug].author)} — <a href="${esc(commons[item.slug].licenseUrl || commons[item.slug].page)}" rel="noopener license">${esc(commons[item.slug].license)}</a>, via <a href="${esc(commons[item.slug].page)}" rel="noopener">Wikimedia Commons</a></p>` : "";
    const members = families.get(item.mineral_group) || [];
    const parent = members.find(member => member.slug === item.mineral_group);
    const others = members.filter(member => member.slug !== item.slug && member.slug !== parent?.slug);
    const family = members.length > 1 ? (parent?.slug === item.slug ? `<section class="fiche-section"><h2>Toutes les déclinaisons</h2><ul class="fiche-list">${others.map(member => `<li>${mineralLink(member)}</li>`).join("")}</ul></section>`
      : parent ? `<section class="fiche-section"><h2>Famille : ${esc(parent.name)}</h2><ul class="fiche-list">${[parent, ...others].map(member => `<li>${mineralLink(member)}</li>`).join("")}</ul></section>` : "") : "";
    const rows = [["Famille chimique", item.chemical_class], ["Système cristallin", item.crystal_system], ["Dureté (Mohs)", item.hardness == null ? null : item.hardness_max != null && Number(item.hardness_max) !== Number(item.hardness) ? `${formatNum(item.hardness)} à ${formatNum(item.hardness_max)}` : formatNum(item.hardness)],
      ["Densité", item.density == null ? null : item.density_max != null && Number(item.density_max) !== Number(item.density) ? `${formatNum(item.density)} à ${formatNum(item.density_max)}` : formatNum(item.density)],
      ["Couleurs", (item.colors || []).join(", ")], ["Trait", item.streak], ["Éclat", item.luster], ["Transparence", item.transparency], ["Clivage", item.cleavage], ["Cassure", item.fracture], ["Habitus", item.habit], ["Fluorescence", item.fluorescence],
      ["Formation et gisements", item.formation], ["Variétés", item.varieties], ["Confusions possibles", item.confusions], ["Étymologie", item.etymology]];
    item.visible = `<article class="seo-fiche"><div class="kicker">Minéral</div><h1 class="page-title">${esc(item.name)}</h1>${item.formula ? `<p class="meta">${esc(item.formula)}</p>` : ""}`
      + `${photo ? `<div class="fiche-photos"><img src="${esc(photo)}" alt="${esc(item.name)}"></div>` : ""}${credit}${item.description ? `<p class="seo-desc">${esc(item.description)}</p>` : ""}${dl("scientific-details", rows)}${family ? `<div>${family}</div>` : ""}`
      + `<p><a class="link" href="apprendre.html#mineraux">← Retour aux fiches minéraux</a></p></article>`;
    item.properties = rows.filter(([, value]) => value).map(([name, value]) => ({ "@type": "PropertyValue", name, value }));
    const facts = [item.chemical_class, item.crystal_system && `système ${item.crystal_system.toLowerCase()}`, item.hardness != null && `dureté ${span(item.hardness, item.hardness_max)}`, item.density != null && `densité ${span(item.density, item.density_max)}`].filter(Boolean).join(", ");
    add("mineral", item.slug, {
      template: "fiche", page: "fiche", params: `type=mineral&id=${item.slug}`, lastmod: day(item.updated_at), image: photoUrl(cfg, item.media) || commonsUrl(item.slug),
      title: mineralTitle(item), description: cut(`${item.name}${item.formula ? ` (${item.formula})` : ""} : ${facts}. ${item.description || ""}`),
      visible: item.visible,
      jsonld: [{ "@type": "WebPage", name: mineralTitle(item), description: cut(item.description || facts, 300), url: `${SITE}/${FOLDERS.mineral}/${slugify(item.slug)}/`, inLanguage: "fr", isPartOf: { "@type": "WebSite", name: "Jeremineralogie", url: `${SITE}/` },
        about: { "@type": "Thing", name: item.name, alternateName: item.formula || undefined, description: cut(item.description || facts, 500), image: (photo || commonsUrl(item.slug)) || undefined, additionalProperty: item.properties } },
        breadcrumb(...crumbs("mineral", item.name, `${SITE}/${FOLDERS.mineral}/${slugify(item.slug)}/`))]
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
      visible: `<div class="specimen"><div>${image ? `<div class="gallery-main"><img src="${esc(image)}" alt="${esc(name)}"></div>` : ""}</div><div class="details"><div class="kicker">Boutique</div><h1 class="page-title">${esc(name)}</h1>`
        + `${dl("", [["Référence", clean(item.reference)], ["Minéral", clean(item.mineral_name || item.mineral?.name)], ["Gisement", mine], ["Département", clean(item.department?.name)], ["Dimensions", clean(item.dimensions)]])}<div class="price">${esc(price)}</div></div></div>`
        + `${item.description ? `<div class="content"><h2>Description</h2>${p(item.description)}</div>` : ""}`,
      jsonld: { "@type": "Product", name: `${name}${mine ? ` — ${mine}` : ""}`, sku: item.reference || undefined, description: cut(item.description || name, 500), image: image ? [image] : undefined,
        offers: { "@type": "Offer", price: ((item.price_cents ?? 0) / 100).toFixed(2), priceCurrency: item.currency || "EUR", availability: "https://schema.org/InStock", url, seller: { "@type": "Organization", name: "Jeremineralogie" } } },
      extra: breadcrumb(...crumbs("piece", name, url))
    });
  });
  specimens.forEach(item => {
    const name = clean(item.mineral_name || item.mineral?.name) || "Spécimen";
    const place = clean(item.provenance || item.locality_name);
    const where = [place, clean(item.department_name), clean(item.country)].filter(Boolean).join(", ");
    add("specimen", item.slug, {
      template: "specimen", page: "specimen", params: `id=${item.slug}`, lastmod: day(item.updated_at), image: photoUrl(cfg, item.media),
      title: specimenTitle(name, place), description: cut(`${name}${where ? ` de ${where}` : ""}. ${item.description || "Spécimen de la collection Jeremineralogie."}`),
      visible: `<div class="specimen"><div>${photoUrl(cfg, item.media) ? `<div class="gallery-main"><img src="${esc(photoUrl(cfg, item.media))}" alt="${esc(name)}"></div>` : ""}</div><div class="details"><div class="kicker">Ma collection</div><h1 class="page-title">${esc(name)}</h1>${where ? `<p class="meta">${esc(where)}</p>` : ""}</div></div>`
        + `<div class="content section"><h2>Description du spécimen</h2>${p(item.description || "Spécimen de la collection Jeremineralogie.")}</div>`,
      jsonld: [{ "@type": "WebPage", name: specimenTitle(name, place), description: cut(item.description || name, 300), url: `${SITE}/${FOLDERS.specimen}/${slugify(item.slug)}/`, inLanguage: "fr", isPartOf: { "@type": "WebSite", name: "Jeremineralogie", url: `${SITE}/` },
        about: { "@type": "Thing", name: `${name}${place ? ` — ${place}` : ""}`, description: cut(item.description || name, 500), image: photoUrl(cfg, item.media) || undefined } },
        breadcrumb(...crumbs("specimen", name, `${SITE}/${FOLDERS.specimen}/${slugify(item.slug)}/`))]
    });
  });
  articles.forEach(item => {
    const paragraphs = blocksToText(item.body);
    const image = photoUrl(cfg, item.media);
    add("article", item.slug, {
      template: "article", page: "article", params: `slug=${item.slug}`, lastmod: day(item.updated_at), image, ogType: "article",
      title: articleTitle(item.title), description: cut(item.excerpt || paragraphs[0] || item.title),
      visible: `<article class="article-full"><div class="kicker">${esc(categoryLabel(item.category))}</div><div class="meta">${esc(dateFr(item.published_on))}</div><h1 class="visually-hidden">${esc(item.title)}</h1>${paragraphs.map(p).join("")}</article>`,
      extra: breadcrumb(...crumbs("article", item.title, `${SITE}/${FOLDERS.article}/${slugify(item.slug)}/`)),
      jsonld: { "@type": "Article", headline: item.title, datePublished: item.published_on || undefined, dateModified: day(item.updated_at) || undefined, image: image ? [image] : undefined, author: { "@type": "Organization", name: "Jeremineralogie", url: `${SITE}/` }, publisher: { "@type": "Organization", name: "Jeremineralogie", url: `${SITE}/` }, mainEntityOfPage: `${SITE}/${FOLDERS.article}/${slugify(item.slug)}/`, inLanguage: "fr" }
    });
  });
  archives.forEach(item => {
    add("archive", item.slug, {
      template: "document", page: "document", params: `slug=${item.slug}`, lastmod: day(item.updated_at),
      image: item.cover_path ? photoUrl(cfg, [{ bucket_id: item.cover_bucket || "site-media-public", storage_path: item.cover_path, position: 0 }]) : null,
      title: documentTitle(item.title), description: cut(item.summary || item.description || `${item.title} — ${categoryLabel(item.category)}, archives et documentation Jeremineralogie.`),
      visible: `<article class="content doc-full"><div class="kicker">${esc(categoryLabel(item.category))}</div><h1 class="page-title">${esc(item.title)}</h1><div class="meta">${esc(dateFr(item.document_date))}</div>${p(item.description || item.summary)}</article>`,
      jsonld: [{ "@type": "CreativeWork", name: item.title, description: cut(item.summary || item.description || item.title, 300), url: `${SITE}/${FOLDERS.archive}/${slugify(item.slug)}/`, inLanguage: "fr", dateCreated: item.document_date || undefined, dateModified: day(item.updated_at) || undefined, publisher: { "@type": "Organization", name: "Jeremineralogie", url: `${SITE}/` } },
        breadcrumb(...crumbs("archive", item.title, `${SITE}/${FOLDERS.archive}/${slugify(item.slug)}/`))]
    });
  });
  // ----- Gisements, communes et départements : pages fabriquées à partir de ce qui est publié et lié (mises à jour chaque nuit) -----
  const set = (rows, key) => new Set(rows.map(row => row[key]).filter(Boolean));
  const byId = rows => new Map(rows.map(row => [row.id, row]));
  const mineralById = byId(minerals), articleById = byId(articles), archiveById = byId(archives), localityById = byId(localities), mineById = byId(mines);
  const regionById = new Map(regions.map(region => [region.id, region.name]));
  const departmentByCode = new Map(departments.map(department => [department.code, department]));
  const departmentSlug = department => slugify(department.name) || slugify(department.code);
  const href = (type, slug) => `/${FOLDERS[type]}/${slugify(slug)}/`;
  const nameOfPiece = row => clean(row.mineral_name || row.mineral?.name) || clean(row.title) || "Spécimen";
  const specimenEntry = row => ({ title: clean(row.mineral_name || row.mineral?.name) || "Spécimen", meta: [row.provenance, row.locality_name].filter(Boolean).map(clean).join(" · "), href: href("specimen", row.slug) });
  const pieceEntry = row => ({ title: nameOfPiece(row), meta: [clean(row.mine?.name), clean(row.reference)].filter(Boolean).join(" · "), href: href("piece", row.reference || row.slug) });
  const articleEntry = row => ({ title: row.title, meta: categoryLabel(row.category), href: href("article", row.slug) });
  const archiveEntry = row => ({ title: row.title, meta: categoryLabel(row.category), href: href("archive", row.slug) });
  const mineralEntry = row => ({ title: row.name, meta: "", href: href("mineral", row.slug) });
  const listBlock = (title, entries, tag = "section", heading = "h2", cls = "fiche-section", listCls = "fiche-list") => entries.length
    ? `<${tag}${cls ? ` class="${cls}"` : ""}><${heading}>${esc(title)}</${heading}><ul${listCls ? ` class="${listCls}"` : ""}>${entries.map(entry => `<li><a class="link" href="${esc(entry.href)}">${esc(entry.title)}</a>${entry.meta ? ` — ${esc(entry.meta)}` : ""}</li>`).join("")}</ul></${tag}>` : "";
  const uniqueBy = (rows, key) => [...new Map(rows.filter(row => row[key]).map(row => [row[key], row])).values()];
  const mineralsOf = (specimenRows, pieceRows, occurrenceRows = []) => uniqueBy([...specimenRows.map(row => mineralById.get(row.mineral_id) || (row.mineral?.slug ? row.mineral : null)), ...pieceRows.map(row => mineralById.get(row.mineral_id) || (row.mineral?.slug ? row.mineral : null)), ...occurrenceRows.map(row => mineralById.get(row.mineral_id))].filter(Boolean), "slug").sort((a, b) => a.name.localeCompare(b.name, "fr"));
  const articlesOf = (...linkSets) => uniqueBy(linkSets.flat().map(link => articleById.get(link.article_id)).filter(Boolean), "slug");
  const archivesOf = (...linkSets) => uniqueBy(linkSets.flat().map(link => archiveById.get(link.archive_id)).filter(Boolean), "slug");
  const backLink = `<p><a class="link" href="collection.html">← Retour à Ma collection</a></p>`;
  const stripe = rows => rows.sort((a, b) => String(a.slug || a.reference || "").localeCompare(String(b.slug || b.reference || "")));

  mines.forEach(mine => {
    const locality = localityById.get(mine.locality_id), department = departmentByCode.get(locality?.department_code);
    const sp = specimens.filter(row => row.mine_id === mine.id), sh = pieces.filter(row => row.mine_id === mine.id);
    const ms = mineralsOf(sp, sh), ar = articlesOf(articleMines.filter(link => link.mine_id === mine.id)), dc = archivesOf(archiveMines.filter(link => link.mine_id === mine.id));
    const place = [locality?.name, department?.name].filter(Boolean).join(", ");
    const url = `${SITE}${href("mine", mine.slug)}`;
    add("mine", mine.slug, {
      template: "fiche", page: "fiche", params: `type=mine&id=${mine.slug}`, lastmod: day(mine.updated_at), image: photoUrl(cfg, sp[0]?.media || sh[0]?.media),
      title: mineTitle(mine.name, locality?.name), description: cut(`${mine.name}${place ? ` (${place})` : ""} : gisement${ms.length ? `, minéraux : ${ms.map(row => row.name).join(", ")}` : ""}. ${mine.description || ""}`),
      visible: `<article class="seo-fiche"><div class="kicker">Gisement</div><h1 class="page-title">${esc(mine.name)}</h1>${locality ? `<p class="meta">Commune : <a class="link" href="${href("locality", locality.slug)}">${esc(locality.name)}</a></p>` : ""}`
        + `${mine.description ? `<p class="seo-desc">${esc(mine.description)}</p>` : ""}${listBlock("Dans ma collection", sp.map(specimenEntry))}${listBlock("Disponible en boutique", sh.map(pieceEntry))}${listBlock("Minéraux de ce gisement dans ma collection", ms.map(mineralEntry))}${listBlock("Articles", ar.map(articleEntry))}${listBlock("Archives & documentation", dc.map(archiveEntry))}${backLink}</article>`,
      jsonld: [{ "@type": "Place", name: mine.name, description: cut(mine.description || `Gisement ${mine.name}`, 400), url, containedInPlace: locality ? { "@type": "Place", name: locality.name } : undefined },
        breadcrumb(["Accueil", `${SITE}/`], ...(department ? [[department.name, `${SITE}${href("department", departmentSlug(department))}`]] : []), ...(locality ? [[locality.name, `${SITE}${href("locality", locality.slug)}`]] : []), [mine.name, url])]
    });
  });

  localities.forEach(locality => {
    const department = departmentByCode.get(locality.department_code);
    const lm = mines.filter(mine => mine.locality_id === locality.id), mineIds = new Set(lm.map(mine => mine.id));
    const sp = specimens.filter(row => row.locality_id === locality.id || mineIds.has(row.mine_id)), sh = pieces.filter(row => row.locality_id === locality.id || mineIds.has(row.mine_id));
    const ms = mineralsOf(sp, sh, occurrences.filter(row => row.locality_id === locality.id));
    const ar = articlesOf(articleLocalities.filter(link => link.locality_id === locality.id), articleMines.filter(link => mineIds.has(link.mine_id)));
    const dc = archivesOf(archiveLocalities.filter(link => link.locality_id === locality.id), archiveMines.filter(link => mineIds.has(link.mine_id)));
    const url = `${SITE}${href("locality", locality.slug)}`;
    add("locality", locality.slug, {
      template: "fiche", page: "fiche", params: `type=locality&id=${locality.slug}`, lastmod: day(locality.updated_at), image: photoUrl(cfg, sp[0]?.media || sh[0]?.media),
      title: localityTitle(locality.name, department?.name), description: cut(`${locality.name}${department ? ` (${department.name})` : ""} : ${lm.length ? `gisements ${lm.map(mine => mine.name).join(", ")}` : "commune"}${ms.length ? `, minéraux : ${ms.map(row => row.name).join(", ")}` : ""}. ${locality.notes || ""}`),
      visible: `<article class="seo-fiche"><div class="kicker">Commune</div><h1 class="page-title">${esc(locality.name)}</h1>${department ? `<p class="meta">${esc(department.name)}${/^(2[AB]|\d{2,3})$/i.test(department.code) ? ` · ${esc(department.code)}` : ""}</p>` : ""}`
        + `${locality.notes ? `<p class="seo-desc">${esc(locality.notes)}</p>` : ""}${listBlock("Gisements de cette commune", lm.map(mine => ({ title: mine.name, meta: "", href: href("mine", mine.slug) })))}${listBlock("Dans ma collection", sp.map(specimenEntry))}${listBlock("Disponible en boutique", sh.map(pieceEntry))}${listBlock("Minéraux", ms.map(mineralEntry))}${listBlock("Articles", ar.map(articleEntry))}${listBlock("Archives & documentation", dc.map(archiveEntry))}${backLink}</article>`,
      jsonld: [{ "@type": "Place", name: locality.name, description: cut(locality.notes || `Commune de ${locality.name}`, 400), url, containedInPlace: department ? { "@type": "AdministrativeArea", name: department.name } : undefined },
        breadcrumb(["Accueil", `${SITE}/`], ...(department ? [[department.name, `${SITE}${href("department", departmentSlug(department))}`]] : []), [locality.name, url])]
    });
  });

  const departmentPages = [];
  departments.forEach(department => {
    const dl = localities.filter(locality => locality.department_code === department.code), localityIds = new Set(dl.map(locality => locality.id));
    const dm = mines.filter(mine => localityIds.has(mine.locality_id)), mineIds = new Set(dm.map(mine => mine.id));
    const sp = specimens.filter(row => row.department_code === department.code || localityIds.has(row.locality_id) || mineIds.has(row.mine_id));
    const sh = pieces.filter(row => row.department_code === department.code || localityIds.has(row.locality_id) || mineIds.has(row.mine_id));
    const ms = mineralsOf(sp, sh, occurrences.filter(row => row.department_code === department.code));
    const ar = articlesOf(articleDepartments.filter(link => link.department_code === department.code), articleLocalities.filter(link => localityIds.has(link.locality_id)), articleMines.filter(link => mineIds.has(link.mine_id)));
    const dc = archivesOf(archiveDepartments.filter(link => link.department_code === department.code), archiveLocalities.filter(link => localityIds.has(link.locality_id)), archiveMines.filter(link => mineIds.has(link.mine_id)));
    const empty = !(sp.length || sh.length || dl.length || dm.length || ms.length || ar.length || dc.length);
    const slug = departmentSlug(department), url = `${SITE}${href("department", slug)}`;
    const region = regionById.get(department.region_id);
    const label = /^(2[AB]|\d{2,3})$/i.test(department.code) ? `${department.name} (${department.code})` : department.name;
    const block3 = (title, entries) => `<div><h3>${esc(title)}</h3>${entries.length ? `<ul>${entries.map(entry => `<li><a class="link" href="${esc(entry.href)}">${esc(entry.title)}${entry.meta ? ` — ${esc(entry.meta)}` : ""}</a></li>`).join("")}</ul>` : "<p>Aucune donnée publiée.</p>"}</div>`;
    const detail = `<div class="department-code">Département ${esc(department.code)}</div><h2>${esc(department.name)}</h2><p>${region ? `Région : ${esc(region)}` : "Référentiel géographique Jeremineralogie."}</p>`;
    const live = `<h2>Données publiées du référentiel</h2>${block3("Spécimens de ma collection", sp.map(specimenEntry))}${block3("Pièces disponibles en boutique", sh.map(pieceEntry))}${block3("Communes publiées", dl.map(locality => ({ title: locality.name, meta: "", href: href("locality", locality.slug) })))}${block3("Mines et gisements publiés", dm.map(mine => ({ title: mine.name, meta: "", href: href("mine", mine.slug) })))}${block3("Minéraux documentés", ms.map(mineralEntry))}${block3("Archives et documents associés", dc.map(archiveEntry))}${block3("Articles associés", ar.map(articleEntry))}`;
    departmentPages.push({ empty, department, slug });
    add("department", slug, {
      template: "departement", page: "departement", params: `dep=${department.code}`, lastmod: empty ? null : undefined, noindex: empty,
      title: departmentTitle(department.name, /^(2[AB]|\d{2,3})$/i.test(department.code) ? department.code : ""),
      description: cut(`${label}${region ? `, ${region}` : ""} : ${[dm.length && `gisements ${dm.map(mine => mine.name).join(", ")}`, dl.length && `communes ${dl.map(locality => locality.name).join(", ")}`, ms.length && `minéraux ${ms.map(row => row.name).join(", ")}`].filter(Boolean).join(" ; ") || "minéraux, gisements et pièces du département"}.`),
      departmentDetail: detail, departmentLive: live,
      jsonld: [{ "@type": "CollectionPage", name: `Minéraux et gisements : ${label}`, url, inLanguage: "fr", about: { "@type": "AdministrativeArea", name: department.name } }],
      extra: breadcrumb(["Accueil", `${SITE}/`], ["Départements", `${SITE}/departement.html`], [department.name, url])
    });
  });

  terms.forEach(item => {
    add("term", item.slug, {
      template: "apprendre", page: "apprendre", params: `terme=${item.slug}`, tab: "glossaire", lastmod: day(item.updated_at),
      title: termTitle(item.term), description: cut(`${item.term} (${DOMAINS[item.domain] || "glossaire"}) : ${item.definition}`),
      hidden: block(item.term, item.definition),
      jsonld: { "@type": "DefinedTerm", name: item.term, description: item.definition, inDefinedTermSet: `${SITE}/apprendre.html#glossaire` },
      extra: breadcrumb(...crumbs("term", item.term, `${SITE}/${FOLDERS.term}/${slugify(item.slug)}/`))
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
  const urls = [...STATIC_PAGES.map(file => ({ loc: `${SITE}/${file}` })), ...unique.filter(page => !page.noindex).map(page => ({ loc: page.url, lastmod: page.lastmod }))];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(entry => `  <url><loc>${esc(entry.loc)}</loc>${entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ""}</url>`).join("\n")}\n</urlset>\n`;
  await writeFile(path.join(ROOT, "sitemap.xml"), sitemap);
  const counts = Object.keys(FOLDERS).map(type => `${type}: ${unique.filter(page => page.type === type).length}`).join(", ");
  console.log(`Pages générées : ${unique.length} (${counts}). Plan du site : ${urls.length} adresses.`);
}

main().catch(error => { console.error(error); process.exit(1); });
