import { cleanUrl } from "./clean-urls.js";
import { getSupabase } from "./supabase-client.js";

// Liens automatiques vers le glossaire : dans un bloc de texte, la première occurrence de chaque terme devient
// cliquable et ouvre une petite bulle avec la définition et un lien vers l'onglet Apprendre.
// Les termes trop généraux (minéral, roche, couleur…) ne sont pas reliés pour ne pas surcharger les textes (voir glossary-match.js).
import { matcher, termHits } from "./glossary-match.js";
const SKIP = "a, button, h1, h2, h3, script, style, input, textarea, select, .gloss-pop, .kicker, .meta";

export const glossaryTerms = () => loadTerms();
let termsPromise = null;
function loadTerms() {
  if (!termsPromise) {
    const client = getSupabase();
    termsPromise = client
      ? client.from("glossary_terms").select("term,slug,definition,domain").eq("publication_status", "published")
        .then(({ data, error }) => { if (error) throw error; return data || []; })
        .catch(error => { console.error("Glossaire indisponible :", error); return []; })
      : Promise.resolve([]);
  }
  return termsPromise;
}

function textNodes(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: node => !node.nodeValue.trim() || node.parentElement?.closest(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
  });
  const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
  return nodes;
}

function linkNode(node, keys, used) {
  const hits = termHits(node.nodeValue, keys, used);
  if (!hits.length) return;
  const chars = hits[0].chars;
  const fragment = document.createDocumentFragment();
  let cursor = 0;
  hits.forEach(hit => {
    if (hit.start > cursor) fragment.append(chars.slice(cursor, hit.start).join(""));
    const link = document.createElement("a");
    link.className = "gloss"; link.href = cleanUrl("term", hit.term.slug);
    link.textContent = chars.slice(hit.start, hit.end).join(""); link.dataset.slug = hit.term.slug;
    link.setAttribute("aria-haspopup", "dialog");
    fragment.append(link); cursor = hit.end;
  });
  if (cursor < chars.length) fragment.append(chars.slice(cursor).join(""));
  node.replaceWith(fragment);
}

// Relie les termes du glossaire dans les éléments donnés (une seule fois par terme sur l'ensemble).
export async function applyGlossary(...roots) {
  const targets = roots.flat().filter(Boolean);
  if (!targets.length) return;
  const terms = await loadTerms();
  if (!terms.length) return;
  const keys = matcher(terms);
  const bySlug = new Map(terms.map(term => [term.slug, term]));
  const used = new Set();
  targets.forEach(root => textNodes(root).forEach(node => linkNode(node, keys, used)));
  bindPopover(bySlug);
}

const DOMAINS = { mineralogie: "Minéralogie", geologie: "Géologie", cristallographie: "Cristallographie" };
let popover = null;
let anchor = null;
let bound = false;
function place() {
  if (!popover || !anchor) return;
  const rect = anchor.getBoundingClientRect();
  const width = Math.min(340, window.innerWidth - 24);
  popover.style.width = `${width}px`;
  popover.style.left = `${Math.max(12, Math.min(rect.left + rect.width / 2 - width / 2, window.innerWidth - width - 12))}px`;
  const below = rect.bottom + 8;
  const height = popover.offsetHeight;
  popover.style.top = `${below + height > window.innerHeight - 8 && rect.top - height - 8 > 8 ? rect.top - height - 8 : below}px`;
}
function bindPopover(bySlug) {
  if (bound) return; bound = true;
  const close = () => { if (popover) { popover.remove(); popover = null; anchor = null; } };
  document.addEventListener("click", event => {
    const link = event.target.closest("a.gloss");
    if (!link) { if (popover && !event.target.closest(".gloss-pop")) close(); return; }
    const term = bySlug.get(link.dataset.slug);
    if (!term) return;
    event.preventDefault();
    close();
    popover = document.createElement("div"); popover.className = "gloss-pop"; popover.setAttribute("role", "dialog"); popover.setAttribute("aria-label", term.term);
    const head = document.createElement("div"); head.className = "gloss-pop-head";
    const title = document.createElement("strong"); title.textContent = term.term;
    const domain = document.createElement("span"); domain.textContent = DOMAINS[term.domain] || "";
    const shut = document.createElement("button"); shut.type = "button"; shut.className = "gloss-pop-close"; shut.setAttribute("aria-label", "Fermer"); shut.textContent = "×";
    shut.addEventListener("click", close);
    head.append(title, domain, shut);
    const text = document.createElement("p"); text.textContent = term.definition;
    const more = document.createElement("a"); more.className = "link"; more.href = link.href; more.textContent = "Voir dans le glossaire";
    popover.append(head, text, more);
    document.body.append(popover);
    anchor = link; place();
    shut.focus({ preventScroll: true });
  });
  document.addEventListener("keydown", event => { if (event.key === "Escape") close(); });
  window.addEventListener("scroll", place, { passive: true });
  window.addEventListener("resize", place);
}
