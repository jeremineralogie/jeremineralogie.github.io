// Outil « Photos » de l'admin : allège les photos déjà en ligne (version 1 920 px + vignette), depuis le navigateur.
// Les originaux ne sont pas touchés ni supprimés ; chaque photo allégée est enregistrée en o/…, la base pointe ensuite vers elle.
// Reprenable à tout moment : une photo déjà allégée (chemin en o/…) est ignorée.
import { isOptimized, makeVariants, thumbPathOf, uploadPrepared } from "./image-variants.js";

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

const PUBLIC_BUCKET = "site-media-public";

// Tous les fichiers du bucket public (parcours des dossiers).
async function listAllFiles(client, folder = "") {
  const names = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await client.storage.from(PUBLIC_BUCKET).list(folder, { limit: 1000, offset }); if (error) throw error;
    for (const entry of data || []) {
      const path = folder ? `${folder}/${entry.name}` : entry.name;
      if (entry.id === null) names.push(...await listAllFiles(client, path)); else names.push({ path, size: entry.metadata?.size || 0 });
    }
    if ((data || []).length < 1000) break;
  }
  return names;
}

// Originaux sûrs à supprimer : une version allégée ET une vignette existent, et plus rien (base, texte des articles ou des archives) ne pointe vers eux.
async function listRemovableOriginals(client) {
  const files = await listAllFiles(client), names = new Set(files.map(file => file.path));
  const stripped = path => path.replace(/\.[A-Za-z0-9]+$/, "");
  const optimizedBases = new Set([...names].filter(name => name.startsWith("o/")).map(name => stripped(name.slice(2))));
  const thumbBases = new Set([...names].filter(name => name.startsWith("t/")).map(name => stripped(name.slice(2))));
  let candidates = files.filter(file => !file.path.startsWith("o/") && !file.path.startsWith("t/") && IMAGE.test(file.path) && optimizedBases.has(stripped(file.path)) && thumbBases.has(stripped(file.path)));
  const used = new Set(); const texts = [];
  for (const table of MEDIA_TABLES) { const { data, error } = await client.from(table).select("storage_path").limit(5000); if (error) throw error; (data || []).forEach(row => used.add(row.storage_path)); }
  { const { data, error } = await client.from("archive_documents").select("storage_path,cover_path,body,summary").limit(5000); if (error) throw error; for (const row of data || []) { used.add(row.storage_path); used.add(row.cover_path); texts.push(JSON.stringify([row.body, row.summary])); } }
  { const { data, error } = await client.from("articles").select("body").limit(5000); if (error) throw error; for (const row of data || []) texts.push(JSON.stringify(row.body)); }
  const haystack = texts.join("\n");
  candidates = candidates.filter(file => !used.has(file.path) && !haystack.includes(file.path));
  return candidates;
}

async function removeOriginals(client, candidates, onProgress) {
  let removed = 0, bytes = 0;
  for (let index = 0; index < candidates.length; index += 50) {
    const batch = candidates.slice(index, index + 50);
    const { error } = await client.storage.from(PUBLIC_BUCKET).remove(batch.map(file => file.path)); if (error) throw error;
    removed += batch.length; bytes += batch.reduce((total, file) => total + file.size, 0); onProgress(removed);
  }
  return { removed, bytes };
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
  const originals = document.createElement("div"); originals.className = "photos-originals";
  const showOriginals = async () => {
    originals.replaceChildren(line("Recherche des originaux inutiles…"));
    try {
      const candidates = await listRemovableOriginals(client);
      if (!candidates.length) { originals.replaceChildren(line("Aucun original à supprimer.")); return; }
      const total = candidates.reduce((sum, file) => sum + file.size, 0);
      const button = document.createElement("button"); button.type = "button"; button.className = "admin-danger";
      button.textContent = `Supprimer ${candidates.length} original${candidates.length > 1 ? "aux" : ""} (${size(total)})`;
      const note = line(`${candidates.length} photo${candidates.length > 1 ? "s d'origine ont" : " d'origine a"} une version allégée et une vignette, et plus rien sur le site ne s'en sert. Les supprimer libère ${size(total)}. C'est définitif.`);
      const result = line("");
      originals.replaceChildren(note, button, result);
      button.addEventListener("click", async () => {
        button.disabled = true;
        try { const done = await removeOriginals(client, candidates, count => { result.textContent = `${count} / ${candidates.length} supprimés…`; }); result.textContent = `${done.removed} originaux supprimés, ${size(done.bytes)} libérés.`; button.hidden = true; }
        catch (error) { result.textContent = `Suppression interrompue : ${error.message || error}`; button.disabled = false; }
      });
    } catch (error) { originals.replaceChildren(line(`Impossible de chercher les originaux : ${error.message || error}`)); }
  };
  const later = document.createElement("button"); later.type = "button"; later.className = "btn secondary"; later.textContent = "Chercher les originaux à supprimer";
  later.addEventListener("click", () => { later.hidden = true; void showOriginals(); });
  if (!pending.length) { body.append(line("Toutes les photos sont déjà allégées."), later, originals); return; }
  const start = document.createElement("button"); start.type = "button"; start.className = "btn"; start.textContent = `Alléger ${pending.length} photo${pending.length > 1 ? "s" : ""}`;
  const stop = document.createElement("button"); stop.type = "button"; stop.className = "btn secondary"; stop.textContent = "Arrêter"; stop.hidden = true;
  const bar = document.createElement("progress"); bar.max = pending.length; bar.value = 0; bar.hidden = true; bar.className = "photos-progress";
  const summary = line("", "photos-summary"), errors = document.createElement("ul"); errors.className = "photos-errors";
  body.append(line(pending.length > 1 ? `${pending.length} photos sont encore en version d'origine.` : "1 photo est encore en version d'origine."), start, stop, bar, summary, errors, later, originals);
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
