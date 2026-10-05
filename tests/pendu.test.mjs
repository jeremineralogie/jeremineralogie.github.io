// Pendu minéralogique : lettres sans accents, coups, victoire, défaite, indice, choix des mots.
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
globalThis.document ??= { dispatchEvent() {} };
const { lettersOf, newGame, guess, isWon, isLost, hint, prepare, pickWord, maxLength, MAX_ERRORS, normalize } = await import("../assets/js/pendu-logic.js");

const word = term => ({ term, slug: term, letters: lettersOf(term) });
test("lettres sans accents ni séparateurs", () => {
  assert.equal(lettersOf("Système cristallin"), "SYSTEMECRISTALLIN");
  assert.equal(lettersOf("Éclat-adamantin"), "ECLATADAMANTIN");
  assert.equal(normalize("é"), "E");
});
test("proposer E vaut pour É ; une même lettre deux fois ne coûte rien", () => {
  const game = newGame(word("Éclat"));
  assert.equal(guess(game, "e"), "hit"); assert.equal(guess(game, "E"), "known"); assert.equal(game.errors, 0);
  assert.equal(guess(game, "z"), "miss"); assert.equal(game.errors, 1); assert.equal(guess(game, "z"), "known"); assert.equal(game.errors, 1);
});
test("victoire quand toutes les lettres sont trouvées, défaite à 6 erreurs", () => {
  const game = newGame(word("Mica"));
  "MICA".split("").forEach(letter => guess(game, letter)); assert.ok(isWon(game)); assert.ok(!isLost(game));
  const lost = newGame(word("Mica")); "QWXYZV".split("").forEach(letter => guess(lost, letter)); assert.equal(lost.errors, MAX_ERRORS); assert.ok(isLost(lost));
});
test("indice : dévoile une lettre manquante pour un cristal, jamais le dernier, jamais la dernière lettre à trouver", () => {
  const game = newGame(word("Quartz"));
  const letter = hint(game, () => 0); assert.ok(letter && game.word.letters.includes(letter)); assert.equal(game.errors, 1);
  const last = newGame(word("Quartz")); last.errors = MAX_ERRORS - 1; assert.equal(hint(last), null);
  const almost = newGame(word("Aa")); guess(almost, "a"); assert.equal(hint(almost), null);
});
test("mots : définitions masquées, courts d'abord, jamais deux fois le même", async () => {
  const terms = JSON.parse(await readFile(new URL("./fixtures/quiz-glossaire.json", import.meta.url), "utf8").catch(() => "[]"));
  const pool = prepare(terms.length ? terms : [
    ...["Clivage", "Macle", "Éclat", "Densité", "Fracture", "Dureté", "Cristal", "Gangue", "Filon", "Géode", "Système cristallin", "Isotrope"].map(term => ({ term, slug: term, domain: "mineralogie", definition: `${term} : un mot de glossaire dont la définition est assez longue pour jouer.` }))
  ]);
  assert.ok(pool.length >= 10);
  pool.forEach(item => assert.ok(!item.text.toLowerCase().includes(item.term.toLowerCase()), `${item.term} visible dans sa définition`));
  const used = new Set();
  for (let round = 0; round < pool.length; round += 1) { const picked = pickWord(pool, round, used); if (!picked) break; assert.ok(!used.has(picked.slug)); used.add(picked.slug); }
  assert.ok(maxLength(0) < maxLength(5) && maxLength(5) < maxLength(9));
  assert.ok(pickWord(pool, 0, new Set(), () => 0).letters.length <= maxLength(0) || pool.every(item => item.letters.length > maxLength(0)));
});

test("fiche de partage : illustration du pendu", async () => {
  const { existsSync } = await import("node:fs");
  assert.ok(existsSync(new URL("../assets/decor/logo-pendu.webp", import.meta.url)));
  assert.match(await readFile(new URL("../assets/js/pendu.js", import.meta.url), "utf8"), /logo: "\/assets\/decor\/logo-pendu\.webp"/);
});
