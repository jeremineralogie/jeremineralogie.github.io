// Jeux du jour (trouve le minéral, quiz, devine le gisement) et badges : section affichée sur l'accueil et dans l'onglet « Jeux » d'Apprendre & jouer.
// Les parties sont les mêmes sur les deux pages (tirage fixé par la date) et partagent la même mémoire sur l'appareil.
import { publicMediaUrl, shopItemName } from "./content-repository.js";
import { pieceUrl, specimenUrl } from "./detail-nav.js";
import { ficheUrl } from "./entity-links.js";
import { recordGame, renderBadges, streakOf, todayResult } from "./game-progress.js";
import { renderGeoGame } from "./geo-game.js";
import { renderMineralPhotoGame } from "./mineral-photo-game.js";
import { dateFr, sharePanel } from "./share.js";
import { commonsPhoto, creditLine, loadMineralPhotos } from "./mineral-photos.js";

const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text != null) node.textContent = text; return node; };
const fold = value => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "");
const num = value => Number(value).toLocaleString("fr-FR", { maximumFractionDigits: 2 });
const span = (min, max) => min == null ? "" : max != null && Number(max) !== Number(min) ? `${num(min)} à ${num(max)}` : num(min);
const firstPhoto = media => (media || []).filter(item => item.bucket_id === "site-media-public" && item.storage_path).sort((a, b) => a.position - b.position)[0];

// Jour courant à Paris (le minéral et les jeux changent à minuit, heure française).
export const today = new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(new Date());
export function seeded(text) { let hash = 2166136261; for (const character of text) { hash ^= character.charCodeAt(0); hash = Math.imul(hash, 16777619); } return () => { hash = Math.imul(hash ^ (hash >>> 15), 2246822507) ^ Math.imul(hash ^ (hash >>> 13), 3266489909); return ((hash >>>= 0) % 100000) / 100000; }; }

// Minéral du jour (accueil) et minéral du quiz, toujours différents, tirés dans la liste triée par identifiant.
export function dailyMinerals(minerals) {
  const list = [...minerals].sort((a, b) => String(a.slug).localeCompare(String(b.slug)));
  if (!list.length) return { daily: null, quiz: null };
  const daily = list[Math.floor(seeded(`mineral-${today}`)() * list.length)];
  const playable = list.filter(item => CLUES.filter(([, get]) => get(item)).length >= 3);
  if (!playable.length) return { daily, quiz: null };
  let index = Math.floor(seeded(`quiz-${today}`)() * playable.length);
  if (playable[index].id === daily.id) index = (index + 1) % playable.length;
  return { daily, quiz: playable[index] };
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

// Partage du quiz : le résultat sans dévoiler le minéral.
function quizShare(correct) {
  const hints = todayResult("quiz")?.hints;
  const detail = !correct ? "pas trouvé cette fois" : hints === 0 ? "sans aucun indice" : hints ? `avec ${hints} indice${hints > 1 ? "s" : ""} en plus` : "";
  const streak = streakOf("quiz");
  return sharePanel({
    fileName: `quiz-du-jour-${today}.png`,
    text: `🧪 Quiz du jour Jeremineralogie — ${new Intl.DateTimeFormat("fr-FR").format(new Date(`${today}T12:00:00`))}\n${correct ? "✅ Trouvé" : "❌ Raté"}${detail && correct ? ` ${detail}` : ""}\nSaurez-vous trouver le minéral mystère ?`,
    spec: { title: "Le quiz du jour", date: dateFr(today), big: correct ? "Trouvé !" : "Raté…", bigSub: detail, note: "Le minéral reste secret : à vous de jouer !", mystery: true,
      streak: streak > 1 ? `🔥 Série de ${streak} jours` : "", footer: "Saurez-vous le trouver ?" }
  });
}

// Photo du minéral à trouver, montrée avec le résultat : photo ajoutée dans l'admin (et son crédit), sinon photo libre de Wikimedia Commons.
async function answerPhoto(mineral, client) {
  const own = firstPhoto(mineral.media);
  if (own) return { src: publicMediaUrl(client, own), credit: mineral.photo_credit ? el("p", "photo-credit", mineral.photo_credit) : null };
  const commons = commonsPhoto(await loadMineralPhotos(), mineral.slug);
  return commons ? { src: commons.src, credit: creditLine(commons) } : null;
}

function renderQuiz(panel, mineral, minerals, client) {
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
    const figure = el("figure", "quiz-photo"); figure.hidden = true; result.append(figure);
    void answerPhoto(mineral, client).then(photo => {
      if (!photo) return;
      const image = el("img"); image.src = photo.src; image.alt = mineral.name; image.loading = "lazy";
      figure.append(image); if (photo.credit) figure.append(photo.credit); figure.hidden = false;
    }).catch(() => {});
    const link = el("a", "link quiz-link", `Voir la fiche ${mineral.name} →`); link.href = ficheUrl("mineral", mineral.slug);
    result.append(el("br"), link);
    const streak = store.get("jm-quiz-serie");
    if (streak?.count > 1 && correct) result.append(el("span", "quiz-streak", `Série en cours : ${streak.count} bonnes réponses d’affilée`));
    result.append(el("span", "quiz-next", "Un nouveau quiz vous attend demain."));
    result.append(quizShare(correct));
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
    recordGame("quiz", { correct, hints: hintsUsed, family: mineral.chemical_class || null });
    showResult(answer, correct);
  });
}

// Pièces à deviner : collection et boutique, avec une photo publique et une commune placée sur la carte.
async function geoPieces(client) {
  const rows = async query => { const { data, error } = await query; if (error) throw error; return data || []; };
  const [localities, mines, departments, specimens, shop] = await Promise.all([
    rows(client.from("localities").select("id,name,latitude,longitude,department_code").not("latitude", "is", null)),
    rows(client.from("mines").select("id,name,locality_id,latitude,longitude")),
    rows(client.from("departments").select("code,name")),
    rows(client.from("specimens").select("slug,mineral_name,country,locality_id,mine_id,mineral:minerals!specimens_mineral_id_fkey(name),media:specimen_media(bucket_id,storage_path,position)").eq("publication_status", "published")),
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
    // Point du gisement s'il a été posé (plus précis), sinon celui de la commune.
    const spot = mine?.latitude != null && mine?.longitude != null ? mine : place;
    // Zone du badge « Tour de France » : département français, sinon pays (ou à défaut le lieu) à l'étranger.
    const zone = place.department_code || (row.country && fold(row.country) !== "france" ? `pays:${fold(row.country)}` : `lieu:${place.id}`);
    return { key: `${type}:${row.slug}`, name, href, photo: publicMediaUrl(client, photo), lat: spot.latitude, lng: spot.longitude, department: place.department_code, zone,
      place: [mine?.name, place.name, department].filter(Boolean).join(" · ") };
  };
  return [
    ...specimens.map(row => piece("collection", row, row.mineral_name || row.mineral?.name || "Spécimen", specimenUrl({ id: row.slug }))),
    ...shop.map(row => piece("boutique", row, shopItemName(row), pieceUrl(row)))
  ].filter(Boolean);
}

// Section Jeux : les jeux toujours visibles, les badges dans un volet dépliable.
export async function mountGames(root, { client, minerals, collapsible = false }) {
  // Trois niveaux, toujours dans l'ordre de difficulté : facile (photo + 4 noms), intermédiaire (quiz à indices), difficile (localiser sur la carte).
  // Sur l'accueil (collapsible), chaque jeu est un encart rétractable, replié au départ, qui indique si la partie du jour est jouée.
  const block = (title, level, levelClass, game) => {
    const node = el(collapsible ? "details" : "div", `home-game${collapsible ? " home-game-fold" : ""}`); node.hidden = true;
    const body = el("div"); body.dataset.body = "";
    const heading = el("h3", "home-game-title"); heading.append(el("span", `game-level ${levelClass}`, level), title);
    if (!collapsible) { node.append(heading, body); return node; }
    const done = el("span", "game-done");
    const refresh = () => { const played = Boolean(todayResult(game)); done.textContent = played ? "✓ Joué aujourd’hui" : ""; done.hidden = !played; };
    refresh(); document.addEventListener("jm-progress", refresh);
    const summary = el("summary", "home-game-summary"); summary.append(heading, done);
    node.append(summary, body); return node;
  };
  const mineralBlock = block("Trouve le minéral", "Facile", "is-easy", "mineral"), quizBlock = block("Le quiz du jour", "Intermédiaire", "is-medium", "quiz"), geoBlock = block("Devine le gisement", "Difficile", "is-hard", "geo");
  const badges = el("details", "home-badges");
  const summary = el("summary"); const count = el("span", "home-badges-count");
  summary.append(el("span", "home-badges-label", "Mes séries et badges"), count);
  const list = el("div", "badges");
  badges.append(summary, list);
  root.replaceChildren(mineralBlock, quizBlock, geoBlock, badges);
  const { quiz } = dailyMinerals(minerals);
  if (quiz) renderQuiz(quizBlock, quiz, minerals, client);
  renderBadges(list, count);
  void renderMineralPhotoGame(mineralBlock, { client, minerals }).catch(error => console.error("Trouve le minéral :", error));
  try {
    const pieces = await geoPieces(client);
    if (!pieces.length) return;
    if (!collapsible) { await renderGeoGame(geoBlock, pieces); return; }
    // La carte a besoin d'un encart ouvert pour prendre sa taille : on ne la monte qu'à la première ouverture.
    geoBlock.hidden = false;
    geoBlock.addEventListener("toggle", () => { if (geoBlock.open && !geoBlock.dataset.started) { geoBlock.dataset.started = "1"; void renderGeoGame(geoBlock, pieces); } });
  }
  catch (error) { console.error("Devine le gisement :", error); }
}
