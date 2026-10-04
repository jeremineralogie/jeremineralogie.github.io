// « Quel minéral es-tu ? » : 10 questions, 24 minéraux. Chaque réponse décale cinq traits (posé↔fougueux, solitaire↔sociable, discret↔éclatant, concret↔rêveur, sensible↔solide) ;
// le résultat est le minéral dont le profil est le plus proche, avec un petit réglage par minéral pour que chacun sorte à peu près aussi souvent (vérifié sur 100 000 parcours au hasard).
export const QUIZ = {
 "axes": [
  "E",
  "S",
  "C",
  "R",
  "T"
 ],
 "mu": [
  0.7766,
  0.4932,
  2.2551,
  3.251,
  2.7222
 ],
 "sd": [
  3.3583,
  2.8056,
  2.3138,
  2.3708,
  2.4024
 ],
 "questions": [
  {
   "q": "Ton week-end idéal ?",
   "answers": [
    {
     "label": "Randonnée en montagne",
     "v": [
      1,
      0,
      0,
      0,
      1
     ]
    },
    {
     "label": "Balade au bord de la rivière",
     "v": [
      -1,
      0,
      0,
      1,
      0
     ]
    },
    {
     "label": "Soirée entre amis",
     "v": [
      0,
      2,
      1,
      0,
      0
     ]
    },
    {
     "label": "Lecture au calme",
     "v": [
      -1,
      -2,
      0,
      1,
      0
     ]
    }
   ]
  },
  {
   "q": "Ta qualité principale ?",
   "answers": [
    {
     "label": "Patient(e)",
     "v": [
      -2,
      0,
      0,
      0,
      1
     ]
    },
    {
     "label": "Créatif(ve)",
     "v": [
      0,
      0,
      1,
      2,
      0
     ]
    },
    {
     "label": "Fiable",
     "v": [
      0,
      0,
      0,
      -1,
      2
     ]
    },
    {
     "label": "Enthousiaste",
     "v": [
      2,
      1,
      0,
      0,
      0
     ]
    }
   ]
  },
  {
   "q": "Dans un groupe, tu es…",
   "answers": [
    {
     "label": "Le moteur",
     "v": [
      2,
      1,
      0,
      0,
      0
     ]
    },
    {
     "label": "Le sage",
     "v": [
      -1,
      0,
      0,
      1,
      1
     ]
    },
    {
     "label": "Le fêtard (la fêtarde)",
     "v": [
      0,
      2,
      2,
      0,
      0
     ]
    },
    {
     "label": "L’observateur(trice)",
     "v": [
      -1,
      -2,
      0,
      0,
      0
     ]
    }
   ]
  },
  {
   "q": "Ton style ?",
   "answers": [
    {
     "label": "Sobre",
     "v": [
      0,
      0,
      -2,
      0,
      0
     ]
    },
    {
     "label": "Coloré(e)",
     "v": [
      0,
      0,
      2,
      1,
      0
     ]
    },
    {
     "label": "Classique",
     "v": [
      0,
      0,
      0,
      -1,
      1
     ]
    },
    {
     "label": "Original(e)",
     "v": [
      0,
      -1,
      1,
      1,
      0
     ]
    }
   ]
  },
  {
   "q": "Face à un imprévu ?",
   "answers": [
    {
     "label": "Je m’adapte",
     "v": [
      0,
      0,
      0,
      1,
      1
     ]
    },
    {
     "label": "Je réfléchis",
     "v": [
      -1,
      0,
      0,
      -1,
      0
     ]
    },
    {
     "label": "Je fonce",
     "v": [
      2,
      0,
      0,
      0,
      1
     ]
    },
    {
     "label": "Je demande de l’aide",
     "v": [
      0,
      2,
      0,
      0,
      -1
     ]
    }
   ]
  },
  {
   "q": "Ton paysage préféré ?",
   "answers": [
    {
     "label": "Volcan",
     "v": [
      2,
      0,
      1,
      0,
      0
     ]
    },
    {
     "label": "Rivière",
     "v": [
      -1,
      0,
      0,
      1,
      0
     ]
    },
    {
     "label": "Forêt",
     "v": [
      0,
      -1,
      0,
      1,
      1
     ]
    },
    {
     "label": "Grotte",
     "v": [
      0,
      -2,
      -1,
      1,
      0
     ]
    }
   ]
  },
  {
   "q": "Ton rapport au temps ?",
   "answers": [
    {
     "label": "Prendre mon temps",
     "v": [
      -2,
      0,
      0,
      0,
      0
     ]
    },
    {
     "label": "Tout de suite",
     "v": [
      2,
      0,
      0,
      0,
      0
     ]
    },
    {
     "label": "Planifier",
     "v": [
      -1,
      0,
      0,
      -1,
      1
     ]
    },
    {
     "label": "Improviser",
     "v": [
      1,
      0,
      0,
      1,
      -1
     ]
    }
   ]
  },
  {
   "q": "Ton plus grand défaut ?",
   "answers": [
    {
     "label": "Têtu(e)",
     "v": [
      0,
      -1,
      0,
      0,
      2
     ]
    },
    {
     "label": "Rêveur(se)",
     "v": [
      0,
      0,
      0,
      2,
      -1
     ]
    },
    {
     "label": "Trop sensible",
     "v": [
      0,
      1,
      0,
      0,
      -2
     ]
    },
    {
     "label": "Impatient(e)",
     "v": [
      2,
      0,
      0,
      0,
      -1
     ]
    }
   ]
  },
  {
   "q": "Ce qu’on dit de toi ?",
   "answers": [
    {
     "label": "Toujours fiable",
     "v": [
      0,
      0,
      0,
      -1,
      2
     ]
    },
    {
     "label": "Toujours là où on ne t’attend pas",
     "v": [
      1,
      0,
      1,
      1,
      0
     ]
    },
    {
     "label": "Une vraie lumière",
     "v": [
      0,
      1,
      2,
      0,
      0
     ]
    },
    {
     "label": "Un mystère",
     "v": [
      0,
      -1,
      -1,
      2,
      0
     ]
    }
   ]
  },
  {
   "q": "Ta devise ?",
   "answers": [
    {
     "label": "« Tout vient à point »",
     "v": [
      -2,
      0,
      0,
      0,
      1
     ]
    },
    {
     "label": "« Sois toi-même »",
     "v": [
      0,
      0,
      1,
      1,
      1
     ]
    },
    {
     "label": "« Ensemble c’est mieux »",
     "v": [
      0,
      2,
      0,
      0,
      0
     ]
    },
    {
     "label": "« Toujours plus haut »",
     "v": [
      1,
      0,
      1,
      0,
      1
     ]
    }
   ]
  }
 ],
 "minerals": [
  {
   "name": "Fluorite",
   "slug": "fluorite",
   "tagline": "Coloré(e), polyvalent(e)",
   "text": "Tu es une fluorite ! Coloré(e), polyvalent(e), tu n’es jamais deux fois pareil(le). Tu mets de la couleur partout où tu passes, et tu te fais remarquer sans forcer. Attention : tu es plus fragile que tu en as l’air.",
   "profile": [
    0.4,
    0.5,
    0.9,
    0.4,
    -0.2
   ],
   "bias": 0.034
  },
  {
   "name": "Quartz",
   "slug": "quartz",
   "tagline": "Fiable, solide",
   "text": "Tu es un quartz. Fiable, solide, présent(e) partout : on sait toujours qu’on peut compter sur toi. Tu n’as rien à prouver, et pourtant tu es partout chez toi.",
   "profile": [
    0.0,
    0.3,
    -0.4,
    -0.6,
    0.8
   ],
   "bias": -0.147
  },
  {
   "name": "Pyrite",
   "slug": "pyrite",
   "tagline": "Brillant(e), charismatique",
   "text": "Tu es une pyrite. Brillant(e) et charismatique, tu fais tourner les têtes dès que tu entres. Parfois on te prend pour ce que tu n’es pas, mais ceux qui te connaissent savent combien tu vaux.",
   "profile": [
    0.5,
    0.5,
    0.8,
    -0.5,
    0.1
   ],
   "bias": 0.051
  },
  {
   "name": "Galène",
   "slug": "galene",
   "tagline": "Posé(e), discret(ète)",
   "text": "Tu es une galène. Posé(e) et discret(ète), tu n’as pas besoin de faire du bruit pour qu’on te remarque. Tu es solide, fiable, et tu as toujours un temps d’avance. Les autres brillent ; toi, tu comptes.",
   "profile": [
    -0.8,
    -0.8,
    -0.8,
    -0.5,
    0.8
   ],
   "bias": -0.264
  },
  {
   "name": "Améthyste",
   "slug": "amethyste",
   "tagline": "Rêveur(se), sensible",
   "text": "Tu es une améthyste. Rêveur(se) et sensible, tu vois ce que les autres ne voient pas. Il y a en toi un petit côté mystique, et la nuit est ton moment préféré.",
   "profile": [
    -0.4,
    -0.4,
    0.2,
    0.9,
    -0.5
   ],
   "bias": -0.045
  },
  {
   "name": "Calcite",
   "slug": "calcite",
   "tagline": "Adaptable, caméléon",
   "text": "Tu es une calcite. Adaptable, tu prends mille formes selon la situation, et tu t’en sors toujours. Un vrai caméléon : on ne s’ennuie jamais avec toi.",
   "profile": [
    0.1,
    0.2,
    0.0,
    0.2,
    0.2
   ],
   "bias": -0.059
  },
  {
   "name": "Gypse",
   "slug": "gypse",
   "tagline": "Tendre, sociable",
   "text": "Tu es un gypse. Tendre et sociable, tu mets tout le monde à l’aise. On se sent bien avec toi, mais ne te brusque pas trop : tu es plus sensible que tu ne le montres.",
   "profile": [
    -0.3,
    0.8,
    -0.2,
    0.1,
    -0.7
   ],
   "bias": -0.275
  },
  {
   "name": "Malachite",
   "slug": "malachite",
   "tagline": "Calme, équilibré(e)",
   "text": "Tu es une malachite. Calme et équilibré(e), tu ne fais rien au hasard. Les détails comptent pour toi, et c’est pour ça que ton travail est toujours beau.",
   "profile": [
    -0.6,
    -0.1,
    0.4,
    0.2,
    0.3
   ],
   "bias": 0.062
  },
  {
   "name": "Opale",
   "slug": "opale",
   "tagline": "Changeant(e), imprévisible",
   "text": "Tu es une opale. Changeant(e) et imprévisible, tu as mille reflets selon la lumière et l’humeur du jour. Personne ne sait vraiment à quoi s’attendre avec toi, et c’est ce qui fait ton charme.",
   "profile": [
    0.2,
    -0.1,
    0.6,
    0.8,
    -0.8
   ],
   "bias": 0.006
  },
  {
   "name": "Diamant",
   "slug": "diamant",
   "tagline": "Exigeant(e), parfait(e)",
   "text": "Tu es un diamant. Exigeant(e), tu vises la perfection, et tu l’atteins souvent. Attention à la pression : même le plus dur peut se briser sur un mauvais choc.",
   "profile": [
    0.3,
    -0.3,
    0.8,
    -0.7,
    -0.3
   ],
   "bias": 0.225
  },
  {
   "name": "Grenat",
   "slug": "grenat",
   "tagline": "Passionné(e), tenace",
   "text": "Tu es un grenat. Passionné(e) et tenace, tu ne lâches jamais rien. Tu as les pieds sur terre, mais un cœur qui bat fort.",
   "profile": [
    0.8,
    0.1,
    0.2,
    -0.6,
    0.8
   ],
   "bias": 0.148
  },
  {
   "name": "Mica",
   "slug": "mica",
   "tagline": "Réfléchi(e), délicat(e)",
   "text": "Tu es un mica. Tu es en couches : plus on te connaît, plus on découvre de choses. Réfléchi(e) et délicat(e), tu préfères observer avant de te lancer.",
   "profile": [
    -0.6,
    -0.5,
    -0.2,
    0.4,
    -0.4
   ],
   "bias": -0.245
  },
  {
   "name": "Azurite",
   "slug": "azurite",
   "tagline": "Profond(e), intense",
   "text": "Tu es une azurite. Profond(e) et intense, tu ressens tout à fond. Un petit côté mélancolique, mais une beauté que personne n’oublie.",
   "profile": [
    -0.2,
    -0.5,
    0.5,
    0.6,
    -0.6
   ],
   "bias": 0.048
  },
  {
   "name": "Hématite",
   "slug": "hematite",
   "tagline": "Sombre, magnétique",
   "text": "Tu es une hématite. Sombre, magnétique, forte tête : on t’admire ou on te redoute, rarement on t’ignore. Sous la carapace, tu es plus loyal(e) que tu le prétends.",
   "profile": [
    0.4,
    -0.7,
    -0.6,
    -0.2,
    0.9
   ],
   "bias": -0.041
  },
  {
   "name": "Tourmaline",
   "slug": "tourmaline",
   "tagline": "Multiple, créatif(ve)",
   "text": "Tu es une tourmaline. Multiple et créatif(ve), tu n’es jamais là où on t’attend. Tu as mille facettes, et tu les assumes toutes.",
   "profile": [
    0.5,
    0.2,
    0.5,
    0.7,
    0.1
   ],
   "bias": 0.075
  },
  {
   "name": "Saphir",
   "slug": "saphir",
   "tagline": "Élégant(e), loyal(e)",
   "text": "Tu es un saphir. Élégant(e) et loyal(e), tu as de la classe sans en faire des tonnes. Discret(ète), mais précieux(se) : ceux qui te connaissent le savent.",
   "profile": [
    -0.5,
    -0.2,
    0.3,
    0.0,
    0.7
   ],
   "bias": -0.003
  },
  {
   "name": "Or",
   "slug": "or",
   "tagline": "Précieux(se), magnétique",
   "text": "Tu es de l’or. Précieux(se) et magnétique, tu attires les regards et la confiance. On t’aime, et tu le sais, mais tu restes fidèle à toi-même.",
   "profile": [
    0.2,
    0.6,
    0.9,
    -0.2,
    0.6
   ],
   "bias": 0.21
  },
  {
   "name": "Cuivre",
   "slug": "cuivre",
   "tagline": "Chaleureux(se), conducteur",
   "text": "Tu es du cuivre. Chaleureux(se) et conducteur, tu es celui (celle) qui fait le lien entre les gens. Partout où tu passes, les choses circulent mieux.",
   "profile": [
    0.4,
    0.9,
    0.0,
    -0.3,
    0.3
   ],
   "bias": -0.026
  },
  {
   "name": "Turquoise",
   "slug": "turquoise",
   "tagline": "Doux(ce), apaisant(e)",
   "text": "Tu es une turquoise. Doux(ce) et apaisant(e), tu fais du bien rien qu’en étant là. Il y a du soleil en toi, et tu le partages sans compter.",
   "profile": [
    -0.7,
    0.6,
    0.3,
    0.5,
    -0.1
   ],
   "bias": -0.009
  },
  {
   "name": "Lapis-lazuli",
   "slug": "lapis-lazuli",
   "tagline": "Profond(e), sage",
   "text": "Tu es un lapis-lazuli. Profond(e) et sage, tu portes tout un ciel étoilé en toi. Tu parles peu, mais quand tu parles, on écoute.",
   "profile": [
    -0.8,
    -0.4,
    0.1,
    0.8,
    0.4
   ],
   "bias": -0.046
  },
  {
   "name": "Péridot",
   "slug": "peridot",
   "tagline": "Joyeux(se), solaire",
   "text": "Tu es un péridot. Joyeux(se) et solaire, tu es né(e) du feu des volcans, et ça se voit. Tu mets de la bonne humeur partout, même les jours de pluie.",
   "profile": [
    0.9,
    0.8,
    0.4,
    0.3,
    -0.3
   ],
   "bias": -0.066
  },
  {
   "name": "Obsidienne",
   "slug": "obsidienne",
   "tagline": "Volcanique, intense",
   "text": "Tu es une obsidienne. Volcanique et intense, tu as du tempérament. Tranchant(e) quand il le faut, tu dis les choses clairement, et on le respecte.",
   "profile": [
    0.7,
    -0.8,
    -0.3,
    -0.1,
    0.5
   ],
   "bias": -0.029
  },
  {
   "name": "Baryte",
   "slug": "baryte",
   "tagline": "Contrasté(e), plein(e) de présence",
   "text": "Tu es une baryte. Contrasté(e), clair(e) avec du caractère, tu as de la présence dans une pièce. Les gens te reconnaissent entre mille.",
   "profile": [
    -0.1,
    -0.6,
    0.5,
    -0.8,
    0.0
   ],
   "bias": 0.14
  },
  {
   "name": "Œil-de-tigre",
   "slug": "oeil-de-tigre",
   "tagline": "Courageux(se), protecteur(trice)",
   "text": "Tu es un œil-de-tigre. Courageux(se) et protecteur(trice), tu veilles sur les tiens. Ton regard est lumineux, et tu ne recules pas.",
   "profile": [
    0.6,
    0.0,
    0.6,
    -0.3,
    0.9
   ],
   "bias": 0.256
  }
 ]
};
