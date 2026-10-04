// Quiz « Quel minéral es-tu ? » : 10 questions, 24 minéraux possibles, résultat calculé sur 5 axes.
import { QUIZ } from "./quiz-data.js";
import { ficheUrl } from "./entity-links.js";
import { sharePanel, dateFr } from "./share.js";
import { getPersona, recordPersona } from "./game-progress.js";
import { commonsPhoto, creditLine, loadMineralPhotos } from "./mineral-photos.js";

const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text != null) node.textContent = text; return node; };

// Calcul : somme des réponses, centrage/réduction par axe, puis profil le plus proche (corrigé du biais d'équilibrage).
export function quizResult(answers) {
  const sum = QUIZ.axes.map(() => 0);
  answers.forEach((choice, index) => QUIZ.questions[index].answers[choice].v.forEach((value, axis) => { sum[axis] += value; }));
  const x = sum.map((value, axis) => Math.max(-1, Math.min(1, (value - QUIZ.mu[axis]) / (QUIZ.sd[axis] * 1.35))));
  let best = 0, bestScore = Infinity;
  QUIZ.minerals.forEach((mineral, index) => {
    const score = Math.sqrt(mineral.profile.reduce((total, value, axis) => total + (value - x[axis]) ** 2, 0)) - mineral.bias;
    if (score < bestScore) { bestScore = score; best = index; }
  });
  return QUIZ.minerals[best];
}

export function mountQuiz(container) {
  container.replaceChildren();
  const box = el("div", "mq");
  container.append(box);
  const credits = loadMineralPhotos();
  let step = 0; const answers = [];

  const intro = () => {
    box.replaceChildren();
    box.append(
      el("p", "mq-lead", "Dix questions, vingt-quatre minéraux possibles : lequel te ressemble le plus ?"),
      Object.assign(el("button", "pick-choice mq-start", "Commencer le quiz"), { type: "button", onclick: () => { step = 0; answers.length = 0; question(); } })
    );
  };

  const question = () => {
    box.replaceChildren();
    const item = QUIZ.questions[step];
    const bar = el("div", "mq-bar"); const fill = el("span"); fill.style.width = `${(step / QUIZ.questions.length) * 100}%`; bar.append(fill);
    box.append(el("p", "mq-count", `Question ${step + 1} sur ${QUIZ.questions.length}`), bar, el("h3", "mq-question", item.q));
    const list = el("div", "mq-answers");
    item.answers.forEach((answer, index) => {
      const button = el("button", "pick-choice mq-answer", answer.label); button.type = "button";
      button.addEventListener("click", () => { answers[step] = index; step += 1; if (step < QUIZ.questions.length) question(); else void result(); });
      list.append(button);
    });
    box.append(list);
    if (step > 0) {
      const back = el("button", "mq-back", "← Question précédente"); back.type = "button";
      back.addEventListener("click", () => { step -= 1; question(); });
      box.append(back);
    }
  };

  const result = async (saved = null) => {
    const mineral = saved || quizResult(answers);
    if (!saved) recordPersona(mineral.slug);
    box.replaceChildren();
    const photo = commonsPhoto(await credits, mineral.slug);
    const card = el("div", "mq-result");
    card.append(el("p", "mq-kicker", "Ton minéral est…"), el("h3", "mq-name", mineral.name), el("p", "mq-tagline", mineral.tagline));
    if (photo) {
      const image = el("img", "mq-photo"); image.src = photo.src; image.alt = `${mineral.name} — photo d’un échantillon`; image.loading = "lazy";
      card.append(image, creditLine(photo));
    }
    card.append(el("p", "mq-text", mineral.text));
    const link = el("a", "link mq-fiche", `Voir la fiche : ${mineral.name} →`); link.href = ficheUrl("mineral", mineral.slug);
    card.append(link);
    card.append(sharePanel({
      spec: { title: "Quel minéral es-tu ?", date: dateFr(new Date().toISOString().slice(0, 10)), big: mineral.name, bigSub: mineral.tagline, photos: photo ? [new URL(photo.src, location.origin).href] : [], footer: "Et toi, quel minéral es-tu ?" },
      text: `Je suis ${mineral.name} ! Et toi, quel minéral es-tu ?`,
      fileName: `mineral-${mineral.slug}.png`
    }));
    card.append(el("p", "mq-once", "Le test ne se passe qu’une fois : ce minéral est le tien."));
    box.append(card);
  };

  // Test déjà passé : on affiche directement le minéral du joueur (conservé avec sa progression et son compte).
  const done = getPersona();
  const known = done && QUIZ.minerals.find(item => item.slug === done.slug);
  if (known) void result(known); else intro();
}
