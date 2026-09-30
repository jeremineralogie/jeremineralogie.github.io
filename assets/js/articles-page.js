import { loadPublishedContent, publicMediaUrl, showLoadError, watchContent } from "./content-repository.js";
import { categoryLabel } from "./reference-resolver.js";
import { articleUrl } from "./detail-nav.js";

const grid = document.querySelector("#articles-grid");
const status = document.querySelector("#articles-status");
let rows = [];
let client;

// Résumé : l'extrait saisi ; à défaut, le début du premier paragraphe de l'article (coupé par le CSS).
const summaryOf = article => {
  if (article.excerpt) return article.excerpt;
  const first = (Array.isArray(article.body) ? article.body : []).find(block => block?.type !== "heading" && (typeof block === "string" ? block : block?.text));
  return typeof first === "string" ? first : first?.text || "";
};

function render() {
  grid.replaceChildren();
  if (!rows.length) { status.textContent = "Aucun article publié pour le moment."; status.hidden = false; return; }
  status.hidden = true;
  rows.forEach(article => {
    const card = document.createElement("a"); card.className = "card"; card.href = articleUrl(article);
    const image = (article.media || []).filter(item => item.bucket_id === "site-media-public").sort((a, b) => a.position - b.position)[0];
    if (image) { const element = document.createElement("img"); element.src = publicMediaUrl(client, image); element.alt = image.alt_text || article.title; card.append(element); }
    const body = document.createElement("div"); body.className = "card-body";
    const category = document.createElement("div"); category.className = "kicker"; category.textContent = categoryLabel(article.category); body.append(category);
    const title = document.createElement("h3"); title.textContent = article.title; body.append(title);
    const meta = document.createElement("div"); meta.className = "meta"; meta.textContent = article.published_on ? new Intl.DateTimeFormat("fr-FR").format(new Date(`${article.published_on}T00:00:00`)) : ""; body.append(meta);
    const summary = summaryOf(article);
    if (summary) { const excerpt = document.createElement("p"); excerpt.className = "summary"; excerpt.textContent = summary; body.append(excerpt); }
    const more = document.createElement("div"); more.className = "more"; more.textContent = "Lire l’article"; body.append(more);
    card.append(body); grid.append(card);
  });
}

async function refresh() {
  status.textContent = "Chargement des articles…"; status.hidden = false;
  try { const result = await loadPublishedContent("articles"); client = result.client; rows = result.data; render(); }
  catch (error) { rows = []; showLoadError(error, status, grid, "articles"); }
}
await refresh();
// Anciens liens articles.html#slug : ouvrent directement l'article.
if (location.hash) { const wanted = decodeURIComponent(location.hash.slice(1)); const hit = rows.find(article => article.slug === wanted); if (hit) location.replace(articleUrl(hit)); }
if (client) watchContent(client, "articles", refresh);
