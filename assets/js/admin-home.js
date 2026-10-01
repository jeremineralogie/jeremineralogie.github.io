// Tableau de bord de l'admin : tout ce qui reste à compléter, avec accès direct à chaque fiche.
import { loadMineralPhotos } from "./mineral-photos.js";

const $ = selector => document.querySelector(selector);
const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text != null) node.textContent = text; return node; };
const SIX_MONTHS = 1000 * 60 * 60 * 24 * 182;
let client = null;
let actions = null;
let bound = false;

export async function openHome(supabase, handlers) {
  client = supabase; actions = handlers;
  if (!bound) { bound = true; $("#home-refresh").addEventListener("click", () => void load()); }
  await load();
}

async function load() {
  const status = $("#home-status");
  status.textContent = "Analyse des fiches…";
  const pick = async (label, query) => { const { data, error } = await query; if (error) { console.error(`Tableau de bord — ${label} :`, error); return null; } return data || []; };
  const [specimens, shop, articles, archives, localities, mines, minerals, messages, commons] = await Promise.all([
    pick("collection", client.from("specimens").select("id,slug,mineral_name,mineral_id,locality_id,mine_id,locality_name,provenance,description,publication_status,created_at,mineral:minerals!specimens_mineral_id_fkey(name),media:specimen_media(id)")),
    pick("boutique", client.from("shop_items").select("id,reference,title,mineral_name,mineral_id,locality_id,mine_id,description,dimensions,publication_status,sale_status,created_at,mineral:minerals!shop_items_mineral_id_fkey(name),media:shop_item_media(id)")),
    pick("articles", client.from("articles").select("id,title,publication_status,media:article_media(id)")),
    pick("archives", client.from("archive_documents").select("id,title,publication_status,storage_path")),
    pick("communes", client.from("localities").select("id,name,latitude,department_code").order("name")),
    pick("gisements", client.from("mines").select("id,name,locality_id").order("name")),
    pick("minéraux", client.from("minerals").select("id,slug,name,publication_status,media:mineral_media(id)").order("name")),
    client.from("messages").select("id", { count: "exact", head: true }).eq("status", "nouveau").then(({ count, error }) => error ? 0 : count || 0),
    loadMineralPhotos()
  ]);
  const mineLocality = new Map((mines || []).map(row => [row.id, row.locality_id]));
  const located = new Map((localities || []).map(row => [row.id, row.latitude != null]));
  const place = row => row.locality_id || mineLocality.get(row.mine_id) || null;
  const noPhoto = row => !(row.media || []).length;
  // Fiche minéral : photo ajoutée dans l'admin ou photo libre trouvée par le robot GitHub (Wikimedia Commons).
  const mineralNoPhoto = row => noPhoto(row) && !commons?.[row.slug];
  const specimenName = row => row.mineral_name || row.mineral?.name || row.slug || "Spécimen sans nom";
  const shopName = row => `${row.mineral_name || row.mineral?.name || row.title || "Pièce"} — ${row.reference || "sans référence"}`;
  const openSpecimen = row => () => actions.openSpecimen(row.id);
  const openShop = row => () => actions.openRecord("shop", "list", row.id);
  const inSale = (shop || []).filter(row => row.sale_status !== "sold");

  const usedMineralIds = new Set([...(specimens || []), ...(shop || [])].map(row => row.mineral_id).filter(Boolean));
  const categories = [
    ["Ma collection", specimens && [
      ["Sans photo", specimens.filter(noPhoto), specimenName, openSpecimen],
      ["Sans commune (absents de la carte)", specimens.filter(row => !place(row)), specimenName, openSpecimen],
      ["Commune pas encore placée sur la carte", specimens.filter(row => place(row) && located.get(place(row)) === false), specimenName, openSpecimen],
      ["Sans description", specimens.filter(row => !String(row.description || "").trim()), specimenName, openSpecimen],
      ["Minéral principal non relié à une fiche minéral", specimens.filter(row => !row.mineral_id), specimenName, openSpecimen]
    ]],
    ["Boutique", shop && [
      ["Sans photo", inSale.filter(noPhoto), shopName, openShop],
      ["Sans description", inSale.filter(row => !String(row.description || "").trim()), shopName, openShop],
      ["Sans dimensions", inSale.filter(row => !String(row.dimensions || "").trim()), shopName, openShop],
      ["Sans commune (absentes de la carte)", inSale.filter(row => !place(row)), shopName, openShop],
      ["En brouillon (non visibles)", inSale.filter(row => row.publication_status !== "published"), shopName, openShop],
      ["En vente depuis plus de 6 mois", inSale.filter(row => row.sale_status === "available" && row.created_at && Date.now() - new Date(row.created_at) > SIX_MONTHS), shopName, openShop]
    ]],
    ["Articles et archives", articles && archives && [
      ["Articles en brouillon", articles.filter(row => row.publication_status !== "published"), row => row.title, row => () => actions.openRecord("articles", "list", row.id)],
      ["Articles sans image", articles.filter(noPhoto), row => row.title, row => () => actions.openRecord("articles", "list", row.id)],
      ["Archives sans document joint", archives.filter(row => !row.storage_path), row => row.title, row => () => actions.openRecord("archives", "list", row.id)],
      ["Archives en brouillon", archives.filter(row => row.publication_status !== "published"), row => row.title, row => () => actions.openRecord("archives", "list", row.id)]
    ]],
    ["Carte", localities && mines && [
      ["Communes sans position sur la carte", localities.filter(row => row.latitude == null), row => `${row.name}${row.department_code ? ` (${row.department_code})` : ""}`, row => () => actions.openRecord("referentiels", "localities", row.id)],
      ["Gisements sans commune", mines.filter(row => !row.locality_id), row => row.name, row => () => actions.openRecord("referentiels", "mines", row.id)]
    ]],
    ["Fiches minéraux (Apprendre)", minerals && [
      ["Minéraux de votre collection ou boutique dont la fiche n’a pas de photo", minerals.filter(row => usedMineralIds.has(row.id) && mineralNoPhoto(row)), row => row.name, row => () => actions.openRecord("referentiels", "minerals", row.id)],
      ["Fiches en brouillon (invisibles dans Apprendre)", minerals.filter(row => row.publication_status !== "published"), row => row.name, row => () => actions.openRecord("referentiels", "minerals", row.id)],
      ["Toutes les fiches sans photo", minerals.filter(mineralNoPhoto), row => row.name, row => () => actions.openRecord("referentiels", "minerals", row.id)]
    ]]
  ];

  const body = $("#home-body");
  const blocks = [];
  if (messages) {
    const alert = el("button", "home-alert", `✉ ${messages} nouveau${messages > 1 ? "x" : ""} message${messages > 1 ? "s" : ""} à lire`); alert.type = "button";
    alert.addEventListener("click", () => actions.openMain("messages"));
    blocks.push(alert);
  }
  let open = 0;
  categories.forEach(([title, checks]) => {
    const card = el("section", "home-card");
    card.append(el("h4", "", title));
    if (!checks) { card.append(el("p", "admin-empty", "Données indisponibles pour le moment.")); blocks.push(card); return; }
    const list = el("div", "home-checks");
    checks.forEach(([label, items, nameOf, openOf]) => {
      if (!items.length) return;
      open += items.length;
      const row = el("details", "home-check");
      const summary = el("summary");
      summary.append(el("span", "home-check-label", label), el("span", "home-check-count", String(items.length)));
      row.append(summary);
      const ul = el("ul", "home-items");
      items.slice(0, 40).forEach(item => {
        const li = el("li"); const button = el("button", "home-item", nameOf(item)); button.type = "button";
        button.addEventListener("click", openOf(item)); li.append(button); ul.append(li);
      });
      if (items.length > 40) ul.append(el("li", "home-more", `… et ${items.length - 40} autre${items.length - 40 > 1 ? "s" : ""}`));
      row.append(ul); list.append(row);
    });
    if (!list.children.length) card.append(el("p", "home-ok", "✓ Rien à compléter"));
    else card.append(list);
    blocks.push(card);
  });
  body.replaceChildren(...blocks);
  status.textContent = open ? "Touchez une ligne pour voir les fiches concernées, puis une fiche pour l’ouvrir." : "Tout est complet.";
}
