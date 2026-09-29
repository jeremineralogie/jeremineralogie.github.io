import { loadPublishedContent, publicMediaUrl, showLoadError, watchContent } from "./content-repository.js";

const grid = document.querySelector("#shop-grid");
const status = document.querySelector("#shop-status");
let rows = [];
let client;

function render() {
  grid.replaceChildren();
  if (!rows.length) { status.textContent = "Aucun spécimen n’est actuellement disponible dans la boutique."; status.hidden = false; return; }
  status.hidden = true;
  rows.forEach(item => {
    const card = document.createElement("article"); card.className = "card";
    const photo = (item.media || []).filter(media => media.bucket_id === "site-media-public").sort((a, b) => a.position - b.position)[0];
    if (photo) { const image = document.createElement("img"); image.src = publicMediaUrl(client, photo); image.alt = photo.alt_text || item.title; card.append(image); }
    const body = document.createElement("div"); body.className = "card-body";
    const heading = document.createElement("h3"); heading.textContent = item.title; body.append(heading);
    const meta = document.createElement("div"); meta.className = "meta"; meta.textContent = [item.provenance, item.dimensions, item.weight_grams == null ? "" : `${item.weight_grams} g`].filter(Boolean).join(" · "); body.append(meta);
    if (item.description) { const description = document.createElement("p"); description.textContent = item.description; body.append(description); }
    const price = document.createElement("div"); price.className = "price"; price.textContent = new Intl.NumberFormat("fr-FR", { style: "currency", currency: item.currency || "EUR" }).format(item.price_cents / 100); body.append(price);
    const contact = document.createElement("a"); contact.className = "btn"; contact.href = `contact.html?reference=${encodeURIComponent(item.reference)}`; contact.textContent = "Me contacter"; body.append(contact);
    card.append(body); grid.append(card);
  });
}

async function refresh() {
  status.textContent = "Chargement de la boutique depuis Supabase…"; status.hidden = false;
  try { const result = await loadPublishedContent("shop"); client = result.client; rows = result.data; render(); }
  catch (error) { rows = []; showLoadError(error, status, grid, "articles de la boutique"); }
}
await refresh();
if (client) watchContent(client, "shop", refresh);
