// Liste des quiz et des jeux à rejouer : chacun dans son cadre rétractable, monté à la première ouverture (page « Jeux & quiz » et accueil).
// kind « quiz » : quiz de personnalité, à passer une seule fois (onglet Quiz) ; kind « jeu » : jeux rejouables à volonté (onglet Jeux).
const QUIZZES = [
  { id: "mineral", kind: "quiz", title: "Quel minéral es-tu ?", load: () => import("./quiz-mineral.js").then(module => (box, ctx) => module.mountQuiz(box, ctx)) },
  { id: "prospecteur", kind: "quiz", title: "Quel prospecteur es-tu ?", load: () => import("./quiz-prospecteur.js").then(module => (box, ctx) => module.mountProspecteur(box, ctx)) },
  { id: "outil", kind: "quiz", title: "Quel outil de prospecteur es-tu ?", load: () => import("./quiz-outil.js").then(module => (box, ctx) => module.mountOutil(box, ctx)) },
  { id: "collectionneur", kind: "quiz", title: "Quel collectionneur es-tu ?", load: () => import("./quiz-collectionneur.js").then(module => (box, ctx) => module.mountCollectionneur(box, ctx)) },
  { id: "forme", kind: "quiz", title: "Quelle forme cristalline es-tu ?", load: () => import("./quiz-forme.js").then(module => (box, ctx) => module.mountForme(box, ctx)) },
  { id: "vrai-faux", kind: "jeu", level: "easy", title: "Vrai ou faux minéralogique", load: () => import("./quiz-vrai-faux.js").then(module => (box, ctx) => module.mountVraiFaux(box, ctx)) },
  { id: "classe-les", kind: "jeu", level: "medium", title: "Classe-les !", load: () => import("./classe-les.js").then(module => (box, ctx) => module.mountClasseLes(box, ctx)) },
  { id: "pendu", kind: "jeu", level: "medium", title: "Le pendu minéralogique", load: () => import("./pendu.js").then(module => (box, ctx) => module.mountPendu(box, ctx)) },
  { id: "plus-dur", kind: "jeu", level: "easy", title: "Plus dur ou moins dur ?", load: () => import("./plus-dur.js").then(module => (box, ctx) => module.mountPlusDur(box, ctx)) },
  { id: "glossaire", kind: "jeu", level: "hard", title: "Le glossaire en défi", load: () => import("./quiz-glossaire.js").then(module => (box, ctx) => module.mountGlossaire(box, ctx)) }
];

const LEVELS = [["easy", "Facile", "is-easy"], ["medium", "Intermédiaire", "is-medium"], ["hard", "Difficile", "is-hard"]];

// Jeux du jour et jeux à rejouer réunis par difficulté : tous les faciles ensemble, puis les intermédiaires, puis les difficiles.
export async function mountLevels(target, ctx) {
  const { mountGames } = await import("./games.js");
  const daily = document.createElement("div"), replay = document.createElement("div");
  void mountGames(daily, { ...ctx, collapsible: true });
  mountQuizzes(replay, ctx, "jeu");
  const games = [...daily.children, ...replay.children];
  target.replaceChildren(...LEVELS.map(([, label, levelClass]) => {
    const group = document.createElement("div"); group.className = "level-group";
    const title = document.createElement("h3"); title.className = "level-title"; title.append(Object.assign(document.createElement("span"), { className: `game-level ${levelClass}`, textContent: label }));
    group.append(title, ...games.filter(node => node.querySelector(`.game-level.${levelClass}`)));
    return group;
  }));
}

export function mountQuizzes(root, ctx, kind = "quiz") {
  root.replaceChildren(...QUIZZES.filter(quiz => quiz.kind === kind).map(quiz => {
    const node = document.createElement("details"); node.className = "home-game home-game-fold"; node.id = `quiz-${quiz.id}`;
    const summary = document.createElement("summary"); summary.className = "home-game-summary";
    const title = document.createElement("span"); title.className = "home-game-title";
    const name = document.createElement("span"); name.className = "game-name"; name.textContent = quiz.title; title.append(name);
    if (quiz.level) { const [, label, levelClass] = LEVELS.find(item => item[0] === quiz.level); const badge = document.createElement("span"); badge.className = `game-level ${levelClass}`; badge.textContent = label; title.append(badge); }
    summary.append(title);
    const body = document.createElement("div"); body.dataset.body = ""; body.className = "mq-host";
    node.append(summary, body);
    node.addEventListener("toggle", async () => {
      if (!node.open || node.dataset.ready) return;
      node.dataset.ready = "1";
      try { (await quiz.load())(body, ctx); } catch (error) { console.error(`Quiz ${quiz.id} :`, error); body.textContent = "Ce quiz n’est pas disponible pour le moment."; delete node.dataset.ready; }
    });
    return node;
  }));
}
