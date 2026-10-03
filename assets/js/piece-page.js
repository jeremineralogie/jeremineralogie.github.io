import { departmentUrl } from "./clean-urls.js";
import { setCanonical } from "./clean-urls.js";
import { loadPublishedContent, publicMediaUrl, shopItemName, showLoadError } from "./content-repository.js";
import { ficheUrl } from "./entity-links.js";
import { pieceTitle } from "./seo-titles.js";
import { applyGlossary } from "./glossary-links.js";
import { favoriteButton } from "./favorites.js";
import { pieceUrl, renderNeighbours } from "./detail-nav.js";
import { shareButton } from "./share-button.js";
import { specimenAlt } from "./alt-text.js";
import { loadOthersOfMine, loadSimilar, relatedBlock } from "./related.js";

const key = new URLSearchParams(window.JM_PARAMS ?? location.search).get("ref");
const status = document.querySelector("#detail-status");
const root = document.querySelector("#detail");

function render(client, item) {
  const name = shopItemName(item);
  document.title = pieceTitle(name, item.mine?.name);
  const photos = (item.media || []).filter(media => media.bucket_id === "site-media-public").sort((a, b) => a.position - b.position);
  const altOf = (photo, index) => specimenAlt({ mineral: item.mineral_name || item.mineral?.name, associated: (item.associations || []).map(entry => entry.mineral?.name), mine: item.mine?.name, locality: item.locality_name || item.locality?.name,
    department: item.department_name || item.department?.name, departmentCode: item.department_code, region: item.region?.name || item.department?.region?.name, country: item.provenance !== item.mine?.name ? item.provenance : "",
    dimensions: item.dimensions, weight: item.weight_grams == null ? "" : `${String(item.weight_grams).replace(".", ",")} g`, reference: item.reference, keywords: item.keywords, discovery: item.discovery_date_text }, index, photos.length, photo.alt_text);
  const wrap = document.createElement("div"); wrap.className = "specimen";
  const left = document.createElement("div"); const gallery = document.createElement("div"); gallery.className = "gallery-main"; left.append(gallery);
  if (!photos.length) { const placeholder = document.createElement("div"); placeholder.className = "gallery-photo-placeholder"; placeholder.textContent = "Photographie à ajouter"; gallery.append(placeholder); }
  else {
    const main = document.createElement("img"); main.src = publicMediaUrl(client, photos[0]); main.alt = altOf(photos[0], 0); gallery.append(main);
    if (photos.length > 1) {
      const thumbs = document.createElement("div"); thumbs.className = "thumbs";
      photos.forEach((photo, index) => {
        const thumb = document.createElement("img"); thumb.src = publicMediaUrl(client, photo); thumb.alt = altOf(photo, index);
        thumb.tabIndex = 0; thumb.setAttribute("role", "button");
        const choose = () => { main.src = thumb.src; main.alt = thumb.alt; };
        thumb.addEventListener("click", choose); thumb.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); choose(); } });
        thumbs.append(thumb);
      });
      left.append(thumbs);
    }
  }
  const sold = item.sale_status === "sold";
  if (sold) { const ribbon = document.createElement("span"); ribbon.className = "sold-ribbon"; ribbon.textContent = "Vendu"; gallery.append(ribbon); }
  const details = document.createElement("div"); details.className = "details";
  const kicker = document.createElement("div"); kicker.className = "kicker"; kicker.textContent = "Boutique";
  const title = document.createElement("h1"); title.className = "page-title"; title.textContent = name;
  const list = document.createElement("dl");
  const row = (label, value) => {
    if (!value) return;
    const term = document.createElement("dt"); term.textContent = label;
    const description = document.createElement("dd");
    if (value instanceof Node) description.append(value); else description.textContent = value;
    list.append(term, description);
  };
  const link = (text, href) => { if (!text) return ""; if (!href) return text; const anchor = document.createElement("a"); anchor.className = "link"; anchor.href = href; anchor.textContent = text; return anchor; };
  const clean = value => String(value ?? "").trim();
  const mineralName = clean(item.mineral_name || item.mineral?.name);
  const mineName = clean(item.mine?.name);
  const provenance = clean(item.provenance);
  const localityName = clean(item.locality_name || item.locality?.name);
  const departmentName = clean(item.department_name || item.department?.name);
  row("Référence", clean(item.reference));
  row("Minéral", link(mineralName, item.mineral?.slug && ficheUrl("mineral", item.mineral.slug)));
  const associated = (item.associations || []).map(entry => entry.mineral).filter(mineral => mineral?.name);
  if (associated.length) {
    const list = document.createElement("span");
    associated.forEach((mineral, index) => { if (index) list.append(", "); list.append(link(mineral.name, mineral.slug && ficheUrl("mineral", mineral.slug))); });
    row("Minéraux associés", list);
  }
  row("Gisement", link(mineName, item.mine?.slug && ficheUrl("mine", item.mine.slug)));
  row("Commune", link(localityName, item.locality?.slug && ficheUrl("locality", item.locality.slug)));
  row("Département", link(departmentName && (departmentName + (item.department_code ? ` (${item.department_code})` : "")), item.department_code && departmentUrl(item.department_code)));
  row("Région", clean(item.region?.name || item.department?.region?.name));
  if (provenance && provenance !== mineName) row("Pays", provenance);
  row("Dimensions", clean(item.dimensions));
  row("Poids", item.weight_grams == null ? "" : `${String(item.weight_grams).replace(".", ",")} g`);
  row("Mots-clés", clean(item.keywords));
  row("Date de découverte", clean(item.discovery_date_text));
  const price = document.createElement("div"); price.className = "price";
  price.textContent = new Intl.NumberFormat("fr-FR", { style: "currency", currency: item.currency || "EUR" }).format(item.price_cents / 100);
  const contact = sold ? document.createElement("p") : document.createElement("a");
  if (sold) { contact.className = "meta sold-note"; contact.textContent = "Cette pièce a été vendue."; price.classList.add("is-sold"); }
  else { contact.className = "btn"; contact.href = `contact.html?reference=${encodeURIComponent(item.reference)}`; contact.textContent = "Me contacter"; }
  const cover = photos[0] ? publicMediaUrl(client, photos[0]) : "";
  const favorite = favoriteButton({ type: "piece", id: item.reference || item.slug, name: shopItemName(item), href: pieceUrl(item), meta: [clean(item.mine?.name), clean(item.reference)].filter(Boolean).join(" · "), image: cover });
  details.append(kicker, title, list, price, contact, favorite, shareButton({ title: name, text: `${name} — Jeremineralogie` }));
  wrap.append(left, details); root.replaceChildren(wrap);
  document.querySelector("[data-seo]")?.remove();
  if (item.description) {
    const section = document.createElement("div"); section.className = "content";
    const heading = document.createElement("h2"); heading.textContent = "Description";
    const text = document.createElement("p"); text.textContent = item.description; section.append(heading, text); root.append(section);
    void applyGlossary(text);
  }
  const labels = { formula: "Formule", crystal_system: "Système cristallin", hardness: "Dureté", density: "Densité", colors: "Couleurs", luster: "Éclat", cleavage: "Clivage", habit: "Habitus", formation: "Formation" };
  const science = document.createElement("dl"); science.className = "scientific-details";
  Object.entries(labels).forEach(([field, label]) => {
    const value = item.mineral?.[field]; if (value == null || value === "" || (Array.isArray(value) && !value.length)) return;
    const term = document.createElement("dt"); term.textContent = label;
    const description = document.createElement("dd"); description.textContent = Array.isArray(value) ? value.join(", ") : String(value);
    science.append(term, description);
  });
  if (science.children.length) {
    const section = document.createElement("div"); section.className = "content";
    const heading = document.createElement("h2"); heading.textContent = "Documentation minéralogique";
    section.append(heading, science); root.append(section);
  }
  // Maillage : autres minéraux du même gisement, minéraux similaires.
  const mineralSlug = item.mineral?.slug;
  void Promise.all([loadOthersOfMine(client, item.mine?.slug, mineralSlug), loadSimilar(client, mineralSlug)]).then(([others, similar]) => {
    root.querySelectorAll(".related-block").forEach(node => node.remove());
    const blocks = [relatedBlock("Autres minéraux de ce gisement", others), relatedBlock("Minéraux similaires", similar)].filter(Boolean);
    if (blocks.length) root.append(...blocks);
  });
}

try {
  const { client, data } = await loadPublishedContent("shop");
  const index = data.findIndex(item => item.reference === key || item.slug === key);
  if (!key || index < 0) { root.replaceChildren(); status.textContent = "Cette pièce n’est plus disponible en boutique."; }
  else {
    status.hidden = true; render(client, data[index]); setCanonical("piece", data[index].reference || data[index].slug);
    renderNeighbours(document.querySelectorAll("[data-nav]"), data, index, pieceUrl, shopItemName);
  }
} catch (error) { showLoadError(error, status, root, "articles de la boutique"); }
