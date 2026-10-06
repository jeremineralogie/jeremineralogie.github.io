// Statistiques de l'admin : périodes 1 / 3 / 7 / 15 / 30 jours, comparaisons, séries complétées, constats, export.
import test from "node:test";
import assert from "node:assert/strict";
import { PERIODS, ranges, compareText, hasPrevious, bucketFor, groupPoints, delta, dailyPoints, hourlyPoints, insights, toCsv, percent } from "../assets/js/admin-stats-logic.js";

test("les périodes demandées existent : 1, 3, 7, 15, 30 jours, 3, 6 et 12 mois", () => {
  assert.deepEqual(PERIODS.map(period => period.days), [1, 3, 7, 15, 30, 90, 180, 365]);
  assert.deepEqual(PERIODS.map(period => period.label), ["1 j", "3 j", "7 j", "15 j", "30 j", "3 mois", "6 mois", "12 mois"]);
  assert.equal(compareText(90), "aux 3 mois précédents"); assert.equal(compareText(365), "aux 12 mois précédents");
});

test("les longues périodes sont regroupées par semaine ou par mois, et la comparaison disparaît quand les données ne sont plus conservées", () => {
  assert.deepEqual([30, 90, 180, 365].map(bucketFor), ["day", "week", "week", "month"]);
  const now = new Date(2026, 9, 6, 12);
  assert.equal(hasPrevious(ranges(180, now).previousFrom, now), true, "6 mois : encore comparable");
  assert.equal(hasPrevious(ranges(365, now).previousFrom, now), false, "12 mois : la période précédente a été effacée");
  const { from, to } = ranges(90, now);
  const points = dailyPoints([{ t: "2026-10-05T00:00:00", visits: 4, views: 9 }, { t: "2026-10-06T00:00:00", visits: 1, views: 2 }, { t: "2026-09-29T00:00:00", visits: 2, views: 3 }], from, to);
  const weeks = groupPoints(points, "week");
  assert.ok(weeks.every(week => week.date.getDay() === 1), "les semaines commencent un lundi");
  assert.deepEqual(weeks.slice(-2).map(week => week.visits), [2, 5]);
  const months = groupPoints(dailyPoints([{ t: "2026-10-05T00:00:00", visits: 4, views: 9 }, { t: "2026-09-29T00:00:00", visits: 2, views: 3 }], ...Object.values(ranges(365, now)).slice(0, 2)), "month");
  assert.equal(months.length, 13); assert.deepEqual(months.slice(-2).map(month => month.visits), [2, 4]);
  assert.equal(months.reduce((sum, month) => sum + month.views, 0), 12);
});

test("« 7 j » couvre aujourd'hui et les 6 jours précédents, comparés aux 7 jours d'avant à la même heure", () => {
  const now = new Date(2026, 9, 6, 15, 30);
  const { from, to, previousFrom, previousTo } = ranges(7, now);
  assert.equal(from.getTime(), new Date(2026, 8, 30, 0, 0).getTime());
  assert.equal(to.getTime(), now.getTime());
  assert.equal(previousFrom.getTime(), new Date(2026, 8, 23, 0, 0).getTime());
  assert.equal(previousTo.getTime(), new Date(2026, 8, 29, 15, 30).getTime());
  const today = ranges(1, now);
  assert.equal(today.from.getTime(), new Date(2026, 9, 6).getTime());
  assert.equal(today.previousFrom.getTime(), new Date(2026, 9, 5).getTime(), "hier depuis minuit");
  assert.equal(today.previousTo.getTime(), new Date(2026, 9, 5, 15, 30).getTime(), "hier à la même heure");
  assert.equal(compareText(1), "à hier à la même heure");
  assert.equal(compareText(15), "aux 15 jours précédents");
});

test("l'évolution se lit sans division par zéro", () => {
  assert.deepEqual(delta(120, 100), { pct: 20, direction: "up" });
  assert.deepEqual(delta(75, 100), { pct: -25, direction: "down" });
  assert.deepEqual(delta(100, 100), { pct: 0, direction: "flat" });
  assert.deepEqual(delta(5, 0), { pct: null, direction: "up" });
  assert.deepEqual(delta(0, 0), { pct: 0, direction: "flat" });
  assert.equal(delta(5, null), null);
  assert.equal(percent(1, 3), 33); assert.equal(percent(1, 0), 0);
});

test("chaque jour de la période a un point, complété par des zéros", () => {
  const now = new Date(2026, 9, 6, 10);
  const { from, to } = ranges(3, now);
  const points = dailyPoints([{ t: "2026-10-05T00:00:00", visits: 4, views: 9 }], from, to);
  assert.deepEqual(points.map(point => [point.visits, point.views]), [[0, 0], [4, 9], [0, 0]]);
  const hours = hourlyPoints([{ h: 9, visits: 2, views: 5 }], new Date(2026, 9, 6, 11, 5));
  assert.equal(hours.length, 12); assert.deepEqual([hours[9].visits, hours[10].visits], [2, 0]);
});

test("les constats ne disent que ce que montrent les chiffres", () => {
  const points = dailyPoints([{ t: "2026-10-04T00:00:00", visits: 9, views: 20 }, { t: "2026-10-05T00:00:00", visits: 3, views: 6 }], ...Object.values(ranges(3, new Date(2026, 9, 6, 10))).slice(0, 2));
  const notes = insights({ days: 3, totals: { visits: 12, views: 26 }, previous: { visits: 10, views: 20 }, points,
    more: { hours: [{ h: 21, visits: 6 }, { h: 9, visits: 6 }], weekdays: [], bounce: { visits: 12, single: 3 } },
    devices: [{ device: "mobile", visits: 9 }, { device: "ordinateur", visits: 3 }], sources: [{ source: "Google", visits: 6 }, { source: "Accès direct", visits: 6 }], pageName: "Boutique", broken: 2, emptySearches: 0 });
  const text = notes.map(note => note.text).join("\n");
  assert.match(text, /12 visites : \+20 % par rapport aux 3 jours précédents/);
  assert.match(text, /Meilleur jour : dimanche 4 octobre \(9 visites\)/);
  assert.match(text, /75 % des visites se font sur téléphone/);
  assert.match(text, /25 % des visites s'arrêtent à une seule page/);
  assert.match(text, /2 liens cassés détectés/);
  assert.deepEqual(insights({ days: 7, totals: { visits: 0, views: 0 }, previous: null, points: [], more: null, devices: [], sources: [] }), []);
});

test("l'export CSV s'ouvre dans Excel en français", () => {
  const csv = toCsv([{ d: "2026-10-05", visits: 4, source: 'Google "FR"' }], [{ label: "Jour", value: row => row.d }, { label: "Visites", value: row => row.visits }, { label: "Source", value: row => row.source }]);
  assert.equal(csv, '﻿"Jour";"Visites";"Source"\r\n"2026-10-05";"4";"Google ""FR"""');
});
