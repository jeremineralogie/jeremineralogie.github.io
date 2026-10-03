import { fitCardText } from "./card-fit.js";
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
const sortSelect = panel.querySelector("[data-sort]");
sortSelect?.addEventListener("change", render);
const updatePanel = bindFilterPanel(panel, selects, render);
const presets = new URLSearchParams(location.search);
let presetsApplied = false;

function render() {
  grid.replaceChildren();
  if (!rows.length) { status.textContent = "Aucun spécimen n’est actuellement disponible dans la boutique."; status.hidden = false; panel.hidden = true; count.textContent = ""; empty.hidden = true; return; }
  status.hidden = true; panel.hidden = false;
  const chosen = selects.filter(select => select.value).map(select => [select.dataset.filter, select.value.toLocaleLowerCase("fr")]);
  let visible = rows.filter(item => chosen.every(([key, value]) => facet(item, key).toLocaleLowerCase("fr") === value));
  // Tri par prix (le tri « les plus récentes » garde l'ordre d'origine) ; à prix égal, l'ordre d'origine est conservé.
  const order = sortSelect?.value;
  const soldLast = (a, b) => (a.sale_status === "sold") - (b.sale_status === "sold");
  if (order) visible = [...visible].sort((a, b) => soldLast(a, b) || (order === "asc" ? 1 : -1) * ((a.price_cents ?? 0) - (b.price_cents ?? 0)));
  const forSale = visible.filter(item => item.sale_status !== "sold").length;
  count.textContent = `${forSale} spécimen${forSale === 1 ? "" : "s"} disponible${forSale === 1 ? "" : "s"}${visible.length > forSale ? ` · ${visible.length - forSale} vendu${visible.length - forSale === 1 ? "" : "s"}` : ""}`;
  empty.hidden = visible.length > 0;
  visible.forEach(item => {
    const card = document.createElement("a"); card.className = "card card-boutique"; card.href = pieceUrl(item);
    const photo = (item.media || []).filter(media => media.bucket_id === "site-media-public").sort((a, b) => a.position - b.position)[0];
    if (photo) { const image = document.createElement("img"); image.src = publicMediaUrl(client, photo); image.alt = photo.alt_text || shopItemName(item); card.append(image); }
    else { const placeholder = document.createElement("div"); placeholder.className = "card-photo-placeholder"; placeholder.textContent = "Photographie à ajouter"; placeholder.setAttribute("role", "img"); card.append(placeholder); }
    if (item.sale_status === "sold") {
      card.classList.add("is-sold");
      const ribbon = document.createElement("span"); ribbon.className = "sold-window"; const band = document.createElement("b"); band.textContent = "Vendu"; ribbon.append(band); card.append(ribbon);
    }
    const body = document.createElement("div"); body.className = "card-body";
    const heading = document.createElement("h3"); heading.textContent = shopItemName(item); body.append(heading);
    const meta = document.createElement("div"); meta.className = "meta";
    meta.textContent = item.mine?.name || item.provenance || item.locality_name || item.locality?.name || ""; body.append(meta);
    const price = document.createElement("div"); price.className = "price"; price.textContent = item.sale_status === "sold" ? "Vendu" : new Intl.NumberFormat("fr-FR", { style: "currency", currency: item.currency || "EUR" }).format(item.price_cents / 100); body.append(price);
    const more = document.createElement("div"); more.className = "more"; more.textContent = "Voir la fiche"; body.append(more);
    card.append(body); grid.append(card); fitCardText(card);
  });
}

async function refresh() {
  if (!rows.length) { status.textContent = "Chargement de la boutique…"; status.hidden = false; }
  try {
    const result = await loadPublishedContent("shop"); client = result.client; rows = result.data;
    fillFilterOptions(selects, rows, (item, key) => [facet(item, key)]);
    // Liens entrants du type boutique.html?mineral=Fluorite (depuis l'onglet Apprendre).
    if (!presetsApplied) {
      presetsApplied = true;
      selects.forEach(select => {
        const wanted = clean(presets.get(select.dataset.filter)).toLocaleLowerCase("fr");
        const option = wanted && [...select.options].find(item => item.value.toLocaleLowerCase("fr") === wanted);
        if (option) select.value = option.value;
      });
    }
    updatePanel(); render();
  }
  catch (error) { rows = []; showLoadError(error, status, grid, "articles de la boutique"); }
}
await refresh();
// Anciens liens boutique.html#RÉFÉRENCE : ouvrent directement la fiche.
if (location.hash) { const wanted = decodeURIComponent(location.hash.slice(1)); const hit = rows.find(item => item.reference === wanted || item.slug === wanted); if (hit) location.replace(pieceUrl(hit)); }
if (client) watchContent(client, "shop", refresh);
