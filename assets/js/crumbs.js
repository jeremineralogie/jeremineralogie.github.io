// Fil d'Ariane visible en haut du contenu : [[nom, adresse], …] (le dernier élément est la page en cours). Même aspect que celui des pages préparées pour Google.
export function renderCrumbs(items) {
  document.querySelector("main > .crumbs")?.remove();
  const main = document.querySelector("main");
  if (!main || !items?.length) return;
  const nav = document.createElement("nav"); nav.className = "crumbs"; nav.setAttribute("aria-label", "Fil d’Ariane");
  const list = document.createElement("ol");
  items.forEach(([name, url], index) => {
    const item = document.createElement("li");
    if (index === items.length - 1) { item.setAttribute("aria-current", "page"); item.textContent = name; }
    else { const link = document.createElement("a"); link.href = url; link.textContent = name; item.append(link); }
    list.append(item);
  });
  nav.append(list);
  main.prepend(nav);
}
