// Onglet « Carnet de terrain » de la page Jeux & quiz : série de connexion, résultats partageables à tout moment, badges.
import { getProgress } from "./game-progress.js";
import { BADGES, CATEGORIES, statsOf, parisDay } from "./badges.js";
import { sharePanel, dateFr } from "./share.js";
import { currentUser, onAccountChange } from "./account.js";

const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text != null) node.textContent = text; return node; };
const plural = (count, one, many) => `${count} ${count > 1 ? many : one}`;
const GOALS = [7, 30, 90];
// Résultats du carnet : clé de la progression, nom, logo, lien pour jouer.
const RESULTS = [
  ["mineral", "Trouve le minéral", "💎", "/jeux.html#jeux"], ["quiz", "Le quiz du jour", "🧪", "/jeux.html#jeux"], ["geo", "Devine le gisement", "🗺️", "/jeux.html#jeux"],
  ["persona-mineral", "Quel minéral es-tu ?", "🪨", "/jeux.html#quiz"], ["persona-prospecteur", "Quel prospecteur es-tu ?", "⛏️", "/jeux.html#quiz"], ["persona-outil", "Quel outil de prospecteur es-tu ?", "🔨", "/jeux.html#quiz"],
  ["vrai-faux", "Vrai ou faux minéralogique", "✅", "/jeux.html#jeux"], ["glossaire", "Le glossaire en défi", "📖", "/jeux.html#jeux"]
];

function connectionCard(state, stats) {
  const card = el("section", "carnet-card");
  card.append(el("h3", "carnet-title", "Série de connexion"));
  const streak = stats.connect.streak;
  const goal = GOALS.find(value => value > streak) || GOALS[GOALS.length - 1];
  const logged = Boolean(currentUser());
  card.append(el("p", "carnet-big", `🔥 ${plural(streak, "jour d’affilée", "jours d’affilée")}`));
  const bar = el("div", "carnet-bar"); bar.setAttribute("role", "progressbar"); bar.setAttribute("aria-valuemin", "0"); bar.setAttribute("aria-valuemax", String(goal)); bar.setAttribute("aria-valuenow", String(Math.min(streak, goal))); bar.setAttribute("aria-label", "Progression vers le prochain badge de connexion");
  const fill = el("span"); fill.style.width = `${Math.min(100, (streak / goal) * 100)}%`; bar.append(fill);
  const scale = el("div", "carnet-scale"); scale.append(el("span", "", "0"), el("span", "", `${goal} jours`));
  card.append(bar, scale);
  if (!logged) card.append(el("p", "carnet-note", "Connecte-toi pour suivre ta série : crée un compte (gratuit, sans adresse e-mail) ou connecte-toi avec la pastille en haut à droite."));
  else {
    const left = Math.max(0, goal - streak);
    card.append(el("p", "carnet-note", streak >= GOALS[GOALS.length - 1] ? `Objectif de ${goal} jours atteint. Record : ${plural(stats.connect.longest, "jour", "jours")}.` : `Prochain badge de connexion : ${goal} jours (encore ${plural(left, "jour", "jours")}). Record : ${plural(stats.connect.longest, "jour", "jours")}.`));
  }
  return card;
}

function resultsCard(state) {
  const card = el("section", "carnet-card");
  card.append(el("h3", "carnet-title", "Mes résultats"), el("p", "carnet-note", "Le dernier résultat de chaque jeu et de chaque quiz, à partager quand tu veux. Chaque résultat est gardé 7 jours, puis supprimé."));
  const list = el("ul", "carnet-results");
  for (const [key, name, icon, link] of RESULTS) {
    const saved = state.cards?.[key];
    const item = el("li", "carnet-result");
    const head = el("div", "carnet-result-head"); head.append(el("span", "carnet-result-icon", icon), el("strong", "", name));
    item.append(head);
    if (!saved) { const play = el("a", "link", "Pas encore joué : jouer →"); play.href = link; item.append(play); list.append(item); continue; }
    const quiz = state.quizzes?.[key];
    const detail = [saved.spec?.big && `${saved.spec.big}${saved.spec.bigSub ? ` — ${saved.spec.bigSub}` : ""}`, saved.date && dateFr(saved.date), quiz && `${plural(quiz.plays, "partie", "parties")}${quiz.best ? ` · meilleur score ${quiz.best.score} / ${quiz.best.total}` : ""}`].filter(Boolean);
    item.append(el("p", "carnet-result-detail", detail.join(" · ")));
    const share = el("details", "carnet-share"); share.append(el("summary", "", "Partager ce résultat"));
    const body = el("div", "carnet-share-body"); share.append(body);
    share.addEventListener("toggle", () => { if (share.open && !body.childElementCount) body.append(sharePanel({ spec: saved.spec, text: saved.text, fileName: saved.fileName, shareKey: key })); });
    item.append(share); list.append(item);
  }
  card.append(list);
  return card;
}

function badgesCard(state, stats) {
  const card = el("section", "carnet-card");
  const total = BADGES.filter(badge => state.badges?.[badge.id]).length;
  card.append(el("h3", "carnet-title", "Mes badges"), el("p", "badge-count", `${plural(total, "badge", "badges")} sur ${BADGES.length}`));
  const today = parisDay();
  const groups = el("div", "badges");
  for (const [category, title] of CATEGORIES) {
    const group = el("div", "badge-group"); group.append(el("h4", "badge-group-title", title));
    const list = el("ul", "badge-list");
    BADGES.filter(badge => badge.category === category).forEach(badge => {
      const earned = state.badges?.[badge.id];
      const item = el("li", `badge${earned ? " is-earned" : ""}${earned === today ? " is-new" : ""}`);
      item.title = earned ? `${badge.name} — obtenu le ${dateFr(earned)}` : `${badge.name} — ${badge.rule}`;
      const progress = !earned && badge.progress ? badge.progress(stats) : null;
      item.append(el("span", "badge-icon", badge.icon), el("span", "badge-name", badge.name), el("span", "badge-rule", progress ? `${badge.rule} (${Math.min(progress[0], progress[1])} / ${progress[1]})` : badge.rule));
      if (earned === today) item.append(el("span", "badge-new", "Nouveau"));
      list.append(item);
    });
    group.append(list); groups.append(group);
  }
  card.append(groups);
  return card;
}

export function mountCarnet(container) {
  let connection, results, badges;
  const drawAll = () => {
    const state = getProgress(), stats = statsOf(state);
    connection = connectionCard(state, stats); results = resultsCard(state); badges = badgesCard(state, stats);
    container.replaceChildren(connection, results, badges);
  };
  // Un changement de progression (partage, connexion…) ne redessine que la série et les badges : un aperçu de partage ouvert reste en place.
  const drawLive = () => {
    if (!results?.isConnected) return drawAll();
    const state = getProgress(), stats = statsOf(state);
    const nextConnection = connectionCard(state, stats), nextBadges = badgesCard(state, stats);
    connection.replaceWith(nextConnection); badges.replaceWith(nextBadges); connection = nextConnection; badges = nextBadges;
  };
  drawAll();
  document.addEventListener("jm-progress", drawLive);
  onAccountChange(drawAll);
}
