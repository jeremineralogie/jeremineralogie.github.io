import { loadPublishedContent, publicMediaUrl, shopItemName, showLoadError, watchContent } from "./content-repository.js";
import { pieceUrl } from "./detail-nav.js";
import { bindFilterPanel, fillFilterOptions } from "./filter-panel.js";

const grid = document.querySelector("#shop-grid");
const status = document.querySelector("#shop-status");
let rows = [];
let client;
const panel = document.querySelector(".filter-panel");
const selects = [...panel.querySelectorAll("[data-filter]")];
const count = document.querySelector("#shop-count");
const empty = document.querySelector("#shop-empty");
const clean = value => String(value || "").trim();
const facet = (item, key) => clean({
  mineral: shopItemName(item),
  region: item.department?.region?.name,
  department: item.department_name || item.department?.name,
  locality: item.locality_name || item.locality?.name,
  mine: item.mine?.name
}[key]);
const updatePanel = bindFilterPanel(panel, selects, render);

function render() {
  grid.replaceChildren();
  if (!rows.length) { status.textContent = "Aucun spécimen n’est actuellement disponible dans la boutique."; status.hidden = false; panel.hidden = true; count.textContent = ""; empty.hidden = true; return; }
  status.hidden = true; panel.hidden = false;
  const chosen = selects.filter(select => select.value).map(select => [select.dataset.filter, select.value.toLocaleLowerCase("fr")]);
  const visible = rows.filter(item => chosen.every(([key, value]) => facet(item, key).toLocaleLowerCase("fr") === value));
  count.textContent = `${visible.length} spécimen${visible.length === 1 ? "" : "s"}`;
  empty.hidden = visible.length > 0;
  visible.forEach(item => {
    const card = document.createElement("a"); card.className = "card"; card.href = pieceUrl(item);
    const photo = (item.media || []).filter(media => media.bucket_id === "site-media-public").sort((a, b) => a.position - b.position)[0];
    if (photo) { const image = document.createElement("img"); image.src = publicMediaUrl(client, photo); image.alt = photo.alt_text || shopItemName(item); card.append(image); }
    else { const placeholder = document.createElement("div"); placeholder.className = "card-photo-placeholder"; placeholder.textContent = "Photographie à ajouter"; placeholder.setAttribute("role", "img"); card.append(placeholder); }
    const body = document.createElement("div"); body.className = "card-body";
    const heading = document.createElement("h3"); heading.textContent = shopItemName(item); body.append(heading);
    const meta = document.createElement("div"); meta.className = "meta";
    meta.textContent = item.mine?.name || item.provenance || ""; body.append(meta);
    const price = document.createElement("div"); price.className = "price"; price.textContent = new Intl.NumberFormat("fr-FR", { style: "currency", currency: item.currency || "EUR" }).format(item.price_cents / 100); body.append(price);
    const more = document.createElement("div"); more.className = "more"; more.textContent = "Voir la fiche"; body.append(more);
    card.append(body); grid.append(card);
  });
}

async function refresh() {
  if (!rows.length) { status.textContent = "Chargement de la boutique…"; status.hidden = false; }
  try { const result = await loadPublishedContent("shop"); client = result.client; rows = result.data; fillFilterOptions(selects, rows, (item, key) => [facet(item, key)]); updatePanel(); render(); }
  catch (error) { rows = []; showLoadError(error, status, grid, "articles de la boutique"); }
}
await refresh();
// Anciens liens boutique.html#RÉFÉRENCE : ouvrent directement la fiche.
if (location.hash) { const wanted = decodeURIComponent(location.hash.slice(1)); const hit = rows.find(item => item.reference === wanted || item.slug === wanted); if (hit) location.replace(pieceUrl(hit)); }
if (client) watchContent(client, "shop", refresh);
