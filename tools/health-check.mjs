// Surveillance du site : vérifie que les pages clés répondent et que la base de données publique contient bien le contenu.
// Lancé toutes les 6 heures par .github/workflows/sante.yml : un échec envoie un e-mail GitHub à l'administrateur.
// Variables facultatives : SITE_URL (défaut https://jeremineralogie.fr), SUPABASE_URL / SUPABASE_KEY (défaut : assets/js/supabase-config.js).
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = (process.env.SITE_URL || "https://jeremineralogie.fr").replace(/\/$/, "");
const source = await readFile(path.join(ROOT, "assets/js/supabase-config.js"), "utf8");
const SUPABASE = process.env.SUPABASE_URL || /url:\s*"([^"]+)"/.exec(source)?.[1];
const KEY = process.env.SUPABASE_KEY || /publishableKey:\s*"([^"]+)"/.exec(source)?.[1];

const problems = [];
const check = async (label, task) => {
  const started = Date.now();
  try { const detail = await task(); console.log(`✓ ${label}${detail ? ` — ${detail}` : ""} (${Date.now() - started} ms)`); }
  catch (error) { problems.push(`${label} : ${error.message}`); console.log(`✗ ${label} — ${error.message}`); }
};
const get = async (url, options = {}) => {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(20000), headers: { "User-Agent": "jeremineralogie-sante", ...(options.headers || {}) } });
  if (!response.ok) throw new Error(`réponse ${response.status}`);
  return response;
};

// Pages du site (adresses publiques) : code 200 et un texte attendu.
for (const [page, expected] of [["/", "Jeremineralogie"], ["/apprendre.html", "Apprendre"], ["/jeux.html", "Jeux"], ["/boutique.html", "Boutique"], ["/collection.html", "collection"], ["/mineraux/fluorite/", "Fluorite"], ["/glossaire/clivage/", "Clivage"], ["/sitemap.xml", "<urlset"], ["/robots.txt", "Sitemap"]]) {
  await check(`page ${page}`, async () => { const text = await (await get(`${SITE}${page}`)).text(); if (!text.includes(expected)) throw new Error(`« ${expected} » introuvable`); });
}
// Base de données : lecture publique du contenu publié.
const count = async (table, filter = "") => {
  const response = await get(`${SUPABASE}/rest/v1/${table}?select=id${filter}&limit=1`, { headers: { apikey: KEY, Prefer: "count=exact", Range: "0-0" } });
  return Number(/\/(\d+)$/.exec(response.headers.get("content-range") || "")?.[1] ?? NaN);
};
for (const [table, minimum] of [["minerals", 400], ["glossary_terms", 250], ["localities", 20], ["mines", 10]]) {
  await check(`base : ${table}`, async () => { const n = await count(table, "&publication_status=eq.published"); if (!(n >= minimum)) throw new Error(`${n} lignes publiées (au moins ${minimum} attendues)`); return `${n} lignes`; });
}
await check("base : pièces en boutique lisibles", async () => { const n = await count("shop_items", "&publication_status=eq.published"); if (!Number.isFinite(n)) throw new Error("décompte illisible"); return `${n} pièces`; });
// Authentification : la route de santé répond.
await check("authentification Supabase", async () => { const response = await get(`${SUPABASE}/auth/v1/health`, { headers: { apikey: KEY } }); const body = await response.json().catch(() => ({})); if (body.name && body.name !== "GoTrue") throw new Error(`réponse inattendue (${body.name})`); });

if (problems.length) { console.error(`\n${problems.length} problème${problems.length > 1 ? "s" : ""} :\n- ${problems.join("\n- ")}`); process.exit(1); }
console.log("\nTout est en ordre.");
