// Quiz « Quel outil de prospecteur es-tu ? » : 10 questions, 8 outils.
import { QUIZ_OUTIL } from "./quiz-outil-data.js";
import { ficheUrl } from "./entity-links.js";
import { mountPersonaQuiz } from "./quiz-persona.js";

const data = { ...QUIZ_OUTIL, results: QUIZ_OUTIL.profiles };
const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text != null) node.textContent = text; return node; };

export function mountOutil(container) {
  mountPersonaQuiz(container, {
    kind: "outil", data,
    lead: "Dix questions, huit outils possibles : quel outil de prospecteur te ressemble le plus ?",
    kicker: "Ton outil de prospecteur est…",
    shareTitle: "Quel outil de prospecteur es-tu ?", shareFooter: "Et toi, quel outil de prospecteur es-tu ?",
    shareText: item => `Je suis ${item.name.toLocaleLowerCase("fr")} ! Et toi, quel outil de prospecteur es-tu ?`,
    extras: async item => {
      const src = `/assets/outils/${item.icon}.webp`;
      const icon = el("img", "mq-icon"); icon.src = src; icon.alt = item.name; icon.width = 180; icon.height = 180;
      const [slug, name, why] = item.mineral;
      const note = el("p", "mq-mineral"); note.append(`Ton minéral : ${name}. ${why} `);
      const link = el("a", "link mq-fiche", `Voir la fiche : ${name} →`); link.href = ficheUrl("mineral", slug); link.dataset.fiche = "";
      return { before: [icon], after: [note, link], logo: src, logoWidth: 700, photos: [] };
    }
  });
}
