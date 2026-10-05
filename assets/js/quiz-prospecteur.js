// Quiz « Quel prospecteur es-tu ? » : 10 questions, 8 profils.
import { QUIZ_PROSPECTEUR } from "./quiz-prospecteur-data.js";
import { mountPersonaQuiz } from "./quiz-persona.js";

const data = { ...QUIZ_PROSPECTEUR, results: QUIZ_PROSPECTEUR.profiles };
const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text != null) node.textContent = text; return node; };

export function mountProspecteur(container) {
  mountPersonaQuiz(container, {
    kind: "prospecteur", data,
    lead: "Dix questions, huit profils possibles : quel prospecteur es-tu sur le terrain ?",
    kicker: "Ton profil de prospecteur est…",
    shareTitle: "Quel prospecteur es-tu ?", shareFooter: "Et toi, quel prospecteur es-tu ?",
    shareText: item => `Je suis ${item.name} ! Et toi, quel prospecteur es-tu ?`,
    // Médaillon illustré de chaque profil (assets/prospecteurs/<slug>.webp), repris sur l'image de partage.
    extras: async item => {
      const src = `/assets/prospecteurs/${item.slug}.webp`;
      const icon = el("img", "mq-icon"); icon.src = src; icon.alt = item.name; icon.width = 180; icon.height = 180;
      return { before: [icon], after: [], logo: src, logoWidth: 700, photos: [] };
    }
  });
}
