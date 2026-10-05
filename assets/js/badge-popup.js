// Fenêtre de félicitations : 3 secondes après le déverrouillage d'un badge (compte requis), avec le nom du badge et le pseudo du compte.
import { currentUser } from "./account.js";

const DELAY = 3000, SHOW = 7000;
const queue = [];
let showing = false;
const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text != null) node.textContent = text; return node; };

function next() {
  if (showing || !queue.length) return;
  showing = true;
  const badge = queue.shift(), user = currentUser();
  const pop = el("div", "badge-pop"); pop.setAttribute("role", "status"); pop.setAttribute("aria-live", "polite");
  const close = el("button", "badge-pop-x", "×"); close.type = "button"; close.setAttribute("aria-label", "Fermer");
  pop.append(el("span", "badge-pop-icon", badge.icon), el("span", "badge-pop-kicker", "Nouveau badge"), el("strong", "badge-pop-name", badge.name),
    el("span", "badge-pop-who", user?.name ? `Bravo ${user.name} !` : "Bravo !"), close);
  const done = () => { pop.classList.remove("on"); setTimeout(() => { pop.remove(); showing = false; next(); }, 400); };
  close.addEventListener("click", done);
  document.body.append(pop);
  requestAnimationFrame(() => pop.classList.add("on"));
  setTimeout(done, SHOW);
}

export function startBadgePopup() {
  document.addEventListener("jm-badges", event => {
    const badges = event.detail?.badges || [];
    if (!currentUser()) return; // les badges exigent un compte
    setTimeout(() => { queue.push(...badges); next(); }, DELAY);
  });
}
