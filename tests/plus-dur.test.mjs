// « Plus dur ou moins dur ? » : paires toujours justes (aucune égalité, aucun doute), difficulté croissante, série enregistrée.
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
globalThis.document ??= { dispatchEvent() {} }; globalThis.CustomEvent ??= class { constructor(type, init = {}) { this.type = type; this.detail = init.detail; } };
const store = new Map(); globalThis.localStorage ??= { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, String(value)), removeItem: key => store.delete(key) };
const { prepare, makePair, gapFor, poolFor, durete } = await import("../assets/js/plus-dur-logic.js");
const { recordSeriesPlay, getProgress, mergeProgress } = await import("../assets/js/game-progress.js");

const rows = JSON.parse(await readFile(new URL("./fixtures/quiz-minerals.json", import.meta.url), "utf8"));
const pool = prepare(rows);
let seed = 99; const random = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };

test("la base de test fournit assez de minéraux jouables", () => { assert.ok(pool.length >= 30, `${pool.length}`); });
test("chaque paire : le plus dur est bien le plus dur, sans chevauchement ni écart trop faible, sans minéral répété", () => {
  for (let game = 0; game < 200; game += 1) {
    const used = new Set();
    for (let round = 0; round < 25; round += 1) {
      const pair = makePair(pool, round, used, random);
      if (!pair) break;
      assert.ok(pair.hard.lo > pair.soft.hi, `${pair.hard.name} (${pair.hard.lo}) contre ${pair.soft.name} (${pair.soft.hi})`);
      assert.ok(pair.hard.mid - pair.soft.mid >= gapFor(round) - 1e-9, `écart manche ${round}`);
      assert.ok(!used.has(pair.hard.slug) && !used.has(pair.soft.slug), "minéral déjà vu");
      used.add(pair.hard.slug); used.add(pair.soft.slug);
    }
  }
});
test("la difficulté monte : écart de plus en plus serré, minéraux très connus au début", () => {
  assert.ok(gapFor(0) > gapFor(5) && gapFor(5) > gapFor(10) && gapFor(10) > gapFor(20));
  const early = poolFor(pool, 0);
  assert.ok(early.length <= pool.length && early.every(item => ["tres_commun", "commun"].includes(item.rarity) || early.length === pool.length));
});
test("durete : valeur ou fourchette", () => { assert.equal(durete({ lo: 7, hi: 7 }), "7"); assert.equal(durete({ lo: 6.5, hi: 7 }), "6,5 à 7"); });
test("série enregistrée : record conservé, fusion appareil / compte par meilleur score", () => {
  store.clear();
  recordSeriesPlay("plus-dur", 7); recordSeriesPlay("plus-dur", 3);
  const quiz = getProgress().quizzes["plus-dur"];
  assert.equal(quiz.plays, 2); assert.equal(quiz.best.score, 7); assert.equal(quiz.last.score, 3); assert.equal(quiz.best.streak, true);
  const merged = mergeProgress({ quizzes: { "plus-dur": { plays: 2, best: { score: 7, total: 1, streak: true }, last: { score: 3, total: 1, date: "2026-10-05" } } } }, { quizzes: { "plus-dur": { plays: 5, best: { score: 12, total: 1, streak: true }, last: { score: 1, total: 1, date: "2026-10-04" } } } });
  assert.equal(merged.quizzes["plus-dur"].best.score, 12); assert.equal(merged.quizzes["plus-dur"].plays, 5);
});

test("fiche de partage : l'illustration du jeu existe", async () => {
  const { existsSync } = await import("node:fs");
  assert.ok(existsSync(new URL("../assets/decor/logo-plus-dur.webp", import.meta.url)));
  const game = await readFile(new URL("../assets/js/plus-dur.js", import.meta.url), "utf8");
  assert.match(game, /logo: "\/assets\/decor\/logo-plus-dur\.webp"/);
});
