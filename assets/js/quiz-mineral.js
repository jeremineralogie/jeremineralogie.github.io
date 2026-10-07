// Quiz « Quel minéral es-tu ? » : 10 questions, 24 minéraux possibles.
import { QUIZ } from "./quiz-data.js";
import { ficheUrl } from "./entity-links.js";
import { commonsPhoto, creditLine, loadMineralPhotos } from "./mineral-photos.js";
import { mountPersonaQuiz, personaResult } from "./quiz-persona.js";

const data = { ...QUIZ, results: QUIZ.minerals };
const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text != null) node.textContent = text; return node; };

export const quizResult = answers => personaResult(data, answers);

export function mountQuiz(container) {
  const credits = loadMineralPhotos();
  mountPersonaQuiz(container, {
    kind: "mineral", data,
    lead: "Dix questions, vingt-quatre minéraux possibles : lequel te ressemble le plus ?",
    kicker: "Ton minéral est…",
    shareTitle: "Quel minéral es-tu ?", shareFooter: "Et toi, quel minéral es-tu ?",
    shareText: item => `Je suis ${item.name} ! Et toi, quel minéral es-tu ?`,
    extras: async item => {
      const photo = commonsPhoto(await credits, item.slug);
      const before = [];
      if (photo) {
        const image = el("img", "mq-photo"); image.src = photo.src; image.alt = `${item.name} — photo d’un échantillon`; image.loading = "lazy";
        before.push(image, creditLine(photo));
      }
      const link = el("a", "link mq-fiche", `Voir la fiche : ${item.name} →`); link.href = ficheUrl("mineral", item.slug); link.dataset.fiche = "";
      const url = photo ? new URL(photo.src, location.origin).href : null;
      return { before, after: [link], logo: url, logoWidth: 760, logoFrame: true, photos: [] };
    }
  });
}
