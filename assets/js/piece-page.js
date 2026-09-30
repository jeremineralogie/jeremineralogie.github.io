import { loadPublishedContent, publicMediaUrl, showLoadError } from "./content-repository.js";
import { ficheUrl } from "./entity-links.js";
import { pieceUrl, renderNeighbours } from "./detail-nav.js";

const key = new URLSearchParams(location.search).get("ref");
const status = document.querySelector("#detail-status");
const root = document.querySelector("#detail");

function render(client, item) {
  document.title = `${item.title} — Boutique — Jeremineralogie`;
  const photos = (item.media || []).filter(media => media.bucket_id === "site-media-public").sort((a, b) => a.position - b.position);
  const wrap = document.createElement("div"); wrap.className = "specimen";
  const left = document.createElement("div"); const gallery = document.createElement("div"); gallery.className = "gallery-main"; left.append(gallery);
  if (!photos.length) { const placeholder = document.createElement("div"); placeholder.className = "gallery-photo-placeholder"; placeholder.textContent = "Photographie à ajouter"; gallery.append(placeholder); }
  else {
    const main = document.createElement("img"); main.src = publicMediaUrl(client, photos[0]); main.alt = photos[0].alt_text || item.title; gallery.append(main);
    if (photos.length > 1) {
      const thumbs = document.createElement("div"); thumbs.className = "thumbs";
      photos.forEach((photo, index) => {
        const thumb = document.createElement("img"); thumb.src = publicMediaUrl(client, photo); thumb.alt = photo.alt_text || `${item.title} — photo ${index + 1}`;
        thumb.tabIndex = 0; thumb.setAttribute("role", "button");
        const choose = () => { main.src = thumb.src; main.alt = thumb.alt; };
        thumb.addEventListener("click", choose); thumb.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); choose(); } });
        thumbs.append(thumb);
      });
      left.append(thumbs);
    }
  }
  const details = document.createElement("div"); details.className = "details";
  const kicker = document.createElement("div"); kicker.className = "kicker"; kicker.textContent = "Boutique";
  const title = document.createElement("h1"); title.className = "page-title"; title.textContent = item.title;
  const list = document.createElement("dl");
  const row = (label, value) => {
    if (!value) return;
    const term = document.createElement("dt"); term.textContent = label;
    const description = document.createElement("dd");
    if (value instanceof Node) description.append(value); else description.textContent = value;
    list.append(term, description);
  };
  row("Référence", item.reference);
  if (item.provenance && item.mine?.slug) { const link = document.createElement("a"); link.className = "link"; link.href = ficheUrl("mine", item.mine.slug); link.textContent = item.provenance; row("Provenance", link); }
  else row("Provenance", item.provenance);
  row("Dimensions", item.dimensions);
  row("Poids", item.weight_grams == null ? "" : `${item.weight_grams} g`);
  const price = document.createElement("div"); price.className = "price";
  price.textContent = new Intl.NumberFormat("fr-FR", { style: "currency", currency: item.currency || "EUR" }).format(item.price_cents / 100);
  const contact = document.createElement("a"); contact.className = "btn"; contact.href = `contact.html?reference=${encodeURIComponent(item.reference)}`; contact.textContent = "Me contacter";
  details.append(kicker, title, list, price, contact);
  wrap.append(left, details); root.replaceChildren(wrap);
  if (item.description) {
    const section = document.createElement("div"); section.className = "content";
    const heading = document.createElement("h2"); heading.textContent = "Description";
    const text = document.createElement("p"); text.textContent = item.description; section.append(heading, text); root.append(section);
  }
}

try {
  const { client, data } = await loadPublishedContent("shop");
  const index = data.findIndex(item => item.reference === key || item.slug === key);
  if (!key || index < 0) { root.replaceChildren(); status.textContent = "Cette pièce n’est plus disponible en boutique."; }
  else {
    status.hidden = true; render(client, data[index]);
    renderNeighbours(document.querySelectorAll("[data-nav]"), data, index, pieceUrl, item => item.title);
  }
} catch (error) { showLoadError(error, status, root, "articles de la boutique"); }
