import { getSupabase } from "./supabase-client.js";
import { getFavorites, removeFavorite } from "./favorites.js";

// Page « Mes favoris » : favoris enregistrés sur l'appareil, regroupés par type.
const GROUPS = [["piece", "Boutique"], ["specimen", "Ma collection"], ["mineral", "Fiches minéraux"]];
const list = document.querySelector("#fav-list");
const count = document.querySelector("#fav-count");
const empty = document.querySelector("#fav-empty");
let unavailable = new Set();

function render() {
  const favorites = getFavorites();
  count.textContent = favorites.length ? `${favorites.length} favori${favorites.length > 1 ? "s" : ""}` : "";
  empty.hidden = favorites.length > 0;
  list.replaceChildren(...GROUPS.map(([type, label]) => {
    const items = favorites.filter(item => item.type === type);
    if (!items.length) return "";
    const block = document.createElement("section"); block.className = "fav-group";
    const heading = document.createElement("h2"); heading.textContent = label;
    const ul = document.createElement("ul"); ul.className = "fav-items";
    items.forEach(item => {
      const li = document.createElement("li"); li.className = "fav-item";
      const link = document.createElement("a"); link.className = "fav-link"; link.href = item.href;
      if (item.image) { const image = document.createElement("img"); image.src = item.image; image.alt = ""; image.loading = "lazy"; link.append(image); }
      else { const blank = document.createElement("span"); blank.className = "fav-thumb"; blank.textContent = "♥"; link.append(blank); }
      const text = document.createElement("span"); text.className = "fav-text";
      const name = document.createElement("strong"); name.textContent = item.name; text.append(name);
      if (item.meta) { const meta = document.createElement("span"); meta.className = "fav-meta"; meta.textContent = item.meta; text.append(meta); }
      if (type === "piece" && unavailable.has(String(item.id))) { const note = document.createElement("span"); note.className = "fav-gone"; note.textContent = "N’est plus disponible en boutique"; text.append(note); }
      link.append(text);
      const remove = document.createElement("button"); remove.type = "button"; remove.className = "fav-remove"; remove.setAttribute("aria-label", `Retirer ${item.name} de mes favoris`); remove.textContent = "Retirer";
      remove.addEventListener("click", () => { removeFavorite(item); render(); });
      li.append(link, remove); ul.append(li);
    });
    block.append(heading, ul); return block;
  }).filter(Boolean));
}

// Signale les pièces vendues ou retirées de la boutique.
async function checkPieces() {
  const refs = getFavorites().filter(item => item.type === "piece").map(item => String(item.id));
  const client = getSupabase();
  if (!refs.length || !client) return;
  const quoted = refs.map(ref => `"${ref.replace(/["\\]/g, "")}"`).join(",");
  const { data, error } = await client.from("shop_items").select("reference,slug").eq("publication_status", "published").eq("sale_status", "available").or(`reference.in.(${quoted}),slug.in.(${quoted})`);
  if (error) { console.error("Vérification des favoris :", error); return; }
  const present = new Set((data || []).flatMap(row => [row.reference, row.slug]));
  unavailable = new Set(refs.filter(ref => !present.has(ref)));
  render();
}

render();
void checkPieces();
