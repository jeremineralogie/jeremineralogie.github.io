// Bouton « Partager » des fiches ouvertes : menu avec les réseaux (WhatsApp, Facebook, X, Telegram, LinkedIn, Pinterest, e-mail),
// le menu de partage de l'appareil (Instagram, Messenger, SMS…), le partage de l'image et la copie du lien.
const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text != null) node.textContent = text; return node; };
const pageUrl = () => document.querySelector('link[rel="canonical"]')?.href || location.href;
const enc = encodeURIComponent;

// Adresses de partage des réseaux (le titre et l'image de l'aperçu viennent de la page elle-même).
export function networkLinks({ url, title, text, image }) {
  const message = text || title || "";
  return [
    ["WhatsApp", `https://wa.me/?text=${enc(`${message} ${url}`.trim())}`],
    ["Facebook", `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`],
    ["X", `https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(message)}`],
    ["Telegram", `https://t.me/share/url?url=${enc(url)}&text=${enc(message)}`],
    ["LinkedIn", `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`],
    ...(image ? [["Pinterest", `https://www.pinterest.com/pin/create/button/?url=${enc(url)}&media=${enc(image)}&description=${enc(message)}`]] : []),
    ["E-mail", `mailto:?subject=${enc(title || message)}&body=${enc(`${message}\n${url}`)}`]
  ];
}

async function imageFile(image, name) {
  const response = await fetch(image);
  if (!response.ok) throw new Error("image indisponible");
  const blob = await response.blob();
  return new File([blob], `${name}.${(blob.type.split("/")[1] || "jpg").replace("jpeg", "jpg")}`, { type: blob.type || "image/jpeg" });
}

export function shareButton({ title, text, image = "", label = "Partager cette fiche", copyPrompt = "Copiez le lien de cette fiche :" }) {
  const wrap = el("div", "share-wrap");
  const button = el("button", "share-btn"); button.type = "button"; button.setAttribute("aria-haspopup", "true"); button.setAttribute("aria-expanded", "false");
  button.innerHTML = `<span class="share-icon" aria-hidden="true">↗</span><span></span>`; button.lastChild.textContent = label;
  const menu = el("div", "share-menu"); menu.hidden = true; menu.setAttribute("role", "menu");
  wrap.append(button, menu);

  const close = () => { menu.hidden = true; button.setAttribute("aria-expanded", "false"); };
  const item = (name, onClick) => { const node = el("button", "share-item", name); node.type = "button"; node.setAttribute("role", "menuitem"); node.addEventListener("click", onClick); return node; };
  const copy = async node => {
    const url = pageUrl();
    try { await navigator.clipboard.writeText(url); node.textContent = "Lien copié ✓"; }
    catch { window.prompt(copyPrompt, url); return; }
    setTimeout(() => { node.textContent = "Copier le lien"; }, 2500);
  };

  const build = () => {
    const url = pageUrl();
    const entries = networkLinks({ url, title, text, image }).map(([name, href]) => {
      const link = el("a", "share-item", name); link.href = href; link.setAttribute("role", "menuitem");
      if (!href.startsWith("mailto:")) { link.target = "_blank"; link.rel = "noopener noreferrer"; }
      link.addEventListener("click", close);
      return link;
    });
    if (navigator.share) entries.push(item("Plus d'options…", async () => { close(); try { await navigator.share({ title, text, url }); } catch { /* partage annulé */ } }));
    if (image && navigator.canShare && navigator.share) {
      entries.push(item("Partager l'image", async () => {
        close();
        try {
          const file = await imageFile(image, (title || "image").replace(/[^\p{L}\p{N}]+/gu, "-").slice(0, 40) || "image");
          if (navigator.canShare({ files: [file] })) await navigator.share({ files: [file], title, text: `${text || title} ${url}`.trim() });
        } catch { /* partage annulé ou image non partageable */ }
      }));
    }
    const copyItem = item("Copier le lien", () => copy(copyItem));
    entries.push(copyItem);
    menu.replaceChildren(...entries);
  };

  button.addEventListener("click", () => {
    if (!menu.hidden) { close(); return; }
    build(); menu.hidden = false; button.setAttribute("aria-expanded", "true");
    menu.querySelector(".share-item")?.focus?.();
  });
  document.addEventListener("click", event => { if (!wrap.contains(event.target)) close(); });
  document.addEventListener("keydown", event => { if (event.key === "Escape" && !menu.hidden) { close(); button.focus(); } });
  return wrap;
}
