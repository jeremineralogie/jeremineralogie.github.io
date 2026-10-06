// Générateur de pages pour Google : lancé sur des données d'essai (tests/fixtures/seo) dans un dossier temporaire, puis contrôles des pages produites.
import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { cp, mkdtemp, mkdir, readdir, readFile, rm, copyFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let tmp, output;

before(async () => {
  tmp = await mkdtemp(path.join(os.tmpdir(), "jm-seo-"));
  for (const file of (await readdir(REPO)).filter(name => name.endsWith(".html") || name === "sitemap.xml")) await copyFile(path.join(REPO, file), path.join(tmp, file));
  await cp(path.join(REPO, "assets/js"), path.join(tmp, "assets/js"), { recursive: true });
  await mkdir(path.join(tmp, "assets/mineraux-photos"), { recursive: true });
  await copyFile(path.join(REPO, "assets/mineraux-photos/credits.json"), path.join(tmp, "assets/mineraux-photos/credits.json"));
  await cp(path.join(REPO, "tools/seo"), path.join(tmp, "tools/seo"), { recursive: true });
  const { stdout } = await run("node", ["tools/seo/build.mjs"], { cwd: tmp, env: { ...process.env, SEO_FIXTURES: path.join(REPO, "tests/fixtures/seo") } });
  output = stdout;
});
after(async () => { if (tmp) await rm(tmp, { recursive: true, force: true }); });

const read = file => readFile(path.join(tmp, file), "utf8");
const visible = html => html.split('<div data-seo>')[1]?.split('<p class="notice"')[0] ?? "";

test("le générateur annonce les pages produites", () => assert.match(output, /Pages générées : \d+/));

test("chaque fiche minéral a titre, adresse canonique, fil d'Ariane et JSON-LD valide", async () => {
  const dir = path.join(tmp, "mineraux");
  for (const slug of await readdir(dir)) {
    const html = await read(`mineraux/${slug}/index.html`);
    assert.match(html, /<title>[^<]{10,}<\/title>/, slug);
    assert.ok(html.includes(`<link rel="canonical" href="https://jeremineralogie.fr/mineraux/${slug}/">`), slug);
    assert.equal((html.match(/class="crumbs"/g) || []).length, 1, `fil d'Ariane de ${slug}`);
    for (const block of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) JSON.parse(block[1].replace(/\\u003c/g, "<"));
  }
});

test("un terme du glossaire n'est relié qu'une fois par fiche (pages pour Google)", async () => {
  for (const slug of await readdir(path.join(tmp, "mineraux"))) {
    const links = [...visible(await read(`mineraux/${slug}/index.html`)).matchAll(/class="gloss" href="([^"]+)"/g)].map(match => match[1]);
    assert.equal(new Set(links).size, links.length, `termes répétés sur ${slug} : ${links.join(", ")}`);
  }
});

test("la fiche de la fluorite relie ses propriétés précises", async () => {
  const html = visible(await read("mineraux/fluorite/index.html"));
  assert.match(html, /href="\/glossaire\/cubique\/"/);
  assert.match(html, /href="\/glossaire\/systeme-cristallin\/"/);
});

test("articles et documents : fiches liées, fil d'Ariane, un seul lien par fiche citée", async () => {
  for (const [folder, crumb] of [["lire", "Articles"], ["documents", "Archives"]]) {
    for (const slug of await readdir(path.join(tmp, folder))) {
      const html = visible(await read(`${folder}/${slug}/index.html`));
      assert.ok(html.includes("class=\"crumbs\"") && html.includes(crumb), `${folder}/${slug}`);
      const hrefs = [...html.matchAll(/<a class="link" href="(\/mineraux\/[^"]+)">/g)].map(match => match[1]);
      const inText = hrefs.slice(0, Math.max(0, hrefs.length - 1));
      assert.equal(new Set(inText).size, inText.length, `lien répété dans ${slug}`);
    }
  }
});

test("l'annuaire caché est dans Apprendre & identifier mais pas dans les pages de termes", async () => {
  const apprendre = await read("apprendre.html");
  assert.match(apprendre, /<!--seo-index-->[\s\S]*data-seo-index[\s\S]*<!--\/seo-index-->/);
  assert.ok((apprendre.match(/<li><a href="\/mineraux\//g) || []).length >= 10);
  assert.ok((apprendre.match(/<li><a href="\/glossaire\//g) || []).length >= 5);
  for (const slug of await readdir(path.join(tmp, "glossaire"))) assert.ok(!(await read(`glossaire/${slug}/index.html`)).includes("data-seo-index"), slug);
});

test("le plan du site contient les pages fixes (dont Jeux & quiz) et les pages générées", async () => {
  const sitemap = await read("sitemap.xml");
  for (const loc of ["/jeux.html", "/apprendre.html", "/mineraux/fluorite/", "/glossaire/clivage/"]) assert.ok(sitemap.includes(`https://jeremineralogie.fr${loc}`), loc);
  assert.equal(new Set(sitemap.match(/<loc>[^<]+<\/loc>/g)).size, (sitemap.match(/<loc>/g) || []).length, "adresses en double");
});

test("aucun lien cassé dans le contenu fabriqué par le générateur", async () => {
  const exists = async target => readFile(path.join(tmp, target.replace(/\/$/, ""), target.endsWith("/") ? "index.html" : "")).then(() => true, () => false);
  const folders = ["mineraux", "glossaire", "gisements", "communes", "departements", "themes", "pieces", "specimens", "lire", "documents"];
  let checked = 0;
  for (const folder of folders) {
    for (const entry of await readdir(path.join(tmp, folder))) {
      const file = entry === "index.json" ? null : `${folder}/${entry}/index.html`; if (!file) continue;
      const html = await read(file).catch(() => "");
      const block = folder === "glossaire" ? (html.split('<div class="visually-hidden" data-seo>')[1]?.split("</div>")[0] ?? "") : (html.includes("<div data-seo>") ? visible(html) : "");
      for (const match of block.matchAll(/href="(\/[^"#?]*\/)"/g)) { checked += 1; assert.ok(await exists(match[1]), `${file} → ${match[1]} n'existe pas`); }
    }
  }
  assert.ok(checked > 50, `seulement ${checked} liens contrôlés`);
});

test("un article et une archive listent les pièces de la collection et de la boutique qui leur sont liées", async () => {
  const article = visible(await read("lire/le-trait/index.html"));
  assert.match(article, /Fiches liées :.*Fluorite — Saint-Jacques-d’Ambur/s);
  assert.ok(article.includes('href="/pieces/jmquec1/"'), "pièce de la boutique disponible");
  assert.ok(!article.includes("jmsold1"), "pièce vendue absente");
  const archive = visible(await read("documents/les-mineraux/index.html"));
  assert.ok(archive.includes('href="/specimens/fluorite-la-barre/"'), "spécimen de la collection");
});
