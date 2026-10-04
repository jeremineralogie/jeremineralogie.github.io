// Jeux du jour (trouve le minéral, quiz, devine le gisement) : historique, séries de jours consécutifs et badges.
// Tout est gardé sur l'appareil du visiteur (aucun compte) ; sans mémoire disponible, les jeux restent jouables.
const KEY = "jm-jeux";
const DAY = 86400000;

export const parisDay = (offset = 0) => new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(new Date(Date.now() + offset * DAY));
const shift = (date, days) => new Date(Date.parse(`${date}T12:00:00Z`) + days * DAY).toISOString().slice(0, 10);
const isFrench = code => /^(2[AB]|\d{2,3})$/i.test(String(code ?? ""));

function read() {
  let state;
  try { state = JSON.parse(localStorage.getItem(KEY) || "null"); } catch { state = null; }
  state = { mineral: {}, quiz: {}, geo: {}, earned: {}, ...state };
  // Reprise du quiz déjà joué avant l'arrivée des badges.
  if (!Object.keys(state.quiz).length) {
    try {
      const legacy = JSON.parse(localStorage.getItem("jm-quiz") || "null");
      if (legacy?.date) state.quiz[legacy.date] = { correct: Boolean(legacy.correct), hints: null, family: null };
    } catch { /* rien à reprendre */ }
  }
  return state;
}
function write(state) { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* mémoire indisponible */ } }

// Série en cours : jours consécutifs jusqu'à aujourd'hui (ou hier, si la partie du jour n'est pas encore jouée).
function currentStreak(dates) {
  const set = new Set(dates);
  let day = set.has(parisDay()) ? parisDay() : parisDay(-1);
  let count = 0;
  while (set.has(day)) { count += 1; day = shift(day, -1); }
  return count;
}
function longestStreak(dates) {
  const sorted = [...new Set(dates)].sort();
  let best = 0, run = 0, previous = null;
  for (const day of sorted) { run = previous && shift(previous, 1) === day ? run + 1 : 1; best = Math.max(best, run); previous = day; }
  return best;
}

function statsOf(state) {
  const mineralDays = Object.keys(state.mineral), quizDays = Object.keys(state.quiz), geoDays = Object.keys(state.geo);
  const mineral = Object.values(state.mineral), quiz = Object.values(state.quiz), geo = Object.values(state.geo);
  const rounds = geo.flatMap(game => game.rounds || []);
  const exact = rounds.filter(round => round.km < 1);
  const tripleDays = mineralDays.filter(day => state.quiz[day] && state.geo[day]);
  const anyDays = new Set([...mineralDays, ...quizDays, ...geoDays]);
  return {
    mineral: {
      streak: currentStreak(mineralDays), longest: longestStreak(mineralDays), games: mineral.length,
      perfect: mineral.filter(game => game.score >= game.rounds).length,
      found: mineral.reduce((sum, game) => sum + (game.score || 0), 0),
      families: new Set(mineral.flatMap(game => game.families || [])).size
    },
    quiz: {
      streak: currentStreak(quizDays), longest: longestStreak(quizDays),
      correct: quiz.filter(game => game.correct).length,
      noHint: quiz.filter(game => game.correct && game.hints === 0).length,
      noHintLongest: longestStreak(quizDays.filter(day => state.quiz[day].correct && state.quiz[day].hints === 0)),
      families: new Set(quiz.filter(game => game.correct && game.family).map(game => game.family)).size
    },
    geo: {
      streak: currentStreak(geoDays), longest: longestStreak(geoDays), games: geo.length,
      best: Math.max(0, ...geo.map(game => game.score || 0)),
      closest: Math.min(Infinity, ...rounds.map(round => round.km)),
      exact: exact.length,
      // Zones (départements français, sinon pays ou lieu étranger) où une pièce a été trouvée à moins de 1 km.
      zones: new Set(exact.map(round => round.zone || round.department).filter(Boolean)).size
    },
    both: {
      days: tripleDays.length, streak: currentStreak(tripleDays), longest: longestStreak(tripleDays),
      played: anyDays.size, shared: Boolean(state.shared)
    }
  };
}

const SERIES = [[3, "🔓", "Régulier"], [7, "🎓", "Assidu"], [30, "🔥", "Passionné"], [100, "👑", "Légende"]];
const series = game => SERIES.map(([days, icon, name]) => ({ id: `${game}-serie-${days}`, game, icon, name, rule: `${days} jours d’affilée`, test: stats => stats[game].longest >= days }));
const badge = (id, game, icon, name, rule, test) => ({ id, game, icon, name, rule, test });
// 36 badges : 10 par jeu (4 séries + 6 exploits) et 6 communs aux trois jeux.
export const BADGES = [
  ...series("mineral"),
  badge("mineral-coup-d-oeil", "mineral", "👁️", "Coup d’œil", "Première partie terminée", stats => stats.mineral.games >= 1),
  badge("mineral-sans-faute", "mineral", "💯", "Sans faute", "Une partie à 5 sur 5", stats => stats.mineral.perfect >= 1),
  badge("mineral-oeil-expert", "mineral", "🔎", "Œil d’expert", "5 parties sans faute", stats => stats.mineral.perfect >= 5),
  badge("mineral-collectionneur", "mineral", "💎", "Collectionneur d’images", "100 minéraux reconnus", stats => stats.mineral.found >= 100),
  badge("mineral-familier", "mineral", "⛏️", "Familier des minéraux", "Minéraux reconnus dans 8 familles chimiques", stats => stats.mineral.families >= 8),
  badge("mineral-oeil-maitre", "mineral", "🏆", "Œil de maître", "25 parties sans faute", stats => stats.mineral.perfect >= 25),
  ...series("quiz"),
  badge("quiz-premier-pas", "quiz", "🥇", "Premier pas", "Première bonne réponse", stats => stats.quiz.correct >= 1),
  badge("quiz-sans-filet", "quiz", "🧠", "Sans filet", "10 bonnes réponses sans indice", stats => stats.quiz.noHint >= 10),
  badge("quiz-premier-coup", "quiz", "⚡", "Du premier coup", "Bonne réponse sans indice, 5 jours d’affilée", stats => stats.quiz.noHintLongest >= 5),
  badge("quiz-encyclopediste", "quiz", "📚", "Encyclopédiste", "50 bonnes réponses", stats => stats.quiz.correct >= 50),
  badge("quiz-familles", "quiz", "🧪", "Expert des familles", "Bonne réponse dans 8 familles chimiques", stats => stats.quiz.families >= 8),
  badge("quiz-erudit", "quiz", "🎖️", "Érudit", "100 bonnes réponses", stats => stats.quiz.correct >= 100),
  ...series("geo"),
  badge("geo-boussole", "geo", "🧭", "Boussole", "Première partie terminée", stats => stats.geo.games >= 1),
  badge("geo-oeil-de-lynx", "geo", "🎯", "Œil de lynx", "Une manche à moins de 5 km", stats => stats.geo.closest < 5),
  badge("geo-pile-au-but", "geo", "📍", "Pile au but", "Une manche à moins de 1 km", stats => stats.geo.closest < 1),
  badge("geo-cartographe", "geo", "🗺️", "Cartographe", "Une partie à 4 500 points ou plus", stats => stats.geo.best >= 4500),
  badge("geo-tour-de-france-2", "geo", "🏔️", "Tour de France", "Pièces de 10 départements et pays différents trouvées à moins de 1 km", stats => stats.geo.zones >= 10),
  badge("geo-grand-tour", "geo", "🏅", "Grand tour", "50 pièces trouvées à moins de 1 km", stats => stats.geo.exact >= 50),
  badge("both-journee-parfaite", "both", "🌟", "Journée parfaite", "Les trois jeux le même jour", stats => stats.both.days >= 1),
  badge("both-prospecteur-3", "both", "⚒️", "Prospecteur complet", "Les trois jeux le même jour, 7 fois", stats => stats.both.days >= 7),
  badge("both-triple-serie", "both", "💡", "Triple série", "Les trois jeux 7 jours d’affilée", stats => stats.both.longest >= 7),
  badge("both-fidele", "both", "🗓️", "Fidèle", "30 jours de jeu au total", stats => stats.both.played >= 30),
  badge("both-ambassadeur", "both", "📲", "Ambassadeur", "Partager un résultat", stats => stats.both.shared),
  badge("both-conservateur", "both", "🌍", "Conservateur", "Tous les autres badges", (stats, earned) => BADGES.every(item => item.id === "both-conservateur" || earned[item.id]))
];

// Badges gagnés (gardés même si une série s'interrompt ensuite) ; renvoie ceux obtenus à l'instant.
function award(state) {
  const stats = statsOf(state);
  const fresh = [];
  for (const badge of BADGES) {
    if (!state.earned[badge.id] && badge.test(stats, state.earned)) { state.earned[badge.id] = parisDay(); fresh.push(badge); }
  }
  return fresh;
}

// Enregistre la partie du jour d'un jeu (« mineral », « quiz » ou « geo »), puis annonce les nouveaux badges.
export function recordGame(game, result) {
  const state = read();
  state[game][parisDay()] = result;
  const fresh = award(state);
  write(state);
  fresh.forEach((badge, index) => setTimeout(() => toast(badge), index * 2600));
  document.dispatchEvent(new CustomEvent("jm-progress"));
  return fresh;
}

// Un résultat partagé (menu de partage ouvert, ou image enregistrée) : badge « Ambassadeur ».
export function recordShare() {
  const state = read();
  if (state.shared) return [];
  state.shared = parisDay();
  const fresh = award(state);
  write(state);
  fresh.forEach((item, index) => setTimeout(() => toast(item), index * 2600));
  document.dispatchEvent(new CustomEvent("jm-progress"));
  return fresh;
}

// Quiz « Quel minéral es-tu ? » : un seul résultat par joueur, gardé avec la progression (et donc avec le compte).
export const getPersona = () => read().persona || null;
export function recordPersona(slug) {
  const state = read();
  if (state.persona) return state.persona;
  state.persona = { slug, date: parisDay() };
  write(state);
  document.dispatchEvent(new CustomEvent("jm-progress"));
  return state.persona;
}

// ----- Synchronisation avec le compte joueur (voir account.js) -----
export const getProgress = () => read();
// Fusion de deux progressions : toutes les parties des deux côtés sont gardées (à égalité de jour, la meilleure), badges réunis.
export function mergeProgress(a, b) {
  const out = { ...b, ...a, mineral: {}, quiz: {}, geo: {}, earned: {} };
  const better = (x, y) => {
    const score = item => Number(item?.score ?? item?.points ?? (item?.correct ? 1 : 0)) || 0;
    return score(y) > score(x) ? y : x;
  };
  for (const key of ["mineral", "quiz", "geo"]) {
    const left = a?.[key] || {}, right = b?.[key] || {};
    for (const day of new Set([...Object.keys(left), ...Object.keys(right)])) out[key][day] = day in left && day in right ? better(left[day], right[day]) : (left[day] ?? right[day]);
  }
  for (const id of new Set([...Object.keys(a?.earned || {}), ...Object.keys(b?.earned || {})])) {
    const dates = [a?.earned?.[id], b?.earned?.[id]].filter(Boolean).sort();
    out.earned[id] = dates[0];
  }
  const shared = [a?.shared, b?.shared].filter(Boolean).sort()[0]; if (shared) out.shared = shared;
  const persona = [a?.persona, b?.persona].filter(Boolean).sort((x, y) => String(x.date).localeCompare(String(y.date)))[0]; if (persona) out.persona = persona;
  return out;
}
// Remplace la progression locale par celle du compte (sans relancer d'envoi au serveur).
export function replaceProgress(state) {
  write(state);
  document.dispatchEvent(new CustomEvent("jm-progress", { detail: { remote: true } }));
}

export const streakOf = game => statsOf(read())[game].streak;
export const todayResult = game => read()[game][parisDay()] || null;

function toast(badge) {
  const box = document.createElement("div"); box.className = "badge-toast"; box.setAttribute("role", "status");
  box.append(Object.assign(document.createElement("span"), { className: "badge-toast-icon", textContent: badge.icon }));
  const text = document.createElement("span"); text.append(Object.assign(document.createElement("strong"), { textContent: "Nouveau badge !" }), ` ${badge.name}`);
  box.append(text); document.body.append(box);
  requestAnimationFrame(() => box.classList.add("is-shown"));
  setTimeout(() => { box.classList.remove("is-shown"); setTimeout(() => box.remove(), 400); }, 2400);
}

// Badges de la section Jeux de l'accueil : séries en cours, badges gagnés en couleur, les autres grisés avec leur condition.
// summary (facultatif) reçoit le décompte « n / total », affiché même quand la liste est repliée.
const GROUPS = [["mineral", "Facile · Trouve le minéral"], ["quiz", "Intermédiaire · Quiz du jour"], ["geo", "Difficile · Devine le gisement"], ["both", "Les trois jeux · Badges communs"]];
export function renderBadges(container, summary = null) {
  const draw = () => {
    const state = read();
    const stats = statsOf(state);
    const today = parisDay();
    container.replaceChildren(...GROUPS.map(([game, title]) => {
      const group = document.createElement("div"); group.className = "badge-group";
      const head = document.createElement("h3"); head.className = "badge-group-title"; head.textContent = title;
      const streak = stats[game].streak;
      if (streak) head.append(Object.assign(document.createElement("span"), { className: "badge-streak", textContent: `🔥 ${streak} jour${streak > 1 ? "s" : ""}` }));
      const list = document.createElement("ul"); list.className = "badge-list";
      BADGES.filter(badge => badge.game === game).forEach(badge => {
        const earned = state.earned[badge.id];
        const item = document.createElement("li"); item.className = `badge${earned ? " is-earned" : ""}${earned === today ? " is-new" : ""}`;
        item.title = earned ? `${badge.name} — obtenu le ${new Intl.DateTimeFormat("fr-FR").format(new Date(`${earned}T12:00:00`))}` : `${badge.name} — ${badge.rule}`;
        item.append(Object.assign(document.createElement("span"), { className: "badge-icon", textContent: badge.icon }),
          Object.assign(document.createElement("span"), { className: "badge-name", textContent: badge.name }),
          Object.assign(document.createElement("span"), { className: "badge-rule", textContent: badge.rule }));
        list.append(item);
      });
      group.append(head, list);
      return group;
    }));
    const total = BADGES.filter(badge => state.earned[badge.id]).length;
    const count = `${total} badge${total > 1 ? "s" : ""} sur ${BADGES.length}`;
    if (summary) summary.textContent = count;
    else container.prepend(Object.assign(document.createElement("p"), { className: "badge-count", textContent: count }));
  };
  draw();
  document.addEventListener("jm-progress", draw);
}
