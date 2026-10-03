import { getSupabase } from "./supabase-client.js";
import { ficheUrl } from "./entity-links.js";
import { mountGames } from "./games.js";
import { commonsPhoto, creditText, loadMineralPhotos } from "./mineral-photos.js";

// Onglet « Apprendre & jouer » : fiches minéraux (référentiel minerals) et glossaire (glossary_terms), avec filtres et index A–Z,
// aide à l'identification, « Tests et outils » (densité, dureté, fluorescence) et « Jeux » (mêmes jeux et badges que l'accueil).
const status = document.querySelector("#learn-status");
const tabs = [...document.querySelectorAll(".learn-tabs [data-tab]")];
const panels = { mineraux: document.querySelector("#panel-mineraux"), glossaire: document.querySelector("#panel-glossaire"), identification: document.querySelector("#panel-identification"), outils: document.querySelector("#panel-outils"), jeux: document.querySelector("#panel-jeux") };
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
let photoCredits = {};
let client = null;
let gamesMounted = false;
let terms = [];
const presence = new Map(); // mineral id → { collection, boutique }

function showTab(name) {
  const tab = panels[name] ? name : "mineraux";
  tabs.forEach(item => { const active = item.dataset.tab === tab; item.classList.toggle("active", active); if (active) item.setAttribute("aria-current", "page"); else item.removeAttribute("aria-current"); });
  Object.entries(panels).forEach(([key, panel]) => { panel.hidden = key !== tab; });
  if (tab === "jeux") mountGamesOnce();
}
// Les jeux (carte, photos) ne se chargent qu'à la première ouverture de l'onglet « Jeux ».
function mountGamesOnce() {
  if (gamesMounted || !client || !minerals.length) return;
  gamesMounted = true;
  void mountGames(panels.jeux.querySelector("[data-games]"), { client, minerals });
}
window.addEventListener("hashchange", () => showTab(location.hash.slice(1)));
// Sous-onglets : changement sans quitter la page (y compris depuis les pages préparées pour Google, dont les liens partent de la racine).
tabs.forEach(tab => tab.addEventListener("click", event => { event.preventDefault(); showTab(tab.dataset.tab); history.replaceState(null, "", `${location.pathname}${location.search}#${tab.dataset.tab}`); }));

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
      // Vignette : photo libre de la fiche (crédit complet sur la fiche et dans les informations légales).
      const photo = commonsPhoto(photoCredits, item.slug);
      if (photo) { const thumb = element("img", "learn-thumb"); thumb.src = photo.thumbSrc; thumb.alt = ""; thumb.loading = "lazy"; thumb.title = creditText(photo); a.append(thumb); a.classList.add("has-thumb"); }
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

// ----- Aide à l'identification -----
const iPanel = panels.identification;
const criteria = [...iPanel.querySelectorAll("select[data-crit]")];
const overlaps = (min, max, range) => { if (min == null) return null; const [low, high] = range.split("-").map(Number); const top = max ?? min; return Number(top) >= low && Number(min) <= high; };
const TESTS = {
  luster: (m, v) => m.luster ? v.split("|").some(word => fold(m.luster).includes(word)) : null,
  color: (m, v) => (m.colors || []).length ? colorKeys(m).includes(v) : null,
  streak: (m, v) => m.streak ? v.split("|").some(word => fold(m.streak).includes(word)) : null,
  hardness: (m, v) => overlaps(m.hardness, m.hardness_max, v),
  density: (m, v) => overlaps(m.density, m.density_max, v),
  transparency: (m, v) => m.transparency ? fold(m.transparency).includes(v) : null,
  system: (m, v) => m.crystal_system ? v.split("|").includes(m.crystal_system) : null,
  special: (m, v) => {
    const text = fold(m.description);
    if (v === "magnetic") return /magnetique/.test(text) && !/(pas|non) magnetique/.test(text);
    if (v === "fizz") return m.chemical_class === "Carbonates";
    if (v === "fluo") return Boolean(m.fluorescence);
    if (v === "cleavage") return m.cleavage ? /parfait/.test(fold(m.cleavage)) : null;
    return null;
  }
};
function setupIdentification() {
  const colorSelect = iPanel.querySelector("#i-color");
  const used = new Set(minerals.flatMap(colorKeys));
  COLORS.forEach(([key]) => { if (used.has(key)) colorSelect.add(new Option(key.charAt(0).toUpperCase() + key.slice(1), key)); });
  criteria.forEach(select => select.addEventListener("change", renderIdentification));
  iPanel.querySelector("#ident-reset").addEventListener("click", () => { criteria.forEach(select => { select.value = ""; }); renderIdentification(); });
  renderIdentification();
}
function renderIdentification() {
  const chosen = criteria.filter(select => select.value).map(select => [select.dataset.crit, select.value, select.options[select.selectedIndex].text]);
  const results = iPanel.querySelector("#ident-results");
  const count = iPanel.querySelector("#ident-count");
  if (!chosen.length) { results.replaceChildren(); count.textContent = "Choisissez au moins un critère pour voir les minéraux possibles."; return; }
  const scored = minerals.map(mineral => {
    const checks = chosen.map(([key, value, label]) => ({ label, ok: TESTS[key](mineral, value) }));
    const matched = checks.filter(check => check.ok === true).length;
    const missed = checks.filter(check => check.ok === false).length;
    return { mineral, checks, matched, missed };
  }).filter(entry => entry.matched > 0).sort((a, b) => a.missed - b.missed || b.matched - a.matched || a.mineral.name.localeCompare(b.mineral.name, "fr"));
  const best = scored.filter(entry => entry.missed <= Math.max(0, scored[0]?.missed ?? 0) + (chosen.length > 2 ? 1 : 0)).slice(0, 15);
  const perfect = scored.filter(entry => entry.missed === 0).length;
  count.textContent = perfect ? `${perfect} minéra${perfect > 1 ? "ux correspondent" : "l correspond"} à tous vos critères` : "Aucun minéral ne correspond à tous les critères : voici les plus proches.";
  results.replaceChildren(...best.map(({ mineral, checks, missed }) => {
    const card = link(ficheUrl("mineral", mineral.slug), "", "ident-result");
    const head = element("span", "learn-mineral-head");
    head.append(element("strong", "learn-mineral-name", mineral.name));
    if (mineral.formula) head.append(element("span", "learn-formula", mineral.formula));
    card.append(head);
    card.append(element("span", `ident-score${missed ? "" : " is-full"}`, `${checks.length - missed} critère${checks.length - missed > 1 ? "s" : ""} sur ${checks.length}`));
    const misses = checks.filter(check => check.ok === false).map(check => check.label);
    if (misses.length) card.append(element("span", "ident-miss", `Ne correspond pas : ${misses.join(" · ")}`));
    const facts = [mineral.luster && `éclat ${mineral.luster}`, mineral.streak && `trait ${mineral.streak}`, mineral.hardness != null && `dureté ${range(mineral.hardness, mineral.hardness_max)}`].filter(Boolean).join(" · ");
    if (facts) card.append(element("span", "learn-mineral-facts", facts));
    return card;
  }));
}

// ----- Tests et outils -----
const tPanel = panels.outils;
const parse = input => { const value = Number(String(input.value).replace(",", ".")); return input.value !== "" && Number.isFinite(value) && value > 0 ? value : null; };
// Liste de minéraux cliquables (fiches), avec la valeur utile au test.
function matchList(container, items, detail, empty) {
  if (!items.length) { container.replaceChildren(element("p", "meta", empty)); return; }
  const list = element("ul", "tool-match-list");
  items.forEach(mineral => { const item = element("li"); item.append(link(ficheUrl("mineral", mineral.slug), mineral.name), element("span", "tool-match-detail", detail(mineral))); list.append(item); });
  container.replaceChildren(list);
}
const densityText = mineral => mineral.density == null ? "" : `densité ${range(mineral.density, mineral.density_max)}`;
const hardnessText = mineral => mineral.hardness == null ? "" : `dureté ${range(mineral.hardness, mineral.hardness_max)}`;

function setupDensity() {
  const form = tPanel.querySelector("#density-form");
  const air = form.querySelector("#density-air"), water = form.querySelector("#density-water");
  const waterLabel = form.querySelector('label[for="density-water"]');
  const result = tPanel.querySelector("#density-result"), matches = tPanel.querySelector("#density-matches");
  const update = () => {
    const mode = form.querySelector('input[name="density-mode"]:checked').value;
    waterLabel.textContent = waterLabel.dataset[mode === "tare" ? "labelTare" : "labelWater"];
    const a = parse(air), b = parse(water);
    if (!a || !b) { result.textContent = "Saisissez les deux pesées pour obtenir la densité."; matches.replaceChildren(); return; }
    const displaced = mode === "tare" ? b : a - b;
    if (displaced <= 0) { result.textContent = "Vérifiez les pesées : le poids dans l’eau doit être inférieur au poids dans l’air."; matches.replaceChildren(); return; }
    const density = a / displaced;
    result.textContent = `Densité mesurée : ${density.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}`;
    // Fiches dont la densité (fourchette) est à moins de 0,15 de la mesure, les plus proches d'abord.
    const gap = mineral => { const low = Number(mineral.density), high = Number(mineral.density_max ?? mineral.density); return density < low ? low - density : density > high ? density - high : 0; };
    const close = minerals.filter(mineral => mineral.density != null && gap(mineral) <= 0.15).sort((x, y) => gap(x) - gap(y) || x.name.localeCompare(y.name, "fr"));
    matchList(matches, close.slice(0, 24), mineral => [densityText(mineral), hardnessText(mineral)].filter(Boolean).join(" · "), "Aucune fiche minéral ne correspond à cette densité. Refaites la mesure (bulles d’air, gangue ?).");
  };
  form.addEventListener("input", update); form.addEventListener("change", update);
  update();
}

// Repères de dureté : minéraux de l'échelle et objets du quotidien.
const MOHS_REFERENCES = [[1, "Talc (1)"], [2, "Gypse (2)"], [2.5, "Ongle (2,5)"], [3, "Calcite (3)"], [3.5, "Objet en cuivre (3,5)"], [4, "Fluorite (4)"], [4.5, "Clou en fer (4,5)"],
  [5, "Apatite (5)"], [5.5, "Verre ou lame de couteau (5,5)"], [6, "Orthose (6)"], [6.5, "Lime en acier (6,5)"], [7, "Quartz ou porcelaine (7)"], [8, "Topaze (8)"], [9, "Corindon (9)"], [10, "Diamant (10)"]];
function setupMohs() {
  const scratches = tPanel.querySelector("#mohs-scratches"), scratched = tPanel.querySelector("#mohs-scratched");
  scratches.add(new Option("Je ne sais pas / rien de la liste", ""));
  scratched.add(new Option("Je ne sais pas / rien de la liste", ""));
  MOHS_REFERENCES.forEach(([value, label]) => { scratches.add(new Option(label, String(value))); scratched.add(new Option(label, String(value))); });
  const result = tPanel.querySelector("#mohs-result"), matches = tPanel.querySelector("#mohs-matches");
  const update = () => {
    const low = scratches.value ? Number(scratches.value) : null, high = scratched.value ? Number(scratched.value) : null;
    if (low == null && high == null) { result.textContent = "Indiquez ce que votre minéral raye, ou ce qui le raye."; matches.replaceChildren(); return; }
    if (low != null && high != null && low > high) { result.textContent = "Ces deux observations se contredisent : refaites le test sur une surface fraîche."; matches.replaceChildren(); return; }
    const from = low ?? 1, to = high ?? 10;
    result.textContent = from === to ? `Dureté estimée : environ ${number(from)}` : `Dureté estimée : entre ${number(from)} et ${number(to)}`;
    const fits = minerals.filter(mineral => mineral.hardness != null && Number(mineral.hardness_max ?? mineral.hardness) >= from && Number(mineral.hardness) <= to)
      .sort((x, y) => Number(x.hardness) - Number(y.hardness) || x.name.localeCompare(y.name, "fr"));
    const shown = fits.slice(0, 40);
    matchList(matches, shown, mineral => [hardnessText(mineral), densityText(mineral)].filter(Boolean).join(" · "), "Aucune fiche minéral dans cette fourchette.");
    if (fits.length > shown.length) matches.append(element("p", "meta", `… et ${fits.length - shown.length} autres. Affinez avec la densité ou l’aide à l’identification.`));
  };
  scratches.addEventListener("change", update); scratched.addEventListener("change", update);
  update();
}

function setupTools() {
  setupDensity();
  setupMohs();
  const fluorescent = minerals.filter(mineral => mineral.fluorescence);
  matchList(tPanel.querySelector("#uv-matches"), fluorescent, mineral => mineral.fluorescence, "Aucune fluorescence renseignée pour le moment.");
  // Liens vers les fiches et sommaire : défilement sans changer d'onglet.
  tPanel.querySelectorAll("a[data-mineral]").forEach(anchor => { anchor.href = ficheUrl("mineral", anchor.dataset.mineral); });
  tPanel.querySelectorAll("a[data-jump]").forEach(anchor => anchor.addEventListener("click", event => {
    event.preventDefault();
    tPanel.querySelector(anchor.getAttribute("href"))?.scrollIntoView({ behavior: "smooth", block: "start" });
  }));
}

async function load() {
  client = getSupabase();
  if (!client) { status.textContent = "Contenu momentanément indisponible."; return; }
  const [mineralResult, termResult, specimenResult, shopResult] = await Promise.all([
    client.from("minerals").select("id,name,slug,photo_credit,rarity,media:mineral_media(bucket_id,storage_path,position),formula,chemical_class,crystal_system,hardness,hardness_max,density,density_max,colors,streak,luster,transparency,cleavage,fluorescence,description").eq("publication_status", "published"),
    client.from("glossary_terms").select("term,slug,domain,definition,see_also,related_minerals").eq("publication_status", "published"),
    client.from("specimens").select("mineral_id").eq("publication_status", "published"),
    client.from("shop_items").select("mineral_id").eq("publication_status", "published").eq("sale_status", "available")
  ]);
  if (mineralResult.error || termResult.error) throw mineralResult.error || termResult.error;
  photoCredits = await loadMineralPhotos();
  minerals = (mineralResult.data || []).sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }));
  terms = (termResult.data || []).sort((a, b) => a.term.localeCompare(b.term, "fr", { sensitivity: "base" }));
  (specimenResult.data || []).forEach(row => { if (!row.mineral_id) return; const entry = presence.get(row.mineral_id) || { collection: 0, boutique: 0 }; entry.collection += 1; presence.set(row.mineral_id, entry); });
  (shopResult.data || []).forEach(row => { if (!row.mineral_id) return; const entry = presence.get(row.mineral_id) || { collection: 0, boutique: 0 }; entry.boutique += 1; presence.set(row.mineral_id, entry); });
  fillMineralFilters();
  renderMinerals();
  renderGlossary();
  setupIdentification();
  setupTools();
  if (!panels.jeux.hidden) mountGamesOnce();
  status.hidden = true;
  document.querySelector("[data-seo]")?.remove();
  // Lien depuis une bulle du glossaire : apprendre.html?terme=<slug>#glossaire
  const wanted = new URLSearchParams(window.JM_PARAMS ?? location.search).get("terme");
  if (wanted) { showTab("glossaire"); requestAnimationFrame(() => openTerm(wanted)); }
}

showTab(location.hash.slice(1) || window.JM_TAB || "");
try { await load(); }
catch (error) { console.error("Chargement de l'onglet Apprendre :", error); status.textContent = "Impossible de charger le contenu pour le moment. Réessayez dans quelques instants."; }
