// Données du quiz « Quel prospecteur es-tu ? » (10 questions, 8 profils) : réponses chiffrées sur 5 axes (patience, aventure, méthode, force, partage).
export const QUIZ_PROSPECTEUR = {
 "axes": [
  "P",
  "A",
  "M",
  "F",
  "S"
 ],
 "mu": [
  4.2418,
  3.9966,
  4.9957,
  3.7476,
  2.484
 ],
 "sd": [
  2.5277,
  2.7333,
  2.3874,
  2.2236,
  2.5652
 ],
 "questions": [
  {
   "q": "Le week-end arrive. Quel est ton programme idéal ?",
   "answers": [
    {
     "label": "Une longue marche vers un coin que je ne connais pas",
     "v": [
      0,
      2,
      0,
      0,
      0
     ]
    },
    {
     "label": "Une rivière, un tamis et tout mon temps",
     "v": [
      2,
      0,
      0,
      0,
      0
     ]
    },
    {
     "label": "Une vieille carrière, un marteau et de l’énergie",
     "v": [
      0,
      1,
      0,
      2,
      0
     ]
    },
    {
     "label": "Trier et étiqueter mes dernières trouvailles",
     "v": [
      0,
      -1,
      2,
      0,
      0
     ]
    }
   ]
  },
  {
   "q": "Tu arrives sur un nouveau site. Ta première action ?",
   "answers": [
    {
     "label": "Je fais le tour pour comprendre la roche, je note, puis je me lance",
     "v": [
      1,
      1,
      1,
      0,
      0
     ]
    },
    {
     "label": "Je file droit vers les déblais",
     "v": [
      1,
      0,
      0,
      1,
      -1
     ]
    },
    {
     "label": "Je sors mon carnet et je note l’endroit",
     "v": [
      0,
      0,
      2,
      0,
      0
     ]
    },
    {
     "label": "Je tape sur le premier gros bloc",
     "v": [
      -1,
      0,
      0,
      2,
      0
     ]
    }
   ]
  },
  {
   "q": "Trois heures sans rien trouver. Tu fais quoi ?",
   "answers": [
    {
     "label": "Je continue : ça va venir",
     "v": [
      2,
      0,
      0,
      0,
      0
     ]
    },
    {
     "label": "Je change de coin",
     "v": [
      -1,
      2,
      0,
      0,
      0
     ]
    },
    {
     "label": "Je tape plus fort : la veine est forcément là",
     "v": [
      0,
      0,
      0,
      2,
      0
     ]
    },
    {
     "label": "J’en profite pour expliquer mes gestes à quelqu’un",
     "v": [
      0,
      0,
      0,
      0,
      2
     ]
    }
   ]
  },
  {
   "q": "Que mets-tu dans ton sac à dos ?",
   "answers": [
    {
     "label": "Presque rien : un marteau, une loupe, de l’eau",
     "v": [
      0,
      2,
      0,
      -1,
      0
     ]
    },
    {
     "label": "Burin, masse, casque, gants : tout le matériel",
     "v": [
      0,
      0,
      0,
      2,
      0
     ]
    },
    {
     "label": "Des boîtes, du papier bulle et des étiquettes",
     "v": [
      0,
      0,
      2,
      0,
      0
     ]
    },
    {
     "label": "Une pelle, un tamis, une batée",
     "v": [
      2,
      0,
      0,
      1,
      0
     ]
    }
   ]
  },
  {
   "q": "Tu trouves un cristal magnifique. Tu…",
   "answers": [
    {
     "label": "Le range dans ma collection, avec une fiche détaillée",
     "v": [
      0,
      0,
      2,
      0,
      0
     ]
    },
    {
     "label": "Le montre tout de suite à tout le monde",
     "v": [
      0,
      0,
      0,
      0,
      2
     ]
    },
    {
     "label": "Repars aussitôt chercher le suivant",
     "v": [
      -1,
      1,
      0,
      1,
      0
     ]
    },
    {
     "label": "Le nettoie doucement, pendant des heures",
     "v": [
      2,
      0,
      1,
      0,
      0
     ]
    }
   ]
  },
  {
   "q": "Avec qui préfères-tu aller sur le terrain ?",
   "answers": [
    {
     "label": "Seul(e), en silence",
     "v": [
      1,
      0,
      0,
      0,
      -2
     ]
    },
    {
     "label": "Avec un(e) ami(e), pas plus",
     "v": [
      1,
      0,
      1,
      0,
      1
     ]
    },
    {
     "label": "Avec un groupe, pour transmettre et apprendre",
     "v": [
      0,
      0,
      1,
      0,
      2
     ]
    },
    {
     "label": "Peu importe, tant que ça avance",
     "v": [
      0,
      1,
      0,
      1,
      0
     ]
    }
   ]
  },
  {
   "q": "Un ancien mineur te raconte où il trouvait ses plus beaux échantillons. Tu…",
   "answers": [
    {
     "label": "J’y vais dès demain",
     "v": [
      0,
      2,
      0,
      1,
      0
     ]
    },
    {
     "label": "Je note tout et je recoupe avec les cartes",
     "v": [
      1,
      0,
      2,
      0,
      0
     ]
    },
    {
     "label": "J’écoute des heures, et je retiens l’histoire",
     "v": [
      1,
      0,
      0,
      0,
      1
     ]
    },
    {
     "label": "Je file regarder les tas de déblais autour",
     "v": [
      1,
      1,
      0,
      0,
      -1
     ]
    }
   ]
  },
  {
   "q": "Il pleut depuis le matin. Ta réaction ?",
   "answers": [
    {
     "label": "Raison de plus pour y aller",
     "v": [
      0,
      2,
      0,
      1,
      0
     ]
    },
    {
     "label": "Je reste au sec et je trie mes pierres",
     "v": [
      1,
      -2,
      1,
      0,
      0
     ]
    },
    {
     "label": "J’attends que le niveau de l’eau redescende",
     "v": [
      2,
      0,
      0,
      0,
      0
     ]
    },
    {
     "label": "J’appelle des amis pour planifier la prochaine sortie",
     "v": [
      0,
      0,
      1,
      0,
      2
     ]
    }
   ]
  },
  {
   "q": "Ce que tu préfères dans ce loisir ?",
   "answers": [
    {
     "label": "Le moment où la roche s’ouvre",
     "v": [
      0,
      0,
      0,
      2,
      0
     ]
    },
    {
     "label": "La balade et les paysages",
     "v": [
      0,
      2,
      0,
      0,
      0
     ]
    },
    {
     "label": "Un classement bien tenu",
     "v": [
      0,
      0,
      2,
      0,
      0
     ]
    },
    {
     "label": "Voir briller les yeux de quelqu’un qui découvre",
     "v": [
      0,
      0,
      0,
      0,
      2
     ]
    }
   ]
  },
  {
   "q": "Quelle devise te ressemble le plus ?",
   "answers": [
    {
     "label": "Tout vient à qui sait attendre",
     "v": [
      2,
      0,
      0,
      0,
      0
     ]
    },
    {
     "label": "Il faut aller voir",
     "v": [
      0,
      2,
      0,
      0,
      0
     ]
    },
    {
     "label": "Une place pour chaque chose",
     "v": [
      0,
      0,
      2,
      0,
      0
     ]
    },
    {
     "label": "Ce qu’on partage vaut de l’or",
     "v": [
      0,
      0,
      0,
      0,
      2
     ]
    }
   ]
  }
 ],
 "profiles": [
  {
   "name": "Chasseur(euse) de filon",
   "slug": "chasseur-filon",
   "tagline": "Flair et obstination",
   "text": "Tu es un chasseur(euse) de filon ! Pour toi, une roche n’est jamais qu’une porte : derrière, il y a une veine, et tu comptes bien la suivre. Tu lis le terrain, tu repères les indices et tu ne lâches rien tant que le filon n’a pas livré ses secrets. Les belles surprises, tu les dois à ton flair et à ton obstination.",
   "profile": [
    0.3,
    0.6,
    0.2,
    0.7,
    -0.3
   ],
   "bias": 0.233
  },
  {
   "name": "Gratteur(euse) de rivière",
   "slug": "gratteur-riviere",
   "tagline": "Patience et eau claire",
   "text": "Tu es un gratteur(euse) de rivière ! Les pieds dans l’eau, le tamis à la main, tu sais que les plus beaux trésors se méritent. Patient(e) dans le geste, tu laisses le courant faire le tri et tu gardes les yeux grands ouverts. Un éclat au fond de la batée, et toute l’attente est récompensée.",
   "profile": [
    0.9,
    0,
    0.1,
    0.2,
    -0.2
   ],
   "bias": 0.024
  },
  {
   "name": "Collectionneur(euse) méthodique",
   "slug": "collectionneur-methodique",
   "tagline": "Chaque pièce à sa place",
   "text": "Tu es un collectionneur(euse) méthodique ! Chaque pièce a sa place, son étiquette, son histoire et son lieu d’origine. Tu aimes comprendre avant d’accumuler, et ta collection est autant un savoir qu’un plaisir des yeux. Quand tu ouvres un tiroir, tu sais exactement ce que tu y trouveras.",
   "profile": [
    0.4,
    -0.6,
    0.9,
    -0.6,
    0.2
   ],
   "bias": -0.15
  },
  {
   "name": "Marcheur(euse) curieux(se)",
   "slug": "marcheur-curieux",
   "tagline": "Toujours un sentier de plus",
   "text": "Tu es un marcheur(euse) curieux(se) ! Le minéral est parfois un prétexte : ce que tu aimes, c’est le chemin, le paysage et l’envie de voir ce qu’il y a derrière la prochaine colline. Tu ramènes autant de souvenirs que de cailloux, et ton œil s’arrête sur chaque affleurement. Tu découvres des coins que personne n’avait pensé à regarder.",
   "profile": [
    0,
    0.9,
    -0.4,
    -0.1,
    0.3
   ],
   "bias": -0.1
  },
  {
   "name": "Casseur(euse) de cailloux",
   "slug": "casseur-cailloux",
   "tagline": "L’énergie avant tout",
   "text": "Tu es un casseur(euse) de cailloux ! Le marteau te démange, et rien ne vaut le moment où la roche s’ouvre en deux sur une surprise. Tu avances avec énergie : tu tapes, tu regardes, tu recommences. Ton enthousiasme est contagieux, et la poussière ne te fait pas peur.",
   "profile": [
    -0.4,
    0.2,
    -0.5,
    0.9,
    0
   ],
   "bias": -0.148
  },
  {
   "name": "Fouine des carrières",
   "slug": "fouine-carrieres",
   "tagline": "Le flair des déblais",
   "text": "Tu es une fouine des carrières ! Discret(ète) et malin(e), tu sais que les meilleures trouvailles se cachent dans les déblais, là où les autres ne regardent pas. Tu observes, tu fouilles, tu repars avec la pièce que tout le monde avait oubliée. Ton flair est ton meilleur outil, et tu gardes volontiers tes bons coins pour toi.",
   "profile": [
    0.5,
    0.3,
    -0.3,
    0.3,
    -0.5
   ],
   "bias": 0.012
  },
  {
   "name": "Passeur(euse) de savoir",
   "slug": "passeur-savoir",
   "tagline": "Ce qu’on partage vaut de l’or",
   "text": "Tu es un passeur(euse) de savoir ! Ce que tu as appris sur le terrain, tu aimes le transmettre : expliquer un nom, montrer un geste, raconter un lieu. Pour toi, une trouvaille prend toute sa valeur quand elle est partagée. Autour de toi, on apprend sans s’en rendre compte, et l’on a envie de s’y mettre.",
   "profile": [
    0.2,
    -0.1,
    0.4,
    -0.5,
    0.95
   ],
   "bias": -0.143
  },
  {
   "name": "Vrai(e) prospecteur(trice)",
   "slug": "vrai-prospecteur",
   "tagline": "L’équilibre rare",
   "text": "Tu es un(e) vrai(e) prospecteur(trice) ! Tu as un peu de tout : la patience pour attendre, l’énergie pour creuser, la curiosité pour explorer et la rigueur pour noter. Peu importe le terrain, tu sais t’adapter et tu rentres rarement les mains vides. C’est un équilibre rare, et c’est exactement ce qui fait un bon prospecteur.",
   "profile": [
    0.5,
    0.5,
    0.5,
    0.5,
    0.1
   ],
   "bias": 0.273
  }
 ]
};
