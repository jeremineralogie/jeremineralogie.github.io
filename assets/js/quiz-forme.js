// Quiz « Quelle forme cristalline es-tu ? » : 10 questions, 8 résultats (les sept systèmes cristallins et l'amorphe).
import { QUIZ_FORME } from "./quiz-forme-data.js";
import { ficheUrl } from "./entity-links.js";
import { glossLink } from "./glossary-links.js";
import { mountPersonaQuiz } from "./quiz-persona.js";

const data = { ...QUIZ_FORME, results: QUIZ_FORME.profiles };
const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text != null) node.textContent = text; return node; };

export function mountForme(container) {
  mountPersonaQuiz(container, {
    kind: "forme", data,
    lead: "Dix questions, huit résultats possibles : quelle forme cristalline te ressemble le plus ?",
    kicker: "Ta forme cristalline est…",
    shareTitle: "Quelle forme cristalline es-tu ?", shareFooter: "Et toi, quelle forme cristalline es-tu ?",
    shareText: item => `Je suis ${item.name.replace(/\(.*?\)/g, "").toLocaleLowerCase("fr")} ! Et toi, quelle forme cristalline es-tu ?`,
    extras: async item => {
      const src = `/assets/formes/${item.slug}.webp`;
      const icon = el("img", "mq-icon"); icon.src = src; icon.alt = item.name; icon.width = 180; icon.height = 180;
      icon.addEventListener("error", () => icon.remove());
      const [slug, name, why] = item.mineral;
      const note = el("p", "mq-mineral"); note.append(`Ton minéral : ${name}. ${why} `);
      const link = el("a", "link mq-fiche", `Voir la fiche : ${name} →`); link.href = ficheUrl("mineral", slug);
      const glossary = glossLink("systeme-cristallin", "Comprendre les systèmes cristallins →", "gloss mq-fiche");
      return { before: [icon], after: [note, link, glossary], logo: src, logoWidth: 700, photos: [] };
    }
  });
}
