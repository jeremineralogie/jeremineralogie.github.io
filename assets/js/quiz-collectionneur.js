// Quiz « Quel collectionneur es-tu ? » : 10 questions, 8 profils.
import { QUIZ_COLLECTIONNEUR } from "./quiz-collectionneur-data.js";
import { ficheUrl } from "./entity-links.js";
import { mountPersonaQuiz } from "./quiz-persona.js";

const data = { ...QUIZ_COLLECTIONNEUR, results: QUIZ_COLLECTIONNEUR.profiles };
const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text != null) node.textContent = text; return node; };

export function mountCollectionneur(container) {
  mountPersonaQuiz(container, {
    kind: "collectionneur", data,
    lead: "Dix questions, huit profils possibles : quel collectionneur de minéraux es-tu ?",
    kicker: "Ton profil de collectionneur est…",
    shareTitle: "Quel collectionneur es-tu ?", shareFooter: "Et toi, quel collectionneur es-tu ?",
    shareText: item => `Je suis ${item.name.replace(/\(.*?\)/g, "")} ! Et toi, quel collectionneur es-tu ?`,
    extras: async item => {
      // Médaillon illustré du profil (assets/collectionneurs/<slug>.webp) : s'il manque, la page de résultat s'affiche simplement sans lui.
      const src = `/assets/collectionneurs/${item.slug}.webp`;
      const icon = el("img", "mq-icon"); icon.src = src; icon.alt = item.name; icon.width = 180; icon.height = 180;
      icon.addEventListener("error", () => icon.remove());
      const [slug, name, why] = item.mineral;
      const note = el("p", "mq-mineral"); note.append(`Ton minéral : ${name}. ${why} `);
      const link = el("a", "link mq-fiche", `Voir la fiche : ${name} →`); link.href = ficheUrl("mineral", slug); link.dataset.fiche = "";
      return { before: [icon], after: [note, link], logo: src, logoWidth: 700, photos: [] };
    }
  });
}
