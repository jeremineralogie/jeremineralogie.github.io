// Partage : articles et pièces de la collection ont leur bouton, avec le bon libellé.
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read = name => readFile(new URL(`../assets/js/${name}`, import.meta.url), "utf8");
test("l'article, le spécimen de la collection et la pièce de la boutique ont un bouton de partage", async () => {
  assert.match(await read("article-page.js"), /label: "Partager cet article"/);
  assert.match(await read("specimen-page.js"), /label: "Partager cette pièce"/);
  assert.match(await read("piece-page.js"), /label: "Partager cette pièce"/);
  assert.match(await read("share-button.js"), /label = "Partager cette fiche"/);
});

test("le menu de partage propose les réseaux avec le lien, le titre et l'image", async () => {
  const { networkLinks } = await import("../assets/js/share-button.js");
  const links = Object.fromEntries(networkLinks({ url: "https://jeremineralogie.fr/lire/baryte/", title: "Baryte miel", text: "Baryte miel — Jeremineralogie", image: "https://x.test/a b.webp" }));
  for (const name of ["WhatsApp", "Facebook", "X", "Telegram", "LinkedIn", "Pinterest", "E-mail"]) assert.ok(links[name], name);
  assert.match(links.WhatsApp, /^https:\/\/wa\.me\/\?text=.*jeremineralogie\.fr%2Flire%2Fbaryte%2F/);
  assert.match(links.Facebook, /u=https%3A%2F%2Fjeremineralogie\.fr%2Flire%2Fbaryte%2F$/);
  assert.match(links.Pinterest, /media=https%3A%2F%2Fx\.test%2Fa%20b\.webp/);
  assert.ok(!("Pinterest" in Object.fromEntries(networkLinks({ url: "https://a.test/", title: "t" }))), "Pinterest exige une image");
});
test("l'article transmet une image au partage et le référencement en trouve une dans le texte", async () => {
  assert.match(await read("article-page.js"), /image: shareImage/);
  assert.match(await readFile(new URL("../tools/seo/build.mjs", import.meta.url), "utf8"), /photoUrl\(cfg, item\.media\) \|\| bodyImageUrl\(cfg, item\.body\)/);
});
