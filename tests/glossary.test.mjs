// Liens du glossaire : un terme n'est relié qu'une fois par page, les mots courants ne sont reliés que dans les champs précis.
import test from "node:test";
import assert from "node:assert/strict";
import { matcher, glossaryParts, propertyParts, termHits } from "../assets/js/glossary-match.js";

const term = (slug, name) => ({ slug, term: name, domain: "mineralogie", definition: "x" });
const TERMS = [term("clivage", "Clivage"), term("clivage-parfait", "Clivage parfait"), term("cubique", "Cubique"), term("eclat-vitreux", "Éclat vitreux"), term("taille", "Taille"), term("massif", "Massif"), term("cassure-irreguliere", "Cassure irrégulière"), term("halogenure", "Halogénure"), term("systeme-cristallin", "Système cristallin")];
const bySlug = new Map(TERMS.map(row => [row.slug, row]));
const linked = parts => parts.filter(part => part.term).map(part => part.term.slug);

test("première occurrence seulement : deuxième texte sans nouveau lien", () => {
  const keys = matcher(TERMS); const used = new Set();
  const first = linked(glossaryParts("Un éclat vitreux et un éclat vitreux.", keys, used));
  const second = linked(glossaryParts("Encore un éclat vitreux.", keys, used));
  assert.deepEqual(first, ["eclat-vitreux"]); assert.deepEqual(second, []);
  const text = glossaryParts("Un éclat vitreux et un éclat vitreux.", matcher(TERMS), new Set());
  assert.equal(text.filter(part => part.term).length, 1);
});
test("les mots trop courants ne sont reliés que dans le mode précis ; « taille » jamais", () => {
  const sentence = "Cristal cubique massif, taille moyenne.";
  assert.deepEqual(linked(glossaryParts(sentence, matcher(TERMS), new Set())), []);
  assert.deepEqual(linked(glossaryParts(sentence, matcher(TERMS, { includeGeneric: true }), new Set())).sort(), ["cubique", "massif"]);
});
test("les propriétés précises (système, famille, cassure, clivage) sont reliées une seule fois", () => {
  const used = new Set();
  assert.equal(propertyParts("Système cristallin", "Cubique", bySlug, used)[0].term.slug, "cubique");
  assert.equal(propertyParts("Système cristallin", "Cubique", bySlug, used)[0].term, undefined, "deuxième fois : texte simple");
  assert.equal(propertyParts("Famille chimique", "Halogénures", bySlug, new Set())[0].term.slug, "halogenure");
  const cassure = propertyParts("Cassure", "irrégulière", bySlug, new Set());
  assert.equal(cassure[0].term.slug, "cassure-irreguliere");
  assert.equal(propertyParts("Densité", "3,1", bySlug, new Set()), null);
});
test("termHits ne chevauche jamais deux liens", () => {
  const hits = termHits("Le clivage parfait du clivage.", matcher(TERMS), new Set());
  for (let i = 1; i < hits.length; i += 1) assert.ok(hits[i].start >= hits[i - 1].end);
});
