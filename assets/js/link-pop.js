// Petite fenêtre d'aperçu pour les liens surlignés vers une fiche minéral, un gisement, une commune ou un département :
// un clic affiche l'essentiel sans quitter la page, avec un bouton « Voir la fiche ». (Les pièces et les spécimens sont exclus.)
// Seuls les liens marqués data-fiche (liens surlignés dans un texte) sont concernés ; menus, cartes, listes et boutons « Voir la fiche » ouvrent la page directement.
// Les liens restent de vrais liens : Ctrl / Cmd / clic du milieu, ou un lien sans données, ouvrent la page normalement.
import { getSupabase } from "./supabase-client.js";
import { DEPARTMENT_SLUGS } from "./department-slugs.js";

const FOLDERS = { mineraux: "mineral", gisements: "mine", communes: "locality", departements: "department" };
const LABELS = { mineral: "Minéral", mine: "Gisement", locality: "Commune", department: "Département" };
const SNIPPET = 260;

let popover = null, anchor = null;

function target(link) {
  let url; try { url = new URL(link.href, location.href); } catch { return null; }
  if (url.origin !== location.origin) return null;
  const clean = url.pathname.match(/^\/(mineraux|gisements|communes|departements)\/([^/]+)\/?$/);
  if (clean) return { type: FOLDERS[clean[1]], slug: decodeURIComponent(clean[2]) };
  if (/\/fiche\.html$/.test(url.pathname) && FOLDERS_BY_TYPE.has(url.searchParams.get("type")) && url.searchParams.get("id")) return { type: url.searchParams.get("type"), slug: url.searchParams.get("id") };
  if (/\/departement\.html$/.test(url.pathname) && url.searchParams.get("dep")) return { type: "department", code: url.searchParams.get("dep") };
  return null;
}
const FOLDERS_BY_TYPE = new Set(["mineral", "mine", "locality"]);

const cut = text => {
  const plain = String(text ?? "").replace(/\s+/g, " ").trim();
  if (plain.length <= SNIPPET) return plain;
  const short = plain.slice(0, SNIPPET); return `${short.slice(0, Math.max(short.lastIndexOf(" "), 120))}…`;
};

// Lit l'essentiel de la fiche : { name, line, text }. Renvoie null si rien n'est disponible.
async function load(info) {
  const client = getSupabase(); if (!client) return null;
  if (info.type === "mineral") {
    const { data } = await client.from("minerals").select("name,formula,chemical_class,description").eq("slug", info.slug).maybeSingle();
    return data && { name: data.name, line: [data.formula, data.chemical_class].filter(Boolean).join(" · "), text: cut(data.description) };
  }
  if (info.type === "mine") {
    const { data } = await client.from("mines").select("name,description,locality:localities(name)").eq("slug", info.slug).maybeSingle();
    return data && { name: data.name, line: data.locality?.name ? `Commune : ${data.locality.name}` : "", text: cut(data.description) };
  }
  if (info.type === "locality") {
    const { data } = await client.from("localities").select("name,notes,department:departments(name)").eq("slug", info.slug).maybeSingle();
    return data && { name: data.name, line: data.department?.name || "", text: cut(data.notes) };
  }
  const code = info.code || Object.keys(DEPARTMENT_SLUGS).find(key => DEPARTMENT_SLUGS[key] === info.slug);
  if (!code) return null;
  const { data } = await client.from("departments").select("name,code").eq("code", code).maybeSingle();
  return data && { name: data.name, line: `Département ${data.code}`, text: "" };
}

function close() { popover?.remove(); popover = null; anchor = null; }
function place() {
  if (!popover || !anchor?.isConnected) { close(); return; }
  const rect = anchor.getBoundingClientRect();
  const width = Math.min(360, window.innerWidth - 24);
  popover.style.width = `${width}px`;
  popover.style.left = `${Math.max(12, Math.min(rect.left + rect.width / 2 - width / 2, window.innerWidth - width - 12))}px`;
  const below = rect.bottom + 8, height = popover.offsetHeight;
  popover.style.top = `${below + height > window.innerHeight - 8 && rect.top - height - 8 > 8 ? rect.top - height - 8 : below}px`;
}

function open(link, info, details) {
  document.querySelectorAll(".gloss-pop").forEach(node => node.remove());
  close();
  popover = document.createElement("div"); popover.className = "gloss-pop link-pop"; popover.setAttribute("role", "dialog");
  const name = details?.name || link.textContent.trim();
  popover.setAttribute("aria-label", name);
  const head = document.createElement("div"); head.className = "gloss-pop-head";
  const title = document.createElement("strong"); title.textContent = name;
  const kind = document.createElement("span"); kind.textContent = LABELS[info.type];
  const shut = document.createElement("button"); shut.type = "button"; shut.className = "gloss-pop-close"; shut.setAttribute("aria-label", "Fermer"); shut.textContent = "×";
  shut.addEventListener("click", close);
  head.append(title, kind, shut); popover.append(head);
  if (details?.line) { const line = document.createElement("p"); line.className = "link-pop-line"; line.textContent = details.line; popover.append(line); }
  if (details?.text) { const text = document.createElement("p"); text.textContent = details.text; popover.append(text); }
  const more = document.createElement("a"); more.className = "link"; more.href = link.href; more.textContent = "Voir la fiche →";
  popover.append(more);
  document.body.append(popover);
  anchor = link; place();
  shut.focus({ preventScroll: true });
}

export function bindLinkPopups() {
  document.addEventListener("click", event => {
    const link = event.target.closest?.("a[data-fiche]");
    if (!link) { if (popover && !event.target.closest(".link-pop")) close(); return; }
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    if (link.target === "_blank") return;
    const info = target(link); if (!info) return;
    event.preventDefault();
    // Fenêtre immédiate (nom du lien + bouton), complétée dès que la fiche est lue.
    const current = link; open(link, info, null);
    void load(info).then(details => { if (details && anchor === current && popover) open(current, info, details); }).catch(error => console.error("Aperçu de fiche :", error));
  });
  document.addEventListener("keydown", event => { if (event.key === "Escape") close(); });
  window.addEventListener("scroll", place, { passive: true });
  window.addEventListener("resize", place);
}
bindLinkPopups();
