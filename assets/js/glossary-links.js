import { getSupabase } from "./supabase-client.js";

// Liens automatiques vers le glossaire : dans un bloc de texte, la première occurrence de chaque terme devient
// cliquable et ouvre une petite bulle avec la définition et un lien vers l'onglet Apprendre.
// Les termes trop généraux (minéral, roche, couleur…) ne sont pas reliés pour ne pas surcharger les textes.
const GENERIC = new Set(["mineral", "roche", "cristal", "couleur", "densite", "trait", "mine", "face", "arete", "serie", "variete", "specimen",
  "cube", "prisme", "gisement", "gite", "formule chimique", "transparent", "translucide", "opaque", "durete", "eclat", "carriere", "puits",
  "galerie", "minerai", "croute", "manteau", "lave", "magma", "fossile", "erosion", "alteration", "symetrie", "cassure", "inclusion", "nodule",
  "concretion", "encroutement", "fibreux", "lamellaire", "tabulaire", "prismatique", "etiquette", "nettoyage", "matrice", "affleurement",
  "faille", "pli", "fluide", "datation", "silicate", "carbonate", "sulfure", "gemme", "synthetique", "traitement", "flexible", "elastique",
  "groupe mineral", "espece minerale", "systeme cristallin", "cubique", "quadratique", "hexagonal", "trigonal", "orthorhombique", "monoclinique",
  "triclinique", "amorphe", "couleur", "zonage", "calcaire", "argile", "gres", "grotte", "alluvion"]);
const isWordChar = character => Boolean(character) && /[\p{L}\p{N}]/u.test(character);
const foldChar = character => character.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[’`]/g, "'").replace(/-/g, " ");
const foldText = text => [...String(text ?? "")].map(foldChar).join("");
const SKIP = "a, button, h1, h2, h3, script, style, input, textarea, select, .gloss-pop, .kicker, .meta";

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

function matcher(terms) {
  const keys = [];
  terms.forEach(term => {
    const base = foldText(term.term.trim());
    if (base.length < 4 || GENERIC.has(base)) return;
    const forms = new Set([base]);
    if (!base.includes(" ")) { forms.add(`${base}s`); if (base.endsWith("al")) forms.add(`${base.slice(0, -2)}aux`); }
    else { const [first, ...rest] = base.split(" "); forms.add([`${first}s`, ...rest].join(" ")); }
    forms.forEach(form => keys.push({ form, term }));
  });
  return keys.sort((a, b) => b.form.length - a.form.length);
}

function textNodes(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: node => !node.nodeValue.trim() || node.parentElement?.closest(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
  });
  const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
  return nodes;
}

function linkNode(node, keys, used) {
  const source = node.nodeValue;
  let folded = ""; const map = [];
  [...source].forEach((character, index) => { for (const piece of foldChar(character)) { folded += piece; map.push(index); } });
  const chars = [...source];
  const hits = [];
  for (const { form, term } of keys) {
    if (used.has(term.slug)) continue;
    let from = 0;
    while (from <= folded.length) {
      const start = folded.indexOf(form, from);
      if (start < 0) break;
      const end = start + form.length;
      if (!isWordChar(folded[start - 1]) && !isWordChar(folded[end]) && !hits.some(hit => start < hit.end && end > hit.start)) {
        hits.push({ start, end, term }); used.add(term.slug); break;
      }
      from = start + 1;
    }
  }
  if (!hits.length) return;
  hits.sort((a, b) => a.start - b.start);
  const fragment = document.createDocumentFragment();
  let cursor = 0;
  hits.forEach(hit => {
    const start = map[hit.start]; const end = map[hit.end - 1] + 1;
    if (start < cursor) return;
    if (start > cursor) fragment.append(chars.slice(cursor, start).join(""));
    const link = document.createElement("a");
    link.className = "gloss"; link.href = `apprendre.html?terme=${encodeURIComponent(hit.term.slug)}#glossaire`;
    link.textContent = chars.slice(start, end).join(""); link.dataset.slug = hit.term.slug;
    link.setAttribute("aria-haspopup", "dialog");
    fragment.append(link); cursor = end;
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
