// « Devine le gisement » (accueil) : une photo de pièce, on touche la carte là où elle a été trouvée.
// 5 manches par jour, les mêmes pour tout le monde ; score de 0 à 1 000 par manche selon la distance.
import { loadLeaflet } from "./leaflet-loader.js";
import { parisDay, recordGame, streakOf, todayResult } from "./game-progress.js";
import { dateFr, sharePanel } from "./share.js";

const ROUNDS = 5;
const FRANCE = [[41.3, -5.2], [51.1, 9.6]];
const SAVE_KEY = "jm-gisement-jour";
const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text != null) node.textContent = text; return node; };
const store = {
  get() { try { return JSON.parse(localStorage.getItem(SAVE_KEY) || "null"); } catch { return null; } },
  set(value) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(value)); } catch { /* partie jouable sans mémoire */ } }
};
const best = {
  get() { try { return Number(localStorage.getItem("jm-gisement-record")) || 0; } catch { return 0; } },
  set(value) { try { localStorage.setItem("jm-gisement-record", String(value)); } catch { /* sans mémoire */ } }
};

function seeded(text) { let hash = 2166136261; for (const character of text) { hash ^= character.charCodeAt(0); hash = Math.imul(hash, 16777619); } return () => { hash = Math.imul(hash ^ (hash >>> 15), 2246822507) ^ Math.imul(hash ^ (hash >>> 13), 3266489909); return ((hash >>>= 0) % 100000) / 100000; }; }
function distanceKm(a, b) {
  const rad = Math.PI / 180, dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}
export const pointsFor = km => km < 1 ? 1000 : Math.round(1000 * Math.exp(-km / 150));
const kmText = km => km < 10 ? `${km.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} km` : `${Math.round(km).toLocaleString("fr-FR")} km`;
const square = points => points >= 900 ? "🟩" : points >= 500 ? "🟨" : points >= 100 ? "🟧" : "🟥";

// Pièces du jour : tirage identique pour tous les visiteurs, à partir de la date.
export function dailyPieces(pieces, day = parisDay()) {
  const random = seeded(`gisement-${day}`);
  return [...pieces].sort((a, b) => a.key.localeCompare(b.key)).map(piece => [random(), piece]).sort((a, b) => a[0] - b[0]).map(([, piece]) => piece).slice(0, ROUNDS);
}

// Partie du jour terminée mais jamais enregistrée (dernier clic manqué, ou jouée avant l'arrivée des badges) : on l'enregistre,
// pour que « Joué aujourd'hui », les séries et les badges en tiennent compte sans ouvrir le jeu.
export function backfillRecord(pieces) {
  const day = parisDay(), chosen = dailyPieces(pieces, day), saved = store.get();
  if (!chosen.length || todayResult("geo") || saved?.date !== day || saved.keys?.join() !== chosen.map(piece => piece.key).join() || (saved.results || []).length < chosen.length) return;
  const finalScore = saved.results.reduce((sum, result) => sum + result.points, 0);
  if (finalScore > best.get()) best.set(finalScore);
  recordGame("geo", { score: finalScore, rounds: saved.results.map(({ km, department, zone }) => ({ km, department, zone })) });
}

// pieces : [{ key, name, photo, href, lat, lng, place, department }]
export async function renderGeoGame(panel, pieces) {
  const body = panel.querySelector("[data-body]");
  const today = parisDay();
  const chosen = dailyPieces(pieces, today);
  if (!chosen.length) return;
  const saved = store.get();
  const results = saved?.date === today && saved.keys?.join() === chosen.map(piece => piece.key).join() ? saved.results : [];
  const save = () => store.set({ date: today, keys: chosen.map(piece => piece.key), results });
  panel.hidden = false;
  // La partie compte dès que la dernière manche est validée (pas seulement au clic sur « Voir le résultat »).
  const record = () => {
    if (todayResult("geo")) return;
    const finalScore = results.reduce((sum, result) => sum + result.points, 0);
    if (finalScore > best.get()) best.set(finalScore);
    recordGame("geo", { score: finalScore, rounds: results.map(({ km, department, zone }) => ({ km, department, zone })) });
  };
  if (results.length >= chosen.length) { record(); summary(); return; }

  let L;
  try { L = await loadLeaflet(); }
  catch (error) { body.replaceChildren(el("p", "geo-intro", error.message)); return; }

  const box = el("div", "geo");
  const head = el("div", "geo-head");
  const step = el("span", "geo-step"), score = el("span", "geo-score");
  head.append(step, score);
  const intro = el("p", "geo-intro", "Où cette pièce a-t-elle été trouvée ? Touchez la carte à l’endroit choisi, puis validez.");
  const photo = el("img", "geo-photo"); photo.alt = "Pièce à localiser";
  const mapBox = el("div", "geo-map");
  const abroad = chosen.some(piece => !L.latLngBounds(FRANCE).contains([piece.lat, piece.lng]));
  const note = el("p", "geo-note", "Certaines pièces du jour viennent de l’étranger : dézoomez si besoin."); note.hidden = !abroad;
  const actions = el("div", "geo-actions");
  const validate = el("button", "btn geo-validate", "Valider"); validate.type = "button"; validate.disabled = true;
  const next = el("button", "btn geo-next", "Manche suivante"); next.type = "button"; next.hidden = true;
  const outcome = el("p", "geo-outcome"); outcome.setAttribute("aria-live", "polite");
  actions.append(validate, next);
  box.append(head, intro, photo, mapBox, note, actions, outcome);
  body.replaceChildren(box);

  const map = L.map(mapBox, { minZoom: 2, maxZoom: 16, worldCopyJump: true, zoomControl: true }).fitBounds(FRANCE);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, className: "map-tiles", attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>' }).addTo(map);
  map.attributionControl.setPrefix(false);
  const layer = L.layerGroup().addTo(map);
  let guess = null, revealed = false;

  const total = () => results.reduce((sum, result) => sum + result.points, 0);
  function showRound() {
    const piece = chosen[results.length];
    revealed = false; guess = null; layer.clearLayers();
    step.textContent = `Manche ${results.length + 1} / ${chosen.length}`;
    score.textContent = `${total().toLocaleString("fr-FR")} points`;
    photo.src = piece.photo;
    validate.hidden = false; validate.disabled = true; next.hidden = true; outcome.textContent = "";
    map.fitBounds(FRANCE);
    requestAnimationFrame(() => map.invalidateSize());
  }
  map.on("click", event => {
    if (revealed) return;
    guess = event.latlng.wrap();
    layer.clearLayers();
    L.circleMarker(guess, { radius: 9, color: "#f3eaff", weight: 2, fillColor: "#8e5cff", fillOpacity: 0.9 }).addTo(layer);
    validate.disabled = false;
  });
  validate.addEventListener("click", () => {
    if (!guess || revealed) return;
    revealed = true;
    const piece = chosen[results.length];
    const truth = L.latLng(piece.lat, piece.lng);
    const km = distanceKm(guess, truth);
    const points = pointsFor(km);
    results.push({ km: Math.round(km * 10) / 10, points, department: piece.department || null, zone: piece.zone || piece.department || null });
    save();
    L.polyline([guess, truth], { color: "#f0d9a8", weight: 2, dashArray: "6 6" }).addTo(layer);
    L.circleMarker(truth, { radius: 10, color: "#fff", weight: 2, fillColor: "#3fbf7f", fillOpacity: 0.95 }).addTo(layer).bindTooltip(piece.place || piece.name);
    map.fitBounds(L.latLngBounds([guess, truth]), { padding: [40, 40], maxZoom: 11 });
    outcome.replaceChildren(el("strong", "", `${piece.name}`), ` — ${piece.place || ""}`, el("br"), `Votre point est à ${kmText(km)} : ${points.toLocaleString("fr-FR")} points.`);
    score.textContent = `${total().toLocaleString("fr-FR")} points`;
    validate.hidden = true; next.hidden = false;
    next.textContent = results.length >= chosen.length ? "Voir le résultat" : "Manche suivante";
    if (results.length >= chosen.length) record();
  });
  next.addEventListener("click", () => {
    if (results.length >= chosen.length) { map.remove(); finish(); return; }
    showRound();
  });
  showRound();

  function finish() {
    record();
    summary();
  }

  function summary() {
    const finalScore = results.reduce((sum, result) => sum + result.points, 0);
    const max = chosen.length * 1000;
    const end = el("div", "geo geo-summary");
    end.append(el("p", "geo-total", `${finalScore.toLocaleString("fr-FR")} / ${max.toLocaleString("fr-FR")} points`));
    end.append(el("p", "geo-squares", results.map(result => square(result.points)).join(" ")));
    const record = best.get();
    if (record) end.append(el("p", "geo-record", `Votre record : ${record.toLocaleString("fr-FR")} points`));
    const list = el("ol", "geo-list");
    chosen.forEach((piece, index) => {
      const result = results[index]; if (!result) return;
      const item = el("li", "geo-item");
      const image = el("img", "geo-thumb"); image.src = piece.photo; image.alt = piece.name; image.loading = "lazy";
      const text = el("div", "geo-item-text");
      const link = el("a", "link", piece.name); link.href = piece.href;
      text.append(link, el("span", "geo-item-place", piece.place || ""), el("span", "geo-item-score", `${kmText(result.km)} · ${result.points.toLocaleString("fr-FR")} points`));
      item.append(image, text); list.append(item);
    });
    end.append(list);
    const squares = results.map(result => square(result.points));
    const streak = streakOf("geo");
    const share = sharePanel({
      fileName: `devine-le-gisement-${today}.png`, remember: "geo",
      text: `🗺️ Devine le gisement — ${new Intl.DateTimeFormat("fr-FR").format(new Date(`${today}T12:00:00`))}\n${squares.join("")} ${finalScore}/${max}\nEt vous, ferez-vous mieux ?`,
      spec: { title: "Devine le gisement", logo: "/assets/decor/logo-jeux.webp", date: dateFr(today), big: finalScore.toLocaleString("fr-FR"), bigSub: `sur ${max.toLocaleString("fr-FR")} points`, squares,
        photos: chosen.slice(0, results.length).map(piece => piece.photo), streak: streak > 1 ? `🔥 Série de ${streak} jours` : "" }
    });
    end.append(share, el("p", "geo-next-day", "De nouvelles pièces à deviner demain."));
    body.replaceChildren(end);
  }
}
