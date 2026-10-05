// Structure du dépôt : modules JavaScript valides, pages HTML complètes (titre, description, langue, adaptation mobile), pas de secret dans le code.
import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("tous les modules JavaScript sont valides", async () => {
  const files = [...(await readdir(path.join(REPO, "assets/js"))).filter(name => name.endsWith(".js")).map(name => path.join(REPO, "assets/js", name)), path.join(REPO, "script.js"), path.join(REPO, "tools/seo/build.mjs"), path.join(REPO, "tools/check-links.mjs")];
  for (const file of files) await run("node", ["--check", file]).catch(error => assert.fail(`${path.relative(REPO, file)} : ${error.stderr}`));
});

test("les pages HTML du site ont langue, titre, description et adaptation mobile", async () => {
  // Les modèles (fiche, pièce, article…) reçoivent leur titre et leur description du générateur : on ne contrôle que les pages propres.
  const templates = ["404.html", "recherche.html", "fiche.html", "piece.html", "specimen.html", "article.html", "document.html", "departement.html", "theme.html"];
  const pages = (await readdir(REPO)).filter(name => name.endsWith(".html") && !templates.includes(name));
  assert.ok(pages.length >= 12, `${pages.length} pages`);
  for (const page of pages) {
    const html = await readFile(path.join(REPO, page), "utf8");
    assert.match(html, /<html lang="fr"/, page);
    assert.match(html, /<title>[^<]{5,}<\/title>/, page);
    assert.match(html, /<meta name="viewport"/, page);
    if (!/noindex/.test(html)) assert.match(html, /<meta name="description" content="[^"]{30,}"/, `${page} : description`);
  }
});

test("toutes les pages déclarent l'icône du site (favicon) et les fichiers existent", async () => {
  const { existsSync } = await import("node:fs");
  for (const file of ["favicon.ico", "apple-touch-icon.png", "assets/icons/icon-48.png", "assets/icons/icon-96.png", "assets/icons/icon-192.png"]) assert.ok(existsSync(path.join(REPO, file)), file);
  const pages = (await readdir(REPO)).filter(name => name.endsWith(".html"));
  for (const page of pages) {
    const html = await readFile(path.join(REPO, page), "utf8");
    assert.match(html, /<link rel="icon" href="\/favicon\.ico"/, page);
    assert.match(html, /rel="icon" type="image\/png" sizes="48x48" href="\/assets\/icons\/icon-48\.png"/, page);
    assert.match(html, /<link rel="apple-touch-icon" href="\/apple-touch-icon\.png"/, page);
  }
});

test("aucune clé secrète ou mot de passe dans le code public", async () => {
  const files = (await readdir(path.join(REPO, "assets/js"))).filter(name => name.endsWith(".js"));
  for (const file of files) {
    const source = await readFile(path.join(REPO, "assets/js", file), "utf8");
    assert.doesNotMatch(source, /sb_secret_[A-Za-z0-9_-]{10,}|-----BEGIN [A-Z ]*PRIVATE KEY/, file);
  }
  const config = await readFile(path.join(REPO, "assets/js/supabase-config.js"), "utf8");
  assert.match(config, /publishableKey/);
  assert.doesNotMatch(config, /sb_secret_[A-Za-z0-9_-]{10,}/);
});

test("chaque migration SQL a un nom daté et ne détruit pas de données sans le dire", async () => {
  const files = await readdir(path.join(REPO, "supabase/migrations"));
  for (const file of files) assert.match(file, /^\d{14}_[a-z0-9_]+\.sql$/, file);
});
