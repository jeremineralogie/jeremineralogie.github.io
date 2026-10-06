// Tout peut être lié à tout : articles, archives, pièces de la collection et de la boutique, dans les deux sens.
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const admin = readFile(new URL("../assets/js/admin-content.js", import.meta.url), "utf8");
const section = async id => { const source = await admin; const start = source.indexOf(`{ id: "${id}"`); return source.slice(start, source.indexOf("\n  { id: ", start + 10)); };
test("les formulaires d'article et d'archive permettent de lier les pièces de la collection et de la boutique", async () => {
  for (const id of ["articles", "archives"]) {
    const text = await section(id);
    assert.match(text, /key: "link_specimens", label: "Pièces de ma collection liées", ref: "specimens"/, id);
    assert.match(text, /key: "link_shop_items", label: "Pièces de la boutique liées", ref: "shop_items"/, id);
  }
  assert.match(await section("articles"), /\["article_specimens", "specimen_id", "specimens", "link_specimens"\], \["article_shop_items", "shop_item_id", "shop_items", "link_shop_items"\]/);
  assert.match(await section("archives"), /\["archive_specimens", "specimen_id", "specimens", "link_specimens"\], \["archive_shop_items", "shop_item_id", "shop_items", "link_shop_items"\]/);
});
test("les formulaires de la collection et de la boutique permettent de lier des articles et des archives", async () => {
  for (const id of ["collection", "shop"]) {
    const text = await section(id);
    assert.match(text, /key: "link_articles", label: "Articles liés", ref: "articles"/, id);
    assert.match(text, /key: "link_archives", label: "Archives liées", ref: "archive_documents"/, id);
  }
  assert.match(await section("collection"), /\["article_specimens", "article_id", "articles", "link_articles"\], \["archive_specimens", "archive_id", "archive_documents", "link_archives"\]/);
  assert.match(await section("shop"), /\["article_shop_items", "article_id", "articles", "link_articles"\], \["archive_shop_items", "archive_id", "archive_documents", "link_archives"\]/);
});
test("les pages publiques des pièces affichent les articles et les archives liés", async () => {
  for (const page of ["specimen-page.js", "piece-page.js"]) {
    const source = await readFile(new URL(`../assets/js/${page}`, import.meta.url), "utf8");
    assert.match(source, /pagesBlock\("Articles liés"/); assert.match(source, /pagesBlock\("Archives liées"/);
  }
});

test("la recherche couvre aussi les termes du glossaire", async () => {
  const source = await readFile(new URL("../assets/js/search-page.js", import.meta.url), "utf8");
  assert.match(source, /type: "Glossaire", table: "glossary_terms"/);
  assert.match(source, /cleanUrl\("term", r\.slug\)/);
});
