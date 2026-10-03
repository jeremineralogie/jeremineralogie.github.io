// Informations légales : liste des crédits des photographies libres des fiches minéraux.
import { ficheUrl } from "./entity-links.js";
import { creditLine, loadMineralPhotos } from "./mineral-photos.js";

const list = document.querySelector("#photo-credits");
if (list) {
  const credits = await loadMineralPhotos();
  const entries = Object.entries(credits).sort(([a], [b]) => a.localeCompare(b, "fr"));
  list.replaceChildren(...entries.map(([slug, photo]) => {
    const item = document.createElement("li");
    const name = document.createElement("a"); name.className = "link"; name.href = ficheUrl("mineral", slug);
    name.textContent = photo.name || slug;
    item.append(name, " — ", ...creditLine({ ...photo }, "").childNodes);
    return item;
  }));
  document.querySelector("#photo-credits-count")?.replaceChildren(String(entries.length));
}
