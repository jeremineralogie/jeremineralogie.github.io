// Aperçu des fiches dans les jeux : un lien souligné vers une fiche minéral ouvre d'abord la petite fenêtre.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = file => readFileSync(new URL(`../assets/js/${file}`, import.meta.url), "utf8");

// Dans les jeux, un lien souligné vers une fiche minéral ouvre d'abord l'aperçu (link-pop.js) : il porte data-fiche.
test("les liens de fiche des jeux et quiz portent data-fiche", () => {
  const files = ["plus-dur.js", "quiz-vrai-faux.js", "classe-les.js", "quiz-glossaire.js", "mineral-photo-game.js", "games.js", "quiz-mineral.js", "quiz-collectionneur.js", "quiz-forme.js", "quiz-outil.js"];
  for (const file of files) {
    const lines = read(file).split("\n").filter(line => /\.href = ficheUrl\("mineral"/.test(line));
    assert.ok(lines.length, `${file} : aucun lien de fiche trouvé`);
    for (const line of lines) assert.match(line, /dataset\.fiche = ""/, `${file} : lien sans data-fiche`);
  }
});

test("les listes de minéraux (apprendre, articles liés, fiches) ouvrent l'aperçu", () => {
  assert.match(read("related.js"), /link\.dataset\.fiche = ""/);
  assert.match(read("apprendre-page.js"), /ficheLink\(ficheUrl\("mineral", mineral\.slug\), mineral\.name\)/);
  assert.match(read("entity-page.js"), /if \(!item\.term\) a\.dataset\.fiche = ""/);
});

