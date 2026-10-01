// Plusieurs photos libres possibles pour quelques fiches, à choisir à l'œil (rien n'est publié).
// CANDIDATS="rubis:ruby crystal|saphir:sapphire crystal" : recherche sur Wikimedia Commons, licences libres seulement.
// Résultat : tools/images/candidats/<slug>-<n>.jpg (640 px) et tools/images/candidats/candidats.json (auteur, licence, page).
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DIR = path.join(ROOT, "tools/images/candidats");
const UA = "JeremineralogieBot/1.0 (https://jeremineralogie.github.io; photos libres des fiches minéraux)";
const FREE = /^(cc0|public domain|pd\b|pd-|cc[- ]by(-sa)?[- ]?\d|cc[- ]by(-sa)?$|attribution|no restrictions|copyrighted free use)/i;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const strip = value => String(value ?? "").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, "\"").replace(/&#0?39;/g, "'").replace(/\s+/g, " ").trim();
async function get(url, as = "json") {
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const response = await fetch(url, { headers: { "User-Agent": UA } });
    if (response.ok) return as === "json" ? response.json() : Buffer.from(await response.arrayBuffer());
    if (response.status === 429 || response.status >= 500) { await sleep(5000 * 2 ** attempt); continue; }
    throw new Error(`${response.status} ${url}`);
  }
  throw new Error(`Échec répété : ${url}`);
}

const wanted = String(process.env.CANDIDATS || "").split("|").map(part => part.split(":")).filter(([slug, query]) => slug && query);
await mkdir(DIR, { recursive: true });
const out = {};
for (const [slug, query] of wanted) {
  const search = await get(`https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search&srnamespace=6&srlimit=30&srsearch=${encodeURIComponent(`${query} filetype:bitmap`)}`);
  const files = (search.query?.search || []).map(hit => hit.title);
  out[slug] = [];
  for (const title of files) {
    if (out[slug].length >= 8) break;
    const data = await get(`https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|extmetadata|size&iiurlwidth=640&titles=${encodeURIComponent(title)}`);
    const info = Object.values(data.query?.pages || {})[0]?.imageinfo?.[0];
    const meta = info?.extmetadata || {};
    const license = strip(meta.LicenseShortName?.value || meta.License?.value || "");
    if (!info?.thumburl || !(FREE.test(license) || /^(cc0|pd|cc-by)/i.test(meta.License?.value || "")) || Math.min(info.width, info.height) < 500) continue;
    const name = `${slug}-${out[slug].length + 1}.jpg`;
    await writeFile(path.join(DIR, name), await get(info.thumburl, "buffer"));
    out[slug].push({ file: name, source: title.replace(/^File:/, ""), author: strip(meta.Artist?.value || meta.Credit?.value || "Auteur inconnu"), license, licenseUrl: meta.LicenseUrl?.value || "", page: info.descriptionurl });
    console.log(`${slug} ← ${title}`);
    await sleep(300);
  }
}
await writeFile(path.join(DIR, "candidats.json"), `${JSON.stringify(out, null, 1)}\n`);
