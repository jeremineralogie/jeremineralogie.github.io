# Application (racine du dépôt jeremineralogie.github.io)
1. Copier le contenu de ce dossier dans le dépôt (écrase : recherche.html, script.js, assets/js/geography-page.js ; ajoute : assets/js/reference-resolver.js, assets/js/search-page.js, 2 migrations).
2. python3 apply_admin_patch.py assets/js/admin.js
3. python3 apply_collection_patch.py assets/js/collection-page.js
   (les deux scripts s'arrêtent sans rien écrire si un ancrage n'est pas unique)
4. Appliquer les migrations : supabase db push
5. git add -A && git commit -m "Recherche, département dynamique, résolution des références, storage admin, géographie" && git push

## Supabase (déjà appliqué en production)
Migrations 20260930000000, 20260930010000 et 20260930020000 déjà exécutées sur le projet nolmmbztvfyyjvllvvjb.
L'historique `supabase_migrations` n'existe pas en base : avant le premier `supabase db push`, exécuter une fois
  supabase migration repair --status applied 20260928000000 20260929000000 20260929120000 20260929130000 20260929140000 20260930000000 20260930010000 20260930020000
