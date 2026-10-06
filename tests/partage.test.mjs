// Partage : articles et pièces de la collection ou de la boutique utilisent la même carte image et le même menu de partage que les jeux.
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read = name => readFile(new URL(`../assets/js/${name}`, import.meta.url), "utf8");
test("l'article, le spécimen de la collection et la pièce de la boutique partagent avec la carte des jeux", async () => {
  const article = await read("article-page.js"), specimen = await read("specimen-page.js"), piece = await read("piece-page.js");
  assert.match(article, /sharePanel\(/); assert.match(article, /label: "📲 Partager cet article"/); assert.match(article, /url: pageLink\(\)/);
  assert.match(specimen, /sharePanel\(/); assert.match(specimen, /label: "📲 Partager cette pièce"/);
  assert.match(piece, /sharePanel\(/); assert.match(piece, /label: "📲 Partager cette pièce"/);
  for (const source of [article, specimen, piece]) assert.doesNotMatch(source, /shareButton/);
});
test("la carte de partage accepte un lien, un libellé et un titre sur plusieurs lignes", async () => {
  const share = await read("share.js");
  assert.match(share, /url = SITE, label = /);
  assert.match(share, /wrapTitle/); assert.match(share, /logoMaxHeight/);
  assert.match(share, /const message = `\$\{text\}\\n\$\{url\}`/);
});
test("l'aperçu du lien d'un article sans photo de couverture reprend la première image du texte", async () => {
  assert.match(await readFile(new URL("../tools/seo/build.mjs", import.meta.url), "utf8"), /photoUrl\(cfg, item\.media\) \|\| bodyImageUrl\(cfg, item\.body\)/);
});
