import { fitCardText } from "./card-fit.js";
import { getSupabase } from "./supabase-client.js";
import { publicMediaUrl, shopItemName } from "./content-repository.js";
import { pieceUrl, articleUrl, documentUrl, specimenUrl } from "./detail-nav.js";
import { ficheUrl } from "./entity-links.js";
import { categoryLabel } from "./reference-resolver.js";
import { dailyMinerals, mountGames } from "./games.js";
import { commonsPhoto, creditLine, loadMineralPhotos } from "./mineral-photos.js";

// Page d'accueil : nouveautés, minéral du jour, jeux du jour (trouve le minéral, quiz, devine le gisement) et badges, chiffres du site.
const client = getSupabase();
const home = document.querySelector("#home");
const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text != null) node.textContent = text; return node; };
const num = value => Number(value).toLocaleString("fr-FR", { maximumFractionDigits: 2 });
const span = (min, max) => min == null ? "" : max != null && Number(max) !== Number(min) ? `${num(min)} à ${num(max)}` : num(min);
const firstPhoto = media => (media || []).filter(item => item.bucket_id === "site-media-public" && item.storage_path).sort((a, b) => a.position - b.position)[0];
const dateFr = value => value ? new Intl.DateTimeFormat("fr-FR").format(new Date(`${String(value).slice(0, 10)}T00:00:00`)) : "";


function cardPhoto(card, url, alt) {
  if (url) { const image = el("img"); image.src = url; image.alt = alt; image.loading = "lazy"; card.append(image); }
  else { const placeholder = el("div", "card-photo-placeholder", "Photographie à ajouter"); placeholder.setAttribute("role", "img"); card.append(placeholder); }
}
function shopCard(item) {
  const card = el("a", "card card-boutique"); card.href = pieceUrl(item);
  const photo = firstPhoto(item.media);
  cardPhoto(card, photo && publicMediaUrl(client, photo), shopItemName(item));
  const body = el("div", "card-body");
  body.append(el("h3", "", shopItemName(item)), el("div", "meta", item.mine?.name || item.provenance || item.locality_name || item.locality?.name || ""),
    el("div", "price", new Intl.NumberFormat("fr-FR", { style: "currency", currency: item.currency || "EUR" }).format((item.price_cents ?? 0) / 100)), el("div", "more", "Voir la fiche"));
  card.append(body); queueMicrotask(() => fitCardText(card)); return card;
}
function specimenCard(row) {
  const card = el("a", "card card-specimen"); card.href = specimenUrl({ id: row.slug });
  const photo = firstPhoto(row.media); const name = row.mineral_name || row.mineral?.name || "Spécimen";
  cardPhoto(card, photo && publicMediaUrl(client, photo), name);
  const body = el("div", "card-body");
  body.append(el("h3", "", name), el("div", "place", [row.provenance || row.locality_name, row.department_name].filter(Boolean).join(" · ")));
  card.append(body); return card;
}
function readCard(row, kind) {
  const card = el("a", "card card-wide"); card.href = kind === "article" ? articleUrl(row) : documentUrl(row);
  const photo = kind === "article" ? firstPhoto(row.media) : row.cover_path ? { bucket_id: row.cover_bucket || "site-media-public", storage_path: row.cover_path } : null;
  if (photo) { const image = el("img"); image.src = publicMediaUrl(client, photo); image.alt = row.title; image.loading = "lazy"; card.append(image); }
  const body = el("div", "card-body");
  body.append(el("div", "kicker", kind === "article" ? "Article" : "Archive"), el("h3", "", row.title),
    el("div", "meta", [categoryLabel(row.category), dateFr(kind === "article" ? row.published_on : row.document_date)].filter(Boolean).join(" · ")));
  const summary = kind === "article" ? row.excerpt : row.summary;
  if (summary) body.append(el("p", "summary", summary));
  card.append(body); return card;
}
function fillGroup(id, cards) {
  const group = document.querySelector(id);
  if (!cards.length) return;
  group.querySelector("[data-grid]").replaceChildren(...cards);
  group.hidden = false;
}

// ----- Minéral du jour -----
async function renderDaily(mineral) {
  const panel = document.querySelector("#home-daily");
  const body = panel.querySelector("[data-body]");
  const box = el("div", "daily");
  const photo = firstPhoto(mineral.media);
  if (photo) {
    const image = el("img", "daily-photo"); image.src = publicMediaUrl(client, photo); image.alt = mineral.name; image.loading = "lazy"; box.append(image);
    if (mineral.photo_credit) box.append(el("p", "photo-credit", mineral.photo_credit));
  }
  else {
    // Sans photo ajoutée dans l'admin : photo libre de Wikimedia Commons, avec son crédit.
    const commons = commonsPhoto(await loadMineralPhotos(), mineral.slug);
    if (commons) { const image = el("img", "daily-photo"); image.src = commons.src; image.alt = mineral.name; image.loading = "lazy"; box.append(image, creditLine(commons)); }
  }
  const name = el("a", "daily-name", mineral.name); name.href = ficheUrl("mineral", mineral.slug);
  box.append(name);
  if (mineral.formula) box.append(el("div", "daily-formula", mineral.formula));
  const facts = el("dl", "daily-facts");
  [["Famille", mineral.chemical_class], ["Système", mineral.crystal_system], ["Dureté", span(mineral.hardness, mineral.hardness_max)], ["Densité", span(mineral.density, mineral.density_max)]]
    .forEach(([label, value]) => { if (value) facts.append(el("dt", "", label), el("dd", "", value)); });
  box.append(facts);
  if (mineral.description) box.append(el("p", "daily-text", mineral.description));
  const more = el("a", "link", "Voir la fiche complète →"); more.href = ficheUrl("mineral", mineral.slug);
  box.append(more);
  body.replaceChildren(box); panel.hidden = false;
}

// ----- Chiffres -----
function renderStats(values) {
  const panel = document.querySelector("#home-stats");
  const body = panel.querySelector("[data-body]");
  body.replaceChildren(...values.filter(([, value]) => value > 0).map(([label, value, href]) => {
    const tile = el("a", "home-stat"); tile.href = href;
    tile.append(el("strong", "", value.toLocaleString("fr-FR")), el("span", "", label));
    return tile;
  }));
  panel.hidden = !body.children.length;
}

async function communesOnMap() {
  const pick = async query => { const { data, error } = await query; if (error) throw error; return data || []; };
  const [localities, mines, specimens, shop, articleLinks, archiveLinks] = await Promise.all([
    pick(client.from("localities").select("id").eq("publication_status", "published").not("latitude", "is", null)),
    pick(client.from("mines").select("id,locality_id").eq("publication_status", "published")),
    pick(client.from("specimens").select("locality_id,mine_id").eq("publication_status", "published")),
    pick(client.from("shop_items").select("locality_id,mine_id").eq("publication_status", "published").eq("sale_status", "available")),
    pick(client.from("article_localities").select("locality_id")), pick(client.from("archive_localities").select("locality_id"))
  ]);
  const located = new Set(localities.map(row => row.id));
  const mineLocality = new Map(mines.map(row => [row.id, row.locality_id]));
  const used = new Set();
  [...specimens, ...shop].forEach(row => { const id = row.locality_id || mineLocality.get(row.mine_id); if (located.has(id)) used.add(id); });
  [...articleLinks, ...archiveLinks].forEach(row => { if (located.has(row.locality_id)) used.add(row.locality_id); });
  return used.size;
}

async function load() {
  if (!client) return;
  const safe = (label, task, fallback) => task().catch(error => { console.error(`Accueil — ${label} :`, error); return fallback; });
  const rows = async query => { const { data, error } = await query; if (error) throw error; return data || []; };
  const total = async query => { const { count, error } = await query; if (error) throw error; return count || 0; };
  const [shop, specimens, articles, archives, minerals, counts, communes] = await Promise.all([
    safe("boutique", () => rows(client.from("shop_items").select("slug,reference,title,mineral_name,provenance,locality_name,price_cents,currency,mineral:minerals!shop_items_mineral_id_fkey(name),mine:mines!shop_items_mine_id_fkey(name),locality:localities!shop_items_locality_id_fkey(name),media:shop_item_media(bucket_id,storage_path,position)")
      .eq("publication_status", "published").eq("sale_status", "available").order("created_at", { ascending: false }).limit(4)), []),
    safe("collection", () => rows(client.from("specimens").select("slug,mineral_name,provenance,locality_name,department_name,mineral:minerals!specimens_mineral_id_fkey(name),media:specimen_media(bucket_id,storage_path,position)")
      .eq("publication_status", "published").order("created_at", { ascending: false }).limit(4)), []),
    safe("articles", () => rows(client.from("articles").select("slug,title,category,published_on,excerpt,media:article_media(bucket_id,storage_path,position)")
      .eq("publication_status", "published").order("published_on", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }).limit(1)), []),
    safe("archives", () => rows(client.from("archive_documents").select("slug,title,category,document_date,summary,cover_bucket,cover_path")
      .eq("publication_status", "published").order("created_at", { ascending: false }).limit(1)), []),
    safe("minéraux", () => rows(client.from("minerals").select("id,name,slug,photo_credit,formula,chemical_class,crystal_system,hardness,hardness_max,density,density_max,streak,luster,transparency,colors,description,media:mineral_media(bucket_id,storage_path,position)")
      .eq("publication_status", "published").order("slug")), []),
    safe("chiffres", () => Promise.all([
      total(client.from("specimens").select("id", { count: "exact", head: true }).eq("publication_status", "published")),
      total(client.from("shop_items").select("id", { count: "exact", head: true }).eq("publication_status", "published").eq("sale_status", "available")),
      total(client.from("glossary_terms").select("id", { count: "exact", head: true }).eq("publication_status", "published")),
      total(client.from("articles").select("id", { count: "exact", head: true }).eq("publication_status", "published")),
      total(client.from("archive_documents").select("id", { count: "exact", head: true }).eq("publication_status", "published"))
    ]), [0, 0, 0, 0, 0]),
    safe("communes", communesOnMap, 0)
  ]);

  fillGroup("#home-shop", shop.map(shopCard));
  fillGroup("#home-collection", specimens.map(specimenCard));
  fillGroup("#home-reads", [...articles.map(row => readCard(row, "article")), ...archives.map(row => readCard(row, "archive"))]);

  const { daily } = dailyMinerals(minerals);
  if (daily) void renderDaily(daily);
  void mountGames(document.querySelector("#home-games [data-games]"), { client, minerals });
  const [specimenCount, shopCount, termCount, articleCount, archiveCount] = counts;
  const plural = (count, one, many) => count > 1 ? many : one;
  renderStats([
    [plural(specimenCount, "spécimen dans ma collection", "spécimens dans ma collection"), specimenCount, "collection.html"],
    [plural(shopCount, "pièce en boutique", "pièces en boutique"), shopCount, "boutique.html"],
    [plural(communes, "commune sur la carte", "communes sur la carte"), communes, "carte.html"],
    [plural(minerals.length, "fiche minéral", "fiches minéraux"), minerals.length, "apprendre.html#mineraux"],
    [plural(termCount, "terme du glossaire", "termes du glossaire"), termCount, "apprendre.html#glossaire"],
    [plural(articleCount, "article", "articles"), articleCount, "articles.html"],
    [plural(archiveCount, "document d’archive", "documents d’archive"), archiveCount, "archives.html"]
  ]);
  home.hidden = false;
}

void load();
