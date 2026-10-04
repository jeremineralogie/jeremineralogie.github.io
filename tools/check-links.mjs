// Vérificateur de liens internes : parcourt toutes les pages HTML du dépôt (fabriquées ou non) et signale les liens, images, scripts et feuilles de style locaux qui ne mènent à aucun fichier.
// Usage : node tools/check-links.mjs [dossier]   (code de sortie 1 s'il y a des liens cassés)
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(process.argv[2] || path.join(path.dirname(fileURLToPath(import.meta.url)), ".."));
const SKIP_DIRS = new Set([".git", "node_modules", "tools", "supabase", ".github"]);
const exists = async file => { try { await stat(file); return true; } catch { return false; } };

async function htmlFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await htmlFiles(full));
    else if (entry.name.endsWith(".html")) out.push(full);
  }
  return out;
}
async function resolves(target) {
  if (await exists(target)) { const info = await stat(target); if (!info.isDirectory()) return true; return exists(path.join(target, "index.html")); }
  return false;
}

const broken = new Map(); let checked = 0;
for (const file of await htmlFiles(ROOT)) {
  const html = await readFile(file, "utf8");
  const base = /<base href="([^"]*)"/.exec(html)?.[1];
  const pageDir = base === "/" ? ROOT : path.dirname(file);
  const seen = new Set();
  for (const match of html.matchAll(/\b(?:href|src)="([^"]*)"/g)) {
    let link = match[1].trim();
    if (!link || /^(?:[a-z][a-z0-9+.-]*:|\/\/|#|\?)/i.test(link) || link.includes("${")) continue;
    link = link.split("#")[0].split("?")[0];
    if (!link || seen.has(link)) continue; seen.add(link); checked += 1;
    let decoded = link; try { decoded = decodeURIComponent(link); } catch { /* adresse laissée telle quelle */ }
    const target = decoded.startsWith("/") ? path.join(ROOT, decoded) : path.join(pageDir, decoded);
    if (!await resolves(target)) {
      const key = link; if (!broken.has(key)) broken.set(key, []);
      broken.get(key).push(path.relative(ROOT, file));
    }
  }
}
for (const [link, pages] of [...broken].sort((a, b) => b[1].length - a[1].length)) console.log(`${link}\n   ← ${pages.length} page${pages.length > 1 ? "s" : ""} : ${pages.slice(0, 3).join(", ")}${pages.length > 3 ? ", …" : ""}`);
console.log(`${checked} liens locaux vérifiés, ${broken.size} cassé${broken.size > 1 ? "s" : ""}.`);
process.exit(broken.size ? 1 : 0);
