import { loadPublishedContent, showLoadError } from "./content-repository.js";
import { categoryLabel } from "./reference-resolver.js";
import { documentUrl, renderNeighbours } from "./detail-nav.js";
import { applyGlossary } from "./glossary-links.js";

const slug = new URLSearchParams(location.search).get("slug");
const status = document.querySelector("#detail-status");
const root = document.querySelector("#detail");

function render(client, row) {
  document.title = `${row.title} — Archives & Documentation — Jeremineralogie`;
  const page = document.createElement("article"); page.className = "content doc-full";
  const category = document.createElement("div"); category.className = "kicker"; category.textContent = categoryLabel(row.category);
  const title = document.createElement("h1"); title.className = "page-title"; title.textContent = row.title;
  const meta = document.createElement("div"); meta.className = "meta";
  meta.textContent = [row.document_date && new Intl.DateTimeFormat("fr-FR").format(new Date(`${row.document_date}T00:00:00`)), row.rights_note].filter(Boolean).join(" · ");
  page.append(category, title, meta);
  if (row.description) { const description = document.createElement("p"); description.textContent = row.description; page.append(description); void applyGlossary(description); }
  if (row.storage_path && row.bucket_id === "site-media-public") {
    const url = client.storage.from(row.bucket_id).getPublicUrl(row.storage_path).data.publicUrl;
    const open = document.createElement("a"); open.className = "btn"; open.href = url; open.target = "_blank"; open.rel = "noopener"; open.textContent = "Ouvrir dans un nouvel onglet";
    page.append(open);
    if (/\.pdf$/i.test(row.storage_path)) { const frame = document.createElement("iframe"); frame.className = "viewer"; frame.src = url; frame.title = row.title; page.append(frame); }
    else if (/\.(jpe?g|png|gif|webp|avif)$/i.test(row.storage_path)) { const image = document.createElement("img"); image.className = "doc-image"; image.src = url; image.alt = row.title; page.append(image); }
  }
  root.replaceChildren(page);
}

try {
  const { client, data } = await loadPublishedContent("archives");
  const index = data.findIndex(row => row.slug === slug);
  if (!slug || index < 0) { root.replaceChildren(); status.textContent = "Ce document est introuvable ou n’est plus publié."; }
  else {
    status.hidden = true; render(client, data[index]);
    renderNeighbours(document.querySelectorAll("[data-nav]"), data, index, documentUrl, row => row.title);
  }
} catch (error) { showLoadError(error, status, root, "documents d’archives"); }
