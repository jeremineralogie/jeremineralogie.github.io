// Noms lisibles des résultats des quiz « Quel … es-tu ? » (chargés à la demande depuis les données des quiz).
export const resultNames = new Map();

export async function loadResultNames() {
  if (resultNames.size) return;
  try {
    const [{ QUIZ }, { QUIZ_PROSPECTEUR }, { QUIZ_OUTIL }, { QUIZ_COLLECTIONNEUR }, { QUIZ_FORME }] = await Promise.all([import("./quiz-data.js"), import("./quiz-prospecteur-data.js"), import("./quiz-outil-data.js"), import("./quiz-collectionneur-data.js"), import("./quiz-forme-data.js")]);
    QUIZ.minerals.forEach(item => resultNames.set(`persona-mineral:${item.slug}`, item.name));
    QUIZ_PROSPECTEUR.profiles.forEach(item => resultNames.set(`persona-prospecteur:${item.slug}`, item.name));
    QUIZ_OUTIL.profiles.forEach(item => resultNames.set(`persona-outil:${item.slug}`, item.name));
    QUIZ_COLLECTIONNEUR.profiles.forEach(item => resultNames.set(`persona-collectionneur:${item.slug}`, item.name));
    QUIZ_FORME.profiles.forEach(item => resultNames.set(`persona-forme:${item.slug}`, item.name));
  } catch (error) { console.error("Noms des résultats de quiz :", error); }
}
