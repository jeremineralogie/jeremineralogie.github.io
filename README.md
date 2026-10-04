# Jeremineralogie

Site de minéralogie française : fiches minéraux, glossaire, collection, boutique, articles, archives, jeux et quiz.
Site statique publié par GitHub Pages sur https://jeremineralogie.fr, avec les données dans Supabase (projet `nolmmbztvfyyjvllvvjb`).

- `index.html`, `*.html` et `assets/js/` : pages et modules du site (JavaScript sans étape de compilation).
- `tools/seo/build.mjs` : fabrique chaque nuit les pages lisibles par Google (fiches, termes, gisements…) et `sitemap.xml`.
- `supabase/migrations/` : structure de la base de données.
- `tests/` : tests automatiques (`node --test tests/*.test.mjs`) ; `tools/check-links.mjs` : vérification des liens internes.
- `docs/exploitation.md` : surveillance, sauvegardes et reprise après incident.
- `CONTEXTE_JEREMINERALOGIE.md` : historique et décisions du projet.
