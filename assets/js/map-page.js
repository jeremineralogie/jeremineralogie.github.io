import { getSupabase } from "./supabase-client.js";
import { shopItemName } from "./content-repository.js";
import { pieceUrl, articleUrl, documentUrl } from "./detail-nav.js";

const L = window.L;
const status = document.querySelector("#map-status");
const missingNote = document.querySelector("#map-missing");
const panel = document.querySelector(".map-filters");
const typeBoxes = [...panel.querySelectorAll(".map-types input")];
const mineralSelect = document.querySelector("#map-mineral");
const communeSelect = document.querySelector("#map-commune");
const TYPES = { collection: "Collection", boutique: "Boutique", article: "Article", archive: "Archive" };
const fold = value => String(value ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "");
const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));

let map, cluster, places = new Map(), entries = [];

function initMap() {
  map = L.map("map", { zoomControl: true, minZoom: 4, maxZoom: 16, worldCopyJump: false, tap: true }).fitBounds([[41.3, -5.2], [51.1, 9.6]]);
  map.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>');
  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    subdomains: "abcd", maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>'
  }).addTo(map);
  cluster = L.markerClusterGroup({
    showCoverageOnHover: false, spiderfyOnMaxZoom: true, maxClusterRadius: 48,
    iconCreateFunction: group => {
      const total = group.getAllChildMarkers().reduce((sum, marker) => sum + (marker.options.count || 0), 0);
      const size = total >= 100 ? 54 : total >= 10 ? 46 : 40;
      return L.divIcon({ html: `<span>${total}</span>`, className: "map-cluster", iconSize: [size, size] });
    }
  });
  map.addLayer(cluster);
}

async function loadData(client) {
  const pick = async (query, label) => { const { data, error } = await query; if (error) { console.error(`Carte — ${label} :`, error); return []; } return data || []; };
  const [localities, mines, specimens, shop, articles, archives] = await Promise.all([
    pick(client.from("localities").select("id,name,slug,latitude,longitude,postal_code,department_code").eq("publication_status", "published"), "communes"),
    pick(client.from("mines").select("id,name,locality_id").eq("publication_status", "published"), "gisements"),
    pick(client.from("specimens").select("slug,mineral_name,locality_id,mine_id,locality_name,provenance,mineral:minerals!specimens_mineral_id_fkey(name),associations:specimen_associations(mineral:minerals(name))").eq("publication_status", "published"), "collection"),
    pick(client.from("shop_items").select("slug,reference,title,mineral_name,locality_id,mine_id,mineral:minerals!shop_items_mineral_id_fkey(name),mine:mines!shop_items_mine_id_fkey(name),associations:shop_item_associations(mineral:minerals(name))").eq("publication_status", "published").eq("sale_status", "available"), "boutique"),
    pick(client.from("articles").select("slug,title,localities:article_localities(locality_id),mines:article_mines(mine_id),minerals:article_minerals(mineral:minerals(name))").eq("publication_status", "published"), "articles"),
    pick(client.from("archive_documents").select("slug,title,localities:archive_localities(locality_id),mines:archive_mines(mine_id),minerals:archive_minerals(mineral:minerals(name))").eq("publication_status", "published"), "archives")
  ]);
  const localityById = new Map(localities.map(row => [row.id, row]));
  const localityByName = new Map(localities.map(row => [fold(row.name), row]));
  const mineById = new Map(mines.map(row => [row.id, row]));
  const mineByName = new Map(mines.map(row => [fold(row.name), row]));
  const placeOf = (localityId, mineId, localityName, mineName) =>
    localityById.get(localityId) || localityById.get(mineById.get(mineId)?.locality_id) ||
    localityByName.get(fold(localityName)) || localityById.get(mineByName.get(fold(mineName))?.locality_id) || null;
  const names = list => (list || []).map(item => item?.mineral?.name).filter(Boolean);
  const all = [];
  const push = (type, title, subtitle, href, minerals, locality) => all.push({ type, title, subtitle, href, minerals: [...new Set(minerals.filter(Boolean))], locality });
  specimens.forEach(row => {
    const mineral = row.mineral_name || row.mineral?.name || "Spécimen";
    push("collection", mineral, row.provenance || mineById.get(row.mine_id)?.name || "", `specimen.html?id=${encodeURIComponent(row.slug)}`,
      [mineral, ...names(row.associations)], placeOf(row.locality_id, row.mine_id, row.locality_name, row.provenance));
  });
  shop.forEach(row => {
    const mineral = shopItemName(row);
    push("boutique", mineral, row.mine?.name || "", pieceUrl(row), [row.mineral_name || row.mineral?.name, ...names(row.associations)], placeOf(row.locality_id, row.mine_id, null, row.mine?.name));
  });
  const linked = (row, type, href) => {
    const spots = new Map();
    (row.localities || []).forEach(link => { const place = localityById.get(link.locality_id); if (place) spots.set(place.id, place); });
    (row.mines || []).forEach(link => { const place = localityById.get(mineById.get(link.mine_id)?.locality_id); if (place) spots.set(place.id, place); });
    if (!spots.size) push(type, row.title, "", href, names(row.minerals), null);
    spots.forEach(place => push(type, row.title, "", href, names(row.minerals), place));
  };
  articles.forEach(row => linked(row, "article", articleUrl(row)));
  archives.forEach(row => linked(row, "archive", documentUrl(row)));
  return all;
}

function communeLabel(place, duplicates) {
  return duplicates.has(fold(place.name)) ? `${place.name} (${place.postal_code || place.department_code || "?"})` : place.name;
}

function fillFilters() {
  const minerals = [...new Set(entries.flatMap(entry => entry.minerals))].sort((a, b) => a.localeCompare(b, "fr"));
  minerals.forEach(name => mineralSelect.add(new Option(name, name)));
  const located = [...new Map(entries.filter(entry => entry.locality).map(entry => [entry.locality.id, entry.locality])).values()];
  const seen = new Map(); located.forEach(place => seen.set(fold(place.name), (seen.get(fold(place.name)) || 0) + 1));
  const duplicates = new Set([...seen].filter(([, count]) => count > 1).map(([key]) => key));
  located.sort((a, b) => a.name.localeCompare(b.name, "fr")).forEach(place => communeSelect.add(new Option(communeLabel(place, duplicates), place.id)));
}

function popupHtml(place, list) {
  const rows = list.map(entry => `<li><span class="map-tag map-tag-${entry.type}">${TYPES[entry.type]}</span><a href="${esc(entry.href)}">${esc(entry.title)}</a>${entry.subtitle ? `<small>${esc(entry.subtitle)}</small>` : ""}</li>`).join("");
  const where = [place.postal_code, place.department_code && `dép. ${place.department_code}`].filter(Boolean).join(" · ");
  return `<div class="map-popup"><strong>${esc(place.name)}</strong>${where ? `<em>${esc(where)}</em>` : ""}<ul>${rows}</ul></div>`;
}

function render() {
  const types = new Set(typeBoxes.filter(box => box.checked).map(box => box.value));
  const mineral = mineralSelect.value;
  const commune = communeSelect.value;
  const visible = entries.filter(entry => types.has(entry.type) && (!mineral || entry.minerals.includes(mineral)) && (!commune || entry.locality?.id === commune));
  const active = (types.size < typeBoxes.length ? 1 : 0) + (mineral ? 1 : 0) + (commune ? 1 : 0);
  const count = panel.querySelector(".filter-count"); count.textContent = active ? `(${active})` : ""; count.hidden = !active;
  panel.querySelector(".filter-reset").disabled = !active;
  cluster.clearLayers(); places = new Map();
  let unplaced = 0;
  visible.forEach(entry => {
    const place = entry.locality;
    if (!place || place.latitude == null || place.longitude == null) { unplaced += 1; return; }
    if (!places.has(place.id)) places.set(place.id, { place, list: [] });
    places.get(place.id).list.push(entry);
  });
  const markers = [];
  places.forEach(({ place, list }) => {
    const icon = L.divIcon({ html: `<span>${list.length}</span>`, className: "map-point", iconSize: [34, 34] });
    const marker = L.marker([place.latitude, place.longitude], { icon, count: list.length, title: place.name, keyboard: true });
    marker.bindPopup(popupHtml(place, list), { maxWidth: 300, autoPanPadding: [20, 20] });
    marker.placeId = place.id;
    markers.push(marker);
  });
  cluster.addLayers(markers);
  const total = visible.length - unplaced;
  status.textContent = total ? `${total} fiche${total > 1 ? "s" : ""} sur ${places.size} lieu${places.size > 1 ? "x" : ""}` : "Aucune fiche localisée pour ces filtres.";
  missingNote.hidden = !unplaced;
  missingNote.textContent = unplaced ? `${unplaced} fiche${unplaced > 1 ? "s" : ""} sans commune localisée n’apparai${unplaced > 1 ? "ssent" : "t"} pas sur la carte.` : "";
  if (commune && markers[0]) { cluster.zoomToShowLayer(markers[0], () => markers[0].openPopup()); }
  else if (markers.length && (mineral || types.size < typeBoxes.length)) map.fitBounds(cluster.getBounds(), { padding: [30, 30], maxZoom: 11 });
}

async function start() {
  if (!L || !L.markerClusterGroup) { status.textContent = "La carte n’a pas pu se charger. Vérifiez votre connexion puis rechargez la page."; return; }
  initMap();
  const client = getSupabase();
  if (!client) { status.textContent = "La carte est momentanément indisponible."; return; }
  try {
    entries = await loadData(client);
    fillFilters();
    render();
  } catch (error) {
    console.error("Chargement de la carte :", error);
    status.textContent = "Impossible de charger les lieux. Réessayez dans quelques instants.";
  }
  typeBoxes.forEach(box => box.addEventListener("change", render));
  mineralSelect.addEventListener("change", render);
  communeSelect.addEventListener("change", render);
  panel.querySelector(".filter-reset").addEventListener("click", () => {
    typeBoxes.forEach(box => { box.checked = true; }); mineralSelect.value = ""; communeSelect.value = "";
    map.fitBounds([[41.3, -5.2], [51.1, 9.6]]); render();
  });
}

void start();
