// Partage des résultats des jeux : une image au format story (1080 × 1920) aux couleurs du site,
// partagée avec le menu du téléphone (Instagram, TikTok, Snapchat, WhatsApp…), téléchargeable, et des boutons directs
// pour les réseaux qui acceptent un lien depuis le web.
const SITE = "https://jeremineralogie.github.io/";
const LOGO = "/assets/decor/logo-jeux.webp";
const W = 1080, H = 1920;
const SERIF = '"Cormorant Garamond", Georgia, "Times New Roman", serif';
const SANS = 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif';
const SQUARE_COLORS = { "🟩": "#3fbf7f", "🟨": "#e8c547", "🟧": "#e8873a", "🟥": "#d9415f" };
const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text != null) node.textContent = text; return node; };

function loadImage(src, crossOrigin = true) {
  return new Promise(resolve => {
    const image = new Image();
    if (crossOrigin) image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}
function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function fitText(ctx, text, maxWidth, size, family, weight = "500") {
  let current = size;
  do { ctx.font = `${weight} ${current}px ${family}`; current -= 2; } while (ctx.measureText(text).width > maxWidth && current > 20);
}
function spaced(ctx, text, x, y, spacing) {
  const chars = [...text]; const total = chars.reduce((sum, char) => sum + ctx.measureText(char).width, 0) + spacing * (chars.length - 1);
  let cursor = x - total / 2;
  ctx.textAlign = "left";
  chars.forEach(char => { ctx.fillText(char, cursor, y); cursor += ctx.measureText(char).width + spacing; });
  ctx.textAlign = "center";
}

// spec : { title, date, big, bigSub, note, squares: ["🟩"…], photos: [url…], mystery (médaillon « ? »), streak, footer }
async function drawCard(spec, withPhotos = true) {
  const canvas = document.createElement("canvas"); canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  try { await document.fonts?.ready; } catch { /* polices par défaut */ }
  // Fond : dégradé violet profond, halo derrière le logo, cadre fin.
  const background = ctx.createLinearGradient(0, 0, 0, H);
  background.addColorStop(0, "#16072a"); background.addColorStop(0.55, "#09030f"); background.addColorStop(1, "#030106");
  ctx.fillStyle = background; ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, 470, 40, W / 2, 470, 620);
  glow.addColorStop(0, "rgba(170,100,255,.38)"); glow.addColorStop(1, "rgba(170,100,255,0)");
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(160,110,240,.55)"; ctx.lineWidth = 3; roundRect(ctx, 44, 44, W - 88, H - 88, 28); ctx.stroke();
  ctx.strokeStyle = "rgba(160,110,240,.2)"; ctx.lineWidth = 1.5; roundRect(ctx, 60, 60, W - 120, H - 120, 20); ctx.stroke();

  const logo = await loadImage(LOGO, false);
  if (logo) { const width = 640, height = width * logo.height / logo.width; ctx.drawImage(logo, (W - width) / 2, 110, width, height); }

  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#f3eaff"; ctx.font = `500 76px ${SERIF}`;
  spaced(ctx, spec.title.toUpperCase(), W / 2, 870, 6);
  ctx.fillStyle = "#b9a5d8"; ctx.font = `400 40px ${SANS}`; ctx.fillText(spec.date, W / 2, 940);
  let y = 1110;
  ctx.fillStyle = "#f0d9a8"; fitText(ctx, spec.big, W - 200, 170, SERIF, "600"); ctx.fillText(spec.big, W / 2, y);
  if (spec.bigSub) { y += 80; ctx.fillStyle = "#e6dcf5"; ctx.font = `400 50px ${SANS}`; ctx.fillText(spec.bigSub, W / 2, y); }
  if (spec.squares?.length) {
    y += 60; const size = 96, gap = 22, total = spec.squares.length * size + (spec.squares.length - 1) * gap;
    spec.squares.forEach((square, index) => { ctx.fillStyle = SQUARE_COLORS[square] || "#6a37b6"; roundRect(ctx, (W - total) / 2 + index * (size + gap), y, size, size, 18); ctx.fill(); });
    y += size;
  }
  if (spec.note) { y += 80; ctx.fillStyle = "#cdb6f2"; fitText(ctx, spec.note, W - 200, 46, SANS, "400"); ctx.fillText(spec.note, W / 2, y); }
  if (spec.mystery) {
    // Médaillon « minéral mystère » : cercle lumineux et point d'interrogation.
    const radius = 150, cy = y + 90 + radius;
    const halo = ctx.createRadialGradient(W / 2, cy, 20, W / 2, cy, radius * 1.6);
    halo.addColorStop(0, "rgba(180,140,255,.45)"); halo.addColorStop(1, "rgba(180,140,255,0)");
    ctx.fillStyle = halo; ctx.fillRect(W / 2 - radius * 1.6, cy - radius * 1.6, radius * 3.2, radius * 3.2);
    ctx.beginPath(); ctx.arc(W / 2, cy, radius, 0, Math.PI * 2); ctx.fillStyle = "#1c1030"; ctx.fill();
    ctx.lineWidth = 6; ctx.strokeStyle = "#b48cff"; ctx.stroke();
    ctx.fillStyle = "#f3eaff"; ctx.font = `600 220px ${SERIF}`; ctx.textBaseline = "middle"; ctx.fillText("?", W / 2, cy + 8); ctx.textBaseline = "alphabetic";
    y = cy + radius;
  }
  const photos = withPhotos ? (await Promise.all((spec.photos || []).slice(0, 5).map(src => loadImage(src)))).filter(Boolean) : [];
  if (photos.length) {
    y += 60; const width = 170, height = 128, gap = 16, total = photos.length * width + (photos.length - 1) * gap;
    photos.forEach((photo, index) => {
      const x = (W - total) / 2 + index * (width + gap);
      ctx.fillStyle = "#000"; roundRect(ctx, x, y, width, height, 12); ctx.fill();
      const scale = Math.min(width / photo.width, height / photo.height);
      ctx.save(); roundRect(ctx, x, y, width, height, 12); ctx.clip();
      ctx.drawImage(photo, x + (width - photo.width * scale) / 2, y + (height - photo.height * scale) / 2, photo.width * scale, photo.height * scale);
      ctx.restore(); ctx.strokeStyle = "rgba(160,110,240,.7)"; ctx.lineWidth = 2; roundRect(ctx, x, y, width, height, 12); ctx.stroke();
    });
    y += height;
  }
  if (spec.streak) { ctx.fillStyle = "#f0d9a8"; ctx.font = `500 46px ${SANS}`; ctx.fillText(spec.streak, W / 2, Math.max(y + 100, 1640)); }
  ctx.fillStyle = "#e6dcf5"; ctx.font = `italic 500 54px ${SERIF}`; ctx.fillText(spec.footer || "Et vous, ferez-vous mieux ?", W / 2, 1760);
  ctx.fillStyle = "#b48cff"; ctx.font = `600 42px ${SANS}`; ctx.fillText("jeremineralogie.github.io", W / 2, 1830);
  return canvas;
}

// Image PNG ; si une photo empêche l'export (sécurité du navigateur), l'image est refaite sans les photos.
export async function makeCardBlob(spec) {
  const toBlob = canvas => new Promise((resolve, reject) => { try { canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Image vide")), "image/png"); } catch (error) { reject(error); } });
  try { return await toBlob(await drawCard(spec, true)); }
  catch { return toBlob(await drawCard(spec, false)); }
}

const NETWORKS = [
  ["Facebook", "facebook", (text, url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`],
  ["WhatsApp", "whatsapp", (text, url) => `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`],
  ["X", "x", (text, url) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`],
  ["Telegram", "telegram", (text, url) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`],
  ["Pinterest", "pinterest", (text, url) => `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&media=${encodeURIComponent(`${SITE}assets/decor/logo-jeux.png`)}&description=${encodeURIComponent(text)}`],
  ["E-mail", "email", (text, url) => `mailto:?subject=${encodeURIComponent("Mon score sur Jeremineralogie")}&body=${encodeURIComponent(`${text}\n${url}`)}`]
];

// Bloc de partage : aperçu de l'image, « Partager l'image » (menu du téléphone), « Enregistrer l'image », réseaux, copie du texte.
export function sharePanel({ spec, text, fileName }) {
  const box = el("div", "share");
  const preview = el("img", "share-preview"); preview.alt = "Image de votre résultat à partager"; preview.hidden = true;
  const main = el("div", "share-main");
  const shareButton = el("button", "share-btn is-primary", "📲 Partager l’image"); shareButton.type = "button";
  const save = el("a", "share-btn", "⬇️ Enregistrer l’image"); save.download = fileName; save.hidden = true;
  main.append(shareButton, save);
  const networks = el("div", "share-networks");
  NETWORKS.forEach(([label, key, href]) => {
    const link = el("a", `share-net share-${key}`, label); link.href = href(text, SITE);
    if (key !== "email") { link.target = "_blank"; link.rel = "noopener"; }
    networks.append(link);
  });
  const copy = el("button", "share-net", "Copier le texte"); copy.type = "button";
  copy.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(`${text}\n${SITE}`); copy.textContent = "Texte copié !"; }
    catch { copy.textContent = "Copie impossible"; }
  });
  networks.append(copy);
  const hint = el("p", "share-hint", "Instagram, TikTok, Snapchat : touchez « Partager l’image », ou enregistrez-la puis publiez-la depuis l’application.");
  const status = el("p", "share-status"); status.setAttribute("aria-live", "polite");
  box.append(preview, main, networks, hint, status);

  let file = null;
  const ready = makeCardBlob(spec).then(blob => {
    file = new File([blob], fileName, { type: "image/png" });
    const url = URL.createObjectURL(blob);
    preview.src = url; preview.hidden = false; save.href = url; save.hidden = false;
    const canShareFiles = Boolean(navigator.canShare?.({ files: [file] }));
    shareButton.hidden = !canShareFiles;
    if (!canShareFiles) save.classList.add("is-primary");
  }).catch(error => { console.error("Image de partage :", error); shareButton.hidden = true; status.textContent = "L’image n’a pas pu être créée : utilisez les boutons ci-dessous."; });
  shareButton.addEventListener("click", async () => {
    await ready;
    if (!file) return;
    try { await navigator.share({ files: [file], text: `${text}\n${SITE}` }); }
    catch (error) {
      if (error?.name === "AbortError") return;
      try { await navigator.share({ files: [file] }); } catch (retry) { if (retry?.name !== "AbortError") status.textContent = "Partage impossible : enregistrez l’image puis publiez-la."; }
    }
  });
  return box;
}

export const dateFr = day => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${day}T12:00:00`));
