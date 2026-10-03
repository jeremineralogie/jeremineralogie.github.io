// Adresses des fiches détaillées (une page générique par type) et navigation précédent / suivant.
import { cleanUrl } from "./clean-urls.js";
export const pieceUrl = item => cleanUrl("piece", item.reference || item.slug);
export const articleUrl = item => cleanUrl("article", item.slug);
export const documentUrl = item => cleanUrl("archive", item.slug);
export const specimenUrl = item => cleanUrl("specimen", item.id);

// containers : éléments [data-nav] ; items : liste ordonnée comme dans l'onglet ; index : position de la fiche affichée.
export function renderNeighbours(containers, items, index, hrefOf, titleOf) {
  containers.forEach(container => {
    container.replaceChildren();
    const side = (item, label, className) => {
      if (!item) { const spacer = document.createElement("span"); spacer.className = className; return spacer; }
      const link = document.createElement("a"); link.className = `link ${className}`; link.href = hrefOf(item);
      link.title = titleOf(item) || ""; link.textContent = label; return link;
    };
    const count = document.createElement("span"); count.className = "meta"; count.textContent = `${index + 1} / ${items.length}`;
    container.append(side(items[index - 1], "← Précédent", "nav-prev"), count, side(items[index + 1], "Suivant →", "nav-next"));
    container.hidden = items.length < 2;
  });
}
