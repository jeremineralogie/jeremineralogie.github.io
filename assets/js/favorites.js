// Favoris du visiteur, mémorisés sur son appareil (localStorage). Avec un compte joueur, ils sont aussi enregistrés sur le compte et synchronisés entre ses appareils (voir account.js).
// Élément : { type: "piece" | "specimen" | "mineral", id, name, href, meta, image, addedAt, removedAt? }
// Un favori retiré garde une « trace » datée (removedAt) pendant 90 jours : sans elle, la synchronisation le ferait revenir depuis un autre appareil.
import { recordFavoritePieces } from "./game-progress.js";
const KEY = "jm-favoris";
const TRACE_DAYS = 90;

function readRaw() {
  try { const list = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(list) ? list : []; }
  catch { return []; }
}
function save(list) {
  const limit = Date.now() - TRACE_DAYS * 86400000;
  const kept = list.filter(entry => !entry.removedAt || Date.parse(entry.removedAt) > limit);
  try { localStorage.setItem(KEY, JSON.stringify(kept)); return true; } catch { return false; }
}
const same = (a, b) => a.type === b.type && String(a.id) === String(b.id);
const keyOf = entry => `${entry.type}:${entry.id}`;
const stamp = entry => entry.removedAt || entry.addedAt || "";

export const getFavorites = () => readRaw().filter(entry => !entry.removedAt);
export const rawFavorites = () => readRaw();
export const isFavorite = item => getFavorites().some(entry => same(entry, item));

// Fusion de deux listes (appareil + compte) : pour chaque favori, l'événement le plus récent (ajout ou retrait) l'emporte.
export function mergeFavorites(a = [], b = []) {
  const byKey = new Map();
  for (const entry of [...a, ...b]) {
    if (!entry?.type || entry.id == null) continue;
    const known = byKey.get(keyOf(entry));
    if (!known || stamp(entry) > stamp(known)) byKey.set(keyOf(entry), entry);
  }
  return [...byKey.values()].sort((x, y) => String(y.addedAt || "").localeCompare(String(x.addedAt || "")));
}
// Remplace la liste locale par celle du compte (sans relancer d'envoi au serveur).
export function replaceFavorites(list) {
  if (!save(list)) return;
  document.dispatchEvent(new CustomEvent("jm-favorites"));
  document.dispatchEvent(new CustomEvent("jm-progress", { detail: { remote: true } }));
}
const changed = () => { document.dispatchEvent(new CustomEvent("jm-favorites")); document.dispatchEvent(new CustomEvent("jm-progress")); };

export function removeFavorite(item) {
  const now = new Date().toISOString();
  if (save(readRaw().map(entry => same(entry, item) && !entry.removedAt ? { ...entry, removedAt: now } : entry))) changed();
}
export function toggleFavorite(item) {
  const list = readRaw();
  const present = list.some(entry => same(entry, item) && !entry.removedAt);
  const now = new Date().toISOString();
  const next = present
    ? list.map(entry => same(entry, item) && !entry.removedAt ? { ...entry, removedAt: now } : entry)
    : [{ ...item, addedAt: now }, ...list.filter(entry => !same(entry, item))];
  const saved = save(next);
  if (saved) {
    if (!present && item.type === "piece") recordFavoritePieces(next.filter(entry => entry.type === "piece" && !entry.removedAt).length); // badges du carnet de terrain
    changed();
  }
  return saved ? !present : present;
}

// Bouton cœur à placer sur une fiche.
export function favoriteButton(item) {
  const button = document.createElement("button");
  button.type = "button"; button.className = "fav-btn";
  const paint = () => {
    const on = isFavorite(item);
    button.classList.toggle("is-on", on);
    button.setAttribute("aria-pressed", String(on));
    button.innerHTML = `<span class="fav-heart" aria-hidden="true">${on ? "♥" : "♡"}</span><span>${on ? "Dans mes favoris" : "Ajouter à mes favoris"}</span>`;
    button.title = on ? "Retirer de mes favoris" : "Retrouvez vos favoris dans « Mes favoris », en bas de chaque page";
  };
  button.addEventListener("click", () => { toggleFavorite(item); paint(); });
  document.addEventListener("jm-favorites", paint); // liste remplacée par celle du compte
  paint();
  return button;
}
