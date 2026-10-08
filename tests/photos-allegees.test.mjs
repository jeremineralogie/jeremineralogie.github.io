import test from "node:test";
import assert from "node:assert/strict";
import { fitInside, isOptimized, optimizedPathOf, thumbPathOf, uploadImage, CACHE_CONTROL } from "../assets/js/image-variants.js";

test("chemins : version allégée et vignette", () => {
  assert.equal(optimizedPathOf("collection/pyrite/abc-photo.JPG"), "o/collection/pyrite/abc-photo.webp");
  assert.equal(optimizedPathOf("o/a/b.webp"), "o/a/b.webp");
  assert.equal(optimizedPathOf("a/b.png", "jpg"), "o/a/b.jpg");
  assert.equal(thumbPathOf("o/a/b.webp"), "t/a/b.webp");
  assert.equal(thumbPathOf("a/b.jpg"), null);
  assert.ok(isOptimized("o/x.webp") && !isOptimized("x/o/y.jpg") && !isOptimized(null));
});

test("dimensions : réduites sans jamais agrandir", () => {
  assert.deepEqual(fitInside(4000, 3000, 1920), { width: 1920, height: 1440 });
  assert.deepEqual(fitInside(3000, 4000, 640), { width: 480, height: 640 });
  assert.deepEqual(fitInside(800, 600, 1920), { width: 800, height: 600 });
});

test("envoi : un fichier non convertible part tel quel, avec un cache d'un an", async () => {
  const calls = [];
  const client = { storage: { from: bucket => ({ upload: async (path, file, options) => { calls.push({ bucket, path, options }); return { error: null }; } }) } };
  const path = await uploadImage(client, "site-media-public", "articles/contenu/x.pdf", { type: "application/pdf" });
  assert.equal(path, "articles/contenu/x.pdf");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].options.cacheControl, CACHE_CONTROL);
});
