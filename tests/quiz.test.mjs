// Quiz : cohérence des données, équilibre des résultats, règles du vrai ou faux et du glossaire en défi.
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { QUIZ } from "../assets/js/quiz-data.js";
import { QUIZ_PROSPECTEUR } from "../assets/js/quiz-prospecteur-data.js";
import { QUIZ_OUTIL } from "../assets/js/quiz-outil-data.js";
import { personaResult } from "../assets/js/quiz-persona.js";
import { buildStatements } from "../assets/js/quiz-vrai-faux.js";
import { buildQuestions, maskDefinition } from "../assets/js/quiz-glossaire.js";

globalThis.document ??= {}; // les modules de quiz n'utilisent le DOM que lors de l'affichage
const json = async name => JSON.parse(await readFile(new URL(`./fixtures/${name}`, import.meta.url), "utf8"));
const forbidden = /\blourd(e|es|s)?\b/i;

function personaChecks(name, data, results, runs) {
  test(`${name} : données complètes`, () => {
    assert.equal(data.questions.length, 10);
    data.questions.forEach(question => { assert.ok(question.q.length > 10); assert.equal(question.answers.length, 4); question.answers.forEach(answer => { assert.equal(answer.v.length, data.axes.length); assert.ok(answer.label.length > 2); }); });
    assert.equal(new Set(results.map(item => item.slug)).size, results.length, "slugs uniques");
    results.forEach(item => { assert.ok(item.text.length > 60, item.name); assert.equal(item.profile.length, data.axes.length); assert.ok(!forbidden.test(item.text + item.tagline), `mot interdit dans ${item.name}`); });
  });
  test(`${name} : tous les résultats sont atteignables et à peu près équilibrés`, () => {
    const counts = new Map();
    let seed = 12345; const random = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
    for (let run = 0; run < runs; run += 1) {
      const answers = Array.from({ length: 10 }, () => Math.floor(random() * 4));
      const slug = personaResult({ ...data, results }, answers).slug; counts.set(slug, (counts.get(slug) || 0) + 1);
    }
    assert.equal(counts.size, results.length, "un résultat n'est jamais obtenu");
    const expected = runs / results.length;
    for (const [slug, count] of counts) assert.ok(count > expected * 0.6 && count < expected * 1.5, `${slug} : ${(count / runs * 100).toFixed(1)} %`);
  });
}
personaChecks("Quel minéral es-tu", QUIZ, QUIZ.minerals, 30000);
personaChecks("Quel prospecteur es-tu", QUIZ_PROSPECTEUR, QUIZ_PROSPECTEUR.profiles, 20000);
personaChecks("Quel outil de prospecteur es-tu", QUIZ_OUTIL, QUIZ_OUTIL.profiles, 20000);
test("Quel outil de prospecteur es-tu : répondre toujours dans le sens d'un outil donne cet outil", () => {
  const data = { ...QUIZ_OUTIL, results: QUIZ_OUTIL.profiles };
  QUIZ_OUTIL.axes.forEach((tool, axis) => {
    const answers = QUIZ_OUTIL.questions.map(question => Math.max(0, question.answers.findIndex(answer => answer.v[axis])));
    const withTool = QUIZ_OUTIL.questions.filter(question => question.answers.some(answer => answer.v[axis])).length;
    if (withTool >= 4) assert.equal(personaResult(data, answers).icon, tool, tool);
  });
  QUIZ_OUTIL.profiles.forEach(item => { assert.equal(item.mineral.length, 3, item.name); assert.ok(item.icon, item.name); assert.ok(existsSync(new URL(`../assets/outils/${item.icon}.webp`, import.meta.url)), `image de ${item.name}`); });
});

test("Vrai ou faux : 10 affirmations, 5 vraies, jamais deux fois le même minéral", async () => {
  const rows = await json("quiz-minerals.json");
  for (let game = 0; game < 300; game += 1) {
    const statements = buildStatements(rows);
    assert.equal(statements.length, 10);
    assert.equal(statements.filter(item => item.answer).length, 5);
    const slugs = statements.flatMap(item => item.rows.map(row => row.slug));
    assert.equal(new Set(slugs).size, slugs.length, "minéral répété");
    statements.forEach(item => { assert.ok(item.text.length > 10 && item.explain.length > 10); });
  }
});
test("Vrai ou faux : aucune affirmation sur les variétés de silice (classement discuté)", async () => {
  const rows = await json("quiz-minerals.json");
  for (let game = 0; game < 200; game += 1) buildStatements(rows).forEach(item => item.rows.forEach(row => assert.ok(!(row.chemical_class.startsWith("Oxydes") && Number(row.density) < 3), row.name)));
});
test("Glossaire en défi : le terme cherché est masqué et les propositions sont distinctes", async () => {
  const terms = await json("quiz-glossaire.json");
  for (let game = 0; game < 100; game += 1) {
    const questions = buildQuestions(terms, 5);
    assert.ok(questions.length >= 5);
    questions.forEach(({ item, choices }) => {
      assert.equal(choices.length, 4); assert.equal(new Set(choices.map(choice => choice.slug)).size, 4);
      assert.ok(choices.some(choice => choice.slug === item.slug));
      const word = item.term.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().split(/\s+/).find(part => part.length >= 5);
      if (word) assert.ok(!item.text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().includes(word), `${item.term} visible dans sa définition`);
    });
  }
  assert.equal(maskDefinition("Le clivage est parfait, les clivages aussi.", "Clivage").text, "Le _____ est parfait, les _____ aussi.");
});
