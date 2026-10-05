// Termes du glossaire : cliquables dans la documentation des spécimens et des pièces, et toujours en petite fenêtre (jamais un renvoi direct).
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read = name => readFile(new URL(`../assets/js/${name}`, import.meta.url), "utf8");

test("la documentation minéralogique des spécimens et des pièces relie ses termes au glossaire", async () => {
  assert.match(await read("specimen-page.js"), /linkProperties\(science\)/);
  assert.match(await read("piece-page.js"), /linkProperties\(science\)/);
  assert.match(await read("entity-page.js"), /linkProperties\(science\)/);
});
test("« Dureté » (libellé des spécimens) est relié à l'échelle de Mohs", async () => {
  assert.match(await read("glossary-match.js"), /"Dureté": "echelle-de-mohs"/);
});
test("les liens vers un terme dans les jeux et quiz ouvrent la petite fenêtre au lieu du glossaire", async () => {
  assert.match(await read("quiz-glossaire.js"), /dataset\.slug = item\.slug/);
  assert.match(await read("pendu.js"), /glossLink\(word\.slug/);
  assert.match(await read("quiz-forme.js"), /glossLink\("systeme-cristallin"/);
  assert.match(await read("glossary-links.js"), /export async function enablePopovers/);
});
