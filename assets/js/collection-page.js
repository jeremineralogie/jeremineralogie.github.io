import { listPublishedSpecimens } from "./collection-repository.js";

const status = document.querySelector("#collection-source-status");
const grid = document.querySelector("#collection-grid");
const filters = [...document.querySelectorAll("[data-filter]")];
const normalize = value => String(value || "").trim().toLocaleLowerCase("fr");

try {
  const remote = await listPublishedSpecimens();
  const fields = ["mineral", "region", "department", "locality", "association"];
  filters.forEach(filter => {
    const original = filter.options[0];
    filter.replaceChildren(original);
    const key = filter.dataset.filter;
    const values = new Set(remote.flatMap(specimen => {
      const value = key === "association" ? specimen.associations : [specimen[key]];
      return value || [];
    }).filter(Boolean));
    [...values].sort((a, b) => a.localeCompare(b, "fr")).forEach(value => filter.add(new Option(value, value)));
  });
  filters.forEach(filter => filter.replaceWith(filter.cloneNode(true)));
  const activeFilters = [...document.querySelectorAll("[data-filter]")];
  const render = () => {
    const chosen = Object.fromEntries(activeFilters.map(filter => [filter.dataset.filter, normalize(filter.value)]));
    const visible = remote.filter(specimen => fields.slice(0, 4).every(key => !chosen[key] || normalize(specimen[key]) === chosen[key]) &&
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
      const title = document.createElement("h3"); title.textContent = specimen.mineral || "Spécimen";
      const meta = document.createElement("div"); meta.className = "meta";
      meta.textContent = [specimen.locality, specimen.department, "Voir la fiche"].filter(Boolean).join(" · ");
      body.append(title, meta); card.append(body); grid.append(card);
    });
    document.querySelector("#collection-count").textContent = `${visible.length} spécimen${visible.length === 1 ? "" : "s"}`;
    document.querySelector("#collection-empty").hidden = visible.length > 0;
  };
  activeFilters.forEach(filter => filter.addEventListener("change", render));
  render();
  status.textContent = "Collection chargée depuis Supabase.";
} catch (error) {
  grid.replaceChildren();
  document.querySelector("#collection-count").textContent = "";
  document.querySelector("#collection-empty").hidden = true;
  status.textContent = "Impossible de charger la collection depuis Supabase. Réessayez plus tard.";
  console.error("Chargement Supabase de la collection :", error);
}
