// Cartes de la boutique : le texte ne doit jamais déborder sur les ornements du cadre.
// Un texte trop long pour la zone libre est réduit (jusqu’aux trois quarts environ de sa taille), puis coupé par « … ».
// Les tailles sont en cqw : le rapport de réduction reste valable à toutes les largeurs d'écran.
const SELECTOR = ".card-body h3, .card-body .meta, .card-body .price";
const MIN_RATIO = 0.72;

function fit(card) {
  if (!card.clientWidth) return;
  card.querySelectorAll(SELECTOR).forEach(node => {
    node.style.fontSize = "";
    const room = node.clientWidth, need = node.scrollWidth;
    if (!room || need <= room) return;
    const cqw = parseFloat(getComputedStyle(node).fontSize) / (card.clientWidth / 100);
    node.style.fontSize = `${(cqw * Math.max(MIN_RATIO, (room - 1) / need)).toFixed(2)}cqw`;
  });
}

export function fitCardText(card) {
  fit(card);
  if (typeof ResizeObserver === "function") new ResizeObserver(() => fit(card)).observe(card);
  document.fonts?.ready.then(() => fit(card));
}
export const fitBoutiqueCards = (root = document) => root.querySelectorAll(".card-boutique").forEach(fitCardText);
