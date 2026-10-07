// Carnet de terrain : règles des 19 badges, séries, fusion entre appareils et compte.
import test from "node:test";
import assert from "node:assert/strict";
import { BADGES, CATEGORIES, awardBadges, statsOf, currentStreak, longestStreak, shift } from "../assets/js/badges.js";
import { mergeProgress } from "../assets/js/game-progress.js";

const TODAY = "2026-10-10";
const days = (count, end = TODAY) => Array.from({ length: count }, (_, index) => shift(end, -index));
const games = count => Object.fromEntries(days(count).map(day => [day, { score: 1 }]));
const earned = state => Object.keys(awardBadges(state, TODAY).reduce((acc, badge) => ({ ...acc, [badge.id]: 1 }), {}));

test("19 badges : 4 connexion, 5 jeux, 6 quiz, 4 navigation, chacun avec nom, logo et condition", () => {
  assert.equal(BADGES.length, 19);
  assert.equal(new Set(BADGES.map(badge => badge.id)).size, 19);
  const expected = { connexion: 4, jeux: 5, quiz: 6, navigation: 4 };
  for (const [category] of CATEGORIES) assert.equal(BADGES.filter(badge => badge.category === category).length, expected[category], category);
  BADGES.forEach(badge => { assert.ok(badge.icon.length >= 1 && badge.name.length > 3 && badge.rule.length > 5, badge.id); });
});
test("séries : en cours (aujourd'hui ou hier) et plus longue", () => {
  assert.equal(currentStreak(days(5), TODAY), 5);
  assert.equal(currentStreak(days(5, shift(TODAY, -1)), TODAY), 5, "hier compte encore");
  assert.equal(currentStreak(days(5, shift(TODAY, -2)), TODAY), 0, "série cassée");
  assert.equal(longestStreak([...days(3), ...days(9, shift(TODAY, -20))]), 9);
});
test("connexion : bienvenue, 7, 30 et 90 jours d'affilée", () => {
  assert.deepEqual(earned({ accountCreated: TODAY }), ["connexion-bienvenue"]);
  assert.deepEqual(earned({ accountCreated: TODAY, visits: days(7) }).sort(), ["connexion-7", "connexion-bienvenue"]);
  assert.ok(earned({ accountCreated: TODAY, visits: days(30) }).includes("connexion-30"));
  const all = earned({ accountCreated: TODAY, visits: days(90) }); assert.ok(["connexion-7", "connexion-30", "connexion-90"].every(id => all.includes(id)));
  assert.ok(!earned({ visits: [...days(6), ...days(6, shift(TODAY, -10))] }).includes("connexion-7"), "7 jours non consécutifs");
});
const replayAll = plays => ({ "vrai-faux": { plays }, glossaire: { plays }, "plus-dur": { plays }, pendu: { plays }, "classe-les": { plays } });
const personasAll = { mineral: { slug: "a" }, prospecteur: { slug: "b" }, outil: { slug: "c" }, collectionneur: { slug: "d" }, forme: { slug: "e" } };
test("jeux : première partie (jeu du jour ou jeu à rejouer), une partie de chacun des jeux, séries de 7 et 30 jours sur les jeux du jour", () => {
  assert.deepEqual(earned({ mineral: games(1), quiz: {}, geo: {} }), ["jeux-premiere"]);
  assert.deepEqual(earned({ quizzes: { pendu: { plays: 1 } } }), ["jeux-premiere"], "une partie d'un jeu à rejouer compte");
  assert.ok(!earned({ mineral: games(1), quiz: games(1), geo: games(1) }).includes("jeux-curieux"), "les jeux à rejouer manquent");
  assert.ok(!earned({ mineral: games(1), quiz: games(1), geo: games(1), quizzes: { ...replayAll(1), pendu: { plays: 0 } } }).includes("jeux-curieux"), "le pendu manque");
  assert.ok(earned({ mineral: games(1), quiz: games(1), geo: games(1), quizzes: replayAll(1) }).includes("jeux-curieux"));
  assert.ok(!earned({ mineral: games(7), quiz: games(7), geo: games(6) }).includes("jeux-serie-7"), "un jeu à 6 jours seulement");
  assert.ok(earned({ mineral: games(7), quiz: games(7), geo: games(7) }).includes("jeux-serie-7"));
  assert.ok(earned({ mineral: games(30), quiz: games(30), geo: games(30) }).includes("jeux-serie-30"));
});
test("jeux : champion = 10 parties de chacun des jeux", () => {
  assert.ok(!earned({ mineral: games(10), quiz: games(10), geo: games(10), quizzes: replayAll(9) }).includes("quiz-dix-fois"), "9 parties d'un jeu à rejouer");
  assert.ok(!earned({ mineral: games(10), quiz: games(10), geo: games(9), quizzes: replayAll(10) }).includes("quiz-dix-fois"), "9 jours sur un jeu du jour");
  assert.ok(earned({ mineral: games(10), quiz: games(10), geo: games(10), quizzes: replayAll(10) }).includes("quiz-dix-fois"));
  assert.equal(BADGES.find(badge => badge.id === "quiz-dix-fois").category, "jeux");
});
test("quiz : faire tous les quiz (un seul passage chacun) et un badge de partage par quiz", () => {
  assert.ok(earned({ personas: personasAll }).includes("quiz-tous"));
  assert.ok(!earned({ personas: { mineral: { slug: "a" }, prospecteur: { slug: "b" } } }).includes("quiz-tous"), "trois quiz jamais faits");
  assert.ok(!earned({ quizzes: replayAll(20) }).includes("quiz-tous"), "les jeux à rejouer ne sont pas des quiz");
  assert.equal(BADGES.find(badge => badge.id === "quiz-tous").rule, "Faire tous les quiz");
  const share = { mineral: "quiz-partage-mineral", prospecteur: "quiz-partage-prospecteur", outil: "quiz-partage-outil", collectionneur: "quiz-partage-collectionneur", forme: "quiz-partage-forme" };
  for (const [kind, id] of Object.entries(share)) assert.deepEqual(earned({ shares: { [`persona-${kind}`]: TODAY } }), [id], kind);
  assert.deepEqual(earned({ shares: { mineral: TODAY, "vrai-faux": TODAY } }), [], "le partage d'un jeu ne donne pas de badge de quiz");
});
test("navigation : pages, fiches minéraux et favoris", () => {
  const pages = n => Array.from({ length: n }, (_, index) => `/page-${index}/`);
  assert.ok(!earned({ nav: { pages: pages(9) } }).includes("nav-pages"));
  assert.ok(earned({ nav: { pages: pages(10) } }).includes("nav-pages"));
  assert.ok(earned({ nav: { minerals: pages(50) } }).includes("nav-fiches"));
  assert.deepEqual(earned({ nav: { favMax: 1 } }), ["nav-favori"]);
  assert.deepEqual(earned({ nav: { favMax: 10 } }).sort(), ["nav-favori", "nav-favoris-10"]);
});
test("un badge obtenu garde sa date même si la série s'interrompt", () => {
  const state = { visits: days(7), badges: { "connexion-7": "2026-01-01" } };
  awardBadges(state, TODAY); assert.equal(state.badges["connexion-7"], "2026-01-01");
  const broken = { visits: [], badges: { "connexion-7": "2026-01-01" } };
  awardBadges(broken, TODAY); assert.equal(broken.badges["connexion-7"], "2026-01-01");
});
test("fusion appareil + compte : unions, maxima, plus anciennes dates, anciens badges abandonnés", () => {
  const a = { mineral: { "2026-10-01": { score: 3 } }, visits: ["2026-10-01", "2026-10-02"], accountCreated: "2026-10-02", nav: { pages: ["/a/"], minerals: ["quartz"], favMax: 2 }, quizzes: { "vrai-faux": { plays: 3, last: { score: 6, total: 10, date: "2026-10-02" }, best: { score: 8, total: 10, date: "2026-10-01" } } }, shares: { "persona-mineral": "2026-10-05" }, earned: { vieux: "2026-01-01" }, shared: "2026-01-01", cards: { geo: { date: "2026-10-01", spec: { big: "1" } } } };
  const b = { mineral: { "2026-10-01": { score: 5 }, "2026-10-03": { score: 1 } }, visits: ["2026-10-02", "2026-10-03"], accountCreated: "2026-09-20", nav: { pages: ["/b/", "/a/"], minerals: ["calcite"], favMax: 4 }, quizzes: { "vrai-faux": { plays: 5, last: { score: 9, total: 10, date: "2026-10-04" }, best: { score: 9, total: 10, date: "2026-10-04" } } }, shares: { "persona-mineral": "2026-10-04" }, cards: { geo: { date: "2026-10-03", spec: { big: "2" } } } };
  const out = mergeProgress(a, b);
  assert.equal(out.mineral["2026-10-01"].score, 5); assert.equal(Object.keys(out.mineral).length, 2);
  assert.deepEqual(out.visits, ["2026-10-01", "2026-10-02", "2026-10-03"]);
  assert.equal(out.accountCreated, "2026-09-20");
  assert.deepEqual(out.nav.pages.sort(), ["/a/", "/b/"]); assert.equal(out.nav.favMax, 4); assert.equal(out.nav.minerals.length, 2);
  assert.equal(out.quizzes["vrai-faux"].plays, 5); assert.equal(out.quizzes["vrai-faux"].best.score, 9); assert.equal(out.quizzes["vrai-faux"].last.date, "2026-10-04");
  assert.equal(out.shares["persona-mineral"], "2026-10-04");
  assert.equal(out.cards.geo.spec.big, "2", "résultat le plus récent");
  assert.equal(out.earned, undefined); assert.equal(out.shared, undefined);
  assert.ok(out.badges["connexion-bienvenue"], "les badges se recalculent après fusion");
});
test("les statistiques d'une progression vide sont nulles", () => {
  const stats = statsOf({}, TODAY);
  assert.equal(stats.connect.streak, 0); assert.equal(stats.games.any, 0); assert.equal(stats.nav.pages, 0); assert.equal(stats.quizzes.all, false);
});
