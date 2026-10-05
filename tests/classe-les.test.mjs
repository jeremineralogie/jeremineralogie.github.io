// « Classe-les ! » : tirages toujours justes (aucune égalité ni chevauchement), difficulté croissante, correction.
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
const { CRITERIA, COUNT, makeChallenge, check, prepare, titleOf, valueText } = await import("../assets/js/classe-les-logic.js");
const rows = JSON.parse(await readFile(new URL("./fixtures/quiz-minerals.json", import.meta.url), "utf8"));
let seed = 7; const random = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };

test("assez de minéraux jouables pour chaque critère", () => { for (const key of Object.keys(CRITERIA)) assert.ok(prepare(rows, key).length >= 30, key); });
test("chaque défi : 5 minéraux distincts, bien ordonnés, sans chevauchement ni écart trop faible, jamais déjà vus", () => {
  const seen = { durete: 0, densite: 0 };
  for (let game = 0; game < 150; game += 1) {
    const used = new Set();
    for (let round = 0; round < 12; round += 1) {
      const challenge = makeChallenge(rows, round, used, random);
      if (!challenge) break;
      seen[challenge.key] += 1;
      assert.equal(challenge.items.length, COUNT); assert.equal(new Set(challenge.items.map(item => item.slug)).size, COUNT);
      const sign = challenge.desc ? -1 : 1, gap = CRITERIA[challenge.key].gap(round);
      for (let i = 1; i < COUNT; i += 1) {
        const a = challenge.items[i - 1], b = challenge.items[i];
        assert.ok(sign * (b.mid - a.mid) >= gap - 1e-9, `${a.name} / ${b.name} : écart`);
        assert.ok(challenge.desc ? b.hi < a.lo : a.hi < b.lo, `${a.name} / ${b.name} : chevauchement`);
      }
      challenge.items.forEach(item => { assert.ok(!used.has(item.slug)); used.add(item.slug); });
      assert.ok(challenge.shuffled.some((item, index) => item !== challenge.items[index]), "déjà dans l'ordre");
    }
  }
  assert.ok(seen.durete > 0 && seen.densite > 0, "les deux critères sortent");
});
test("difficulté : les écarts se resserrent", () => { for (const c of Object.values(CRITERIA)) assert.ok(c.gap(0) > c.gap(4) && c.gap(4) > c.gap(9)); });
test("correction : bonnes places marquées, réussite seulement si tout est juste", () => {
  const challenge = makeChallenge(rows, 0, new Set(), random);
  assert.ok(check(challenge, challenge.items).perfect);
  const swapped = [...challenge.items]; [swapped[0], swapped[1]] = [swapped[1], swapped[0]];
  const result = check(challenge, swapped); assert.ok(!result.perfect); assert.deepEqual(result.marks.slice(0, 2), [false, false]); assert.deepEqual(result.marks.slice(2), [true, true, true]);
  assert.match(titleOf(challenge), /^Classe ces minéraux du /);
  assert.equal(valueText({ lo: 6.5, hi: 7 }), "6,5 à 7");
});
test("fiche de partage : l'illustration existe et le jeu l'utilise", async () => {
  assert.ok(existsSync(new URL("../assets/decor/logo-classe-les.webp", import.meta.url)));
  assert.match(await readFile(new URL("../assets/js/classe-les.js", import.meta.url), "utf8"), /logo: "\/assets\/decor\/logo-classe-les\.webp"/);
});
