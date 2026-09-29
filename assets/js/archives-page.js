import { loadPublishedContent, showLoadError, watchContent } from "./content-repository.js";

const grid = document.querySelector("#archives-grid");
const status = document.querySelector("#archives-status");
const categoryFilter = document.querySelector("#archive-category");
let rows = [];
let client;

function render() {
  grid.replaceChildren();
  const visible = rows.filter(row => !categoryFilter.value || row.category === categoryFilter.value);
  if (!visible.length) { status.textContent = rows.length ? "Aucun document ne correspond à cette catégorie." : "Aucun document publié pour le moment."; status.hidden = false; return; }
  status.hidden = true;
  for (const documentRow of visible) {
    const card = document.createElement("article"); card.className = "card";
    const body = document.createElement("div"); body.className = "card-body";
    const category = document.createElement("div"); category.className = "kicker"; category.textContent = documentRow.category.replaceAll("-", " "); body.append(category);
    const title = document.createElement("h3"); title.textContent = documentRow.title; body.append(title);
    const meta = document.createElement("div"); meta.className = "meta"; meta.textContent = [documentRow.document_date && new Intl.DateTimeFormat("fr-FR").format(new Date(`${documentRow.document_date}T00:00:00`)), documentRow.rights_note].filter(Boolean).join(" · "); body.append(meta);
    if (documentRow.description) { const description = document.createElement("p"); description.textContent = documentRow.description; body.append(description); }
    if (documentRow.storage_path && documentRow.bucket_id === "site-media-public") {
      const link = document.createElement("a"); link.className = "btn"; link.target = "_blank"; link.rel = "noopener";
      link.href = client.storage.from(documentRow.bucket_id).getPublicUrl(documentRow.storage_path).data.publicUrl;
      link.textContent = /\.pdf$/i.test(documentRow.storage_path) ? "Ouvrir le document PDF" : "Ouvrir le document"; body.append(link);
    }
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
if (client) watchContent(client, "archives", refresh);
