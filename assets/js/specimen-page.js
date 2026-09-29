import { getPublishedSpecimen } from "./collection-repository.js";

const slug = new URLSearchParams(location.search).get("id");
if (!slug) {
  showMissing();
} else {
  try {
    const specimen = await getPublishedSpecimen(slug);
    if (specimen) renderSpecimen(specimen);
    else showMissing();
  } catch (error) {
    console.error("Chargement Supabase du spécimen :", error);
    showLoadError();
  }
}

function showLoadError() {
  document.querySelector("#specimen-detail").hidden = true;
  document.querySelector("#specimen-content").hidden = true;
  document.querySelector("#specimen-not-found").hidden = true;
  document.querySelector("#specimen-load-error").hidden = false;
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
  root.hidden = false;
  content.hidden = false;
  document.title = `${specimen.mineral || "Spécimen"} — Ma collection — Jeremineralogie`;
  root.querySelectorAll("[data-mineral]").forEach(element => { element.textContent = specimen.mineral || "Spécimen"; });
  const put = (selector, value) => { const element = root.querySelector(selector); element.textContent = value || "Non renseigné"; };
  put("[data-location-summary]", [specimen.locality, specimen.department, specimen.region].filter(Boolean).join(" · ") || "Localisation à compléter");
  put("[data-provenance]", specimen.provenance); put("[data-locality]", specimen.locality);
  put("[data-region]", specimen.region); put("[data-dimensions]", specimen.dimensions); put("[data-weight]", specimen.weight);
  put("[data-associations]", (specimen.associations || []).join(", ")); put("[data-discovery-date]", specimen.discoveryDate);
  content.querySelector("[data-description]").textContent = specimen.description || "Non renseigné";
  const department = root.querySelector("[data-department]");
  department.textContent = specimen.department ? specimen.department + (specimen.departmentCode ? ` (${specimen.departmentCode})` : "") : "Non renseigné";
  if (specimen.departmentCode) department.href = "departement.html?dep=" + encodeURIComponent(specimen.departmentCode);
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
}
