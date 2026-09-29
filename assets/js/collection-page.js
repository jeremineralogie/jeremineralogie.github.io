import { getSupabase } from "./supabase-client.js";
import { listPublishedSpecimens } from "./collection-repository.js";

const status = document.querySelector("#collection-source-status");
const grid = document.querySelector("#collection-grid");
const count = document.querySelector("#collection-count");
const empty = document.querySelector("#collection-empty");
const filters = [...document.querySelectorAll("[data-filter]")];
const fields = ["mineral", "region", "department", "locality"];
const normalize = value => String(value || "").trim().toLocaleLowerCase("fr");
const client = getSupabase();
let specimens = [];
let refreshInProgress = false;
let refreshQueued = false;
let pollingFallback = null;
let presetsApplied = false;
const presets = new URLSearchParams(location.search);

function renderFilters() {
  filters.forEach(filter => {
    const selected = filter.value;
    const firstOption = filter.options[0];
    const key = filter.dataset.filter;
    const values = new Set(specimens.flatMap(specimen => {
      const value = key === "association" ? specimen.associations : [specimen[key]];
      return value || [];
    }).filter(Boolean));
    filter.replaceChildren(firstOption);
    [...values].sort((a, b) => a.localeCompare(b, "fr")).forEach(value => filter.add(new Option(value, value)));
    filter.value = values.has(selected) ? selected : "";
  });
}

function renderCollection() {
  const chosen = Object.fromEntries(filters.map(filter => [filter.dataset.filter, normalize(filter.value)]));
  const visible = specimens.filter(specimen => fields.every(key => !chosen[key] || normalize(specimen[key]) === chosen[key]) &&
    (!chosen.association || specimen.associations.some(value => normalize(value) === chosen.association)));
  grid.replaceChildren();
  visible.forEach(specimen => {
    const card = document.createElement("a");
    card.className = "card";
    card.href = "specimen.html?id=" + encodeURIComponent(specimen.id);
    if (specimen.photos.length) {
      const image = document.createElement("img"); image.src = specimen.photos[0]; image.alt = specimen.mineral || "Spécimen"; card.append(image);
    } else {
      const placeholder = document.createElement("div"); placeholder.className = "card-photo-placeholder";
      placeholder.textContent = "Photographie à ajouter"; placeholder.setAttribute("role", "img"); card.append(placeholder);
    }
    const body = document.createElement("div"); body.className = "card-body";
    const title = document.createElement("h3"); title.textContent = specimen.mineral || specimen.provenance || "Spécimen";
    const meta = document.createElement("div"); meta.className = "meta";
    meta.textContent = [specimen.locality, specimen.department, specimen.country, "Voir la fiche"].filter(Boolean).join(" · ");
    body.append(title, meta); card.append(body); grid.append(card);
  });
  count.textContent = `${visible.length} spécimen${visible.length === 1 ? "" : "s"}`;
  empty.hidden = visible.length > 0;
}

async function refreshCollection() {
  if (refreshInProgress) {
    refreshQueued = true;
    return;
  }
  refreshInProgress = true;
  status.textContent = "Actualisation de la collection depuis Supabase…";
  try {
    specimens = await listPublishedSpecimens();
    renderFilters();
    if (!presetsApplied) {
      presetsApplied = true;
      filters.forEach(filter => {
        const wanted = normalize(presets.get(filter.dataset.filter));
        const option = wanted && [...filter.options].find(item => normalize(item.value) === wanted);
        if (option) filter.value = option.value;
      });
    }
    renderCollection();
    status.textContent = "Collection synchronisée avec Supabase.";
  } catch (error) {
    specimens = [];
    renderFilters();
    grid.replaceChildren();
    count.textContent = "";
    empty.hidden = true;
    status.textContent = "Impossible de charger la collection depuis Supabase. Vérifiez votre connexion puis réessayez.";
    console.error("Échec de chargement/actualisation des spécimens publiés :", error);
  } finally {
    refreshInProgress = false;
    if (refreshQueued) {
      refreshQueued = false;
      queueMicrotask(() => void refreshCollection());
    }
  }
}

filters.forEach(filter => filter.addEventListener("change", renderCollection));
void refreshCollection();

if (client) {
  const queueRefresh = () => {
    if (refreshQueued) return;
    refreshQueued = true;
    queueMicrotask(() => {
      refreshQueued = false;
      void refreshCollection();
    });
  };
  pollingFallback = window.setInterval(queueRefresh, 60000);
  const channel = client.channel("public-specimen-collection")
    .on("postgres_changes", { event: "*", schema: "public", table: "specimens" }, queueRefresh)
    .on("postgres_changes", { event: "*", schema: "public", table: "specimen_media" }, queueRefresh)
    .subscribe(subscriptionStatus => {
      if (subscriptionStatus === "SUBSCRIBED") {
        queueRefresh();
      }
      else if (subscriptionStatus === "CHANNEL_ERROR" || subscriptionStatus === "TIMED_OUT") {
        console.error("Synchronisation Realtime de la collection indisponible :", subscriptionStatus);
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
