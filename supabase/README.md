# Supabase setup

The project URL and publishable key are deliberately placeholders in `assets/js/supabase-config.js`. Replace them only after confirming the matching project. Never commit a secret/service-role key.

1. Link the Supabase CLI to the existing project, inspect `migrations/`, then apply the migration.
2. Create Storage buckets: `site-media-public` (public, approved media only) and `admin-staging` (private). Set file size and MIME allowlists.
3. Run `seed.sql` once after applying the migration and creating the buckets.
4. Upload the local fluorite photo to `site-media-public/collection/fluorite-mine-de-la-barre-2018.jpeg`.
5. Create the owner account in Auth, disable public signup, and assign server-managed `app_metadata.role = admin` through the Dashboard/Admin API. Never authorize from user metadata.
6. Set the Auth Site URL and exact production/local redirects for `/admin/`.

Public bucket objects are readable by anyone. Drafts and restricted documents belong in the private bucket. Database and Storage RLS are the security boundary; hiding `/admin/` is not authorization.
