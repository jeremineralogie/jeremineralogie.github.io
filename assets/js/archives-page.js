import { loadPublishedContent, showLoadError, watchContent } from "./content-repository.js";
import { categoryLabel } from "./reference-resolver.js";
import { documentUrl } from "./detail-nav.js";

const grid = document.querySelector("#archives-grid");
const status = document.querySelector("#archives-status");
const categoryFilter = document.querySelector("#archive-category");
let rows = [];
let client;

function syncCategoryOptions() {
  const known = new Set([...categoryFilter.options].map(option => option.value));
  rows.forEach(row => {
    if (!row.category || known.has(row.category)) return;
    known.add(row.category);
    const option = document.createElement("option"); option.value = row.category; option.textContent = categoryLabel(row.category); categoryFilter.append(option);
  });
}

function render() {
  syncCategoryOptions();
  grid.replaceChildren();
  const visible = rows.filter(row => !categoryFilter.value || row.category === categoryFilter.value);
  if (!visible.length) { status.textContent = rows.length ? "Aucun document ne correspond à cette catégorie." : "Aucun document publié pour le moment."; status.hidden = false; return; }
  status.hidden = true;
  for (const documentRow of visible) {
    const card = document.createElement("a"); card.className = "card"; card.href = documentUrl(documentRow);
    const body = document.createElement("div"); body.className = "card-body";
    const category = document.createElement("div"); category.className = "kicker"; category.textContent = categoryLabel(documentRow.category); body.append(category);
    const title = document.createElement("h3"); title.textContent = documentRow.title; body.append(title);
    const meta = document.createElement("div"); meta.className = "meta"; meta.textContent = [documentRow.document_date && new Intl.DateTimeFormat("fr-FR").format(new Date(`${documentRow.document_date}T00:00:00`)), documentRow.rights_note].filter(Boolean).join(" · "); body.append(meta);
    if (documentRow.description) { const description = document.createElement("p"); description.className = "summary"; description.textContent = documentRow.description; body.append(description); }
    const more = document.createElement("div"); more.className = "more"; more.textContent = "Consulter le document"; body.append(more);
    card.append(body); grid.append(card);
  }
}

categoryFilter.addEventListener("change", render);
async function refresh() {
  status.textContent = "Chargement des archives depuis Supabase…"; status.hidden = false;
  try { const result = await loadPublishedContent("archives"); client = result.client; rows = result.data; render(); }
  catch (error) { rows = []; showLoadError(error, status, grid, "documents d’archives"); }
}
await refresh();
// Anciens liens archives.html#slug : ouvrent directement le document.
if (location.hash) { const wanted = decodeURIComponent(location.hash.slice(1)); const hit = rows.find(row => row.slug === wanted); if (hit) location.replace(documentUrl(hit)); }
if (client) watchContent(client, "archives", refresh);
