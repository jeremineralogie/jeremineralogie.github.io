CONTEXTE PROJET — JEREMINERALO GIE
Fichier de transition pour Codex. Lire ce document avant toute modification du dépôt.
1. Projet
Nom : Jeremineralogie
Signature : « Minéraux français, spécimens de collection et patrimoine minier. »
Objectif : site personnel de référence sur la minéralogie française avec collection, boutique, articles, archives/documentation, identification et navigation géographique.
Style : scientifique, sérieux, élégant, moderne, noir et violet. Pas d’esthétique ésotérique/lithothérapie.
2. Dépôt et état actuel
Dépôt GitHub : jeremineralogie/jeremineralogie.github.io Branche : main Hébergement : GitHub Pages.
Le site fonctionne actuellement : affichage correct et liens fonctionnels.
Fichiers principaux :
	●	index.html
	●	styles.css
	●	script.js
	●	boutique.html
	●	articles.html
	●	archives.html
	●	collection.html
	●	specimen.html
	●	identification.html
	●	reseaux.html
	●	contact.html
	●	legal.html
	●	recherche.html
	●	departement.html
	●	assets/hero-specimen.jpeg
README.md.txt existe actuellement à cause d’une manipulation sur iPhone. Il n’est pas critique.
IMPORTANT : le site est modulaire. Ne jamais le transformer en un seul index.html.
3. Design validé
Accueil :
	●	en-tête avec « Jeremineralogie » ;
	●	recherche globale visible à côté du logo ;
	●	navigation : Boutique / Articles / Archives & Documentation / Ma collection ;
	●	hero avec la photo fournie par le propriétaire : assets/hero-specimen.jpeg ;
	●	titre Jeremineralogie ;
	●	signature ci-dessus ;
	●	footer : Identification / Mes réseaux / Contact / Informations légales.
Ne pas remplacer ou modifier la photo hero sans demande explicite. Ne pas dupliquer toute la navigation principale dans le footer. Ne pas refaire le design déjà validé sans demande explicite.
4. Boutique
Vitrine pour le moment, pas de système de paiement complet nécessaire.
Une fiche peut contenir : photo(s), nom, minéral, provenance, localité, département, région, dimensions, poids, associations, description, prix, référence, bouton « Me contacter ».
Prix visible directement.
Références commerciales uniquement pour la boutique : JMFLU 0001, JMAME 0001, etc.
Les spécimens personnels de collection ne reçoivent aucun code commercial.
Un objet vendu est retiré manuellement de la boutique. Pas d’archive automatique des ventes.
5. Articles
Catégories :
	●	Minéralogie
	●	Géologie
	●	Formation des cristaux / cristallographie
	●	Mines & histoire
	●	Découvertes
	●	Identification
	●	Collection
	●	Pédagogie
Une page article peut contenir titre, catégorie, date, image, texte, titres, images, légendes, tableaux, références et liens internes.
6. Archives & Documentation
Sections :
	●	mines & gisements ;
	●	archives historiques ;
	●	plans & cartes ;
	●	histoire de l’exploitation ;
	●	publications scientifiques ;
	●	catalogues ;
	●	bibliographie ;
	●	photographies anciennes.
Les PDF/scans doivent pouvoir être consultés sur le site. Les documents peuvent être reliés aux minéraux, localités, départements, mines, articles et spécimens.
7. Ma collection
Collection publique des spécimens personnels, non commerciale.
Une fiche peut contenir :
	●	plusieurs photos : vue générale, détails, gangue, arrière, échelle ;
	●	minéral ;
	●	provenance ;
	●	localité ;
	●	département ;
	●	région ;
	●	dimensions ;
	●	poids ;
	●	associations ;
	●	description ;
	●	historique/provenance si connu.
Documentation scientifique quand disponible : formule, système cristallin, dureté, densité, couleurs, éclat, clivage, habitus, formation, associations, gisements représentatifs, occurrences françaises, départements français, bibliographie.
Filtres souhaités :
	●	minéral ;
	●	région ;
	●	département ;
	●	localité ;
	●	association.
8. Architecture de collection à mettre en place
Problème actuel : ajouter un spécimen ne doit pas nécessiter de créer/modifier plusieurs pages HTML.
Architecture cible :
	●	collection.html générique ;
	●	specimen.html générique ;
	●	données centralisées, par exemple collection-data.js ;
	●	photos dans assets/.
Idéalement, ajouter un nouveau spécimen = une photo + une entrée de données structurée.
Ne pas créer une nouvelle page HTML dédiée à chaque spécimen si l’architecture générique suffit.
Exemple de demande future : « Ajoute ce spécimen : Fluorite, mine de la Barre, Puy-de-Dôme, quartz, découverte 2018, voici la photo. »
Codex doit alors modifier directement le dépôt selon cette architecture.
9. Premier spécimen fourni
Minéral : Fluorite Provenance : mine de la Barre Département : Puy-de-Dôme (63) Association : quartz Découverte : 2018 Description : découverte en 2018.
Une photographie a été fournie par le propriétaire.
Ne pas inventer d’informations supplémentaires sur cette pièce.
10. Géographie
Règle : régions et départements sont des niveaux de navigation/filtrage, pas une page pour chaque localité.
Structure : Région → Département → contenu du département
Page département générique : departement.html
Sélection possible par paramètre, par exemple : departement.html?dep=63
Ne pas créer departement-puy-de-dome.html.
La page département doit pouvoir regrouper :
	●	boutique ;
	●	collection ;
	●	archives ;
	●	mines/gisements ;
	●	articles ;
	●	minéraux documentés ;
	●	localités ;
	●	carte interactive avec marqueurs.
Exemples Puy-de-Dôme : Pontgibaud, Le Beix, Puy-Saint-Gulmier.
Ne jamais déduire qu’une localité est accessible au public ou autorisée à la collecte sans source vérifiée.
11. Identification
identification.html
Champs :
	●	nom ;
	●	email ;
	●	plusieurs photos ;
	●	minéral supposé ;
	●	lieu de découverte ;
	●	département ;
	●	dimensions ;
	●	poids ;
	●	description/contexte.
Pas de champ vidéo.
Préciser qu’une identification photographique n’est pas une garantie d’identification absolue et qu’une analyse complémentaire peut être nécessaire.
12. Réseaux / Contact / Légal
Réseaux : Facebook, Instagram, TikTok, YouTube. Pas d’hébergement vidéo direct.
Contact : formulaire avec motifs Boutique, Identification, Collection, Documentation, Article, Partenariat, Question générale, Autre.
Légal : à finaliser lors de la mise en place réelle de la boutique. Ne pas inventer de données personnelles ou légales.
13. Recherche
Recherche globale dans l’en-tête.
À terme, rechercher :
	●	minéraux ;
	●	spécimens ;
	●	boutique ;
	●	articles ;
	●	archives ;
	●	mines/gisements ;
	●	localités ;
	●	départements ;
	●	régions.
14. Contraintes techniques
Site statique/modulaire sur GitHub Pages.
Privilégier HTML/CSS/JavaScript et données structurées simples.
Ne pas imposer de serveur, base de données ou framework lourd sans nécessité.
Le propriétaire travaille régulièrement depuis un iPhone : les modifications doivent rester simples à maintenir.
15. Règles impératives pour Codex
Avant toute modification :
	1.	Lire ce fichier.
	2.	Inspecter les fichiers concernés existants.
	3.	Préserver les fonctionnalités déjà opérationnelles.
	4.	Préserver le design validé.
	5.	Ne pas supprimer une fonctionnalité validée.
	6.	Ne pas remplacer le site par un fichier unique.
	7.	Ne pas remplacer la photo hero.
	8.	Ne pas créer inutilement une page par département.
	9.	Ne pas créer inutilement une page HTML par spécimen.
	10.	Vérifier les chemins relatifs, liens et images après modification.
Ne jamais inventer une provenance, localité, date, analyse ou référence bibliographique. Toute information scientifique/historique non fournie doit être vérifiée avant d’être présentée comme un fait.
16. Priorité immédiate
Mettre en place la gestion centralisée de la collection :
	●	collection.html générique ;
	●	specimen.html générique ;
	●	données centralisées ;
	●	photos dans assets/ ;
	●	ajout d’un spécimen sans créer trois nouvelles pages ;
	●	affichage automatique dans la collection ;
	●	clic vers la fiche détaillée.
Puis améliorer progressivement recherche, filtres, départements, archives, articles et boutique.
17. Principe général
Le site doit progressivement relier :
Minéral ↔ Spécimen ↔ Localité ↔ Département ↔ Mine/Gisement ↔ Article ↔ Archive
Toute évolution doit préserver cette logique.

## 14. Liens entre contenus, listes « Autre » et fiches génériques (30 septembre 2026)

- **Fiche générique** `fiche.html?type=mine|mineral|locality&id=<slug>` (script `assets/js/entity-page.js`) : gisement, minéral ou commune. Elle réunit les spécimens de la collection (avec photo), les pièces disponibles en boutique, les articles et les archives liés. Ce n'est pas une page par mine : une seule page HTML générique, comme `specimen.html`.
- **Base de données** : `specimens.mine_id` et `shop_items.mine_id` (FK vers `mines`, migration `20260930030000`). `provenance` reste le texte saisi ; `mine_id` le relie à la fiche gisement.
- **Création automatique** (`ensureNamed` dans `reference-resolver.js`) : saisir un minéral, une commune ou un gisement dans une fiche spécimen (ou une provenance dans la boutique) retrouve la fiche existante (sans tenir compte de la casse, des accents et des tirets) ou en crée une, publiée, avec un slug unique. Aucun département ni aucune région n'est créé automatiquement. Aucune donnée scientifique n'est inventée : une fiche créée ne contient que son nom.
- **Listes déroulantes** : type de site = Mine, Tranchée, Carrière, Alluvion, Affleurement, Travaux publics + « Autre » (valeur libre conservée et proposée ensuite). Catégories d'articles/archives, minéral/gisement/localité/région et liens d'articles/archives : option « Autre » créant la valeur. Pas d'« Autre » sur les états système (publication, disponibilité) ni sur le département (le code est un identifiant officiel). Les champs texte du formulaire spécimen proposent aussi des suggestions (`datalist`) tirées des référentiels.
- **Articles** : les noms de minéraux, gisements et communes publiés sont reliés automatiquement dans le texte (`entity-links.js`, un lien par nom et par article, nom le plus long prioritaire, sans tenir compte des accents). Les liens choisis dans l'administration s'affichent aussi sous « Fiches liées ».
- **Ancres** : `articles.html#<slug>`, `archives.html#<slug>`, `boutique.html#<référence>`.
