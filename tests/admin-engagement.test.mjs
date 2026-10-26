// Statistiques d'engagement de l'admin : langue, région estimée, réponses aux jeux, fiches ouvertes après une erreur, joueurs qui reviennent, ventes.
import test from "node:test";
import assert from "node:assert/strict";
import { languageName, countryOfTimezone, groupByCountry, mostMissed, bestKnown, hardestQuestions, parseFicheTarget, replayFigures, salesFigures, euros, percent } from "../assets/js/admin-stats-engagement.js";
import { readFileSync } from "node:fs";

test("langue du navigateur : nom français, code inconnu conservé", () => {
  assert.equal(languageName("fr-FR"), "Français"); assert.equal(languageName("en-US"), "Anglais"); assert.equal(languageName("xx-YY"), "XX-YY"); assert.equal(languageName(null), "Inconnue");
});

test("région estimée par le fuseau horaire : pays connus, régions pour les autres, jamais d'invention", () => {
  assert.equal(countryOfTimezone("Europe/Paris"), "France"); assert.equal(countryOfTimezone("Europe/Brussels"), "Belgique");
  assert.equal(countryOfTimezone("America/Montreal"), "Canada"); assert.equal(countryOfTimezone("America/Los_Angeles"), "États-Unis"); assert.equal(countryOfTimezone("Australia/Perth"), "Australie");
  assert.equal(countryOfTimezone("Indian/Reunion"), "La Réunion et Mayotte (France)");
  assert.equal(countryOfTimezone("Europe/Tirane"), "Europe (autre pays)"); assert.equal(countryOfTimezone(null), "Inconnu"); assert.equal(countryOfTimezone("Mars/Olympus"), "Inconnu");
  assert.deepEqual(groupByCountry([{ tz: "America/New_York", n: 2 }, { tz: "America/Chicago", n: 3 }, { tz: "Europe/Paris", n: 4 }]), [{ label: "États-Unis", n: 5 }, { label: "France", n: 4 }]);
});

test("réponses aux jeux : minéraux ratés, mieux reconnus, questions les plus difficiles", () => {
  const rows = [
    { game: "mineral", key: "pyrite", n: 10, ok: 4 }, { game: "quiz", key: "topaze", n: 6, ok: 6 }, { game: "mineral", key: "rare", n: 1, ok: 0 },
    { game: "glossaire", key: "clivage", n: 5, ok: 1 }, { game: "glossaire", key: "macle", n: 5, ok: 5 }, { game: "pendu", key: "x", n: 2, ok: 0 }
  ];
  assert.deepEqual(mostMissed(rows, ["mineral", "quiz"]).map(row => [row.key, row.missed]), [["pyrite", 6]], "au moins 2 réponses ; les parfaits n'y sont pas");
  assert.deepEqual(bestKnown(rows, ["mineral", "quiz"]).map(row => [row.key, row.rate]), [["topaze", 100], ["pyrite", 40]], "au moins 3 réponses");
  assert.deepEqual(hardestQuestions(rows, ["glossaire", "pendu"]).map(row => [row.key, row.rate]), [["clivage", 20], ["macle", 100]]);
});

test("fiche ouverte après une erreur : adresse → fiche", () => {
  assert.deepEqual(parseFicheTarget("/fiche.html?type=mineral&id=topaze"), { type: "mineral", slug: "topaze" });
  assert.deepEqual(parseFicheTarget("/mineraux/pyrite/"), { type: "mineral", slug: "pyrite" });
  assert.deepEqual(parseFicheTarget("/glossaire/clivage/"), { type: "term", slug: "clivage" });
  assert.equal(parseFicheTarget("/boutique.html"), null); assert.equal(parseFicheTarget(""), null);
});

test("joueurs qui reviennent : parts en pourcentage, sans division par zéro", () => {
  assert.deepEqual(replayFigures({ players: 20, next_day: 6, multi_day: 9, single_day: 11 }), { players: 20, nextDay: 6, nextDayPct: 30, multi: 9, multiPct: 45, single: 11 });
  assert.equal(replayFigures(null).nextDayPct, 0); assert.equal(percent(1, 0), 0);
});

test("ventes : chiffre d'affaires, panier moyen et ventes par mois, sur la période seulement", () => {
  const from = new Date(2026, 9, 1), to = new Date(2026, 9, 31, 10);
  const figures = salesFigures([
    { sold_on: "2026-10-05", price_cents: 1500 }, { sold_on: "2026-10-31", price_cents: 500 }, { sold_on: "2026-09-30", price_cents: 9900 }, { sold_on: "2026-11-01", price_cents: 700 }
  ], from, to);
  assert.equal(figures.count, 2); assert.equal(figures.total, 2000); assert.equal(figures.average, 1000);
  assert.deepEqual(figures.months, [{ month: "2026-10", count: 2, total: 2000 }]);
  assert.equal(salesFigures([], from, to).average, 0);
  assert.match(euros(1250), /12,50/); assert.match(euros(800), /8/);
});

test("la mesure d'audience envoie les nouvelles mesures sans identifier personne", () => {
  const code = readFileSync(new URL("../assets/js/analytics.js", import.meta.url), "utf8");
  for (const kind of ["engage", "scroll", "env", "plein-ecran".length ? "fiche-apres-erreur" : "", "lien-article"]) assert.ok(code.includes(kind), `mesure « ${kind} » présente`);
  assert.ok(/GAME_KINDS = \["start", "end", "answer"\]/.test(code), "l'identifiant de joueur anonyme n'est ajouté qu'aux événements de jeu");
  assert.ok(!/localStorage\.setItem\([^)]*page_views/.test(code));
  const migration = readFileSync(new URL("../supabase/migrations/20261026120000_engagement_stats.sql", import.meta.url), "utf8");
  for (const kind of ["engage", "scroll", "env", "answer"]) assert.ok(migration.includes(`'${kind}'`), `type d'événement « ${kind} » autorisé par la base`);
  assert.ok(/shop_sales[\s\S]*revoke all on public\.shop_sales from anon/.test(migration), "les ventes ne sont lisibles que par l'administrateur");
  const script = readFileSync(new URL("../script.js", import.meta.url), "utf8");
  assert.ok(script.includes("plein-ecran"), "l'ouverture d'une photo en plein écran est mesurée");
});
