// Recherche d'une photo libre de droits pour chaque fiche minéral (proposition à valider, rien n'est publié).
// 1. Fiches publiées lues dans Supabase (clé publique du site, lecture seule).
// 2. Image de référence de l'espèce sur Wikidata (propriété P18), à défaut l'image principale de l'article Wikipédia en français.
// 3. Licence et auteur lus sur Wikimedia Commons ; seules les licences libres sont retenues (domaine public, CC0, CC BY, CC BY-SA).
// Résultat : tools/images/proposition.json et tools/images/proposition.html (page de relecture avec vignettes et crédits).
// Avec LISTE=nouveaux : fiches de tools/minerals/nouveaux-mineraux.json (pas encore dans Supabase),
// résultat dans tools/images/proposition-nouveaux.json et .html.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(ROOT, "tools/images");
const UA = "JeremineralogieBot/1.0 (https://jeremineralogie.github.io; recherche de photos libres pour fiches minéraux)";
const FREE = /^(cc0|public domain|pd\b|pd-|cc[- ]by(-sa)?[- ]?\d|cc[- ]by(-sa)?$|attribution|no restrictions|copyrighted free use)/i;
const NEW_LIST = process.env.LISTE === "nouveaux";
const OUT_NAME = NEW_LIST ? "proposition-nouveaux" : "proposition";
const MIN_SIDE = 600; // en dessous, une photo plus grande est cherchée sur l'article Wikipédia
// Noms ambigus : l'élément chimique ou un composé passerait avant le minéral natif.
const SEARCH = {
  cuivre: ["native copper", "en"], bismuth: ["native bismuth", "en"], or: ["native gold", "en"], argent: ["native silver", "en"],
  antimoine: ["native antimony", "en"], arsenic: ["native arsenic", "en"], platine: ["native platinum", "en"],
  rosedefer: ["iron rose", "en"], columbitefe: ["columbite-(Fe)", "en"]
};
// Dernier recours : recherche directe de fichiers sur Commons (variétés absentes de Wikidata) ; résultat à vérifier.
const COMMONS_QUERY = {
  fernatif: "native iron meteorite", mercurenatif: "native mercury droplets", tellurenatif: "native tellurium", selammoniac: "sal ammoniac crystals", limonite: "limonite", electrum: "electrum gold silver",
  obsidienne: "obsidian", silex: "flint nodule", ambre: "amber", jais: "jet gemstone", quartzrutile: "rutilated quartz", lapislazuli: "lapis lazuli", topazolite: "topazolite", amethrine: "ametrine", sardonyx: "sardonyx",
  larimar: "larimar", moldavite: "moldavite", moissanite: "moissanite", howlite: "howlite", charoite: "charoite", vermiculite: "vermiculite mineral", montmorillonite: "montmorillonite clay", glauconite: "glauconite",
  chessylite: "azurite Chessy", rosedefer: "hematite rose", quincyte: "quincyte opal", menilite: "menilite opal", pyreneite: "andradite Pyrénées",
  tourmalinemelondeau: "watermelon tourmaline", spathdislande: "Iceland spar calcite", rosedessables: "desert rose gypsum", opaledefeu: "fire opal",
  opalenoble: "precious opal", pierredelune: "moonstone feldspar", pierredesoleil: "sunstone feldspar", quartzfume: "smoky quartz crystal",
  quartzrose: "rose quartz", cristalderoche: "rock crystal quartz", diopsidechromifere: "chrome diopside", oeildetigre: "tiger's eye"
};
const fold = value => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "");
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const esc = value => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const stripHtml = value => String(value ?? "").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, "\"").replace(/&#0?39;/g, "'").replace(/\s+/g, " ").trim();

async function json(url) {
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const response = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
    if (response.ok) return response.json();
    if (response.status === 429 || response.status >= 500) { await sleep(5000 * 2 ** attempt); continue; }
    throw new Error(`${response.status} ${url}`);
  }
  throw new Error(`Échec répété : ${url}`);
}

async function minerals() {
  if (NEW_LIST) {
    // Seules les fiches qui n'ont pas encore de photo libre sont cherchées.
    const credits = JSON.parse(await readFile(path.join(ROOT, "assets/mineraux-photos/credits.json"), "utf8"));
    return JSON.parse(await readFile(path.join(ROOT, "tools/minerals/nouveaux-mineraux.json"), "utf8")).filter(({ slug }) => !credits[slug]).map(({ slug, name, formula }) => ({ slug, name, formula }));
  }
  const source = await readFile(path.join(ROOT, "assets/js/supabase-config.js"), "utf8");
  const url = /url:\s*"([^"]+)"/.exec(source)[1], key = /publishableKey:\s*"([^"]+)"/.exec(source)[1];
  const response = await fetch(`${url}/rest/v1/minerals?select=slug,name,formula&publication_status=eq.published&order=name`, { headers: { apikey: key } });
  if (!response.ok) throw new Error(`Lecture des fiches impossible (${response.status})`);
  return response.json();
}

// Élément Wikidata d'un minéral : recherche du nom en français puis en anglais, en préférant les éléments décrits comme minéraux.
// Le candidat dont le libellé (français ou anglais) est exactement le nom cherché passe en premier.
async function wikidataItem(name) {
  const forced = SEARCH[fold(name)];
  const searches = forced ? [forced] : [[name, "fr"], [name, "en"]];
  for (const [term, language] of searches) {
    const search = await json(`https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&type=item&limit=10&language=${language}&uselang=${language}&search=${encodeURIComponent(term)}`);
    const candidates = (search.search || []).filter(item => /min[ée]ral|gem|gemme|variet|variété|cristal|native/i.test(item.description || ""));
    if (!candidates.length) continue;
    const ids = candidates.map(item => item.id).join("|");
    const entities = await json(`https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=claims|labels|sitelinks&languages=fr|en&ids=${ids}`);
    const exact = candidate => { const entity = entities.entities?.[candidate.id]; return [entity?.labels?.fr?.value, entity?.labels?.en?.value, candidate.label].some(label => fold(label) === fold(term)); };
    const candidate = forced ? candidates[0] : candidates.find(exact) || candidates[0];
    const entity = entities.entities?.[candidate.id];
    const image = entity?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
    return { id: candidate.id, label: entity?.labels?.fr?.value || entity?.labels?.en?.value || candidate.label, description: candidate.description, image: image || null, frwiki: entity?.sitelinks?.frwiki?.title || null, exact: forced || exact(candidate) };
  }
  return null;
}

async function commonsSearch(name) {
  const term = COMMONS_QUERY[fold(name)] || `${name} mineral`;
  const data = await json(`https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search&srnamespace=6&srlimit=8&srsearch=${encodeURIComponent(`${term} filetype:bitmap`)}`);
  return (data.query?.search || []).map(hit => hit.title.replace(/^File:/, ""));
}

async function frWikipediaImage(title) {
  const data = await json(`https://fr.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&piprop=name&redirects=1&titles=${encodeURIComponent(title)}`);
  const page = Object.values(data.query?.pages || {})[0];
  return page?.pageimage || null;
}

// Licence, auteur et vignette d'un fichier Commons.
async function commonsInfo(file) {
  const data = await json(`https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|extmetadata|size&iiurlwidth=480&titles=${encodeURIComponent(`File:${file}`)}`);
  const page = Object.values(data.query?.pages || {})[0];
  const info = page?.imageinfo?.[0];
  if (!info) return null;
  const meta = info.extmetadata || {};
  const license = stripHtml(meta.LicenseShortName?.value || meta.License?.value || "");
  return {
    file, page: info.descriptionurl, thumb: info.thumburl, original: info.url, width: info.width, height: info.height,
    author: stripHtml(meta.Artist?.value || meta.Credit?.value || "Auteur inconnu"), license, licenseUrl: meta.LicenseUrl?.value || "",
    free: FREE.test(license) || /^(cc0|pd|cc-by)/i.test(meta.License?.value || ""),
    attributionRequired: meta.AttributionRequired?.value === "true"
  };
}

const rows = await minerals();
const results = [];
for (const [index, mineral] of rows.entries()) {
  const entry = { slug: mineral.slug, name: mineral.name, wikidata: null, image: null, status: "introuvable", note: "" };
  try {
    const item = await wikidataItem(mineral.name);
    if (item) entry.wikidata = { id: item.id, label: item.label, description: item.description };
    if (item && !item.exact) entry.note = `Correspondance approchée : « ${item.label} ». `;
    // Image Wikidata, puis image de l'article Wikipédia si elle manque, n'est pas libre ou est trop petite.
    const options = [];
    if (item?.image) options.push([item.image, "wikidata"]);
    const wikiImage = await frWikipediaImage(item?.frwiki || mineral.name).catch(() => null);
    if (wikiImage && wikiImage !== item?.image) options.push([wikiImage, "wikipedia-fr"]);
    let chosen = null, rejected = null, viaSearch = false;
    // Rien sur Wikidata ni Wikipédia : recherche de fichiers sur Commons.
    // Variétés connues sous un autre nom : la recherche Commons ciblée passe en premier.
    if (COMMONS_QUERY[fold(mineral.name)]) options.length = 0;
    if (!options.length) { viaSearch = true; (await commonsSearch(mineral.name).catch(() => [])).forEach(file => options.push([file, "recherche-commons"])); }
    for (const [file, origin] of options) {
      if (viaSearch && chosen) break;
      const info = await commonsInfo(file);
      if (!info) continue;
      if (!info.free) { rejected ||= { ...info, origin }; continue; }
      const side = Math.min(info.width || 0, info.height || 0);
      if (!chosen || (Math.min(chosen.width || 0, chosen.height || 0) < MIN_SIDE && side > Math.min(chosen.width || 0, chosen.height || 0))) chosen = { ...info, origin };
    }
    if (chosen && viaSearch) entry.note += "Trouvée par recherche sur Commons : vérifier que c'est bien ce minéral. ";
    if (chosen) { entry.status = "trouvee"; entry.image = chosen; if (Math.min(chosen.width, chosen.height) < MIN_SIDE) entry.note += "Photo de petite taille."; }
    else if (rejected) { entry.status = "licence-non-libre"; entry.image = rejected; entry.note += `Licence « ${rejected.license} » écartée.`; }
    else entry.note += item ? "Pas d'image libre trouvée." : "Espèce non trouvée sur Wikidata.";
  } catch (error) { entry.status = "erreur"; entry.note = error.message; }
  results.push(entry);
  console.log(`${index + 1}/${rows.length} ${mineral.name} → ${entry.status}${entry.image ? ` (${entry.image.file})` : ""}`);
  await sleep(400);
}

await writeFile(path.join(OUT, `${OUT_NAME}.json`), `${JSON.stringify({ generated: new Date().toISOString(), results }, null, 2)}\n`);

const found = results.filter(entry => entry.status === "trouvee");
const card = entry => `<article class="c${entry.status === "trouvee" ? "" : " off"}">
${entry.image?.thumb ? `<a href="${esc(entry.image.page)}" target="_blank" rel="noopener"><img src="${esc(entry.image.thumb)}" alt="${esc(entry.name)}" loading="lazy"></a>` : `<div class="none">Pas de photo</div>`}
<h2>${esc(entry.name)}</h2>
${entry.wikidata ? `<p class="m">Wikidata : <a href="https://www.wikidata.org/wiki/${esc(entry.wikidata.id)}" target="_blank" rel="noopener">${esc(entry.wikidata.label)}</a> — ${esc(entry.wikidata.description || "")}</p>` : ""}
${entry.image ? `<p class="cr">${esc(entry.image.author)} — <a href="${esc(entry.image.licenseUrl || entry.image.page)}" target="_blank" rel="noopener">${esc(entry.image.license)}</a>, via Wikimedia Commons</p><p class="m">Fichier : ${esc(entry.image.file)} (${esc(entry.image.origin)})</p>` : ""}
${entry.note ? `<p class="n">${esc(entry.note)}</p>` : ""}
</article>`;
const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Photos libres proposées — fiches minéraux</title>
<style>body{margin:0;padding:16px;background:#0b0612;color:#e6dcf5;font:15px/1.5 system-ui,sans-serif}h1{font-size:1.4rem;margin:0 0 6px}p.s{color:#b9a5d8;margin:0 0 16px}
.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px}.c{background:#160c26;border:1px solid #3a1d63;border-radius:8px;padding:10px;min-width:0}
.c.off{opacity:.6;border-style:dashed}.c img{width:100%;aspect-ratio:4/3;object-fit:contain;background:#000;border-radius:4px}.none{aspect-ratio:4/3;display:grid;place-items:center;background:#000;color:#8f7bb0;border-radius:4px}
h2{font-size:1.05rem;margin:8px 0 4px}a{color:#c4a6f5}.cr{font-size:.85rem;margin:4px 0}.m{font-size:.75rem;color:#8f7bb0;margin:2px 0;overflow-wrap:anywhere}.n{font-size:.8rem;color:#f0d9a8;margin:4px 0}</style></head><body>
<h1>Photos libres proposées pour les fiches minéraux</h1>
<p class="s">${found.length} photo(s) libre(s) trouvée(s) sur ${results.length} fiches — générée le ${new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}. Cliquez une photo pour voir sa page Commons (auteur, licence). Les cartes en pointillés n'ont pas de photo retenue.</p>
<div class="g">${[...found, ...results.filter(entry => entry.status !== "trouvee")].map(card).join("\n")}</div></body></html>`;
await writeFile(path.join(OUT, `${OUT_NAME}.html`), html);
console.log(`Terminé : ${found.length} photos libres sur ${results.length} fiches.`);
