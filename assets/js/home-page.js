import { getSupabase } from "./supabase-client.js";
import { publicMediaUrl, shopItemName } from "./content-repository.js";
import { pieceUrl, articleUrl, documentUrl, specimenUrl } from "./detail-nav.js";
import { ficheUrl } from "./entity-links.js";
import { categoryLabel } from "./reference-resolver.js";
import { recordGame, renderBadges } from "./game-progress.js";
import { renderGeoGame } from "./geo-game.js";

// Page d'accueil : nouveautés, minéral du jour, jeux du jour (quiz, devine le gisement) et badges, chiffres du site.
const client = getSupabase();
const home = document.querySelector("#home");
const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text != null) node.textContent = text; return node; };
const fold = value => String(value ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "");
const num = value => Number(value).toLocaleString("fr-FR", { maximumFractionDigits: 2 });
const span = (min, max) => min == null ? "" : max != null && Number(max) !== Number(min) ? `${num(min)} à ${num(max)}` : num(min);
const firstPhoto = media => (media || []).filter(item => item.bucket_id === "site-media-public" && item.storage_path).sort((a, b) => a.position - b.position)[0];
const dateFr = value => value ? new Intl.DateTimeFormat("fr-FR").format(new Date(`${String(value).slice(0, 10)}T00:00:00`)) : "";

// Jour courant à Paris (le minéral et le quiz changent à minuit, heure française).
const today = new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(new Date());
function seeded(text) { let hash = 2166136261; for (const character of text) { hash ^= character.charCodeAt(0); hash = Math.imul(hash, 16777619); } return () => { hash = Math.imul(hash ^ (hash >>> 15), 2246822507) ^ Math.imul(hash ^ (hash >>> 13), 3266489909); return ((hash >>>= 0) % 100000) / 100000; }; }

function cardPhoto(card, url, alt) {
  if (url) { const image = el("img"); image.src = url; image.alt = alt; image.loading = "lazy"; card.append(image); }
  else { const placeholder = el("div", "card-photo-placeholder", "Photographie à ajouter"); placeholder.setAttribute("role", "img"); card.append(placeholder); }
}
function shopCard(item) {
  const card = el("a", "card"); card.href = pieceUrl(item);
  const photo = firstPhoto(item.media);
  cardPhoto(card, photo && publicMediaUrl(client, photo), shopItemName(item));
  const body = el("div", "card-body");
  body.append(el("h3", "", shopItemName(item)), el("div", "meta", item.mine?.name || item.provenance || ""),
    el("div", "price", new Intl.NumberFormat("fr-FR", { style: "currency", currency: item.currency || "EUR" }).format((item.price_cents ?? 0) / 100)), el("div", "more", "Voir la fiche"));
  card.append(body); return card;
}
function specimenCard(row) {
  const card = el("a", "card card-specimen"); card.href = specimenUrl({ id: row.slug });
  const photo = firstPhoto(row.media); const name = row.mineral_name || row.mineral?.name || "Spécimen";
  cardPhoto(card, photo && publicMediaUrl(client, photo), name);
  const body = el("div", "card-body");
  body.append(el("h3", "", name), el("div", "place", [row.provenance || row.locality_name, row.department_name].filter(Boolean).join(" · ")));
  card.append(body); return card;
}
function readCard(row, kind) {
  const card = el("a", "card card-wide"); card.href = kind === "article" ? articleUrl(row) : documentUrl(row);
  const photo = kind === "article" ? firstPhoto(row.media) : row.cover_path ? { bucket_id: row.cover_bucket || "site-media-public", storage_path: row.cover_path } : null;
  if (photo) { const image = el("img"); image.src = publicMediaUrl(client, photo); image.alt = row.title; image.loading = "lazy"; card.append(image); }
  const body = el("div", "card-body");
  body.append(el("div", "kicker", kind === "article" ? "Article" : "Archive"), el("h3", "", row.title),
    el("div", "meta", [categoryLabel(row.category), dateFr(kind === "article" ? row.published_on : row.document_date)].filter(Boolean).join(" · ")));
  const summary = kind === "article" ? row.excerpt : row.summary;
  if (summary) body.append(el("p", "summary", summary));
  card.append(body); return card;
}
function fillGroup(id, cards) {
  const group = document.querySelector(id);
  if (!cards.length) return;
  group.querySelector("[data-grid]").replaceChildren(...cards);
  group.hidden = false;
}

// ----- Minéral du jour -----
function renderDaily(mineral) {
  const panel = document.querySelector("#home-daily");
  const body = panel.querySelector("[data-body]");
  const box = el("div", "daily");
  const photo = firstPhoto(mineral.media);
  if (photo) { const image = el("img", "daily-photo"); image.src = publicMediaUrl(client, photo); image.alt = mineral.name; image.loading = "lazy"; box.append(image); }
  const name = el("a", "daily-name", mineral.name); name.href = ficheUrl("mineral", mineral.slug);
  box.append(name);
  if (mineral.formula) box.append(el("div", "daily-formula", mineral.formula));
  const facts = el("dl", "daily-facts");
  [["Famille", mineral.chemical_class], ["Système", mineral.crystal_system], ["Dureté", span(mineral.hardness, mineral.hardness_max)], ["Densité", span(mineral.density, mineral.density_max)]]
    .forEach(([label, value]) => { if (value) facts.append(el("dt", "", label), el("dd", "", value)); });
  box.append(facts);
  if (mineral.description) box.append(el("p", "daily-text", mineral.description));
  const more = el("a", "link", "Voir la fiche complète →"); more.href = ficheUrl("mineral", mineral.slug);
  box.append(more);
  body.replaceChildren(box); panel.hidden = false;
}

// ----- Quiz du jour -----
const SYNONYMS = {
  stibine: ["stibnite"], disthene: ["cyanite", "kyanite"], sphalerite: ["blende"], staurotide: ["staurolite"], vesuvianite: ["idocrase"],
  titanite: ["sphene"], actinote: ["actinolite"], arsenopyrite: ["mispickel"], orthose: ["orthoclase"], cerusite: ["cerussite"],
  baryte: ["barytine", "barite"], celestine: ["celestite"], halite: ["selgemme"], chalcocite: ["chalcosine"], nickeline: ["niccolite"],
  uraninite: ["pechblende"], wolframite: ["wolfram"], fluorite: ["fluorine"], galene: ["galena"], pyrrhotite: ["pyrrhotine"], analcime: ["analcite"]
};
// Indices principaux (trois tirés au sort chaque jour), puis indices de secours, du plus vague au plus révélateur.
const CLUES = [
  ["Dureté (Mohs)", m => span(m.hardness, m.hardness_max)], ["Densité", m => span(m.density, m.density_max)],
  ["Couleur du trait", m => m.streak], ["Éclat", m => m.luster], ["Système cristallin", m => m.crystal_system],
  ["Couleurs possibles", m => (m.colors || []).slice(0, 4).join(", ")]
];
const EXTRA_CLUES = [["Famille chimique", m => m.chemical_class], ["Formule chimique", m => m.formula]];
const store = {
  get(key) { try { return JSON.parse(localStorage.getItem(key) || "null"); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* sans mémoire : le quiz reste jouable */ } }
};

function renderQuiz(mineral, minerals) {
  const panel = document.querySelector("#home-quiz");
  const body = panel.querySelector("[data-body]");
  const random = seeded(`quiz-indices-${today}`);
  const clues = CLUES.map(([label, get]) => [label, get(mineral)]).filter(([, value]) => value)
    .map(entry => [random(), entry]).sort((a, b) => a[0] - b[0]).map(([, entry]) => entry);
  const shown = clues.slice(0, 3);
  const extra = EXTRA_CLUES.map(([label, get]) => [label, get(mineral)]).filter(([, value]) => value);
  let hintsUsed = 0;
  const box = el("div", "quiz");
  box.append(el("p", "quiz-intro", "Quel minéral se cache derrière ces indices ?"));
  const list = el("dl", "quiz-clues");
  const addClue = ([label, value]) => list.append(el("dt", "", label), el("dd", "", value));
  shown.forEach(addClue);
  box.append(list);
  const hint = el("button", "quiz-hint", `Un indice de plus (${extra.length})`); hint.type = "button"; hint.hidden = !extra.length;
  hint.addEventListener("click", () => { const next = extra.shift(); if (next) { addClue(next); hintsUsed += 1; } hint.textContent = `Un indice de plus (${extra.length})`; hint.hidden = !extra.length; });
  const form = el("form", "quiz-form");
  const label = el("label", "visually-hidden", "Nom du minéral"); label.htmlFor = "quiz-answer";
  const input = el("input", "quiz-input"); input.id = "quiz-answer"; input.type = "text"; input.autocomplete = "off"; input.placeholder = "Nom du minéral"; input.setAttribute("list", "quiz-names");
  const names = el("datalist"); names.id = "quiz-names"; minerals.forEach(item => names.append(new Option(item.name)));
  const submit = el("button", "quiz-submit", "Valider"); submit.type = "submit";
  form.append(label, input, submit, names);
  const result = el("div", "quiz-result"); result.setAttribute("aria-live", "polite");
  box.append(hint, form, result);
  body.replaceChildren(box); panel.hidden = false;

  const accepted = new Set([fold(mineral.name), ...(SYNONYMS[fold(mineral.name)] || [])]);
  const showResult = (answer, correct) => {
    input.value = answer; input.disabled = true; submit.disabled = true; hint.hidden = true;
    input.classList.toggle("is-right", correct); input.classList.toggle("is-wrong", !correct);
    result.className = `quiz-result ${correct ? "is-right" : "is-wrong"}`;
    result.replaceChildren(el("strong", "", correct ? "Bravo, bonne réponse !" : "Ce n’est pas ça…"),
      el("span", "", correct ? ` C'était bien ${mineral.name}.` : ` La réponse était : ${mineral.name}.`));
    const link = el("a", "link quiz-link", `Voir la fiche ${mineral.name} →`); link.href = ficheUrl("mineral", mineral.slug);
    result.append(el("br"), link);
    const streak = store.get("jm-quiz-serie");
    if (streak?.count > 1 && correct) result.append(el("span", "quiz-streak", `Série en cours : ${streak.count} bonnes réponses d’affilée`));
    result.append(el("span", "quiz-next", "Un nouveau quiz vous attend demain."));
  };
  const saved = store.get("jm-quiz");
  if (saved?.date === today) { showResult(saved.answer, saved.correct); return; }
  form.addEventListener("submit", event => {
    event.preventDefault();
    const answer = input.value.trim();
    if (!answer) { input.focus(); return; }
    const correct = accepted.has(fold(answer));
    store.set("jm-quiz", { date: today, answer, correct });
    const streak = store.get("jm-quiz-serie") || { count: 0, last: null };
    const yesterday = new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(new Date(Date.now() - 86400000));
    store.set("jm-quiz-serie", correct ? { count: streak.last === yesterday ? streak.count + 1 : 1, last: today } : { count: 0, last: today });
    showResult(answer, correct);
    recordGame("quiz", { correct, hints: hintsUsed, family: mineral.chemical_class || null });
  });
}

// ----- Chiffres -----
function renderStats(values) {
  const panel = document.querySelector("#home-stats");
  const body = panel.querySelector("[data-body]");
  body.replaceChildren(...values.filter(([, value]) => value > 0).map(([label, value, href]) => {
    const tile = el("a", "home-stat"); tile.href = href;
    tile.append(el("strong", "", value.toLocaleString("fr-FR")), el("span", "", label));
    return tile;
  }));
  panel.hidden = !body.children.length;
}

async function communesOnMap() {
  const pick = async query => { const { data, error } = await query; if (error) throw error; return data || []; };
  const [localities, mines, specimens, shop, articleLinks, archiveLinks] = await Promise.all([
    pick(client.from("localities").select("id").eq("publication_status", "published").not("latitude", "is", null)),
    pick(client.from("mines").select("id,locality_id").eq("publication_status", "published")),
    pick(client.from("specimens").select("locality_id,mine_id").eq("publication_status", "published")),
    pick(client.from("shop_items").select("locality_id,mine_id").eq("publication_status", "published").eq("sale_status", "available")),
    pick(client.from("article_localities").select("locality_id")), pick(client.from("archive_localities").select("locality_id"))
  ]);
  const located = new Set(localities.map(row => row.id));
  const mineLocality = new Map(mines.map(row => [row.id, row.locality_id]));
  const used = new Set();
  [...specimens, ...shop].forEach(row => { const id = row.locality_id || mineLocality.get(row.mine_id); if (located.has(id)) used.add(id); });
  [...articleLinks, ...archiveLinks].forEach(row => { if (located.has(row.locality_id)) used.add(row.locality_id); });
  return used.size;
}

// Pièces à deviner : collection et boutique, avec une photo publique et une commune placée sur la carte.
async function geoPieces() {
  const rows = async query => { const { data, error } = await query; if (error) throw error; return data || []; };
  const [localities, mines, departments, specimens, shop] = await Promise.all([
    rows(client.from("localities").select("id,name,latitude,longitude,department_code").not("latitude", "is", null)),
    rows(client.from("mines").select("id,name,locality_id")),
    rows(client.from("departments").select("code,name")),
    rows(client.from("specimens").select("slug,mineral_name,locality_id,mine_id,mineral:minerals!specimens_mineral_id_fkey(name),media:specimen_media(bucket_id,storage_path,position)").eq("publication_status", "published")),
    rows(client.from("shop_items").select("slug,reference,title,mineral_name,locality_id,mine_id,mineral:minerals!shop_items_mineral_id_fkey(name),media:shop_item_media(bucket_id,storage_path,position)").eq("publication_status", "published").neq("sale_status", "hidden"))
  ]);
  const localityById = new Map(localities.map(row => [row.id, row]));
  const mineById = new Map(mines.map(row => [row.id, row]));
  const departmentName = new Map(departments.map(row => [row.code, row.name]));
  const piece = (type, row, name, href) => {
    const mine = mineById.get(row.mine_id);
    const place = localityById.get(row.locality_id) || localityById.get(mine?.locality_id);
    const photo = firstPhoto(row.media);
    if (!place || place.longitude == null || !photo) return null;
    const department = departmentName.get(place.department_code);
    return { key: `${type}:${row.slug}`, name, href, photo: publicMediaUrl(client, photo), lat: place.latitude, lng: place.longitude, department: place.department_code,
      place: [mine?.name, place.name, department].filter(Boolean).join(" · ") };
  };
  return [
    ...specimens.map(row => piece("collection", row, row.mineral_name || row.mineral?.name || "Spécimen", specimenUrl({ id: row.slug }))),
    ...shop.map(row => piece("boutique", row, shopItemName(row), pieceUrl(row)))
  ].filter(Boolean);
}

async function load() {
  if (!client) return;
  const safe = (label, task, fallback) => task().catch(error => { console.error(`Accueil — ${label} :`, error); return fallback; });
  const rows = async query => { const { data, error } = await query; if (error) throw error; return data || []; };
  const total = async query => { const { count, error } = await query; if (error) throw error; return count || 0; };
  const [shop, specimens, articles, archives, minerals, counts, communes] = await Promise.all([
    safe("boutique", () => rows(client.from("shop_items").select("slug,reference,title,mineral_name,provenance,price_cents,currency,mineral:minerals!shop_items_mineral_id_fkey(name),mine:mines!shop_items_mine_id_fkey(name),media:shop_item_media(bucket_id,storage_path,position)")
      .eq("publication_status", "published").eq("sale_status", "available").order("created_at", { ascending: false }).limit(4)), []),
    safe("collection", () => rows(client.from("specimens").select("slug,mineral_name,provenance,locality_name,department_name,mineral:minerals!specimens_mineral_id_fkey(name),media:specimen_media(bucket_id,storage_path,position)")
      .eq("publication_status", "published").order("created_at", { ascending: false }).limit(4)), []),
    safe("articles", () => rows(client.from("articles").select("slug,title,category,published_on,excerpt,media:article_media(bucket_id,storage_path,position)")
      .eq("publication_status", "published").order("published_on", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }).limit(1)), []),
    safe("archives", () => rows(client.from("archive_documents").select("slug,title,category,document_date,summary,cover_bucket,cover_path")
      .eq("publication_status", "published").order("created_at", { ascending: false }).limit(1)), []),
    safe("minéraux", () => rows(client.from("minerals").select("id,name,slug,formula,chemical_class,crystal_system,hardness,hardness_max,density,density_max,streak,luster,transparency,colors,description,media:mineral_media(bucket_id,storage_path,position)")
      .eq("publication_status", "published").order("slug")), []),
    safe("chiffres", () => Promise.all([
      total(client.from("specimens").select("id", { count: "exact", head: true }).eq("publication_status", "published")),
      total(client.from("shop_items").select("id", { count: "exact", head: true }).eq("publication_status", "published").eq("sale_status", "available")),
      total(client.from("glossary_terms").select("id", { count: "exact", head: true }).eq("publication_status", "published")),
      total(client.from("articles").select("id", { count: "exact", head: true }).eq("publication_status", "published")),
      total(client.from("archive_documents").select("id", { count: "exact", head: true }).eq("publication_status", "published"))
    ]), [0, 0, 0, 0, 0]),
    safe("communes", communesOnMap, 0)
  ]);
  void safe("devine le gisement", async () => { const pieces = await geoPieces(); if (pieces.length) await renderGeoGame(document.querySelector("#home-geo"), pieces); }, null);

  fillGroup("#home-shop", shop.map(shopCard));
  fillGroup("#home-collection", specimens.map(specimenCard));
  fillGroup("#home-reads", [...articles.map(row => readCard(row, "article")), ...archives.map(row => readCard(row, "archive"))]);

  const playable = minerals.filter(item => CLUES.filter(([, get]) => get(item)).length >= 3);
  if (minerals.length) {
    const daily = minerals[Math.floor(seeded(`mineral-${today}`)() * minerals.length)];
    renderDaily(daily);
    if (playable.length) {
      let quizIndex = Math.floor(seeded(`quiz-${today}`)() * playable.length);
      if (playable[quizIndex].id === daily.id) quizIndex = (quizIndex + 1) % playable.length;
      renderQuiz(playable[quizIndex], minerals);
    }
  }
  const badges = document.querySelector("#home-badges");
  renderBadges(badges.querySelector("[data-body]"), badges.querySelector("[data-count]")); badges.hidden = false;
  const [specimenCount, shopCount, termCount, articleCount, archiveCount] = counts;
  const plural = (count, one, many) => count > 1 ? many : one;
  renderStats([
    [plural(specimenCount, "spécimen dans ma collection", "spécimens dans ma collection"), specimenCount, "collection.html"],
    [plural(shopCount, "pièce en boutique", "pièces en boutique"), shopCount, "boutique.html"],
    [plural(communes, "commune sur la carte", "communes sur la carte"), communes, "carte.html"],
    [plural(minerals.length, "fiche minéral", "fiches minéraux"), minerals.length, "apprendre.html#mineraux"],
    [plural(termCount, "terme du glossaire", "termes du glossaire"), termCount, "apprendre.html#glossaire"],
    [plural(articleCount, "article", "articles"), articleCount, "articles.html"],
    [plural(archiveCount, "document d’archive", "documents d’archive"), archiveCount, "archives.html"]
  ]);
  home.hidden = false;
}

void load();
