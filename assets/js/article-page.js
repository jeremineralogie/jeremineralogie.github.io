import { loadPublishedContent, publicMediaUrl, showLoadError } from "./content-repository.js";
import { appendLinked, buildLinker, loadArticleLinks, loadLinkEntities } from "./entity-links.js";
import { categoryLabel } from "./reference-resolver.js";
import { articleUrl, renderNeighbours } from "./detail-nav.js";

const slug = new URLSearchParams(location.search).get("slug");
const status = document.querySelector("#detail-status");
const root = document.querySelector("#detail");

async function loadLinks(client) {
  try { return { linker: buildLinker(await loadLinkEntities(client)), chosen: await loadArticleLinks(client) }; }
  catch (error) { console.error("Chargement des liens vers les fiches :", error); return { linker: null, chosen: new Map() }; }
}

function render(client, article, { linker, chosen }) {
  document.title = `${article.title} — Articles — Jeremineralogie`;
  const used = new Set();
  const images = (article.media || []).filter(item => item.bucket_id === "site-media-public").sort((a, b) => a.position - b.position);
  const page = document.createElement("article"); page.className = "article-full";
  const category = document.createElement("div"); category.className = "kicker"; category.textContent = categoryLabel(article.category);
  const title = document.createElement("h1"); title.className = "page-title"; title.textContent = article.title;
  const date = document.createElement("div"); date.className = "meta";
  date.textContent = article.published_on ? new Intl.DateTimeFormat("fr-FR").format(new Date(`${article.published_on}T00:00:00`)) : "";
  page.append(category, title, date);
  if (images[0]) { const image = document.createElement("img"); image.src = publicMediaUrl(client, images[0]); image.alt = images[0].alt_text || article.title; page.append(image); }
  (Array.isArray(article.body) ? article.body : []).forEach(block => {
    const content = typeof block === "string" ? block : block?.text || "";
    if (!content) return;
    const element = document.createElement(block?.type === "heading" ? "h2" : "p");
    if (linker) appendLinked(element, linker(content, used)); else element.textContent = content;
    page.append(element);
  });
  for (const media of images.slice(1)) {
    const image = document.createElement("img"); image.loading = "lazy"; image.src = publicMediaUrl(client, media); image.alt = media.alt_text || article.title; page.append(image);
    if (media.caption) { const caption = document.createElement("div"); caption.className = "meta"; caption.textContent = media.caption; page.append(caption); }
  }
  const related = chosen.get(article.id) || [];
  if (related.length) {
    const line = document.createElement("p"); line.className = "meta"; line.append("Fiches liées : ");
    related.forEach((item, index) => { if (index) line.append(" · "); appendLinked(line, [{ text: item.name, href: item.href }]); });
    page.append(line);
  }
  root.replaceChildren(page);
}

try {
  const { client, data } = await loadPublishedContent("articles");
  const index = data.findIndex(article => article.slug === slug);
  if (!slug || index < 0) { root.replaceChildren(); status.textContent = "Cet article est introuvable ou n’est plus publié."; }
  else {
    status.hidden = true; render(client, data[index], await loadLinks(client));
    renderNeighbours(document.querySelectorAll("[data-nav]"), data, index, articleUrl, article => article.title);
  }
} catch (error) { showLoadError(error, status, root, "articles"); }
