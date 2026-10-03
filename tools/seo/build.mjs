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
    ...[].concat(page.jsonld || [], page.extra || []).map(jsonLd),
    `<script>window.JM_PARAMS=${JSON.stringify(page.params)};window.JM_PAGE=${JSON.stringify(page.page)};${page.tab ? `window.JM_TAB=${JSON.stringify(page.tab)};` : ""}</script>`
  ].filter(Boolean).join("");
  let html = template;
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
  const [minerals, pieces, specimens, articles, archives, terms] = await Promise.all([
    read("minerals", `minerals?select=slug,name,formula,chemical_class,crystal_system,hardness,hardness_max,density,density_max,colors,streak,luster,transparency,cleavage,fracture,habit,fluorescence,varieties,confusions,etymology,photo_credit,mineral_group,is_group,description,formation,updated_at,media:mineral_media(${MEDIA})&publication_status=eq.published&order=slug`),
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
  const urls = [...STATIC_PAGES.map(file => ({ loc: `${SITE}/${file}` })), ...unique.map(page => ({ loc: page.url, lastmod: page.lastmod }))];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(entry => `  <url><loc>${esc(entry.loc)}</loc>${entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ""}</url>`).join("\n")}\n</urlset>\n`;
  await writeFile(path.join(ROOT, "sitemap.xml"), sitemap);
  const counts = Object.keys(FOLDERS).map(type => `${type}: ${unique.filter(page => page.type === type).length}`).join(", ");
  console.log(`Pages générées : ${unique.length} (${counts}). Plan du site : ${urls.length} adresses.`);
}

main().catch(error => { console.error(error); process.exit(1); });
