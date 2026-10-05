// Carnet de terrain : statistiques calculées à partir de la progression du joueur, et badges (règles pures, sans navigateur : testées dans tests/carnet.test.mjs).
export const DAY = 86400000;
export const parisDay = (offset = 0) => new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(new Date(Date.now() + offset * DAY));
export const shift = (date, days) => new Date(Date.parse(`${date}T12:00:00Z`) + days * DAY).toISOString().slice(0, 10);

// Série en cours : jours consécutifs jusqu'à aujourd'hui (ou hier, si la journée n'est pas encore comptée).
export function currentStreak(dates, today = parisDay()) {
  const set = new Set(dates);
  let day = set.has(today) ? today : shift(today, -1);
  let count = 0;
  while (set.has(day)) { count += 1; day = shift(day, -1); }
  return count;
}
export function longestStreak(dates) {
  const sorted = [...new Set(dates)].sort();
  let best = 0, run = 0, previous = null;
  for (const day of sorted) { run = previous && shift(previous, 1) === day ? run + 1 : 1; best = Math.max(best, run); previous = day; }
  return best;
}

export const DAILY_GAMES = ["mineral", "quiz", "geo"];
// Les quiz de personnalité (un seul passage) : pour en ajouter un, l'ajouter ici. Les jeux rejouables (vrai ou faux, glossaire) sont comptés à part.
export const PERSONAS = ["mineral", "prospecteur", "outil", "collectionneur", "forme"];
export const QUIZ_KEYS = [...PERSONAS.map(kind => `persona-${kind}`), "vrai-faux", "glossaire"];
export const REPLAY_QUIZZES = ["vrai-faux", "glossaire"];

export function statsOf(state, today = parisDay()) {
  const stats = {
    connect: { streak: currentStreak(state.visits || [], today), longest: longestStreak(state.visits || []), days: new Set(state.visits || []).size, account: Boolean(state.accountCreated) },
    games: { any: 0 }
  };
  for (const game of DAILY_GAMES) {
    const days = Object.keys(state[game] || {});
    stats[game] = { games: days.length, streak: currentStreak(days, today), longest: longestStreak(days) };
    stats.games.any += days.length;
  }
  const done = Object.fromEntries(PERSONAS.map(kind => [`persona-${kind}`, Boolean(state.personas?.[kind])]));
  const plays = kind => Number(state.quizzes?.[kind]?.plays) || 0;
  REPLAY_QUIZZES.forEach(kind => { done[kind] = plays(kind) >= 1; });
  stats.quizzes = { done, all: QUIZ_KEYS.every(kind => done[kind]), plays: Object.fromEntries(REPLAY_QUIZZES.map(kind => [kind, plays(kind)])), shared: { mineral: Boolean(state.shares?.["persona-mineral"]), prospecteur: Boolean(state.shares?.["persona-prospecteur"]) } };
  stats.quizzes.tenTimes = PERSONAS.every(kind => stats.quizzes.done[`persona-${kind}`]) && REPLAY_QUIZZES.every(kind => plays(kind) >= 10);
  stats.nav = { pages: (state.nav?.pages || []).length, minerals: (state.nav?.minerals || []).length, favorites: Number(state.nav?.favMax) || 0 };
  return stats;
}

const eachGame = (stats, field, goal) => DAILY_GAMES.every(game => stats[game][field] >= goal);
const minOf = (stats, field) => Math.min(...DAILY_GAMES.map(game => stats[game][field]));
const badge = (id, category, icon, name, rule, test, progress = null) => ({ id, category, icon, name, rule, test, progress });
// Chaque badge : id, catégorie, logo, nom, condition, test(stats) et, pour les compteurs, progress(stats) = [valeur actuelle, objectif].
export const BADGES = [
  badge("connexion-bienvenue", "connexion", "👋", "Bienvenue", "Créer un compte", stats => stats.connect.account),
  badge("connexion-7", "connexion", "🌱", "Membre persévérant(e)", "7 jours de connexion d’affilée", stats => stats.connect.longest >= 7, stats => [stats.connect.longest, 7]),
  badge("connexion-30", "connexion", "🔥", "Membre assidu(e)", "30 jours de connexion d’affilée", stats => stats.connect.longest >= 30, stats => [stats.connect.longest, 30]),
  badge("connexion-90", "connexion", "🏡", "Comme à la maison", "90 jours de connexion d’affilée", stats => stats.connect.longest >= 90, stats => [stats.connect.longest, 90]),

  badge("jeux-premiere", "jeux", "🎮", "Nouveau(elle) joueur(se)", "Terminer une première partie", stats => stats.games.any >= 1),
  badge("jeux-curieux", "jeux", "🧭", "Joueur(euse) curieux(se)", "Une première partie de chacun des trois jeux", stats => DAILY_GAMES.every(game => stats[game].games >= 1), stats => [DAILY_GAMES.filter(game => stats[game].games >= 1).length, 3]),
  badge("jeux-serie-7", "jeux", "🕹️", "Accro aux jeux", "7 jours d’affilée sur chacun des trois jeux", stats => eachGame(stats, "longest", 7), stats => [minOf(stats, "longest"), 7]),
  badge("jeux-serie-30", "jeux", "👑", "Game master", "30 jours d’affilée sur chacun des trois jeux", stats => eachGame(stats, "longest", 30), stats => [minOf(stats, "longest"), 30]),

  badge("quiz-tous", "quiz", "❓", "Encore une question ?", `Faire les ${["", "un", "deux", "trois", "quatre", "cinq", "six", "sept"][QUIZ_KEYS.length] || QUIZ_KEYS.length} quiz`, stats => stats.quizzes.all, stats => [QUIZ_KEYS.filter(kind => stats.quizzes.done[kind]).length, QUIZ_KEYS.length]),
  badge("quiz-partage-mineral", "quiz", "🪞", "J’assume en public", "Partager « Quel minéral es-tu ? »", stats => stats.quizzes.shared.mineral),
  badge("quiz-partage-prospecteur", "quiz", "🤝", "Merci du partage", "Partager « Quel prospecteur es-tu ? »", stats => stats.quizzes.shared.prospecteur),
  badge("quiz-dix-fois", "quiz", "🏆", "Champion(ne)", "Faire chaque quiz : tous les quiz de personnalité, et 10 parties du vrai ou faux et du glossaire", stats => stats.quizzes.tenTimes,
    stats => [Math.min(10, stats.quizzes.plays["vrai-faux"]) + Math.min(10, stats.quizzes.plays.glossaire) + PERSONAS.filter(kind => stats.quizzes.done[`persona-${kind}`]).length, 20 + PERSONAS.length]),

  badge("nav-pages", "navigation", "👀", "Curieux(se)", "Explorer 10 pages du site", stats => stats.nav.pages >= 10, stats => [stats.nav.pages, 10]),
  badge("nav-fiches", "navigation", "🎓", "Le savoir !", "Consulter 50 fiches minéraux", stats => stats.nav.minerals >= 50, stats => [stats.nav.minerals, 50]),
  badge("nav-favori", "navigation", "❤️", "Une préférence ?", "Ajouter une pièce en favoris", stats => stats.nav.favorites >= 1),
  badge("nav-favoris-10", "navigation", "⚖️", "Il va falloir choisir", "Ajouter 10 pièces en favoris", stats => stats.nav.favorites >= 10, stats => [stats.nav.favorites, 10])
];
export const CATEGORIES = [["connexion", "Connexion"], ["jeux", "Jeux"], ["quiz", "Quiz"], ["navigation", "Navigation"]];

// Badges obtenus (gardés même si une série s'interrompt ensuite) : state.badges[id] = jour d'obtention. Renvoie les badges gagnés à l'instant.
export function awardBadges(state, today = parisDay()) {
  state.badges = { ...state.badges };
  const stats = statsOf(state, today);
  const fresh = [];
  for (const item of BADGES) if (!state.badges[item.id] && item.test(stats)) { state.badges[item.id] = today; fresh.push(item); }
  return fresh;
}
