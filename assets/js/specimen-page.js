import { departmentUrl } from "./clean-urls.js";
import { setCanonical } from "./clean-urls.js";
import { getSupabase } from "./supabase-client.js";
import { getPublishedSpecimen, listPublishedSpecimens } from "./collection-repository.js";
import { renderNeighbours, specimenUrl } from "./detail-nav.js";
import { siteTypeLabel } from "./reference-resolver.js";
import { ficheUrl } from "./entity-links.js";
import { specimenTitle } from "./seo-titles.js";
import { applyGlossary } from "./glossary-links.js";
import { favoriteButton } from "./favorites.js";

const slug = new URLSearchParams(window.JM_PARAMS ?? location.search).get("id");
const client = getSupabase();
let sequence = 0;
let loading = false;
let refreshQueued = false;
let pollingFallback = null;
let neighboursLoaded = false;

// Précédent / suivant : même ordre que la liste « Ma collection » (sans filtre).
async function loadNeighbours() {
  if (neighboursLoaded) return;
  neighboursLoaded = true;
  try {
    const list = await listPublishedSpecimens();
    const index = list.findIndex(item => item.id === slug);
    if (index >= 0) renderNeighbours(document.querySelectorAll("[data-nav]"), list, index, specimenUrl, item => item.mineral || item.provenance);
  } catch (error) { neighboursLoaded = false; console.error("Chargement de la navigation entre spécimens :", error); }
}

async function refreshSpecimen() {
  if (!slug) return showMissing();
  if (loading) {
    refreshQueued = true;
    return;
  }
  loading = true;
  const current = ++sequence;
  try {
    const specimen = await getPublishedSpecimen(slug);
    if (current !== sequence) return;
    if (specimen) renderSpecimen(specimen);
    else showMissing();
  } catch (error) {
    if (current !== sequence) return;
    console.error("Chargement/actualisation Supabase du spécimen :", error);
    showLoadError();
  } finally {
    loading = false;
    if (refreshQueued) {
      refreshQueued = false;
      queueMicrotask(() => void refreshSpecimen());
    }
  }
}

function showLoadError() {
  document.querySelector("#specimen-detail").hidden = true;
  document.querySelector("#specimen-content").hidden = true;
  document.querySelector("#specimen-not-found").hidden = true;
  const error = document.querySelector("#specimen-load-error");
  error.textContent = "Impossible de charger ou d’actualiser cette fiche. Vérifiez votre connexion puis réessayez.";
  error.hidden = false;
}

function showMissing() {
  document.querySelector("#specimen-detail").hidden = true;
  document.querySelector("#specimen-content").hidden = true;
  document.querySelector("#specimen-load-error").hidden = true;
  document.querySelector("#specimen-not-found").hidden = false;
}

function renderSpecimen(specimen) {
  const root = document.querySelector("#specimen-detail");
  const content = document.querySelector("#specimen-content");
  const notFound = document.querySelector("#specimen-not-found");
  notFound.hidden = true;
  document.querySelector("#specimen-load-error").hidden = true;
  root.hidden = false; setCanonical("specimen", slug);
  content.hidden = false;
  document.title = specimenTitle(specimen.mineral, specimen.provenance || specimen.locality);
  document.querySelector("[data-seo]")?.remove();
  root.querySelectorAll("[data-mineral]").forEach(element => { element.textContent = specimen.mineral || "Spécimen"; });
  const put = (selector, value) => { const element = root.querySelector(selector); element.textContent = value || "Non renseigné"; };
  put("[data-location-summary]", [specimen.locality, specimen.department, specimen.region, specimen.country].filter(Boolean).join(" · ") || "Localisation à compléter");
  put("[data-provenance]", specimen.provenance); put("[data-locality]", specimen.locality);
  put("[data-region]", specimen.region); put("[data-country]", specimen.country);
  put("[data-site-type]", siteTypeLabel(specimen.siteType)); put("[data-keywords]", specimen.keywords);
  put("[data-dimensions]", specimen.dimensions); put("[data-weight]", specimen.weight);
  put("[data-associations]", (specimen.associations || []).join(", ")); put("[data-discovery-date]", specimen.discoveryDate);
  content.querySelector("[data-description]").textContent = specimen.description || "Non renseigné";
  if (specimen.description) void applyGlossary(content.querySelector("[data-description]"));
  root.querySelector(".fav-btn")?.remove();
  root.querySelector("[data-location-summary]").after(favoriteButton({ type: "specimen", id: specimen.id, name: specimen.mineral || "Spécimen", href: specimenUrl({ id: specimen.id }), meta: [specimen.provenance || specimen.locality, specimen.department].filter(Boolean).join(" · "), image: (specimen.photos || [])[0] || "" }));
  const linkField = (selector, text, href) => {
    const element = root.querySelector(selector);
    if (!text || !href) return;
    const link = document.createElement("a"); link.className = "link"; link.href = href; link.textContent = text; element.replaceChildren(link);
  };
  linkField("dd[data-mineral]", specimen.mineral, specimen.mineralSlug && ficheUrl("mineral", specimen.mineralSlug));
  linkField("[data-provenance]", specimen.provenance, specimen.mineSlug && ficheUrl("mine", specimen.mineSlug));
  linkField("[data-locality]", specimen.locality, specimen.localitySlug && ficheUrl("locality", specimen.localitySlug));
  const department = root.querySelector("[data-department]");
  department.textContent = specimen.department ? specimen.department + (specimen.departmentCode ? ` (${specimen.departmentCode})` : "") : "Non renseigné";
  if (specimen.departmentCode) department.href = departmentUrl(specimen.departmentCode);
  else department.removeAttribute("href");
  const gallery = root.querySelector("[data-gallery]"); const thumbs = root.querySelector("[data-thumbnails]");
  gallery.replaceChildren(); thumbs.replaceChildren();
  const photos = (specimen.photos || []).filter(Boolean);
  if (!photos.length) {
    const placeholder = document.createElement("div"); placeholder.className = "gallery-photo-placeholder"; placeholder.textContent = "Photographie à ajouter";
    gallery.append(placeholder); thumbs.hidden = true;
  } else {
    thumbs.hidden = false;
    const main = document.createElement("img"); main.src = photos[0]; main.alt = specimen.mineral || "Spécimen"; gallery.append(main);
    photos.forEach((photo, index) => {
      const thumb = document.createElement("img"); thumb.src = photo; thumb.alt = `${specimen.mineral || "Spécimen"} — photo ${index + 1}`;
      thumb.tabIndex = 0; thumb.setAttribute("role", "button");
      const choose = () => { main.src = photo; main.alt = thumb.alt; };
      thumb.addEventListener("click", choose); thumb.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); choose(); } });
      thumbs.append(thumb);
    });
  }
  const labels = { formula: "Formule", crystalSystem: "Système cristallin", hardness: "Dureté", density: "Densité", colors: "Couleurs", luster: "Éclat", cleavage: "Clivage", habit: "Habitus", formation: "Formation" };
  const science = content.querySelector("[data-scientific]"); science.replaceChildren();
  Object.entries(labels).forEach(([key, label]) => {
    const value = specimen.scientific?.[key]; if (!value || (Array.isArray(value) && !value.length)) return;
    const term = document.createElement("dt"); term.textContent = label;
    const description = document.createElement("dd"); description.textContent = Array.isArray(value) ? value.join(", ") : value;
    science.append(term, description);
  });
  content.querySelector("[data-scientific-section]").hidden = science.children.length === 0;
  void loadNeighbours();
}

void refreshSpecimen();

if (client) {
  const queueRefresh = () => {
    if (refreshQueued) return;
    refreshQueued = true;
    queueMicrotask(() => {
      refreshQueued = false;
      void refreshSpecimen();
    });
  };
  pollingFallback = window.setInterval(queueRefresh, 60000);
  const channel = client.channel(`public-specimen-${slug || "missing"}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "specimens" }, queueRefresh)
    .on("postgres_changes", { event: "*", schema: "public", table: "specimen_media" }, queueRefresh)
    .subscribe(subscriptionStatus => {
      if (subscriptionStatus === "SUBSCRIBED") {
        queueRefresh();
      }
      else if (subscriptionStatus === "CHANNEL_ERROR" || subscriptionStatus === "TIMED_OUT") {
        console.error("Synchronisation Realtime de la fiche indisponible :", subscriptionStatus);
        if (!pollingFallback) pollingFallback = window.setInterval(queueRefresh, 30000);
      }
    });
  window.addEventListener("focus", queueRefresh);
  window.addEventListener("online", queueRefresh);
  window.addEventListener("pagehide", () => {
    window.removeEventListener("focus", queueRefresh);
    window.removeEventListener("online", queueRefresh);
    if (pollingFallback) window.clearInterval(pollingFallback);
    void client.removeChannel(channel);
  }, { once: true });
}
