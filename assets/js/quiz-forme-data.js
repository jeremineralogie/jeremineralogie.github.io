// Données du quiz « Quelle forme cristalline es-tu ? » (10 questions, 8 résultats : les sept systèmes cristallins et l'amorphe).
// Chaque réponse tire vers un résultat (un axe par résultat). Les valeurs mu, sd et bias sont calculées par tools/calibrer-quiz.mjs forme : ne pas les modifier à la main.
const FORMES = ["cubique", "quadratique", "hexagonal", "trigonal", "orthorhombique", "monoclinique", "triclinique", "amorphe"];
// Chaque réponse pèse entre 0,85 et 1,15 (valeur fixe, propre à la réponse) : les scores ne sont plus des entiers, donc les égalités sont rares
// et l'équilibrage des résultats (biais) fonctionne en continu.
const weight = (question, answer) => Number((0.85 + 0.3 * ((((question * 73856093) ^ (answer * 19349663) ^ 83492791) >>> 0) % 1000) / 1000).toFixed(3));
let counter = 0;
const ask = (q, ...answers) => { const question = counter++; return { q, answers: answers.map(([label, tool], answer) => ({ label, v: FORMES.map(name => (name === tool ? weight(question, answer) : 0)) })) }; };

export const QUIZ_FORME = {
 axes: FORMES,
 mu: [1.2582, 1.2316, 1.1984, 1.2734, 1.2625, 1.2613, 1.2119, 1.3085],
 sd: [0.9791, 0.9501, 0.9313, 0.9877, 0.9858, 0.9844, 0.9484, 1.0157],
 questions: [
  ask("Un dimanche sans programme. Tu…", ["ranges et mets de l’ordre dans tes affaires", "cubique"], ["invites des amis à déjeuner", "hexagonal"], ["restes sur le canapé, on verra plus tard", "monoclinique"], ["pars sur un coup de tête, destination inconnue", "triclinique"]),
  ask("Pour t’organiser au travail…", ["une liste de tâches que tu suis dans l’ordre", "quadratique"], ["chacun son rôle : tu répartis et tu avances", "orthorhombique"], ["tu improvises selon l’humeur du jour", "amorphe"], ["tu travailles par grands élans, quand l’inspiration arrive", "trigonal"]),
  ask("Un repas entre amis. Tu…", ["veux que tout le monde soit bien placé et heureux", "hexagonal"], ["animes la conversation", "trigonal"], ["t’occupes de la logistique pour que tout fonctionne", "orthorhombique"], ["proposes un menu que personne n’a jamais goûté", "triclinique"]),
  ask("Ta chambre, c’est…", ["tout est symétrique et rangé", "cubique"], ["un joyeux désordre, mais tu retrouves tout", "monoclinique"], ["un bureau bien droit et un coin lecture bien défini", "quadratique"], ["une disposition que tu changes tous les mois", "amorphe"]),
  ask("Un imprévu bouleverse ton planning. Tu…", ["remets tout en ordre dès que possible", "cubique"], ["t’adaptes, ça s’arrange toujours", "monoclinique"], ["adores ça, ça rend la journée intéressante", "amorphe"], ["réorganises et redistribues les tâches", "orthorhombique"]),
  ask("Pour un voyage…", ["un itinéraire précis, jour par jour", "quadratique"], ["aucun plan, on verra bien", "triclinique"], ["un voyage en groupe, tous ensemble", "hexagonal"], ["des endroits qui en jettent, avec de belles photos", "trigonal"]),
  ask("Dans une discussion tendue. Tu…", ["vas droit au but", "quadratique"], ["cherches un terrain d’entente", "hexagonal"], ["poses les faits, calmement", "orthorhombique"], ["proposes une solution inattendue", "triclinique"]),
  ask("Ce que tu préfères chez toi :", ["ta régularité", "cubique"], ["ta chaleur humaine", "hexagonal"], ["ton éclat", "trigonal"], ["ta liberté", "amorphe"]),
  ask("Pour offrir un cadeau, tu choisis…", ["un classique, bien emballé", "cubique"], ["quelque chose de brillant, qui se remarque", "trigonal"], ["un objet doux et confortable", "monoclinique"], ["un objet farfelu que personne d’autre n’aurait", "triclinique"]),
  ask("Ta devise :", ["« Droit devant »", "quadratique"], ["« Chacun sa place, et tout fonctionne »", "orthorhombique"], ["« Pas de stress, on s’adapte »", "monoclinique"], ["« Prends la vie comme elle vient »", "amorphe"])
 ],
 profiles: [
  { name: "Cubique", slug: "cubique", tagline: "Régulier et fiable", bias: -0.0009, mineral: ["fluorite", "Fluorite", "Elle cristallise en cubes d’une régularité remarquable."],
    text: "Tu es cubique ! Dans un cristal cubique, les trois axes sont égaux et perpendiculaires : c’est la forme la plus régulière qui soit, pareille dans toutes les directions. Comme elle, tu es fiable, ordonné(e), et on sait toujours à quoi s’attendre avec toi. Tu aimes que chaque chose ait sa place, et ton entourage compte sur ta régularité. Ton petit défaut : un imprévu qui dérange ton bel alignement peut te donner des sueurs froides." },
  { name: "Quadratique", slug: "quadratique", tagline: "Droit au but, dans la bonne direction", bias: 0.0018, mineral: ["wulfenite", "Wulfénite", "Ses fines tablettes carrées sont typiquement quadratiques."],
    text: "Tu es quadratique ! Un cristal quadratique a deux axes égaux et un troisième de longueur différente : une direction privilégiée, très nette. Comme lui, tu sais où tu vas : tu aimes les plans, les listes et les chemins droits, et tu te lances une fois la direction choisie. Tu es franc(he), carré(e) dans tes décisions, et tu tiens le cap. Ton petit défaut : quand le chemin se tord, tu as du mal à suivre la courbe." },
  { name: "Hexagonal(e)", slug: "hexagonal", tagline: "L’harmonie du groupe", bias: 0.0002, mineral: ["aigue-marine", "Aigue-marine", "Béryl bleu aux longs prismes hexagonaux, en parfaite cohésion."],
    text: "Tu es hexagonal(e) ! Les cristaux hexagonaux forment des prismes à six faces, et l’hexagone est la forme du nid d’abeille : une structure où chacun est lié à ses voisins. Comme eux, tu aimes l’harmonie, la cohésion du groupe et les repas où tout le monde se sent bien. Tu es celui (celle) qui rassemble, qui veille à ce que personne ne reste de côté. Ton petit défaut : tu te sacrifies parfois pour que le groupe reste soudé." },
  { name: "Trigonal(e)", slug: "trigonal", tagline: "Brillant et charismatique", bias: 0.0004, mineral: ["amethyste", "Améthyste", "Variété de quartz, trigonal : ses pointes brillantes ne passent pas inaperçues."],
    text: "Tu es trigonal(e) ! Le système trigonal, c’est celui du quartz et de la calcite : des cristaux brillants, souvent limpides, à la symétrie ternaire. Comme eux, tu as de l’éclat : tu captes l’attention sans forcer, et on se retourne sur ton passage. Tu travailles par élans, tu animes les conversations et tu aimes que les choses aient du panache. Ton petit défaut : tu aimes un peu trop être au centre de la vitrine." },
  { name: "Orthorhombique", slug: "orthorhombique", tagline: "Chacun sa place, tout fonctionne", bias: 0.0001, mineral: ["topaze", "Topaze", "Orthorhombique, dure, avec un clivage net : tout est à sa place."],
    text: "Tu es orthorhombique ! Dans ce système, les trois axes sont perpendiculaires mais de longueurs différentes : chaque direction a son rôle et ses proportions. Comme lui, tu es pragmatique : tu répartis, tu organises et tu fais en sorte que l’ensemble fonctionne. On te confie la logistique sans hésiter, car tu l’exécutes sans esbroufe. Ton petit défaut : tu ranges parfois les gens dans les mêmes cases que les tâches." },
  { name: "Monoclinique", slug: "monoclinique", tagline: "Décontracté, légèrement de travers", bias: -0.0013, mineral: ["malachite", "Malachite", "Monoclinique, aux bandes vertes souples et concentriques."],
    text: "Tu es monoclinique ! Dans ce système, un axe est penché par rapport aux deux autres : la structure garde de la rigueur, mais avec un léger air de travers. Comme lui, tu es détendu(e) et adaptable : un imprévu ne te fait pas peur, et tu retrouves toujours ton chemin dans un joyeux désordre. Tu es doux (douce), agréable à vivre et difficile à bousculer. Ton petit défaut : tu remets volontiers à demain ce qui peut attendre." },
  { name: "Triclinique", slug: "triclinique", tagline: "Original, sans aucun angle droit", bias: 0.001, mineral: ["turquoise", "Turquoise", "Triclinique, aux veines irrégulières : aucun angle droit."],
    text: "Tu es triclinique ! C’est le système le moins symétrique : aucun angle droit, des axes tous différents. Comme lui, tu es original(e) : tu ne rentres dans aucune case et tu en es fier (fière). Tu proposes ce que personne n’a pensé à proposer, et ta spontanéité surprend tout le monde. On ne s’ennuie jamais avec toi. Ton petit défaut : on a parfois du mal à prévoir où tu vas atterrir." },
  { name: "Amorphe", slug: "amorphe", tagline: "Libre, sans structure imposée", bias: -0.0014, mineral: ["lussatite", "Lussatite", "Opale fibreuse décrite à Lussat, en Auvergne : une silice qui n’entre dans aucune case."],
    text: "Tu es amorphe ! Un minéral amorphe n’a pas de structure ordonnée : pas de cristaux, pas d’arêtes, une matière libre qui épouse son environnement, comme le verre ou l’opale. Comme lui, tu prends la vie comme elle vient : tu improvises, tu changes d’avis et tu adores l’imprévu. Tu ne te laisses enfermer dans aucun cadre. Ton petit défaut : le plan, tu le fais rarement, et tes amis le savent bien." }
 ]
};

// Chaque résultat a pour direction son propre axe.
QUIZ_FORME.profiles.forEach((item, index) => { item.profile = FORMES.map((_, axis) => (axis === index ? 1 : 0)); });
