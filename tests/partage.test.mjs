// Partage : articles et pièces de la collection ont leur bouton, avec le bon libellé.
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read = name => readFile(new URL(`../assets/js/${name}`, import.meta.url), "utf8");
test("l'article, le spécimen de la collection et la pièce de la boutique ont un bouton de partage", async () => {
  assert.match(await read("article-page.js"), /label: "Partager cet article"/);
  assert.match(await read("specimen-page.js"), /label: "Partager cette pièce"/);
  assert.match(await read("piece-page.js"), /label: "Partager cette pièce"/);
  assert.match(await read("share-button.js"), /label = "Partager cette fiche"/);
});
