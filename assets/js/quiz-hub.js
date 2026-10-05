// Liste des quiz : chacun dans son cadre rétractable, monté à la première ouverture (page « Jeux & quiz » et accueil).
const QUIZZES = [
  { id: "mineral", title: "Quel minéral es-tu ?", load: () => import("./quiz-mineral.js").then(module => (box, ctx) => module.mountQuiz(box, ctx)) },
  { id: "prospecteur", title: "Quel prospecteur es-tu ?", load: () => import("./quiz-prospecteur.js").then(module => (box, ctx) => module.mountProspecteur(box, ctx)) },
  { id: "outil", title: "Quel outil de prospecteur es-tu ?", load: () => import("./quiz-outil.js").then(module => (box, ctx) => module.mountOutil(box, ctx)) },
  { id: "vrai-faux", title: "Vrai ou faux minéralogique", load: () => import("./quiz-vrai-faux.js").then(module => (box, ctx) => module.mountVraiFaux(box, ctx)) },
  { id: "glossaire", title: "Le glossaire en défi", load: () => import("./quiz-glossaire.js").then(module => (box, ctx) => module.mountGlossaire(box, ctx)) }
];

export function mountQuizzes(root, ctx) {
  root.replaceChildren(...QUIZZES.map(quiz => {
    const node = document.createElement("details"); node.className = "home-game home-game-fold"; node.id = `quiz-${quiz.id}`;
    const summary = document.createElement("summary"); summary.className = "home-game-summary";
    const title = document.createElement("span"); title.className = "home-game-title"; title.textContent = quiz.title;
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
