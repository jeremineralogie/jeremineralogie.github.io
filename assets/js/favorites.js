// Favoris du visiteur, mémorisés sur son appareil (localStorage), sans compte.
import { recordFavoritePieces } from "./game-progress.js";
// Élément : { type: "piece" | "specimen" | "mineral", id, name, href, meta, image }
const KEY = "jm-favoris";

export function getFavorites() {
  try { const list = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(list) ? list : []; }
  catch { return []; }
}
function save(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); return true; } catch { return false; }
}
const same = (a, b) => a.type === b.type && String(a.id) === String(b.id);
export const isFavorite = item => getFavorites().some(entry => same(entry, item));
export function removeFavorite(item) { save(getFavorites().filter(entry => !same(entry, item))); }
export function toggleFavorite(item) {
  const list = getFavorites();
  const present = list.some(entry => same(entry, item));
  const next = present ? list.filter(entry => !same(entry, item)) : [{ ...item, addedAt: new Date().toISOString() }, ...list];
  const saved = save(next);
  if (saved && !present && item.type === "piece") recordFavoritePieces(next.filter(entry => entry.type === "piece").length); // badges du carnet de terrain
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
  paint();
  return button;
}
