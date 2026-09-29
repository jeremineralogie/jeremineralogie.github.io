import { loadPublishedContent, publicMediaUrl, showLoadError, watchContent } from "./content-repository.js";

const grid = document.querySelector("#articles-grid");
const status = document.querySelector("#articles-status");
let rows = [];
let client;

function render() {
  grid.replaceChildren();
  if (!rows.length) { status.textContent = "Aucun article publié pour le moment."; status.hidden = false; return; }
  status.hidden = true;
  rows.forEach(article => {
    const card = document.createElement("article"); card.className = "card";
    const images = (article.media || []).filter(item => item.bucket_id === "site-media-public").sort((a, b) => a.position - b.position);
    if (images[0]) { const image = document.createElement("img"); image.src = publicMediaUrl(client, images[0]); image.alt = images[0].alt_text || article.title; card.append(image); }
    const body = document.createElement("div"); body.className = "card-body";
    const category = document.createElement("div"); category.className = "kicker"; category.textContent = article.category.replaceAll("-", " "); body.append(category);
    const title = document.createElement("h3"); title.textContent = article.title; body.append(title);
    const meta = document.createElement("div"); meta.className = "meta"; meta.textContent = article.published_on ? new Intl.DateTimeFormat("fr-FR").format(new Date(`${article.published_on}T00:00:00`)) : ""; body.append(meta);
    if (article.excerpt) { const excerpt = document.createElement("p"); excerpt.textContent = article.excerpt; body.append(excerpt); }
    const blocks = Array.isArray(article.body) ? article.body : [];
    blocks.forEach(block => { const paragraph = document.createElement(block?.type === "heading" ? "h4" : "p"); paragraph.textContent = typeof block === "string" ? block : block?.text || ""; if (paragraph.textContent) body.append(paragraph); });
    for (const media of images.slice(1)) { const image = document.createElement("img"); image.loading = "lazy"; image.src = publicMediaUrl(client, media); image.alt = media.alt_text || article.title; body.append(image); if (media.caption) { const caption = document.createElement("div"); caption.className = "meta"; caption.textContent = media.caption; body.append(caption); } }
    card.append(body); grid.append(card);
  });
}

async function refresh() {
  status.textContent = "Chargement des articles depuis Supabase…"; status.hidden = false;
  try { const result = await loadPublishedContent("articles"); client = result.client; rows = result.data; render(); }
  catch (error) { rows = []; showLoadError(error, status, grid, "articles"); }
}
await refresh();
if (client) watchContent(client, "articles", refresh);
