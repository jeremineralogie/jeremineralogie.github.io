// Moteur des quiz de personnalité (« Quel minéral es-tu ? », « Quel prospecteur es-tu ? ») :
// 10 questions, réponses chiffrées sur plusieurs axes, profil le plus proche (corrigé d'un biais d'équilibrage), un seul passage par joueur.
import { getPersona, recordPersona } from "./game-progress.js";
import { sharePanel, dateFr } from "./share.js";
import { track } from "./track.js";

const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text != null) node.textContent = text; return node; };

// Calcul : somme des réponses, centrage/réduction par axe, puis profil le plus proche.
export function personaResult(data, answers) {
  const sum = data.axes.map(() => 0);
  answers.forEach((choice, index) => data.questions[index].answers[choice].v.forEach((value, axis) => { sum[axis] += value; }));
  const x = sum.map((value, axis) => Math.max(-1, Math.min(1, (value - data.mu[axis]) / (data.sd[axis] * 1.35))));
  let best = 0, bestScore = Infinity;
  data.results.forEach((item, index) => {
    const score = Math.sqrt(item.profile.reduce((total, value, axis) => total + (value - x[axis]) ** 2, 0)) - item.bias;
    if (score < bestScore) { bestScore = score; best = index; }
  });
  return data.results[best];
}

// options : kind (clé d'enregistrement), data (questions + results), lead, kicker, shareTitle, shareFooter, shareText(result), extras(result) → nœuds ajoutés au résultat
export function mountPersonaQuiz(container, { kind, data, lead, kicker, shareTitle, shareFooter, shareText, extras }) {
  container.replaceChildren();
  const box = el("div", "mq");
  container.append(box);
  let step = 0; const answers = [];

  const intro = () => {
    box.replaceChildren(el("p", "mq-lead", lead), Object.assign(el("button", "pick-choice mq-start", "Commencer le quiz"), { type: "button", onclick: () => { step = 0; answers.length = 0; track("start", `persona-${kind}`); question(); } }));
  };

  const question = () => {
    box.replaceChildren();
    const item = data.questions[step];
    const bar = el("div", "mq-bar"); const fill = el("span"); fill.style.width = `${(step / data.questions.length) * 100}%`; bar.append(fill);
    box.append(el("p", "mq-count", `Question ${step + 1} sur ${data.questions.length}`), bar, el("h3", "mq-question", item.q));
    const list = el("div", "mq-answers");
    item.answers.forEach((answer, index) => {
      const button = el("button", "pick-choice mq-answer", answer.label); button.type = "button";
      button.addEventListener("click", () => { answers[step] = index; step += 1; if (step < data.questions.length) question(); else void result(); });
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
    const item = saved || personaResult(data, answers);
    if (!saved) { recordPersona(kind, item.slug); track("end", `persona-${kind}`, item.slug); }
    box.replaceChildren();
    const card = el("div", "mq-result");
    card.append(el("p", "mq-kicker", kicker), el("h3", "mq-name", item.name), el("p", "mq-tagline", item.tagline));
    const more = await extras?.(item);
    if (more) card.append(...more.before || []);
    card.append(el("p", "mq-text", item.text));
    if (more) card.append(...more.after || []);
    card.append(sharePanel({
      spec: { title: shareTitle, date: dateFr(new Date().toISOString().slice(0, 10)), big: item.name, bigSub: item.tagline, photos: more?.photos || [], footer: shareFooter },
      text: shareText(item),
      fileName: `${kind}-${item.slug}.png`, remember: `persona-${kind}`, rememberOnce: true
    }));
    card.append(el("p", "mq-once", "Le test ne se passe qu’une fois : ce résultat est le tien."));
    box.append(card);
  };

  // Test déjà passé : on affiche directement le résultat du joueur (conservé avec sa progression et son compte).
  const done = getPersona(kind);
  const known = done && data.results.find(item => item.slug === done.slug);
  if (known) void result(known); else intro();
}
