// Aperçu des fiches : seuls les liens surlignés vers minéraux, gisements, communes et départements ouvrent la petite fenêtre.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("la fenêtre ne concerne que les liens marqués data-fiche et ne bloque pas Ctrl / clic du milieu", () => {
  const source = read("assets/js/link-pop.js");
  assert.match(source, /a\[data-fiche\]/);
  assert.match(source, /ctrlKey \|\| event\.metaKey/);
  assert.match(source, /event\.button !== 0/);
  assert.doesNotMatch(source, /pieces|specimens/, "pièces et spécimens exclus");
});
test("les liens surlignés vers les fiches sont marqués, dans le JavaScript comme dans les pages générées", () => {
  assert.match(read("assets/js/entity-links.js"), /dataset\.fiche/);
  const build = read("tools/seo/build.mjs");
  assert.ok((build.match(/class="link" data-fiche/g) || []).length >= 3);
});
test("le script commun charge l'aperçu hors administration", () => {
  assert.match(read("script.js"), /link-pop\.js/);
});
