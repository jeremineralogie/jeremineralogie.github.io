import { departmentUrl, setCanonical, cleanUrl, slugOf } from "./clean-urls.js";
import { renderCrumbs } from "./crumbs.js";
import { shopItemName } from "./content-repository.js";
import { getSupabase } from "./supabase-client.js";
import { categoryLabel } from "./reference-resolver.js";
import { ficheUrl } from "./entity-links.js";
import { mineralTitle } from "./seo-titles.js";
import { applyGlossary, glossLink, linkProperties } from "./glossary-links.js";
import { favoriteButton } from "./favorites.js";
import { pieceUrl, articleUrl, documentUrl } from "./detail-nav.js";
import { loadSimilar } from "./related.js";
import { themeLinksOf } from "./themes.js";
import { pageLink, sharePanel } from "./share.js";
import { mineralAlt } from "./alt-text.js";
import { commonsPhoto, creditLine, loadMineralPhotos } from "./mineral-photos.js";

// Fiche générique d'un minéral, d'un gisement ou d'une commune : fiche.html?type=mineral|mine|locality&id=<slug>.
const KINDS = {
  mine: { table: "mines", label: "Gisement", fk: "mine_id", select: "id,name,slug,description,locality:localities(name,slug)", articles: ["article_mines", "mine_id"], archives: ["archive_mines", "mine_id"] },
  mineral: { table: "minerals", label: "Minéral", fk: "mineral_id", select: "*,media:mineral_media(bucket_id,storage_path,alt_text,position)", articles: ["article_minerals", "mineral_id"], archives: ["archive_minerals", "mineral_id"] },
  locality: { table: "localities", label: "Commune", fk: "locality_id", select: "id,name,slug,notes,department_code,department:departments(name)", articles: ["article_localities", "locality_id"], archives: ["archive_localities", "locality_id"] }
};
const params = new URLSearchParams(window.JM_PARAMS ?? location.search);
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
  items.forEach(item => { const li = document.createElement("li"); const a = item.term ? glossLink(item.term, item.title, "link gloss") : Object.assign(document.createElement("a"), { className: "link", href: item.href, textContent: item.title }); if (!item.term) a.dataset.fiche = ""; li.append(a); if (item.meta) li.append(` — ${item.meta}`); list.append(li); });
  return list;
}
const unique = (items, key) => [...new Map(items.filter(item => item[key]).map(item => [item[key], item])).values()];

async function load() {
  if (!kind || !slug) return notFound();
  if (!client) throw new Error("La connexion à Supabase n’est pas configurée.");
  const { data: entity, error } = await client.from(kind.table).select(kind.select).eq("slug", slug).maybeSingle();
  if (error) throw error;
  if (!entity) return notFound();
  document.title = kind === KINDS.mineral ? mineralTitle(entity) : `${entity.name} — Jeremineralogie`;
  document.querySelector("#fiche-kind").textContent = kind.label;
  document.querySelector("#fiche-title").textContent = entity.name;
  const description = entity.description ?? entity.notes ?? "";
  document.querySelector("#fiche-description").textContent = description;
  document.querySelector("#fiche-description").hidden = !description;
  const subtitle = document.querySelector("#fiche-subtitle");
  subtitle.replaceChildren();
  if (kind === KINDS.mine && entity.locality) { const a = document.createElement("a"); a.className = "link"; a.dataset.fiche = ""; a.href = ficheUrl("locality", entity.locality.slug); a.textContent = entity.locality.name; subtitle.append("Commune : ", a); }
  if (kind === KINDS.locality) { subtitle.textContent = [entity.department?.name, /^(2[AB]|\d{2,3})$/i.test(entity.department_code || "") ? entity.department_code : ""].filter(Boolean).join(" · "); if (entity.department_code) { const a = document.createElement("a"); a.className = "link"; a.dataset.fiche = ""; a.href = departmentUrl(entity.department_code); a.textContent = "Voir le département"; subtitle.append(" · ", a); } }
  if (kind === KINDS.mineral) subtitle.textContent = entity.formula || "";
  subtitle.hidden = !subtitle.childNodes.length;
  const science = document.querySelector("#fiche-scientific"); science.replaceChildren();
  if (kind === KINDS.mineral) {
    const num = value => Number(value).toLocaleString("fr-FR", { maximumFractionDigits: 3 });
    const span = (min, max) => min == null ? null : max != null && Number(max) !== Number(min) ? `${num(min)} à ${num(max)}` : num(min);
    const rows = [
      ["Famille chimique", entity.chemical_class], ["Système cristallin", entity.crystal_system],
      ["Dureté (Mohs)", span(entity.hardness, entity.hardness_max)], ["Densité", span(entity.density, entity.density_max)],
      ["Couleurs", (entity.colors || []).join(", ")], ["Trait", entity.streak], ["Éclat", entity.luster], ["Transparence", entity.transparency],
      ["Clivage", entity.cleavage], ["Cassure", entity.fracture], ["Habitus", entity.habit], ["Fluorescence", entity.fluorescence],
      ["Formation et gisements", entity.formation], ["Variétés", entity.varieties], ["Confusions possibles", entity.confusions], ["Étymologie", entity.etymology]
    ];
    rows.forEach(([label, value]) => {
      if (value == null || value === "") return;
      const term = document.createElement("dt"); term.textContent = label; const detail = document.createElement("dd"); detail.textContent = String(value); science.append(term, detail);
    });
    const photos = (entity.media || []).filter(item => item.bucket_id === "site-media-public" && item.storage_path).sort((a, b) => a.position - b.position);
    const gallery = document.querySelector("#fiche-photos");
    gallery.replaceChildren(...photos.map((item, index) => { const image = document.createElement("img"); image.src = publicUrl(item); image.alt = mineralAlt(entity, index, photos.length, item.alt_text); image.loading = "lazy"; return image; }));
    // Sans photo ajoutée dans l'admin : photo libre de Wikimedia Commons, avec son crédit.
    const commons = photos.length ? null : commonsPhoto(await loadMineralPhotos(), entity.slug);
    document.querySelector("#fiche .photo-credit")?.remove();
    if (commons) {
      const image = document.createElement("img"); image.src = commons.src; image.alt = mineralAlt(entity); image.loading = "lazy";
      gallery.replaceChildren(image); gallery.after(creditLine(commons));
    } else if (photos.length && entity.photo_credit) {
      // Photos ajoutées dans l'admin avec un crédit / une licence.
      const credit = document.createElement("p"); credit.className = "photo-credit"; credit.textContent = entity.photo_credit; gallery.after(credit);
    }
    gallery.hidden = !photos.length && !commons;
    document.querySelector("#fiche .fav-btn")?.remove(); document.querySelector("#fiche .share")?.remove();
    subtitle.after(favoriteButton({ type: "mineral", id: entity.slug, name: entity.name, href: ficheUrl("mineral", entity.slug), meta: [entity.formula, entity.crystal_system].filter(Boolean).join(" · "), image: photos[0] ? publicUrl(photos[0]) : commons?.src || "" }));
    const shareCover = photos[0] ? publicUrl(photos[0]) : commons?.src || "";
    document.querySelector("#fiche .fav-btn").after(sharePanel({
      spec: { title: entity.name, wrapTitle: true, date: "Fiche minéral", note: [entity.formula, entity.crystal_system].filter(Boolean).join(" · "), logo: shareCover || "/assets/decor/logo-jeux.webp", logoWidth: 880, logoMaxHeight: 960, logoFrame: Boolean(shareCover), footer: "À découvrir sur Jeremineralogie" },
      text: `${entity.name} — fiche minéral sur Jeremineralogie`, url: pageLink(), fileName: `mineral-${entity.slug}.png`, label: "📲 Partager cette fiche", previewAlt: "Image de la fiche à partager"
    }));
    const back = document.querySelector("#fiche-back");
    back.href = "apprendre.html#mineraux"; back.textContent = "← Retour aux fiches minéraux";
    const learn = document.querySelector('.nav a[href="apprendre.html"]'); if (learn) learn.setAttribute("aria-current", "page");
  }
  sectionsBox.replaceChildren();

  const [specimens, shop, articles, archives, mines, family, similar] = await Promise.all([
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
    }, []) : Promise.resolve([]),
    // Famille (groupe) du minéral : la fiche du groupe et ses déclinaisons.
    kind === KINDS.mineral && entity.mineral_group ? safely("famille", async () => {
      const { data, error: e } = await client.from("minerals").select("name,slug").eq("mineral_group", entity.mineral_group).eq("publication_status", "published").order("name");
      if (e) throw e; return data || [];
    }, []) : Promise.resolve([]),
    kind === KINDS.mineral ? loadSimilar(client, entity.slug, entity) : Promise.resolve([])
  ]);

  const label = row => row.mineral_name ?? row.mineral?.name ?? "Spécimen";
  if (family.length > 1) {
    const parent = family.find(row => row.slug === entity.mineral_group);
    const others = family.filter(row => row.slug !== entity.slug && row.slug !== parent?.slug);
    const link = row => ({ title: row.name, href: ficheUrl("mineral", row.slug) });
    if (parent?.slug === entity.slug) section("Toutes les déclinaisons", linkList(others.map(link)));
    else if (parent) section(`Famille : ${parent.name}`, linkList([parent, ...others].map(link)));
  }
  if (specimens.length) section("Dans ma collection", cards(specimens.map(row => ({ title: label(row), meta: [row.provenance, row.locality_name].filter(Boolean).join(" · "), href: `specimen.html?id=${encodeURIComponent(row.slug)}`, photo: firstPhoto(row.media) }))));
  if (shop.length) section("Disponible en boutique", cards(shop.map(row => ({ title: shopItemName(row), meta: new Intl.NumberFormat("fr-FR", { style: "currency", currency: row.currency || "EUR" }).format((row.price_cents ?? 0) / 100), href: pieceUrl(row), photo: firstPhoto(row.media) }))));
  if (kind === KINDS.locality && mines.length) section("Gisements de cette commune", linkList(mines.map(row => ({ title: row.name, href: ficheUrl("mine", row.slug) }))));
  if (kind === KINDS.mineral) { const list = unique(specimens.map(row => row.mine).filter(Boolean), "slug"); if (list.length) section("Gisements dans ma collection", linkList(list.map(row => ({ title: row.name, href: ficheUrl("mine", row.slug) })))); }
  if (kind === KINDS.mine) { const list = unique(specimens.map(row => row.mineral).filter(Boolean), "slug"); if (list.length) section("Minéraux de ce gisement dans ma collection", linkList(list.map(row => ({ title: row.name, href: ficheUrl("mineral", row.slug) })))); }
  if (articles.length) section("Articles", linkList(articles.map(row => ({ title: row.title, meta: categoryLabel(row.category), href: articleUrl(row) }))));
  if (archives.length) section("Archives & documentation", linkList(archives.map(row => ({ title: row.title, meta: categoryLabel(row.category), href: documentUrl(row) }))));
  if (similar.length) section("Minéraux similaires", linkList(similar.map(row => ({ title: row.name, href: ficheUrl("mineral", row.slug) }))));
  if (kind === KINDS.mineral) {
    const related = await safely("glossaire", async () => {
      const { data, error: e } = await client.from("glossary_terms").select("term,slug,domain").contains("related_minerals", [entity.name]).eq("publication_status", "published").order("term");
      if (e) throw e; return data || [];
    }, []);
    if (related.length) section("Dans le glossaire", linkList(related.map(row => ({ title: row.term, meta: DOMAIN_LABELS[row.domain] || "", href: cleanUrl("term", row.slug), term: row.slug }))));
  }
  if (kind === KINDS.mineral) {
    const available = await safely("thèmes", async () => { const response = await fetch("/themes/index.json"); if (!response.ok) throw new Error(response.status); return response.json(); }, null);
    const links = available ? themeLinksOf(entity, available) : [];
    if (links.length) section("Parcourir par thème", linkList(links));
  }
  if (!sectionsBox.children.length && !description && !science.children.length) { const empty = document.createElement("p"); empty.className = "meta"; empty.textContent = "Aucun contenu publié n’est encore lié à cette fiche."; sectionsBox.append(empty); }
  status.hidden = true; root.hidden = false;
  setCanonical(kind === KINDS.mineral ? "mineral" : kind === KINDS.mine ? "mine" : "locality", entity.slug);
  document.querySelector("[data-seo]")?.remove();
  const home = ["Accueil", "/"], learn = ["Apprendre & identifier", "/apprendre.html"];
  renderCrumbs(kind === KINDS.mineral ? [home, learn, ["Fiches minéraux", "/apprendre.html#mineraux"], [entity.name]]
    : kind === KINDS.mine ? [home, ...(entity.locality ? [[entity.locality.name, ficheUrl("locality", entity.locality.slug)]] : []), [entity.name]]
    : [home, ...(entity.department?.name && entity.department_code ? [[entity.department.name, departmentUrl(entity.department_code)]] : []), [entity.name]]);
  await applyGlossary(document.querySelector("#fiche-description"));
  if (kind === KINDS.mineral) await linkProperties(science);
  else await applyGlossary([...science.querySelectorAll("dd")]);
}

// Libellés et valeurs précises de la fiche reliés au glossaire (système cristallin, famille chimique, éclat, cassure, clivage…), comme dans la page préparée pour Google.
const DOMAIN_LABELS = { mineralogie: "Minéralogie", geologie: "Géologie", cristallographie: "Cristallographie" };
function notFound() { root.hidden = true; status.hidden = false; status.textContent = "Cette fiche est introuvable."; }

try { await load(); }
catch (error) { console.error("Chargement de la fiche :", error); root.hidden = true; status.hidden = false; status.textContent = "Impossible de charger cette fiche pour le moment. Réessayez dans quelques instants."; status.classList.add("admin-error"); }
