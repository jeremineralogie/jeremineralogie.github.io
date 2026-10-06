import { setCanonical } from "./clean-urls.js";
import { loadPublishedContent, publicMediaUrl, showLoadError } from "./content-repository.js";
import { appendLinked, buildLinker, linkTextNodes, loadArticleLinks, loadLinkEntities } from "./entity-links.js";
import { renderCrumbs } from "./crumbs.js";
import { categoryLabel } from "./reference-resolver.js";
import { articleUrl, renderNeighbours } from "./detail-nav.js";
import { applyGlossary, skipTermNames } from "./glossary-links.js";
import { articleTitle } from "./seo-titles.js";
import { renderBlocks } from "./article-content.js";
import { shareButton } from "./share-button.js";

const slug = new URLSearchParams(window.JM_PARAMS ?? location.search).get("slug");
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
  document.title = articleTitle(article.title);
  document.querySelector("[data-seo]")?.remove();
  renderCrumbs([["Accueil", "/"], ["Articles", "/articles.html"], [article.title]]);
  const used = new Set();
  const images = (article.media || []).filter(item => item.bucket_id === "site-media-public").sort((a, b) => a.position - b.position);
  const page = document.createElement("article"); page.className = "article-full";
  const category = document.createElement("div"); category.className = "kicker"; category.textContent = categoryLabel(article.category);
  // Le titre et la photo de couverture ne servent qu'à la liste et à la vignette de l'article : l'article s'ouvre sur sa catégorie et sa date,
  // puis directement sur son texte. Le titre reste dans la page pour les lecteurs d'écran et le référencement, sans être affiché.
  const title = document.createElement("h1"); title.className = "visually-hidden"; title.textContent = article.title;
  const date = document.createElement("div"); date.className = "meta";
  date.textContent = article.published_on ? new Intl.DateTimeFormat("fr-FR").format(new Date(`${article.published_on}T00:00:00`)) : "";
  page.append(category, date, title);
  const blocks = renderBlocks(page, article.body, client);
  if (linker) blocks.filter(node => node.classList.contains("art-text") || node.classList.contains("art-rich")).forEach(node => linkTextNodes(node, linker, used));
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
  // Partage : menu de partage de l'appareil (réseaux, messages…) ou, à défaut, copie du lien de l'article.
  const share = document.createElement("div"); share.className = "article-share";
  const shareImage = images[0] ? publicMediaUrl(client, images[0]) : page.querySelector("img.art-img, .art-image img")?.src || "";
  share.append(shareButton({ title: article.title, text: `${article.title} — Jeremineralogie`, image: shareImage, label: "Partager cet article", copyPrompt: "Copiez le lien de cet article :" }));
  page.append(share);
  const others = relatedArticles(article, all, chosen);
  if (others.length) page.append(readMore(others));
  root.replaceChildren(page);
  skipTermNames(used); // un nom déjà relié à une fiche n'est plus relié au glossaire ailleurs dans l'article
  void applyGlossary([...page.querySelectorAll("p.art-text, .art-rich p, .art-rich li")]);
}

try {
  const { client, data } = await loadPublishedContent("articles");
  const index = data.findIndex(article => article.slug === slug);
  if (!slug || index < 0) { root.replaceChildren(); status.textContent = "Cet article est introuvable ou n’est plus publié."; }
  else {
    status.hidden = true; render(client, data[index], await loadLinks(client), data); setCanonical("article", data[index].slug);
    renderNeighbours(document.querySelectorAll("[data-nav]"), data, index, articleUrl, article => article.title);
  }
} catch (error) { showLoadError(error, status, root, "articles"); }
