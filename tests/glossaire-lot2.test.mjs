// Glossaire, lot 2 : la migration générée ne contient que des termes complets, sans doublon, dans les trois domaines.
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const sql = await readFile(new URL("../supabase/migrations/20261007100000_glossary_lot2.sql", import.meta.url), "utf8");
const rows = [...sql.matchAll(/^select '((?:[^']|'')+)', '([a-z0-9-]+)', '(cristallographie|mineralogie|geologie)', '((?:[^']|'')+)', /gm)]
  .map(match => ({ term: match[1].replace(/''/g, "'"), slug: match[2], domain: match[3], definition: match[4].replace(/''/g, "'") }));
test("le lot compte tous ses termes, répartis dans les trois domaines", () => {
  assert.equal(rows.length, (sql.match(/^insert into public\.glossary_terms/gm) || []).length);
  assert.ok(rows.length >= 450, `${rows.length} termes`);
  for (const domain of ["cristallographie", "mineralogie", "geologie"]) assert.ok(rows.filter(row => row.domain === domain).length >= 70, domain);
});
test("chaque terme a un identifiant unique et une vraie définition", () => {
  assert.equal(new Set(rows.map(row => row.slug)).size, rows.length, "identifiants uniques");
  for (const row of rows) {
    assert.ok(row.definition.length >= 40 && row.definition.length <= 420, `${row.term} : ${row.definition.length} caractères`);
    assert.match(row.definition, /[.)]$/, `${row.term} : la définition finit par un point`);
  }
});
test("chaque insertion est sans effet si le terme existe déjà", () => {
  assert.equal((sql.match(/^where not exists \(select 1 from public\.glossary_terms where slug = '/gm) || []).length, rows.length);
});
test("le texte évite les sujets écartés du site (lithothérapie, ésotérisme)", () => {
  assert.doesNotMatch(sql, /lithoth|ésotér|chakra|énergie des pierres/i);
});
test("les mots courants des nouveaux termes ne sont pas reliés dans les textes", async () => {
  const { GENERIC } = await import("../assets/js/glossary-match.js");
  for (const word of ["table", "sable", "couronne", "strate", "dome", "atome", "silice", "provenance"]) assert.ok(GENERIC.has(word), word);
});
