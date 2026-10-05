// Progression du joueur : parties des jeux du jour, quiz, séries, carnet de terrain (connexions, pages consultées, favoris) et badges.
// Tout est gardé sur l'appareil du visiteur ; avec un compte joueur, la même progression est synchronisée (voir account.js). Sans mémoire disponible, les jeux restent jouables.
import { track } from "./track.js";
import { BADGES, awardBadges, statsOf, parisDay, shift } from "./badges.js";
export { parisDay };
const KEY = "jm-jeux";
const MAX_VISITS = 400, MAX_PAGES = 60, MAX_MINERALS = 120;
const CARD_DAYS = 7; // les résultats restent 7 jours dans le carnet de terrain, puis disparaissent
// Les badges ne se gagnent qu'avec un compte : account.js indique si un joueur est connecté.
let loggedIn = false;
export const setLoggedIn = value => { loggedIn = Boolean(value); };

function read() {
  let state;
  try { state = JSON.parse(localStorage.getItem(KEY) || "null"); } catch { state = null; }
  state = { mineral: {}, quiz: {}, geo: {}, ...state };
  // Anciens badges (système remplacé par le carnet de terrain) : abandonnés.
  delete state.earned; delete state.shared;
  // Résultats du carnet : 7 jours.
  if (state.cards) { const limit = shift(parisDay(), -CARD_DAYS); state.cards = Object.fromEntries(Object.entries(state.cards).filter(([, card]) => card?.date >= limit)); }
  // Reprise du quiz déjà joué avant l'arrivée des séries.
  if (!Object.keys(state.quiz).length) {
    try {
      const legacy = JSON.parse(localStorage.getItem("jm-quiz") || "null");
      if (legacy?.date) state.quiz[legacy.date] = { correct: Boolean(legacy.correct), hints: null, family: null };
    } catch { /* rien à reprendre */ }
  }
  return state;
}
function write(state) { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* mémoire indisponible */ } }

// Modifie la progression, attribue les badges gagnés et n'annonce (et ne synchronise) que s'il y a eu un vrai changement.
function change(update, { always = false } = {}) {
  const state = read();
  const before = JSON.stringify(state);
  update(state);
  const fresh = loggedIn ? awardBadges(state) : [];
  const after = JSON.stringify(state);
  if (after === before && !always) return state;
  write(state);
  document.dispatchEvent(new CustomEvent("jm-progress"));
  if (fresh.length) document.dispatchEvent(new CustomEvent("jm-badges", { detail: { badges: fresh } })); // fenêtre de félicitations (badge-popup.js)
  return state;
}
const addUnique = (list = [], value, max) => (value && !list.includes(value) && list.length < max ? [...list, value] : list);

// Enregistre la partie du jour d'un jeu (« mineral », « quiz » ou « geo »).
export function recordGame(game, result) {
  track("end", game, null, Number(result?.score ?? result?.points ?? (result?.correct ? 1 : 0)));
  change(state => { state[game][parisDay()] = result; }, { always: true });
}

// Connexion d'un joueur (compte) : jour de connexion pour la série, et création du compte pour le badge « Bienvenue ».
export function recordLogin() {
  change(state => {
    state.accountCreated ||= parisDay();
    state.visits = [...new Set([...(state.visits || []), parisDay()])].sort().slice(-MAX_VISITS);
  });
}
// Page consultée (pour « Explorer 10 pages » et « Consulter 50 fiches minéraux »).
export function recordPageView(key, mineralSlug = null) {
  change(state => {
    state.nav = { ...state.nav, pages: addUnique(state.nav?.pages, key, MAX_PAGES), minerals: addUnique(state.nav?.minerals, mineralSlug, MAX_MINERALS) };
  });
}
// Nombre de pièces de la boutique dans les favoris (le maximum atteint est gardé).
export function recordFavoritePieces(count) {
  change(state => { state.nav = { ...state.nav, favMax: Math.max(Number(state.nav?.favMax) || 0, count) }; });
}
// Partie d'un quiz rejouable (« vrai-faux », « glossaire ») : nombre de parties, dernier et meilleur score.
export function recordQuizPlay(kind, score, total) {
  const date = parisDay();
  change(state => {
    const old = state.quizzes?.[kind] || {};
    const best = old.best && old.best.score / old.best.total >= score / total ? old.best : { score, total, date };
    state.quizzes = { ...state.quizzes, [kind]: { plays: (old.plays || 0) + 1, last: { score, total, date }, best } };
  }, { always: true });
}
// Un résultat partagé (menu de partage ouvert, ou image enregistrée) : jeu ou quiz concerné.
export function recordShare(key) {
  if (!key) return;
  change(state => { state.shares = { ...state.shares }; state.shares[key] ||= parisDay(); });
}
// Dernier résultat de chaque jeu ou quiz, gardé pour pouvoir le partager plus tard depuis le carnet : { spec, text, fileName }.
export function rememberCard(key, card, keep = false) {
  change(state => {
    if (keep && state.cards?.[key]) return;
    state.cards = { ...state.cards, [key]: { ...card, date: state.cards?.[key]?.date && JSON.stringify(state.cards[key].spec) === JSON.stringify(card.spec) ? state.cards[key].date : parisDay() } };
  });
}

// Quiz de personnalité (« mineral », « prospecteur »…) : un seul résultat par joueur et par quiz, gardé avec la progression (et donc avec le compte).
export const getPersona = kind => read().personas?.[kind] || null;
export function recordPersona(kind, slug) {
  const done = getPersona(kind);
  if (done) return done;
  change(state => { state.personas = { ...state.personas, [kind]: { slug, date: parisDay() } }; }, { always: true });
  return getPersona(kind);
}

// ----- Synchronisation avec le compte joueur (voir account.js) -----
export const getProgress = () => read();
const earliest = (...values) => values.filter(Boolean).sort()[0];
const latest = (...items) => items.filter(Boolean).sort((x, y) => String(y.date).localeCompare(String(x.date)))[0];
const union = (a = [], b = [], max) => [...new Set([...a, ...b])].slice(0, max);
// Fusion de deux progressions : toutes les parties des deux côtés sont gardées (à égalité de jour, la meilleure), badges et résultats réunis.
export function mergeProgress(a, b) {
  const out = { ...b, ...a, mineral: {}, quiz: {}, geo: {} };
  delete out.earned; delete out.shared;
  const better = (x, y) => {
    const score = item => Number(item?.score ?? item?.points ?? (item?.correct ? 1 : 0)) || 0;
    return score(y) > score(x) ? y : x;
  };
  for (const key of ["mineral", "quiz", "geo"]) {
    const left = a?.[key] || {}, right = b?.[key] || {};
    for (const day of new Set([...Object.keys(left), ...Object.keys(right)])) out[key][day] = day in left && day in right ? better(left[day], right[day]) : (left[day] ?? right[day]);
  }
  const mergeDates = field => { const ids = new Set([...Object.keys(a?.[field] || {}), ...Object.keys(b?.[field] || {})]); const result = {}; ids.forEach(id => { result[id] = earliest(a?.[field]?.[id], b?.[field]?.[id]); }); return result; };
  out.badges = mergeDates("badges"); out.shares = mergeDates("shares");
  const accountCreated = earliest(a?.accountCreated, b?.accountCreated); if (accountCreated) out.accountCreated = accountCreated;
  out.visits = union(a?.visits, b?.visits, 10 ** 6).sort().slice(-MAX_VISITS);
  out.nav = { pages: union(a?.nav?.pages, b?.nav?.pages, MAX_PAGES), minerals: union(a?.nav?.minerals, b?.nav?.minerals, MAX_MINERALS), favMax: Math.max(Number(a?.nav?.favMax) || 0, Number(b?.nav?.favMax) || 0) };
  out.personas = {};
  for (const kind of new Set([...Object.keys(a?.personas || {}), ...Object.keys(b?.personas || {})])) {
    const first = [a?.personas?.[kind], b?.personas?.[kind]].filter(Boolean).sort((x, y) => String(x.date).localeCompare(String(y.date)))[0];
    if (first) out.personas[kind] = first;
  }
  out.quizzes = {};
  for (const kind of new Set([...Object.keys(a?.quizzes || {}), ...Object.keys(b?.quizzes || {})])) {
    const x = a?.quizzes?.[kind], y = b?.quizzes?.[kind];
    const best = [x?.best, y?.best].filter(Boolean).sort((p, q) => q.score / q.total - p.score / p.total)[0];
    out.quizzes[kind] = { plays: Math.max(x?.plays || 0, y?.plays || 0), last: latest(x?.last, y?.last), best };
  }
  out.cards = {};
  for (const key of new Set([...Object.keys(a?.cards || {}), ...Object.keys(b?.cards || {})])) out.cards[key] = latest(a?.cards?.[key], b?.cards?.[key]);
  // Les badges se recalculent sur la progression fusionnée (un badge déjà obtenu garde sa date).
  awardBadges(out);
  return out;
}
// Remplace la progression locale par celle du compte (sans relancer d'envoi au serveur).
export function replaceProgress(state) {
  const known = read().badges || {};
  write(state);
  document.dispatchEvent(new CustomEvent("jm-progress", { detail: { remote: true } }));
  // Badges gagnés à l'instant grâce à la fusion (et pas déjà connus de l'appareil).
  const fresh = BADGES.filter(badge => state.badges?.[badge.id] === parisDay() && !known[badge.id]);
  if (fresh.length) document.dispatchEvent(new CustomEvent("jm-badges", { detail: { badges: fresh } }));
}

export const streakOf = game => statsOf(read())[game].streak;
export const todayResult = game => read()[game][parisDay()] || null;
export { BADGES, statsOf };
