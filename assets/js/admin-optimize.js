// Outil « Photos » de l'admin : allège les photos déjà en ligne (version 1 920 px + vignette), depuis le navigateur.
// Les originaux ne sont pas touchés ni supprimés ; chaque photo allégée est enregistrée en o/…, la base pointe ensuite vers elle.
// Reprenable à tout moment : une photo déjà allégée (chemin en o/…) est ignorée.
import { isOptimized, makeVariants, uploadPrepared } from "./image-variants.js";

const MEDIA_TABLES = ["specimen_media", "shop_item_media", "article_media", "mineral_media"];
const IMAGE = /\.(jpe?g|png|webp|bmp|avif|heic|heif)$/i;
const size = bytes => bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1).replace(".", ",")} Mo` : `${Math.max(1, Math.round(bytes / 1024))} Ko`;

// Toutes les photos à alléger : { key, bucket, path, targets: [{ table, idColumn, bucketColumn, pathColumn }] } (un même fichier peut servir à plusieurs lignes).
async function listPending(client) {
  const byFile = new Map();
  const add = (bucket, path, target) => {
    if (!bucket || !path || isOptimized(path) || !IMAGE.test(path)) return;
    const key = `${bucket}/${path}`;
    if (!byFile.has(key)) byFile.set(key, { key, bucket, path, targets: [] });
    byFile.get(key).targets.push(target);
  };
  for (const table of MEDIA_TABLES) {
    const { data, error } = await client.from(table).select("bucket_id,storage_path").limit(5000); if (error) throw error;
    for (const row of data || []) add(row.bucket_id, row.storage_path, { table, bucketColumn: "bucket_id", pathColumn: "storage_path" });
  }
  const { data, error } = await client.from("archive_documents").select("cover_bucket,cover_path").not("cover_path", "is", null).limit(5000); if (error) throw error;
  for (const row of data || []) add(row.cover_bucket || "site-media-public", row.cover_path, { table: "archive_documents", bucketColumn: "cover_bucket", pathColumn: "cover_path", nullBucket: !row.cover_bucket });
  return [...byFile.values()];
}

async function optimizeOne(client, item) {
  const { data: blob, error } = await client.storage.from(item.bucket).download(item.path); if (error) throw error;
  const variants = await makeVariants(new File([blob], item.path.split("/").pop(), { type: blob.type || "image/jpeg" }));
  const result = await uploadPrepared(client, item.bucket, item.path, variants, true);
  for (const target of item.targets) {
    let query = client.from(target.table).update({ [target.pathColumn]: result.path }).eq(target.pathColumn, item.path);
    query = target.nullBucket ? query.is(target.bucketColumn, null) : query.eq(target.bucketColumn, item.bucket);
    const { error: updateError } = await query; if (updateError) throw updateError;
  }
  return { before: blob.size, after: result.fullBytes + result.thumbBytes, full: result.fullBytes };
}

let running = false, stopRequested = false;

export async function openOptimize(client) {
  const body = document.querySelector("#photos-body"), status = document.querySelector("#photos-status");
  if (running) return;
  status.textContent = "Recherche des photos à alléger…"; body.hidden = true;
  let pending;
  try { pending = await listPending(client); } catch (error) { status.textContent = `Impossible de lister les photos : ${error.message || error}`; return; }
  status.textContent = ""; body.hidden = false; body.replaceChildren();
  const line = (text, className) => { const p = document.createElement("p"); p.textContent = text; if (className) p.className = className; return p; };
  if (!pending.length) { body.append(line("Toutes les photos sont déjà allégées. Rien à faire.")); return; }
  const start = document.createElement("button"); start.type = "button"; start.className = "btn"; start.textContent = `Alléger ${pending.length} photo${pending.length > 1 ? "s" : ""}`;
  const stop = document.createElement("button"); stop.type = "button"; stop.className = "btn secondary"; stop.textContent = "Arrêter"; stop.hidden = true;
  const bar = document.createElement("progress"); bar.max = pending.length; bar.value = 0; bar.hidden = true; bar.className = "photos-progress";
  const summary = line("", "photos-summary"), errors = document.createElement("ul"); errors.className = "photos-errors";
  body.append(line(pending.length > 1 ? `${pending.length} photos sont encore en version d'origine.` : "1 photo est encore en version d'origine."), start, stop, bar, summary, errors);
  start.addEventListener("click", async () => {
    running = true; stopRequested = false; start.hidden = true; stop.hidden = false; stop.disabled = false; bar.hidden = false; errors.replaceChildren();
    let done = 0, failed = 0, before = 0, after = 0;
    for (const item of pending) {
      if (stopRequested) break;
      summary.textContent = `En cours : ${done + failed + 1} / ${pending.length}…`;
      try { const result = await optimizeOne(client, item); done += 1; before += result.before; after += result.after; }
      catch (error) { failed += 1; const li = document.createElement("li"); li.textContent = `${item.path} : ${error.message || error}`; errors.append(li); }
      bar.value = done + failed;
    }
    running = false; stop.hidden = true; start.hidden = failed + done >= pending.length && !failed;
    summary.textContent = `${done} photo${done > 1 ? "s allégées" : " allégée"}${failed ? `, ${failed} en erreur` : ""}${before ? ` — ${size(before)} → ${size(after)} (versions grande + vignette)` : ""}.${stopRequested ? " Arrêté : relancez pour continuer." : ""}`;
    if (failed || stopRequested) { start.hidden = false; start.textContent = "Reprendre"; }
  });
  stop.addEventListener("click", () => { stopRequested = true; stop.disabled = true; });
}
