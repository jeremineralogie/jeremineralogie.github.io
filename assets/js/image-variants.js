// Photos allégées : à l'envoi, chaque photo est enregistrée en deux versions WebP.
//   o/<chemin>.webp : version « grande » (1 920 px au plus), affichée dans les fiches et en plein écran ;
//   t/<chemin>.webp : vignette (640 px au plus), affichée dans les listes et les cartes.
// L'original n'est pas touché : une photo dont le chemin ne commence pas par « o/ » n'a pas encore été allégée et s'affiche telle quelle.
export const FULL_MAX = 1920;
export const THUMB_MAX = 640;
export const CACHE_CONTROL = "31536000"; // un an : le chemin d'une photo ne change jamais (une nouvelle photo = un nouveau chemin)

export const isOptimized = path => typeof path === "string" && path.startsWith("o/");
// Chemin de la vignette d'une photo allégée ; null pour une photo qui ne l'est pas encore.
export const thumbPathOf = path => isOptimized(path) ? `t/${path.slice(2)}` : null;
// Chemin de la version allégée d'un original : o/<chemin sans extension>.<extension>.
export function optimizedPathOf(originalPath, ext = "webp") {
  const base = String(originalPath).replace(/^\/+/, "").replace(/^(o|t)\//, "").replace(/\.[A-Za-z0-9]+$/, "");
  return `o/${base}.${ext}`;
}

// Taille qui tient dans un carré de « max » pixels, sans jamais agrandir.
export function fitInside(width, height, max) {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

const encode = (canvas, type, quality) => new Promise(resolve => canvas.toBlob(blob => resolve(blob), type, quality));

// Redessine l'image à la taille voulue et la compresse : WebP, ou JPEG si le navigateur ne sait pas écrire du WebP.
async function render(bitmap, max, quality) {
  const { width, height } = fitInside(bitmap.width, bitmap.height, max);
  const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
  const context = canvas.getContext("2d");
  context.drawImage(bitmap, 0, 0, width, height);
  let blob = await encode(canvas, "image/webp", quality);
  if (blob?.type !== "image/webp") {
    // Navigateur sans WebP : JPEG, avec un fond blanc à la place de la transparence.
    context.globalCompositeOperation = "destination-over"; context.fillStyle = "#fff"; context.fillRect(0, 0, width, height);
    blob = await encode(canvas, "image/jpeg", quality);
  }
  return { blob, ext: blob.type === "image/webp" ? "webp" : "jpg", width, height };
}

// Fichier envoyé → { full, thumb, width, height } : deux blobs prêts à être enregistrés. Lève une erreur si le fichier n'est pas une image lisible.
export async function makeVariants(file) {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const full = await render(bitmap, FULL_MAX, 0.86);
    const thumb = await render(bitmap, THUMB_MAX, 0.8);
    // Une petite photo déjà très légère garde son fichier d'origine plutôt que d'être ré-encodée en plus lourd.
    if (bitmap.width <= FULL_MAX && bitmap.height <= FULL_MAX && file.size <= full.blob.size) {
      const ext = (file.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
      return { full: { blob: file, ext, width: bitmap.width, height: bitmap.height }, thumb, width: bitmap.width, height: bitmap.height };
    }
    return { full, thumb, width: bitmap.width, height: bitmap.height };
  } finally { bitmap.close?.(); }
}

// Enregistre les deux versions déjà préparées. Renvoie le chemin de la version « grande » (à garder dans la base) ; la vignette est à t/ au même endroit.
export async function uploadPrepared(client, bucket, originalPath, { full, thumb }, upsert = false) {
  const path = optimizedPathOf(originalPath, full.ext);
  const thumbPath = thumbPathOf(path);
  const options = blob => ({ upsert, contentType: blob.type || "image/webp", cacheControl: CACHE_CONTROL });
  const first = await client.storage.from(bucket).upload(path, full.blob, options(full.blob));
  if (first.error) throw first.error;
  const second = await client.storage.from(bucket).upload(thumbPath, thumb.blob, options(thumb.blob));
  if (second.error) { await client.storage.from(bucket).remove([path]); throw second.error; }
  return { path, thumbPath, fullBytes: full.blob.size, thumbBytes: thumb.blob.size };
}

export async function uploadVariants(client, bucket, originalPath, file) {
  return uploadPrepared(client, bucket, originalPath, await makeVariants(file));
}

const CONVERTIBLE = /^image\/(jpeg|png|webp|bmp|avif|heic|heif)$/i;
// Envoi d'une image par l'admin : version allégée + vignette ; si le fichier n'est pas convertible (GIF, SVG, format inconnu du navigateur), il est envoyé tel quel.
// Renvoie le chemin à garder dans la base.
export async function uploadImage(client, bucket, path, file) {
  let variants = null;
  if (CONVERTIBLE.test(file.type || "")) { try { variants = await makeVariants(file); } catch { variants = null; } }
  if (variants) return (await uploadPrepared(client, bucket, path, variants)).path;
  const { error } = await client.storage.from(bucket).upload(path, file, { upsert: false, contentType: file.type, cacheControl: CACHE_CONTROL });
  if (error) throw error;
  return path;
}
