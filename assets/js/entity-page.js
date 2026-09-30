import { shopItemName } from "./content-repository.js";
import { getSupabase } from "./supabase-client.js";
import { categoryLabel } from "./reference-resolver.js";
import { ficheUrl } from "./entity-links.js";
import { pieceUrl, articleUrl, documentUrl } from "./detail-nav.js";

// Fiche générique d'un minéral, d'un gisement ou d'une commune : fiche.html?type=mineral|mine|locality&id=<slug>.
const KINDS = {
  mine: { table: "mines", label: "Gisement", fk: "mine_id", select: "id,name,slug,description,locality:localities(name,slug)", articles: ["article_mines", "mine_id"], archives: ["archive_mines", "mine_id"] },
  mineral: { table: "minerals", label: "Minéral", fk: "mineral_id", select: "*", articles: ["article_minerals", "mineral_id"], archives: ["archive_minerals", "mineral_id"] },
  locality: { table: "localities", label: "Commune", fk: "locality_id", select: "id,name,slug,notes,department_code,department:departments(name)", articles: ["article_localities", "locality_id"], archives: ["archive_localities", "locality_id"] }
};
const params = new URLSearchParams(location.search);
const kind = KINDS[params.get("type")];
const slug = params.get("id");
const client = getSupabase();
const status = document.querySelector("#fiche-status");
const root = document.querySelector("#fiche");
const sectionsBox = document.querySelector("#fiche-sections");

const publicUrl = media => media && media.bucket_id === "site-media-public" && media.storage_path ? client.storage.from(media.bucket_id).getPublicUrl(media.storage_path).data.publicUrl : "";
const firstPhoto = media => publicUrl((media || []).filter(item => item.bucket_id === "site-media-public").sort((a, b) => a.position - b.position)[0]);
async function safely(label, task, fallback) { try { return await task(); } catch (error) { console.error(`Fiche ${label} :`, error); return fallback; } }

function section(title, ...children) {
  const box = document.createElement("section"); box.className = "fiche-section";
  const heading = document.createElement("h2"); heading.textContent = title; box.append(heading, ...children); sectionsBox.append(box);
}
function cards(items) {
  const grid = document.createElement("div"); grid.className = "grid";
  items.forEach(item => {
    const card = document.createElement("a"); card.className = "card"; card.href = item.href;
    if (item.photo) { const image = document.createElement("img"); image.src = item.photo; image.alt = item.title; image.loading = "lazy"; card.append(image); }
    const body = document.createElement("div"); body.className = "card-body";
    const title = document.createElement("h3"); title.textContent = item.title; body.append(title);
    if (item.meta) { const meta = document.createElement("div"); meta.className = "meta"; meta.textContent = item.meta; body.append(meta); }
    card.append(body); grid.append(card);
  });
  return grid;
}
function linkList(items) {
  const list = document.createElement("ul"); list.className = "fiche-list";
  items.forEach(item => { const li = document.createElement("li"); const a = document.createElement("a"); a.className = "link"; a.href = item.href; a.textContent = item.title; li.append(a); if (item.meta) li.append(` — ${item.meta}`); list.append(li); });
  return list;
}
const unique = (items, key) => [...new Map(items.filter(item => item[key]).map(item => [item[key], item])).values()];

async function load() {
  if (!kind || !slug) return notFound();
  if (!client) throw new Error("La connexion à Supabase n’est pas configurée.");
  const { data: entity, error } = await client.from(kind.table).select(kind.select).eq("slug", slug).maybeSingle();
  if (error) throw error;
  if (!entity) return notFound();
  document.title = `${entity.name} — Jeremineralogie`;
  document.querySelector("#fiche-kind").textContent = kind.label;
  document.querySelector("#fiche-title").textContent = entity.name;
  const description = entity.description ?? entity.notes ?? "";
  document.querySelector("#fiche-description").textContent = description;
  document.querySelector("#fiche-description").hidden = !description;
  const subtitle = document.querySelector("#fiche-subtitle");
  subtitle.replaceChildren();
  if (kind === KINDS.mine && entity.locality) { const a = document.createElement("a"); a.className = "link"; a.href = ficheUrl("locality", entity.locality.slug); a.textContent = entity.locality.name; subtitle.append("Commune : ", a); }
  if (kind === KINDS.locality) { subtitle.textContent = [entity.department?.name, entity.department_code].filter(Boolean).join(" · "); if (entity.department_code) { const a = document.createElement("a"); a.className = "link"; a.href = `departement.html?dep=${encodeURIComponent(entity.department_code)}`; a.textContent = "Voir le département"; subtitle.append(" · ", a); } }
  if (kind === KINDS.mineral) subtitle.textContent = entity.formula || "";
  subtitle.hidden = !subtitle.childNodes.length;
  const science = document.querySelector("#fiche-scientific"); science.replaceChildren();
  if (kind === KINDS.mineral) {
    Object.entries({ crystal_system: "Système cristallin", hardness: "Dureté", density: "Densité", colors: "Couleurs", luster: "Éclat", cleavage: "Clivage", habit: "Habitus", formation: "Formation" }).forEach(([key, label]) => {
      const value = entity[key]; if (value == null || value === "" || (Array.isArray(value) && !value.length)) return;
      const term = document.createElement("dt"); term.textContent = label; const detail = document.createElement("dd"); detail.textContent = Array.isArray(value) ? value.join(", ") : String(value); science.append(term, detail);
    });
  }
  sectionsBox.replaceChildren();

  const [specimens, shop, articles, archives, mines] = await Promise.all([
    safely("collection", async () => {
      const { data, error: e } = await client.from("specimens").select("slug,mineral_name,provenance,locality_name,mineral:minerals!specimens_mineral_id_fkey(name,slug),mine:mines!specimens_mine_id_fkey(name,slug),media:specimen_media(bucket_id,storage_path,position)")
        .eq(kind.fk, entity.id).eq("publication_status", "published").order("created_at", { ascending: false });
      if (e) throw e; return data || [];
    }, []),
    safely("boutique", async () => {
      const { data, error: e } = await client.from("shop_items").select("slug,reference,title,mineral_name,price_cents,currency,mineral:minerals!shop_items_mineral_id_fkey(name),media:shop_item_media(bucket_id,storage_path,position)")
        .eq(kind.fk, entity.id).eq("publication_status", "published").eq("sale_status", "available");
      if (e) throw e; return data || [];
    }, []),
    safely("articles", async () => {
      const { data, error: e } = await client.from(kind.articles[0]).select("article:articles(slug,title,category)").eq(kind.articles[1], entity.id);
      if (e) throw e; return (data || []).map(row => row.article).filter(Boolean);
    }, []),
    safely("archives", async () => {
      const { data, error: e } = await client.from(kind.archives[0]).select("archive:archive_documents(slug,title,category)").eq(kind.archives[1], entity.id);
      if (e) throw e; return (data || []).map(row => row.archive).filter(Boolean);
    }, []),
    kind === KINDS.locality ? safely("gisements", async () => {
      const { data, error: e } = await client.from("mines").select("name,slug").eq("locality_id", entity.id).order("name");
      if (e) throw e; return data || [];
    }, []) : Promise.resolve([])
  ]);

  const label = row => row.mineral_name ?? row.mineral?.name ?? "Spécimen";
  if (specimens.length) section("Dans ma collection", cards(specimens.map(row => ({ title: label(row), meta: [row.provenance, row.locality_name].filter(Boolean).join(" · "), href: `specimen.html?id=${encodeURIComponent(row.slug)}`, photo: firstPhoto(row.media) }))));
  if (shop.length) section("Disponible en boutique", cards(shop.map(row => ({ title: shopItemName(row), meta: new Intl.NumberFormat("fr-FR", { style: "currency", currency: row.currency || "EUR" }).format((row.price_cents ?? 0) / 100), href: pieceUrl(row), photo: firstPhoto(row.media) }))));
  if (kind === KINDS.locality && mines.length) section("Gisements de cette commune", linkList(mines.map(row => ({ title: row.name, href: ficheUrl("mine", row.slug) }))));
  if (kind === KINDS.mineral) { const list = unique(specimens.map(row => row.mine).filter(Boolean), "slug"); if (list.length) section("Gisements dans ma collection", linkList(list.map(row => ({ title: row.name, href: ficheUrl("mine", row.slug) })))); }
  if (kind === KINDS.mine) { const list = unique(specimens.map(row => row.mineral).filter(Boolean), "slug"); if (list.length) section("Minéraux de ce gisement dans ma collection", linkList(list.map(row => ({ title: row.name, href: ficheUrl("mineral", row.slug) })))); }
  if (articles.length) section("Articles", linkList(articles.map(row => ({ title: row.title, meta: categoryLabel(row.category), href: articleUrl(row) }))));
  if (archives.length) section("Archives & documentation", linkList(archives.map(row => ({ title: row.title, meta: categoryLabel(row.category), href: documentUrl(row) }))));
  if (!sectionsBox.children.length && !description && !science.children.length) { const empty = document.createElement("p"); empty.className = "meta"; empty.textContent = "Aucun contenu publié n’est encore lié à cette fiche."; sectionsBox.append(empty); }
  status.hidden = true; root.hidden = false;
}

function notFound() { root.hidden = true; status.hidden = false; status.textContent = "Cette fiche est introuvable."; }

try { await load(); }
catch (error) { console.error("Chargement de la fiche :", error); root.hidden = true; status.hidden = false; status.textContent = "Impossible de charger cette fiche pour le moment. Réessayez dans quelques instants."; status.classList.add("admin-error"); }
