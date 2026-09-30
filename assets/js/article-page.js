import { loadPublishedContent, publicMediaUrl, showLoadError } from "./content-repository.js";
import { appendLinked, buildLinker, loadArticleLinks, loadLinkEntities } from "./entity-links.js";
import { categoryLabel } from "./reference-resolver.js";
import { articleUrl, renderNeighbours } from "./detail-nav.js";
import { applyGlossary } from "./glossary-links.js";

const slug = new URLSearchParams(location.search).get("slug");
const status = document.querySelector("#detail-status");
const root = document.querySelector("#detail");

async function loadLinks(client) {
  try { return { linker: buildLinker(await loadLinkEntities(client)), chosen: await loadArticleLinks(client) }; }
  catch (error) { console.error("Chargement des liens vers les fiches :", error); return { linker: null, chosen: new Map() }; }
}

// « À lire aussi » : articles partageant des fiches liées ou la même catégorie, puis les plus récents.
function relatedArticles(article, all, chosen) {
  const keys = new Set((chosen.get(article.id) || []).map(item => item.href));
  return all.filter(other => other.id !== article.id).map((other, order) => {
    const shared = (chosen.get(other.id) || []).filter(item => keys.has(item.href)).length;
    return { other, score: shared * 3 + (other.category === article.category ? 1 : 0), order };
  }).sort((a, b) => b.score - a.score || a.order - b.order).slice(0, 3).map(entry => entry.other);
}

function readMore(articles) {
  const box = document.createElement("section"); box.className = "read-more";
  const heading = document.createElement("h2"); heading.textContent = "À lire aussi";
  const list = document.createElement("div"); list.className = "read-more-list";
  articles.forEach(item => {
    const link = document.createElement("a"); link.className = "read-more-item"; link.href = articleUrl(item);
    const kicker = document.createElement("span"); kicker.className = "read-more-kicker"; kicker.textContent = categoryLabel(item.category);
    const title = document.createElement("strong"); title.textContent = item.title;
    link.append(kicker, title);
    if (item.published_on) { const date = document.createElement("span"); date.className = "read-more-date"; date.textContent = new Intl.DateTimeFormat("fr-FR").format(new Date(`${item.published_on}T00:00:00`)); link.append(date); }
    list.append(link);
  });
  box.append(heading, list);
  return box;
}

function render(client, article, { linker, chosen }, all = []) {
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
  const others = relatedArticles(article, all, chosen);
  if (others.length) page.append(readMore(others));
  root.replaceChildren(page);
  void applyGlossary([...page.querySelectorAll(":scope > p:not(.meta)")]);
}

try {
  const { client, data } = await loadPublishedContent("articles");
  const index = data.findIndex(article => article.slug === slug);
  if (!slug || index < 0) { root.replaceChildren(); status.textContent = "Cet article est introuvable ou n’est plus publié."; }
  else {
    status.hidden = true; render(client, data[index], await loadLinks(client), data);
    renderNeighbours(document.querySelectorAll("[data-nav]"), data, index, articleUrl, article => article.title);
  }
} catch (error) { showLoadError(error, status, root, "articles"); }
