// Pose manuelle d'un point sur la carte, depuis les formulaires de l'admin.
// Sert aux communes absentes du référentiel officiel (hameaux, lieux-dits) ou mal placées.
import { isFrenchCode, searchCommunes, searchWorld } from "./geo-communes.js";

const LEAFLET = "https://unpkg.com/leaflet@1.9.4/dist/";
const FRANCE = [[41.3, -5.2], [51.1, 9.6]];
const fold = value => String(value ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[’`]/g, "'").toLowerCase().replace(/[\s-]+/g, " ").trim();
const round = value => Math.round(value * 1e6) / 1e6;
let loading = null;

function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  loading ||= new Promise((resolve, reject) => {
    const css = document.createElement("link"); css.rel = "stylesheet"; css.href = `${LEAFLET}leaflet.css`; document.head.append(css);
    const script = document.createElement("script"); script.src = `${LEAFLET}leaflet.js`;
    script.onload = () => resolve(window.L);
    script.onerror = () => { loading = null; reject(new Error("La carte n’a pas pu se charger. Vérifiez votre connexion.")); };
    document.head.append(script);
  });
  return loading;
}

async function startView(target) {
  if (target.latitude != null && target.longitude != null) return { center: [target.latitude, target.longitude], zoom: 14 };
  if (!target.name) return null;
  const foreign = target.department && !isFrenchCode(target.department);
  try {
    if (!foreign) {
      const rows = await searchCommunes(target.name, target.department || "");
      if (rows[0]) return { center: [rows[0].latitude, rows[0].longitude], zoom: 12 };
    }
    const world = await searchWorld([target.name, foreign ? target.department.replace(/-/g, " ") : ""].filter(Boolean).join(", "), 1);
    if (world[0]) return { center: [world[0].latitude, world[0].longitude], zoom: 12 };
  } catch { /* Service indisponible : on part de la vue France. */ }
  return null;
}

// Ouvre la carte en plein écran ; renvoie { latitude, longitude } ou null si l'on annule.
export async function pickPoint(target) {
  const L = await loadLeaflet();
  return new Promise(resolve => {
    const overlay = document.createElement("div"); overlay.className = "pick-overlay";
    overlay.setAttribute("role", "dialog"); overlay.setAttribute("aria-modal", "true"); overlay.setAttribute("aria-label", "Poser le point sur la carte");
    const head = document.createElement("div"); head.className = "pick-head";
    const title = document.createElement("strong"); title.textContent = `📍 ${target.name || "Nouveau lieu"}`;
    const help = document.createElement("span"); help.textContent = "Touchez la carte à l’endroit exact, puis faites glisser le point pour l’ajuster.";
    const finder = document.createElement("form"); finder.className = "pick-search";
    const query = document.createElement("input"); query.type = "search"; query.placeholder = "Chercher un lieu dans le monde (ville, pays…)"; query.value = target.name || ""; query.setAttribute("aria-label", "Chercher un lieu dans le monde");
    const go = document.createElement("button"); go.type = "submit"; go.className = "admin-secondary"; go.textContent = "Chercher";
    const found = document.createElement("div"); found.className = "pick-results";
    finder.append(query, go);
    head.append(title, help, finder, found);
    const mapBox = document.createElement("div"); mapBox.className = "pick-map";
    const foot = document.createElement("div"); foot.className = "pick-foot";
    const coords = document.createElement("span"); coords.className = "pick-coords"; coords.textContent = "Aucun point posé.";
    const mine = document.createElement("button"); mine.type = "button"; mine.className = "admin-secondary"; mine.textContent = "Ma position";
    const cancel = document.createElement("button"); cancel.type = "button"; cancel.className = "admin-secondary"; cancel.textContent = "Annuler";
    const ok = document.createElement("button"); ok.type = "button"; ok.className = "btn"; ok.textContent = "Valider ce point"; ok.disabled = true;
    foot.append(coords, mine, cancel, ok);
    overlay.append(head, mapBox, foot);
    document.body.append(overlay);
    document.body.classList.add("pick-open");

    const map = L.map(mapBox, { zoomControl: true, maxZoom: 18 }).fitBounds(FRANCE);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
    }).addTo(map);
    map.attributionControl.setPrefix(false);
    let marker = null;
    const place = latlng => {
      if (!marker) {
        marker = L.marker(latlng, { draggable: true, autoPan: true }).addTo(map);
        marker.on("dragend", () => place(marker.getLatLng()));
      } else marker.setLatLng(latlng);
      coords.textContent = `${round(latlng.lat).toFixed(5)}, ${round(latlng.lng).toFixed(5)}`;
      ok.disabled = false;
    };
    map.on("click", event => place(event.latlng));
    if (target.latitude != null && target.longitude != null) place(L.latLng(target.latitude, target.longitude));
    void startView(target).then(view => { if (view) map.setView(view.center, view.zoom); });
    requestAnimationFrame(() => map.invalidateSize());
    finder.addEventListener("submit", async event => {
      event.preventDefault();
      found.textContent = "Recherche…";
      try {
        const rows = await searchWorld(query.value, 6);
        if (!rows.length) { found.textContent = "Aucun lieu trouvé."; return; }
        found.replaceChildren(...rows.map(row => {
          const choice = document.createElement("button"); choice.type = "button"; choice.className = "pick-result"; choice.textContent = row.name;
          choice.addEventListener("click", () => { map.setView([row.latitude, row.longitude], 13); found.replaceChildren(); });
          return choice;
        }));
      } catch (error) { found.textContent = error.message; }
    });

    mine.hidden = !navigator.geolocation;
    mine.addEventListener("click", () => {
      mine.disabled = true; mine.textContent = "Localisation…";
      navigator.geolocation.getCurrentPosition(position => {
        const here = L.latLng(position.coords.latitude, position.coords.longitude);
        place(here); map.setView(here, 16); mine.disabled = false; mine.textContent = "Ma position";
      }, () => { mine.disabled = false; mine.textContent = "Position indisponible"; }, { enableHighAccuracy: true, timeout: 15000 });
    });
    const close = result => {
      map.remove(); overlay.remove(); document.body.classList.remove("pick-open");
      document.removeEventListener("keydown", onKey);
      resolve(result);
    };
    const onKey = event => { if (event.key === "Escape") close(null); };
    document.addEventListener("keydown", onKey);
    cancel.addEventListener("click", () => close(null));
    ok.addEventListener("click", () => { const at = marker.getLatLng(); close({ latitude: round(at.lat), longitude: round(at.lng) }); });
  });
}

// Bloc « position sur la carte » à placer sous le champ commune d'un formulaire.
// getTargets() renvoie la liste des communes saisies : { key, id?, name, department?, latitude?, longitude? }.
// Les points posés restent en attente (widget.pending) jusqu'à l'enregistrement de la fiche.
export function createPointTool(getTargets) {
  const box = document.createElement("div"); box.className = "point-tool";
  const pending = new Map();
  let drawn = "";
  const refresh = () => {
    const targets = getTargets().filter(target => target.name);
    // Ne reconstruit que si quelque chose a changé : un clic en cours sur un bouton ne doit pas être perdu.
    const signature = JSON.stringify(targets.map(target => [target.key, target.name, target.latitude, target.longitude, pending.get(target.key)]));
    if (signature === drawn) return;
    drawn = signature;
    box.hidden = !targets.length;
    box.replaceChildren(...targets.map(target => {
      const row = document.createElement("div"); row.className = "point-row";
      const state = document.createElement("span");
      const manual = pending.get(target.key);
      const located = target.latitude != null && target.longitude != null;
      if (manual) { state.className = "point-state is-manual"; state.textContent = `${target.name} : point posé à la main (${manual.latitude.toFixed(5)}, ${manual.longitude.toFixed(5)}), enregistré avec la fiche.`; }
      else if (located) { state.className = "point-state is-ok"; state.textContent = `${target.name} : placée sur la carte ✓`; }
      else { state.className = "point-state is-missing"; state.textContent = target.id ? `${target.name} n’est pas encore sur la carte. Elle sera cherchée automatiquement à l’enregistrement, ou posez le point vous-même.` : `Nouvelle commune « ${target.name} » : elle sera cherchée automatiquement à l’enregistrement, ou posez le point vous-même.`; }
      const button = document.createElement("button"); button.type = "button"; button.className = "admin-secondary";
      button.textContent = manual || located ? "Déplacer le point" : "📍 Poser le point sur la carte";
      button.addEventListener("click", async () => {
        button.disabled = true;
        try {
          const point = await pickPoint({ ...target, ...(manual || {}) });
          if (point) pending.set(target.key, point);
        } catch (error) { button.disabled = false; state.textContent = error.message; return; }
        button.disabled = false; refresh();
      });
      row.append(state, button);
      if (manual) {
        const undo = document.createElement("button"); undo.type = "button"; undo.className = "admin-secondary"; undo.textContent = "Annuler le point";
        undo.addEventListener("click", () => { pending.delete(target.key); refresh(); });
        row.append(undo);
      }
      return row;
    }));
  };
  return { element: box, pending, refresh, clear() { pending.clear(); refresh(); } };
}

export const pointKey = (id, name) => id ? `id:${id}` : `new:${fold(name)}`;

// Enregistre les points posés à la main. resolveId(target) renvoie l'identifiant de la commune une fois la fiche enregistrée.
export async function savePendingPoints(client, tool, targets, resolveId) {
  const errors = [];
  for (const target of targets) {
    const point = tool.pending.get(target.key);
    const id = point && await resolveId(target);
    if (!id) continue;
    const { error } = await client.from("localities").update({ latitude: point.latitude, longitude: point.longitude }).eq("id", id);
    if (error) errors.push(`${target.name} : ${error.message}`);
  }
  if (errors.length) throw new Error(`Point non enregistré pour ${errors.join(" ; ")}`);
}
