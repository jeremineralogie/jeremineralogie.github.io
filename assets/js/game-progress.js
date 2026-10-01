// Jeux du jour (quiz, devine le gisement) : historique, séries de jours consécutifs et badges.
// Tout est gardé sur l'appareil du visiteur (aucun compte) ; sans mémoire disponible, les jeux restent jouables.
const KEY = "jm-jeux";
const DAY = 86400000;

export const parisDay = (offset = 0) => new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(new Date(Date.now() + offset * DAY));
const shift = (date, days) => new Date(Date.parse(`${date}T12:00:00Z`) + days * DAY).toISOString().slice(0, 10);
const isFrench = code => /^(2[AB]|\d{2,3})$/i.test(String(code ?? ""));

function read() {
  let state;
  try { state = JSON.parse(localStorage.getItem(KEY) || "null"); } catch { state = null; }
  state = { quiz: {}, geo: {}, earned: {}, ...state };
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
  const quizDays = Object.keys(state.quiz), geoDays = Object.keys(state.geo);
  const quiz = Object.values(state.quiz), geo = Object.values(state.geo);
  const bothDays = quizDays.filter(day => state.geo[day]);
  const rounds = geo.flatMap(game => game.rounds || []);
  return {
    quiz: {
      streak: currentStreak(quizDays), longest: longestStreak(quizDays),
      correct: quiz.filter(game => game.correct).length,
      noHint: quiz.filter(game => game.correct && game.hints === 0).length,
      families: new Set(quiz.filter(game => game.correct && game.family).map(game => game.family)).size
    },
    geo: {
      streak: currentStreak(geoDays), longest: longestStreak(geoDays), games: geo.length,
      best: Math.max(0, ...geo.map(game => game.score || 0)),
      closest: Math.min(Infinity, ...rounds.map(round => round.km)),
      departments: new Set(rounds.map(round => round.department).filter(isFrench)).size
    },
    both: { days: bothDays.length, streak: currentStreak(bothDays) }
  };
}

const SERIES = [[3, "Régulier"], [7, "Assidu"], [30, "Passionné"], [100, "Légende"]];
const series = game => SERIES.map(([days, name]) => ({ id: `${game}-serie-${days}`, game, icon: "🔥", name, rule: `${days} jours d’affilée`, test: stats => stats[game].longest >= days }));
export const BADGES = [
  ...series("quiz"),
  { id: "quiz-premier-pas", game: "quiz", icon: "🎓", name: "Premier pas", rule: "Première bonne réponse", test: stats => stats.quiz.correct >= 1 },
  { id: "quiz-sans-filet", game: "quiz", icon: "🧠", name: "Sans filet", rule: "10 bonnes réponses sans indice", test: stats => stats.quiz.noHint >= 10 },
  { id: "quiz-encyclopediste", game: "quiz", icon: "📚", name: "Encyclopédiste", rule: "50 bonnes réponses au total", test: stats => stats.quiz.correct >= 50 },
  { id: "quiz-familles", game: "quiz", icon: "💎", name: "Expert des familles", rule: "Bonne réponse dans 8 familles chimiques", test: stats => stats.quiz.families >= 8 },
  ...series("geo"),
  { id: "geo-boussole", game: "geo", icon: "🧭", name: "Boussole", rule: "Première partie terminée", test: stats => stats.geo.games >= 1 },
  { id: "geo-oeil-de-lynx", game: "geo", icon: "🎯", name: "Œil de lynx", rule: "Une manche à moins de 5 km", test: stats => stats.geo.closest < 5 },
  { id: "geo-cartographe", game: "geo", icon: "🗺️", name: "Cartographe", rule: "Une partie à 4 500 points ou plus", test: stats => stats.geo.best >= 4500 },
  { id: "geo-tour-de-france", game: "geo", icon: "🏔️", name: "Tour de France", rule: "Pièces de 10 départements différents", test: stats => stats.geo.departments >= 10 },
  { id: "both-prospecteur", game: "both", icon: "⚒️", name: "Prospecteur complet", rule: "Les deux jeux le même jour, 7 fois", test: stats => stats.both.days >= 7 },
  { id: "both-conservateur", game: "both", icon: "👑", name: "Conservateur", rule: "Tous les autres badges", test: (stats, earned) => BADGES.every(badge => badge.id === "both-conservateur" || earned[badge.id]) }
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

// Enregistre la partie du jour d'un jeu (« quiz » ou « geo »), puis annonce les nouveaux badges.
export function recordGame(game, result) {
  const state = read();
  state[game][parisDay()] = result;
  const fresh = award(state);
  write(state);
  fresh.forEach((badge, index) => setTimeout(() => toast(badge), index * 2600));
  document.dispatchEvent(new CustomEvent("jm-progress"));
  return fresh;
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
// summary (facultatif) reçoit le décompte « n / 18 », affiché même quand la liste est repliée.
const GROUPS = [["quiz", "Quiz du jour"], ["geo", "Devine le gisement"], ["both", "Les deux jeux"]];
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
