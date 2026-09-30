import { loadPublishedContent, publicMediaUrl, showLoadError, watchContent } from "./content-repository.js";
import { pieceUrl } from "./detail-nav.js";

const grid = document.querySelector("#shop-grid");
const status = document.querySelector("#shop-status");
let rows = [];
let client;

function render() {
  grid.replaceChildren();
  if (!rows.length) { status.textContent = "Aucun spécimen n’est actuellement disponible dans la boutique."; status.hidden = false; return; }
  status.hidden = true;
  rows.forEach(item => {
    const card = document.createElement("a"); card.className = "card"; card.href = pieceUrl(item);
    const photo = (item.media || []).filter(media => media.bucket_id === "site-media-public").sort((a, b) => a.position - b.position)[0];
    if (photo) { const image = document.createElement("img"); image.src = publicMediaUrl(client, photo); image.alt = photo.alt_text || item.title; card.append(image); }
    else { const placeholder = document.createElement("div"); placeholder.className = "card-photo-placeholder"; placeholder.textContent = "Photographie à ajouter"; placeholder.setAttribute("role", "img"); card.append(placeholder); }
    const body = document.createElement("div"); body.className = "card-body";
    const heading = document.createElement("h3"); heading.textContent = item.title; body.append(heading);
    const meta = document.createElement("div"); meta.className = "meta";
    meta.textContent = item.mine?.name || item.provenance || ""; body.append(meta);
    const price = document.createElement("div"); price.className = "price"; price.textContent = new Intl.NumberFormat("fr-FR", { style: "currency", currency: item.currency || "EUR" }).format(item.price_cents / 100); body.append(price);
    const more = document.createElement("div"); more.className = "more"; more.textContent = "Voir la fiche"; body.append(more);
    card.append(body); grid.append(card);
  });
}

async function refresh() {
  status.textContent = "Chargement de la boutique depuis Supabase…"; status.hidden = false;
  try { const result = await loadPublishedContent("shop"); client = result.client; rows = result.data; render(); }
  catch (error) { rows = []; showLoadError(error, status, grid, "articles de la boutique"); }
}
await refresh();
// Anciens liens boutique.html#RÉFÉRENCE : ouvrent directement la fiche.
if (location.hash) { const wanted = decodeURIComponent(location.hash.slice(1)); const hit = rows.find(item => item.reference === wanted || item.slug === wanted); if (hit) location.replace(pieceUrl(hit)); }
if (client) watchContent(client, "shop", refresh);
