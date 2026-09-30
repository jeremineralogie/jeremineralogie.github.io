import { getSupabase } from "./supabase-client.js";
import { ficheUrl } from "./entity-links.js";

// Onglet « Apprendre » : fiches minéraux (référentiel minerals) et glossaire (glossary_terms), avec filtres et index A–Z.
const status = document.querySelector("#learn-status");
const tabs = [...document.querySelectorAll(".learn-tabs [data-tab]")];
const panels = { mineraux: document.querySelector("#panel-mineraux"), glossaire: document.querySelector("#panel-glossaire") };
const DOMAINS = { mineralogie: "Minéralogie", geologie: "Géologie", cristallographie: "Cristallographie" };
const COLORS = [
  ["incolore", /incolore|limpide/], ["blanc", /blanc|argent/], ["gris", /gris|plomb|acier/], ["noir", /noir/],
  ["rouge", /rouge|vermillon|carmin|ecarlate/], ["rose", /rose|framboise/], ["orange", /orang/], ["jaune", /jaune|or\b|miel|dore|laiton|citron/],
  ["vert", /vert|olive|emeraude|pistache/], ["bleu", /bleu|azur|indigo|turquoise/], ["violet", /violet|pourpre|lilas|lavande|mauve/], ["brun", /brun|bronze|cuivre|ocre/]
];
const fold = value => String(value ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[’`]/g, "'");
const squash = value => fold(value).replace(/[^a-z0-9]+/g, "");
// Formules : « CaCO3 » tapé au clavier doit trouver « CaCO₃ ».
const plainDigits = value => String(value ?? "").replace(/[₀-₉]/g, digit => String(digit.charCodeAt(0) - 0x2080));
const letterOf = name => { const first = fold(name).charAt(0).toUpperCase(); return /[A-Z]/.test(first) ? first : "#"; };
const number = value => Number(value).toLocaleString("fr-FR", { maximumFractionDigits: 2 });
const range = (min, max) => min == null ? "" : max != null && Number(max) !== Number(min) ? `${number(min)} à ${number(max)}` : number(min);
const element = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text != null) node.textContent = text; return node; };
const link = (href, text, className = "link") => { const a = element("a", className, text); a.href = href; return a; };

let minerals = [];
let terms = [];
const presence = new Map(); // mineral id → { collection, boutique }

function showTab(name) {
  const tab = panels[name] ? name : "mineraux";
  tabs.forEach(item => { const active = item.dataset.tab === tab; item.classList.toggle("active", active); if (active) item.setAttribute("aria-current", "page"); else item.removeAttribute("aria-current"); });
  Object.entries(panels).forEach(([key, panel]) => { panel.hidden = key !== tab; });
}
window.addEventListener("hashchange", () => showTab(location.hash.slice(1)));

// Filtres : champ texte + listes, compteur « Filtre (n) » et réinitialisation, comme sur les autres pages.
function bindPanel(panel, onChange) {
  const text = panel.querySelector("[data-text]");
  const selects = [...panel.querySelectorAll("select[data-key]")];
  const count = panel.querySelector(".filter-count");
  const reset = panel.querySelector(".filter-reset");
  const update = () => {
    const active = selects.filter(select => select.value).length + (text.value.trim() ? 1 : 0);
    count.textContent = active ? `(${active})` : ""; count.hidden = !active; reset.disabled = !active;
    onChange();
  };
  text.addEventListener("input", update);
  selects.forEach(select => select.addEventListener("change", update));
  reset.addEventListener("click", () => { text.value = ""; selects.forEach(select => { select.value = ""; }); update(); });
  return { text, value: key => panel.querySelector(`select[data-key="${key}"]`).value, update };
}

function azIndex(nav, groups, listRoot) {
  const present = new Set(groups.map(([letter]) => letter));
  nav.replaceChildren(...[..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"].map(letter => {
    const button = element("button", "", letter); button.type = "button";
    button.disabled = !present.has(letter);
    button.addEventListener("click", () => listRoot.querySelector(`[data-letter="${letter}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
    return button;
  }));
}
function grouped(items, nameOf) {
  const map = new Map();
  items.forEach(item => { const letter = letterOf(nameOf(item)); if (!map.has(letter)) map.set(letter, []); map.get(letter).push(item); });
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
}

// ----- Fiches minéraux -----
const mPanel = panels.mineraux;
const mFilters = bindPanel(mPanel, renderMinerals);
function colorKeys(mineral) { const text = fold((mineral.colors || []).join(" ")); return COLORS.filter(([, pattern]) => pattern.test(text)).map(([key]) => key); }

function fillMineralFilters() {
  const fill = (select, values) => { const first = select.options[0]; select.replaceChildren(first, ...values.map(value => new Option(value, value))); };
  fill(mPanel.querySelector("#m-class"), [...new Set(minerals.map(item => item.chemical_class).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr")));
  const order = ["Cubique", "Quadratique", "Hexagonal", "Trigonal", "Orthorhombique", "Monoclinique", "Triclinique", "Amorphe"];
  fill(mPanel.querySelector("#m-system"), [...new Set(minerals.map(item => item.crystal_system).filter(Boolean))].sort((a, b) => (order.indexOf(a) + 99) % 99 - (order.indexOf(b) + 99) % 99 || a.localeCompare(b, "fr")));
  const used = new Set(minerals.flatMap(colorKeys));
  fill(mPanel.querySelector("#m-color"), COLORS.map(([key]) => key).filter(key => used.has(key)));
}

function renderMinerals() {
  const query = squash(plainDigits(mFilters.text.value));
  const [hMin, hMax] = (mFilters.value("hardness") || "0-99").split("-").map(Number);
  const visible = minerals.filter(item => {
    if (query && !squash(item.name).includes(query) && !squash(plainDigits(item.formula)).includes(query)) return false;
    if (mFilters.value("class") && item.chemical_class !== mFilters.value("class")) return false;
    if (mFilters.value("system") && item.crystal_system !== mFilters.value("system")) return false;
    if (mFilters.value("hardness")) { const h = Number(item.hardness_max ?? item.hardness); if (item.hardness == null || h < hMin || Number(item.hardness) >= hMax) return false; }
    if (mFilters.value("color") && !colorKeys(item).includes(mFilters.value("color"))) return false;
    if (mFilters.value("presence") && !presence.get(item.id)?.[mFilters.value("presence")]) return false;
    return true;
  });
  const list = mPanel.querySelector("#m-list");
  const groups = grouped(visible, item => item.name);
  list.replaceChildren(...groups.map(([letter, items]) => {
    const block = element("section", "learn-letter"); block.dataset.letter = letter;
    block.append(element("h2", "learn-letter-title", letter));
    const ul = element("ul", "learn-minerals");
    items.forEach(item => {
      const li = element("li");
      const a = link(ficheUrl("mineral", item.slug), "", "learn-mineral");
      const head = element("span", "learn-mineral-head");
      head.append(element("strong", "learn-mineral-name", item.name));
      if (item.formula) head.append(element("span", "learn-formula", item.formula));
      a.append(head);
      const facts = [item.crystal_system, item.hardness != null ? `dureté ${range(item.hardness, item.hardness_max)}` : "", item.chemical_class].filter(Boolean).join(" · ");
      if (facts) a.append(element("span", "learn-mineral-facts", facts));
      const found = presence.get(item.id);
      if (found?.collection || found?.boutique) {
        const badges = element("span", "learn-badges");
        if (found.collection) badges.append(element("span", "learn-badge", `Collection (${found.collection})`));
        if (found.boutique) badges.append(element("span", "learn-badge is-shop", `Boutique (${found.boutique})`));
        a.append(badges);
      }
      li.append(a); ul.append(li);
    });
    block.append(ul); return block;
  }));
  azIndex(mPanel.querySelector("#m-az"), groups, list);
  mPanel.querySelector("#m-count").textContent = `${visible.length} minéra${visible.length > 1 ? "ux" : "l"}`;
  mPanel.querySelector("#m-empty").hidden = visible.length > 0;
}

// ----- Glossaire -----
const gPanel = panels.glossaire;
const gFilters = bindPanel(gPanel, renderGlossary);
const termSlug = term => fold(term).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function renderGlossary() {
  const query = fold(gFilters.text.value.trim());
  const domain = gFilters.value("domain");
  const visible = terms.filter(item => (!domain || item.domain === domain) && (!query || fold(item.term).includes(query) || fold(item.definition).includes(query)));
  // Les correspondances sur le nom du terme passent avant celles trouvées dans les définitions.
  if (query) visible.sort((a, b) => Number(!fold(a.term).includes(query)) - Number(!fold(b.term).includes(query)) || a.term.localeCompare(b.term, "fr"));
  const byName = new Map(minerals.map(item => [fold(item.name), item]));
  const known = new Set(terms.map(item => item.slug));
  const list = gPanel.querySelector("#g-list");
  const groups = query ? [["", visible]] : grouped(visible, item => item.term);
  list.replaceChildren(...groups.map(([letter, items]) => {
    const block = element("section", "learn-letter"); if (letter) { block.dataset.letter = letter; block.append(element("h2", "learn-letter-title", letter)); }
    items.forEach(item => {
      const entry = element("article", "learn-term"); entry.id = `terme-${item.slug}`;
      const head = element("h3"); head.append(item.term, element("span", "learn-domain", DOMAINS[item.domain] || item.domain));
      entry.append(head, element("p", "learn-definition", item.definition));
      const related = (item.related_minerals || []).map(name => byName.get(fold(name))).filter(Boolean);
      if (related.length) {
        const row = element("p", "learn-term-row"); row.append(element("span", "learn-term-label", "Minéraux : "));
        related.forEach((mineral, index) => { if (index) row.append(", "); row.append(link(ficheUrl("mineral", mineral.slug), mineral.name)); });
        entry.append(row);
      }
      // Liens vers la collection et la boutique pour les minéraux cités qui y sont présents.
      const inCollection = related.filter(mineral => presence.get(mineral.id)?.collection);
      const inShop = related.filter(mineral => presence.get(mineral.id)?.boutique);
      if (inCollection.length || inShop.length) {
        const row = element("p", "learn-term-row learn-term-site");
        if (inCollection.length) {
          row.append(element("span", "learn-term-label", "Dans ma collection : "));
          inCollection.forEach((mineral, index) => { if (index) row.append(", "); row.append(link(`collection.html?mineral=${encodeURIComponent(mineral.name)}`, `${mineral.name} (${presence.get(mineral.id).collection})`)); });
        }
        if (inShop.length) {
          if (inCollection.length) row.append(element("br"));
          row.append(element("span", "learn-term-label", "En boutique : "));
          inShop.forEach((mineral, index) => { if (index) row.append(", "); row.append(link(`boutique.html?mineral=${encodeURIComponent(mineral.name)}`, `${mineral.name} (${presence.get(mineral.id).boutique})`)); });
        }
        entry.append(row);
      }
      const see = (item.see_also || []).filter(name => known.has(termSlug(name)));
      if (see.length) {
        const row = element("p", "learn-term-row"); row.append(element("span", "learn-term-label", "Voir aussi : "));
        see.forEach((name, index) => {
          if (index) row.append(", ");
          const a = link(`#glossaire`, name); a.addEventListener("click", event => { event.preventDefault(); openTerm(termSlug(name)); }); row.append(a);
        });
        entry.append(row);
      }
      const search = link(`recherche.html?q=${encodeURIComponent(item.term.toLocaleLowerCase("fr"))}`, `Chercher « ${item.term.toLocaleLowerCase("fr")} » dans la collection, la boutique et les articles`, "link learn-search");
      const searchRow = element("p", "learn-term-row"); searchRow.append(search); entry.append(searchRow);
      block.append(entry);
    });
    return block;
  }));
  const az = gPanel.querySelector("#g-az"); az.hidden = Boolean(query);
  if (!query) azIndex(az, groups, list);
  gPanel.querySelector("#g-count").textContent = `${visible.length} terme${visible.length > 1 ? "s" : ""}`;
  gPanel.querySelector("#g-empty").hidden = visible.length > 0;
}

function openTerm(slug) {
  if (gFilters.text.value || gFilters.value("domain")) { gFilters.text.value = ""; gPanel.querySelector("#g-domain").value = ""; gFilters.update(); }
  const target = document.querySelector(`#terme-${CSS.escape(slug)}`);
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "center" });
  target.classList.remove("is-flash"); void target.offsetWidth; target.classList.add("is-flash");
}

async function load() {
  const client = getSupabase();
  if (!client) { status.textContent = "Contenu momentanément indisponible."; return; }
  const [mineralResult, termResult, specimenResult, shopResult] = await Promise.all([
    client.from("minerals").select("id,name,slug,formula,chemical_class,crystal_system,hardness,hardness_max,colors").eq("publication_status", "published"),
    client.from("glossary_terms").select("term,slug,domain,definition,see_also,related_minerals").eq("publication_status", "published"),
    client.from("specimens").select("mineral_id").eq("publication_status", "published"),
    client.from("shop_items").select("mineral_id").eq("publication_status", "published").eq("sale_status", "available")
  ]);
  if (mineralResult.error || termResult.error) throw mineralResult.error || termResult.error;
  minerals = (mineralResult.data || []).sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }));
  terms = (termResult.data || []).sort((a, b) => a.term.localeCompare(b.term, "fr", { sensitivity: "base" }));
  (specimenResult.data || []).forEach(row => { if (!row.mineral_id) return; const entry = presence.get(row.mineral_id) || { collection: 0, boutique: 0 }; entry.collection += 1; presence.set(row.mineral_id, entry); });
  (shopResult.data || []).forEach(row => { if (!row.mineral_id) return; const entry = presence.get(row.mineral_id) || { collection: 0, boutique: 0 }; entry.boutique += 1; presence.set(row.mineral_id, entry); });
  fillMineralFilters();
  renderMinerals();
  renderGlossary();
  status.hidden = true;
}

showTab(location.hash.slice(1));
try { await load(); }
catch (error) { console.error("Chargement de l'onglet Apprendre :", error); status.textContent = "Impossible de charger le contenu pour le moment. Réessayez dans quelques instants."; }
