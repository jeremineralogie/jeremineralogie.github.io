// Copie de secours du contenu PUBLIC (fiches, glossaire, gisements, communes, articles, archives, collection, boutique) en fichiers JSON.
// Lancée chaque semaine par .github/workflows/sauvegarde.yml (conservée 90 jours comme archive du workflow).
// Ne contient pas : les brouillons, les comptes des joueurs, les statistiques, les messages, ni les fichiers (photos, documents) du stockage.
// Usage : node tools/backup-content.mjs [dossier de sortie]   (défaut : ./sauvegarde)
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.resolve(process.argv[2] || "sauvegarde");
const source = await readFile(path.join(ROOT, "assets/js/supabase-config.js"), "utf8");
const SUPABASE = process.env.SUPABASE_URL || /url:\s*"([^"]+)"/.exec(source)?.[1];
const KEY = process.env.SUPABASE_KEY || /publishableKey:\s*"([^"]+)"/.exec(source)?.[1];
const TABLES = ["minerals", "mineral_media", "mineral_occurrences", "glossary_terms", "mines", "localities", "departments", "regions", "specimens", "specimen_media", "specimen_associations",
  "shop_items", "shop_item_media", "shop_item_associations", "articles", "article_media", "article_minerals", "article_mines", "article_localities", "article_departments", "article_regions", "article_specimens", "article_shop_items",
  "archive_documents", "archive_minerals", "archive_mines", "archive_localities", "archive_departments", "archive_regions", "archive_specimens", "archive_shop_items", "archive_articles", "site_settings"];
const PAGE = 1000;

async function readAll(table) {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const response = await fetch(`${SUPABASE}/rest/v1/${table}?select=*`, { headers: { apikey: KEY, Range: `${from}-${from + PAGE - 1}`, "Range-Unit": "items" }, signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`« ${table} » : réponse ${response.status}`);
    const batch = await response.json(); rows.push(...batch);
    if (batch.length < PAGE) return rows;
  }
}

await mkdir(OUT, { recursive: true });
const manifest = { date: new Date().toISOString(), source: SUPABASE, tables: {} };
const failures = [];
for (const table of TABLES) {
  try { const rows = await readAll(table); await writeFile(path.join(OUT, `${table}.json`), JSON.stringify(rows)); manifest.tables[table] = rows.length; console.log(`✓ ${table} : ${rows.length}`); }
  catch (error) { failures.push(error.message); console.error(`✗ ${error.message}`); }
}
await writeFile(path.join(OUT, "_manifest.json"), JSON.stringify(manifest, null, 2));
if (manifest.tables.minerals === undefined || manifest.tables.minerals < 100) failures.push("la table minerals est vide ou illisible : sauvegarde jugée invalide");
if (failures.length) { console.error(`\n${failures.length} échec(s) :\n- ${failures.join("\n- ")}`); process.exit(1); }
console.log(`\nSauvegarde terminée : ${Object.values(manifest.tables).reduce((sum, n) => sum + n, 0)} lignes dans ${OUT}`);
