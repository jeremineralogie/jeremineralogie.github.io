// Valeur du compte : badges réservés aux comptes, résultats gardés 7 jours, favoris fusionnés entre appareils, fenêtre de badge.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const store = new Map();
globalThis.localStorage = { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, String(value)), removeItem: key => store.delete(key) };
const events = [];
globalThis.document = { dispatchEvent: event => { events.push(event); return true; }, addEventListener() {} };
globalThis.CustomEvent = class { constructor(type, init = {}) { this.type = type; this.detail = init.detail; } };

const progress = await import("../assets/js/game-progress.js");
const { mergeFavorites } = await import("../assets/js/favorites.js");
const { shift, parisDay } = await import("../assets/js/badges.js");
const reset = () => { store.clear(); events.length = 0; };

test("sans compte : aucun badge n'est attribué ni annoncé", () => {
  reset(); progress.setLoggedIn(false);
  progress.recordLogin();
  assert.deepEqual(progress.getProgress().badges || {}, {});
  assert.equal(events.filter(event => event.type === "jm-badges").length, 0);
});
test("avec un compte : le badge est attribué et annoncé (fenêtre de félicitations)", () => {
  reset(); progress.setLoggedIn(true);
  progress.recordLogin();
  assert.ok(progress.getProgress().badges["connexion-bienvenue"]);
  const announced = events.filter(event => event.type === "jm-badges").flatMap(event => event.detail.badges.map(badge => badge.id));
  assert.ok(announced.includes("connexion-bienvenue"));
  progress.setLoggedIn(false);
});
test("les résultats du carnet sont supprimés après 7 jours", () => {
  reset();
  const old = shift(parisDay(), -8), fresh = shift(parisDay(), -6);
  store.set("jm-jeux", JSON.stringify({ cards: { vieux: { date: old, spec: {} }, recent: { date: fresh, spec: {} } } }));
  const cards = progress.getProgress().cards;
  assert.deepEqual(Object.keys(cards), ["recent"]);
});
test("favoris : l'événement le plus récent (ajout ou retrait) l'emporte", () => {
  const a = [{ type: "piece", id: "1", addedAt: "2026-10-01T10:00:00Z" }, { type: "piece", id: "2", addedAt: "2026-10-01T10:00:00Z" }];
  const b = [{ type: "piece", id: "1", addedAt: "2026-10-01T10:00:00Z", removedAt: "2026-10-02T10:00:00Z" }, { type: "mineral", id: "quartz", addedAt: "2026-10-03T10:00:00Z" }];
  const merged = mergeFavorites(a, b);
  assert.equal(merged.length, 3);
  assert.ok(merged.find(entry => entry.id === "1").removedAt, "le retrait plus récent est conservé");
  assert.ok(!merged.find(entry => entry.id === "2").removedAt);
  assert.equal(merged[0].id, "quartz", "tri : le plus récemment ajouté d'abord");
});
test("fenêtre de badge : délai de 3 secondes et pseudo du compte", () => {
  const source = readFileSync(new URL("../assets/js/badge-popup.js", import.meta.url), "utf8");
  assert.match(source, /DELAY = 3000/);
  assert.match(source, /user\?\.name/);
});
test("messages : rattachés au compte et visibles dans Mon espace", () => {
  const forms = readFileSync(new URL("../assets/js/forms.js", import.meta.url), "utf8");
  assert.match(forms, /user_id: session\?\.user\?\.id/);
  const space = readFileSync(new URL("../assets/js/mon-espace-page.js", import.meta.url), "utf8");
  assert.match(space, /from\("messages"\)[\s\S]*eq\("user_id"/);
});
test("Mon espace : un seul dessin affiché même si plusieurs se croisent", () => {
  const space = readFileSync(new URL("../assets/js/mon-espace-page.js", import.meta.url), "utf8");
  assert.match(space, /turn === drawing/);
  assert.doesNotMatch(space, /root\.append\(/);
});
