import { setCanonical } from "./clean-urls.js";
import { loadPublishedContent, showLoadError } from "./content-repository.js";
import { categoryLabel } from "./reference-resolver.js";
import { documentUrl, renderNeighbours } from "./detail-nav.js";
import { applyGlossary, skipTermNames } from "./glossary-links.js";
import { appendLinked, buildLinker, linkTextNodes, loadArchiveLinks, loadLinkEntities } from "./entity-links.js";
import { renderCrumbs } from "./crumbs.js";
import { documentTitle } from "./seo-titles.js";
import { renderBlocks } from "./article-content.js";

const slug = new URLSearchParams(window.JM_PARAMS ?? location.search).get("slug");
const status = document.querySelector("#detail-status");
const root = document.querySelector("#detail");

function render(client, row) {
  document.title = documentTitle(row.title);
  document.querySelector("[data-seo]")?.remove();
  renderCrumbs([["Accueil", "/"], ["Archives & documentation", "/archives.html"], [row.title]]);
  const page = document.createElement("article"); page.className = "content doc-full";
  const category = document.createElement("div"); category.className = "kicker"; category.textContent = categoryLabel(row.category);
  const title = document.createElement("h1"); title.className = "page-title"; title.textContent = row.title;
  const meta = document.createElement("div"); meta.className = "meta";
  meta.textContent = [row.document_date && new Intl.DateTimeFormat("fr-FR").format(new Date(`${row.document_date}T00:00:00`)), row.rights_note].filter(Boolean).join(" · ");
  page.append(category, title, meta);
  // Description mise en forme dans l'éditeur (alignement, images…) ; à défaut, l'ancien texte brut.
  const blocks = (row.body || []).length ? renderBlocks(page, row.body, client) : [];
  const glossaryNodes = [];
  if (blocks.length) blocks.filter(node => node.classList.contains("art-text") || node.classList.contains("art-rich")).forEach(node => glossaryNodes.push(node));
  else if (row.description) { const description = document.createElement("p"); description.textContent = row.description; page.append(description); glossaryNodes.push(description); }
  // Liens saisis dans l'admin : « Texte | https://… » ou simplement l'adresse.
  (row.links || []).forEach(line => {
    const [label, url] = line.includes("|") ? line.split("|").map(part => part.trim()) : [line.trim(), line.trim()];
    if (!/^https?:\/\//i.test(url)) return;
    const link = document.createElement("a"); link.className = "art-link"; link.href = url; link.target = "_blank"; link.rel = "noopener"; link.textContent = `🔗 ${label || url}`;
    page.append(link);
  });
  if (row.storage_path && row.bucket_id === "site-media-public") {
    const url = client.storage.from(row.bucket_id).getPublicUrl(row.storage_path).data.publicUrl;
    const open = document.createElement("a"); open.className = "btn"; open.href = url; open.target = "_blank"; open.rel = "noopener"; open.textContent = "Ouvrir dans un nouvel onglet";
    page.append(open);
    if (/\.pdf$/i.test(row.storage_path)) { const frame = document.createElement("iframe"); frame.className = "viewer"; frame.src = url; frame.title = row.title; page.append(frame); }
    else if (/\.(jpe?g|png|gif|webp|avif)$/i.test(row.storage_path)) { const image = document.createElement("img"); image.className = "doc-image"; image.src = url; image.alt = row.title; page.append(image); }
  }
  root.replaceChildren(page);
  void linkEntities(client, row, page, glossaryNodes);
}

// Liens automatiques vers les fiches citées dans le texte, puis ligne « Fiches liées » (choisies dans l'administration).
async function linkEntities(client, row, page, glossaryNodes) {
  const used = new Set();
  try {
    const [linker, chosen] = [buildLinker(await loadLinkEntities(client)), await loadArchiveLinks(client, row.id)];
    [...page.querySelectorAll(".art-text, .art-rich, :scope > p:not(.meta)")].forEach(node => linkTextNodes(node, linker, used));
    if (chosen.length) {
      const line = document.createElement("p"); line.className = "meta"; line.append("Fiches liées : ");
      chosen.forEach((item, index) => { if (index) line.append(" · "); appendLinked(line, [{ text: item.name, href: item.href }]); });
      page.append(line);
    }
  } catch (error) { console.error("Liens du document :", error); }
  // Glossaire en un seul passage (un terme une seule fois dans tout le document), après les liens vers les fiches.
  skipTermNames(used);
  void applyGlossary(glossaryNodes);
}

try {
  const { client, data } = await loadPublishedContent("archives");
  const index = data.findIndex(row => row.slug === slug);
  if (!slug || index < 0) { root.replaceChildren(); status.textContent = "Ce document est introuvable ou n’est plus publié."; }
  else {
    status.hidden = true; render(client, data[index]); setCanonical("archive", data[index].slug);
    renderNeighbours(document.querySelectorAll("[data-nav]"), data, index, documentUrl, row => row.title);
  }
} catch (error) { showLoadError(error, status, root, "documents d’archives"); }
