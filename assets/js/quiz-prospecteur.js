// Quiz « Quel prospecteur es-tu ? » : 10 questions, 8 profils.
import { QUIZ_PROSPECTEUR } from "./quiz-prospecteur-data.js";
import { mountPersonaQuiz } from "./quiz-persona.js";

const data = { ...QUIZ_PROSPECTEUR, results: QUIZ_PROSPECTEUR.profiles };

export function mountProspecteur(container) {
  mountPersonaQuiz(container, {
    kind: "prospecteur", data,
    lead: "Dix questions, huit profils possibles : quel prospecteur es-tu sur le terrain ?",
    kicker: "Ton profil de prospecteur est…",
    shareTitle: "Quel prospecteur es-tu ?", shareFooter: "Et toi, quel prospecteur es-tu ?",
    shareText: item => `Je suis ${item.name} ! Et toi, quel prospecteur es-tu ?`
  });
}
