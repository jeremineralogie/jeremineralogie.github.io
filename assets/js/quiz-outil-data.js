// Données du quiz « Quel outil de prospecteur es-tu ? » (10 questions, 8 outils).
// Chaque réponse tire vers un outil (un axe par outil). Les valeurs mu, sd et bias sont calculées par tools/calibrer-quiz-outil.mjs
// (centrage des axes puis équilibrage pour que chaque outil sorte à peu près aussi souvent) : ne pas les modifier à la main.
const OUTILS = ["marteau", "burin", "loupe", "lampe", "tamis", "carnet", "sac", "boussole"];
const ask = (q, ...answers) => ({ q, answers: answers.map(([label, tool]) => ({ label, v: OUTILS.map(name => (name === tool ? 1 : 0)) })) });

export const QUIZ_OUTIL = {
 axes: OUTILS,
 mu: [1.4912, 0.5044, 1.757, 1.0072, 0.9982, 1.4947, 1.5001, 1.2473],
 sd: [1.0612, 0.6128, 1.1545, 0.8728, 0.8651, 1.0541, 1.005, 0.9659],
 questions: [
  ask("La veille d’une sortie, tu…", ["relis tes notes et les trouvailles du coin", "carnet"], ["prépares et testes ton matériel", "sac"], ["étudies la carte et l’itinéraire", "boussole"], ["affûtes ton marteau et ton burin", "marteau"]),
  ask("Dans les bois, le sentier disparaît avant la carrière. Tu…", ["prends un cap à la boussole", "boussole"], ["continues au flair en regardant les cailloux du chemin", "loupe"], ["reviens à la dernière intersection", "carnet"], ["avances à la lampe, il fait déjà sombre sous les arbres", "lampe"]),
  ask("Tu es sur les déblais de la carrière. Tu commences par…", ["regarder chaque bloc de près, à la loupe", "loupe"], ["casser les plus gros blocs pour voir l’intérieur", "marteau"], ["t’installer et fouiller longtemps les fines", "tamis"], ["faire le tour pour repérer d’où viennent les blocs", "boussole"]),
  ask("Un gros bloc a l’air prometteur. Tu…", ["le casses d’un grand coup", "marteau"], ["cherches la fissure en l’examinant sous tous les angles", "loupe"], ["le dégages tout autour au burin", "burin"], ["l’éclaires à la lampe UV pour voir s’il fluoresce", "lampe"]),
  ask("Tu repères une poche de cristaux dans la paroi. Tu…", ["la dégages au burin, millimètre par millimètre", "burin"], ["prends des photos et notes la position avant d’y toucher", "carnet"], ["attaques franchement pour aller vite", "marteau"], ["fouilles les éclats autour au tamis, au cas où", "tamis"]),
  ask("Trois heures sans rien trouver. Tu…", ["continues obstinément au même endroit", "tamis"], ["changes de coin en prenant un nouveau cap", "boussole"], ["tapes sur des blocs que tu n’as pas encore ouverts", "marteau"], ["repasses les déblais déjà vus, à la loupe", "loupe"]),
  ask("La lumière baisse. Tu…", ["sors la lampe UV et balaies les déblais", "lampe"], ["donnes encore quelques coups de marteau tant qu’il reste du jour", "marteau"], ["fais un dernier tamisage", "tamis"], ["commences à emballer proprement tes trouvailles", "sac"]),
  ask("Tu tiens un cristal fragile qui vient de se détacher. Tu…", ["l’emballes aussitôt dans du papier, dans une boîte", "sac"], ["l’observes à la loupe, sur place", "loupe"], ["le photographies et notes où tu l’as trouvé", "carnet"], ["le montres à ton voisin", "sac"]),
  ask("Un autre prospecteur arrive sur ton coin. Tu…", ["lui montres ta plus belle trouvaille à la loupe", "loupe"], ["lui indiques où tu as trouvé le mieux", "carnet"], ["lui prêtes un outil, il en manque", "sac"], ["lui proposes de partir explorer ensemble plus loin", "boussole"]),
  ask("De retour à la voiture, ton premier réflexe ?", ["noter le lieu et ce que tu as trouvé", "carnet"], ["trier, laver, ranger ce que tu rapportes", "sac"], ["regarder tes trouvailles à la loupe, avant de rentrer", "loupe"], ["sortir la lampe UV pour voir ce qui s’allume", "lampe"])
 ],
 profiles: [
  { name: "Le marteau de géologue", slug: "marteau", icon: "marteau", tagline: "Franc et efficace", bias: -0.0729, mineral: ["pyrite", "Pyrite", "Frappée avec de l’acier, elle fait des étincelles : comme toi, elle ne passe pas inaperçue."],
    text: "Tu es le marteau de géologue ! Tu n’aimes pas tourner autour du pot : un bloc, un bon coup, et on sait ce qu’il y a dedans. Sur le terrain, c’est toi qui fais avancer les choses, et c’est souvent après ton passage que les autres découvrent la belle surprise. Ton petit défaut : ta force va parfois plus vite que ta délicatesse, et un cristal fragile peut en faire les frais." },
  { name: "Le burin", slug: "burin", icon: "burin", tagline: "Délicat et précis", bias: 0.1169, mineral: ["pyromorphite", "Pyromorphite", "Ses prismes hexagonaux se dégagent avec patience : un travail de burin, pas de marteau."],
    text: "Tu es le burin ! Là où d’autres foncent, tu prends le temps : un éclat après l’autre, tu libères la pièce sans lui faire de mal. Tu sais que la plus belle trouvaille est parfois celle qu’on a eu la patience de dégager proprement. Ton petit défaut : pendant que tu peaufines ton cristal, la nuit tombe et les autres ont fini depuis longtemps." },
  { name: "La loupe", slug: "loupe", icon: "loupe", tagline: "L’œil qui ne rate rien", bias: 0.0119, mineral: ["wulfenite", "Wulfénite", "Ses fines tablettes carrées ne se révèlent que de près : un minéral à regarder à la loupe."],
    text: "Tu es la loupe ! Tu vois ce que les autres ratent : un reflet, une arête, un minuscule cristal caché dans une fissure. Pour toi, le vrai spectacle commence quand on se penche d’assez près. Les plus belles découvertes de ton groupe, c’est souvent toi qui les repères. Ton petit défaut : à force de regarder de près, tu oublies parfois de lever la tête, et le reste de la carrière t’attend." },
  { name: "La lampe UV", slug: "lampe-uv", icon: "lampe", tagline: "Révélateur d’émerveillement", bias: -0.0136, mineral: ["fluorite", "Fluorite", "C’est elle qui a donné son nom à la fluorescence : sous la lampe, elle s’illumine."],
    text: "Tu es la lampe UV ! Tu aimes la surprise : tu éclaires les pierres dans le noir et, d’un coup, des couleurs apparaissent là où il n’y avait rien. Tu transformes une sortie ordinaire en feu d’artifice, et tu donnes envie à tout le monde de regarder. Ton petit défaut : tu n’es jamais pressé de rentrer tant qu’il reste un recoin à éclairer." },
  { name: "Le tamis", slug: "tamis", icon: "tamis", tagline: "Patience et persévérance", bias: -0.0223, mineral: ["or", "Or", "La pépite qu’on trouve au fond du tamis, après avoir tout laissé passer sauf l’essentiel."],
    text: "Tu es le tamis ! Tu as compris que la chance se travaille : tu t’installes, tu passes et tu repasses, et tu laisses filer tout ce qui ne compte pas. Ta patience finit toujours par payer, et la petite pépite au fond, c’est pour toi. Ton petit défaut : tu es capable de rester au même endroit toute la journée alors que le bon coin était juste derrière." },
  { name: "Le carnet de terrain", slug: "carnet", icon: "carnet", tagline: "Mémoire et méthode", bias: -0.0719, mineral: ["calcite", "Calcite", "Minéral de référence de la dureté 3 : on s’en sert pour tout comparer, comme ton carnet."],
    text: "Tu es le carnet de terrain ! Rien ne t’échappe : où, quand, dans quelle roche, avec quels autres minéraux. Grâce à toi, une trouvaille ne reste pas un caillou perdu au fond d’un tiroir, elle garde son histoire. Les autres te demandent où c’était, et tu as toujours la réponse. Ton petit défaut : tu notes parfois si longtemps que tu en oublies de ramasser." },
  { name: "Le sac à dos", slug: "sac-a-dos", icon: "sac", tagline: "Prévoyant et généreux", bias: -0.0728, mineral: ["quartz", "Quartz", "Présent presque partout et toujours là quand il faut : le minéral généreux par excellence."],
    text: "Tu es le sac à dos ! Tu as toujours le bon papier pour emballer, la bonne boîte pour protéger, et un outil de rechange pour celui qui a oublié le sien. Sans toi, la moitié des trouvailles abîmées en route ne serait jamais rentrée entière. Tu es celui (celle) sur qui tout le groupe compte. Ton petit défaut : à force de tout prévoir, tu portes parfois bien plus que nécessaire." },
  { name: "La boussole", slug: "boussole", icon: "boussole", tagline: "L’appel de l’inconnu", bias: 0.1246, mineral: ["magnetite", "Magnétite", "Le plus magnétique des minéraux : de quoi faire tourner l’aiguille de ta boussole."],
    text: "Tu es la boussole ! Tu ne tiens pas en place : un chemin inconnu, un coin pas encore exploré, et tu as déjà pris ton cap. Tu sais que les meilleurs gisements se cachent rarement là où tout le monde regarde. Grâce à toi, le groupe découvre des endroits qu’il n’aurait jamais osé tenter. Ton petit défaut : tu changes de coin si souvent que tu passes parfois à côté de celui qui allait donner." }
 ]
};

// Chaque outil a pour profil son propre axe.
QUIZ_OUTIL.profiles.forEach((item, index) => { item.profile = OUTILS.map((_, axis) => (axis === index ? 1 : 0)); });
