// Téléchargement des photos libres validées (tools/images/proposition.json) dans assets/mineraux-photos/,
// en 640 px de large au plus, avec un fichier de crédits (auteur, licence, page d'origine) affiché sous chaque photo.
// Les photos ont ensuite été converties en WebP (640 px) avec une vignette « -mini » (160 px) ; relancer ce script
// remplacerait ces fichiers optimisés par des JPEG : à refaire seulement pour une nouvelle sélection.
// Avec LISTE=nouveaux : lit tools/images/proposition-nouveaux.json et ajoute les photos aux crédits existants,
// sans toucher aux photos déjà présentes.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DIR = path.join(ROOT, "assets/mineraux-photos");
const UA = "JeremineralogieBot/1.0 (https://jeremineralogie.github.io; photos libres des fiches minéraux)";
const WIDTH = 640;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function get(url, as = "json") {
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const response = await fetch(url, { headers: { "User-Agent": UA } });
    if (response.ok) return as === "json" ? response.json() : Buffer.from(await response.arrayBuffer());
    if (response.status === 429 || response.status >= 500) { await sleep(5000 * 2 ** attempt); continue; }
    throw new Error(`${response.status} ${url}`);
  }
  throw new Error(`Échec répété : ${url}`);
}

const NEW_LIST = process.env.LISTE === "nouveaux";
const { results } = JSON.parse(await readFile(path.join(ROOT, `tools/images/${NEW_LIST ? "proposition-nouveaux" : "proposition"}.json`), "utf8"));
await mkdir(DIR, { recursive: true });
const credits = NEW_LIST ? JSON.parse(await readFile(path.join(DIR, "credits.json"), "utf8")) : {};
for (const entry of results.filter(item => item.status === "trouvee" && !(NEW_LIST && credits[item.slug]))) {
  const { file, author, license, licenseUrl, page } = entry.image;
  try {
    const data = await get(`https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url&iiurlwidth=${WIDTH}&titles=${encodeURIComponent(`File:${file}`)}`);
    const info = Object.values(data.query?.pages || {})[0]?.imageinfo?.[0];
    const source = info?.thumburl || info?.url;
    if (!source) throw new Error("vignette introuvable");
    const extension = (/\.(jpe?g|png|webp|gif)(?:$|\?)/i.exec(source)?.[1] || "jpg").toLowerCase().replace("jpeg", "jpg");
    const name = `${entry.slug}.${extension}`;
    await writeFile(path.join(DIR, name), await get(source, "buffer"));
    credits[entry.slug] = { photo: name, author, license, licenseUrl, page, width: info.thumbwidth || null, height: info.thumbheight || null };
    console.log(`✓ ${entry.name} → ${name}`);
  } catch (error) { console.log(`✗ ${entry.name} : ${error.message}`); }
  await sleep(300);
}
await writeFile(path.join(DIR, "credits.json"), `${JSON.stringify(credits, null, 1)}\n`);
console.log(`Terminé : ${Object.keys(credits).length} photos.`);
