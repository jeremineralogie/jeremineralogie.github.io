// Contenu riche des articles : blocs de texte mis en forme, intertitres, images, PDF et liens.
// Format enregistré dans articles.body (JSON) :
//   { type: "text" | "heading", html, align }           align : "left" | "center" | "right" (vide = alignement par défaut)
//   { type: "image", bucket, path, width, align, caption } width : pourcentage de la largeur (15 à 100)
//   { type: "pdf", bucket, path, name }
//   { type: "link", url, label }
// Les anciens blocs { type: "paragraph" | "heading", text } restent lisibles.
export const FONTS = [
  ["", "Police par défaut"],
  ["'Cormorant Garamond', Georgia, serif", "Élégante (Cormorant)"],
  ["Georgia, 'Times New Roman', serif", "Classique (Georgia)"],
  ["Inter, system-ui, sans-serif", "Moderne (sans empattement)"],
  ["'Courier New', monospace", "Machine à écrire"]
];
const ALIGNS = new Set(["left", "center", "right"]);
const escapeHtml = value => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function normalizeBlocks(body) {
  return (Array.isArray(body) ? body : []).map(block => {
    if (typeof block === "string") return { type: "text", html: escapeHtml(block).replace(/\n/g, "<br>"), align: "" };
    if (!block || typeof block !== "object") return null;
    if (block.type === "paragraph" || block.type === "text" || block.type === "heading") {
      const html = block.html != null ? String(block.html) : escapeHtml(block.text).replace(/\n/g, "<br>");
      return { type: block.type === "heading" ? "heading" : "text", html, align: ALIGNS.has(block.align) ? block.align : "" };
    }
    if (block.type === "image" && block.path) return { type: "image", bucket: block.bucket || "site-media-public", path: block.path, width: Math.min(100, Math.max(15, Number(block.width) || 100)), align: ALIGNS.has(block.align) ? block.align : "center", caption: String(block.caption || "") };
    if (block.type === "pdf" && block.path) return { type: "pdf", bucket: block.bucket || "site-media-public", path: block.path, name: String(block.name || "Document PDF") };
    if (block.type === "link" && block.url) return { type: "link", url: String(block.url), label: String(block.label || block.url) };
    return null;
  }).filter(Boolean);
}

// Texte brut (résumés, référencement).
export function blocksToText(blocks) {
  return normalizeBlocks(blocks).filter(block => block.type === "text" || block.type === "heading")
    .map(block => block.html.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").trim()).filter(Boolean);
}

// Nettoyage du HTML saisi : seuls gras, italique, souligné, couleur, police, retours à la ligne et liens sont conservés.
const SAFE_FONT = value => FONTS.some(([font]) => font && font === value) ? value : null;
const SAFE_COLOR = value => /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\))$/i.test(value.trim()) ? value.trim() : null;
export function sanitizeHtml(html) {
  const template = document.createElement("template");
  template.innerHTML = String(html ?? "");
  const clean = node => {
    const out = document.createDocumentFragment();
    node.childNodes.forEach(child => {
      if (child.nodeType === Node.TEXT_NODE) { out.append(child.nodeValue); return; }
      if (child.nodeType !== Node.ELEMENT_NODE) return;
      const tag = child.tagName.toLowerCase();
      const inner = clean(child);
      if (tag === "br") { out.append(document.createElement("br")); return; }
      if (["b", "strong", "i", "em", "u"].includes(tag)) { const element = document.createElement(tag === "strong" ? "b" : tag === "em" ? "i" : tag); element.append(inner); out.append(element); return; }
      if (tag === "a") {
        const href = child.getAttribute("href") || "";
        if (/^(https?:|mailto:)/i.test(href)) { const link = document.createElement("a"); link.href = href; link.target = "_blank"; link.rel = "noopener"; link.append(inner); out.append(link); }
        else out.append(inner);
        return;
      }
      if (tag === "div" || tag === "p") { if (out.childNodes.length) out.append(document.createElement("br")); out.append(inner); return; }
      // span / font : on garde seulement couleur et police autorisées.
      const color = SAFE_COLOR(child.style?.color || child.getAttribute("color") || "");
      const font = SAFE_FONT((child.style?.fontFamily || child.getAttribute("face") || "").replace(/"/g, "'"));
      const bold = /^(bold|[6-9]00)$/.test(child.style?.fontWeight || "");
      const italic = child.style?.fontStyle === "italic";
      if (color || font || bold || italic) {
        const span = document.createElement("span");
        if (color) span.style.color = color;
        if (font) span.style.fontFamily = font;
        if (bold) span.style.fontWeight = "700";
        if (italic) span.style.fontStyle = "italic";
        span.append(inner); out.append(span);
      } else out.append(inner);
    });
    return out;
  };
  const holder = document.createElement("div");
  holder.append(clean(template.content));
  return holder.innerHTML;
}

export function mediaUrl(client, block) {
  if (!client || !block?.path) return "";
  return client.storage.from(block.bucket || "site-media-public").getPublicUrl(block.path).data.publicUrl;
}

// Affichage public (et aperçu) d'une liste de blocs dans un conteneur.
export function renderBlocks(container, body, client) {
  const nodes = [];
  normalizeBlocks(body).forEach(block => {
    if (block.type === "text" || block.type === "heading") {
      const element = document.createElement(block.type === "heading" ? "h2" : "p");
      element.className = "art-text";
      element.innerHTML = sanitizeHtml(block.html);
      if (block.align) element.style.textAlign = block.align;
      if (element.textContent.trim() || element.querySelector("br")) nodes.push(element);
    } else if (block.type === "image") {
      const figure = document.createElement("figure");
      figure.className = `art-image art-align-${block.align}`;
      figure.style.width = `${block.width}%`;
      const image = document.createElement("img"); image.src = mediaUrl(client, block); image.alt = block.caption || ""; image.loading = "lazy";
      figure.append(image);
      if (block.caption) { const caption = document.createElement("figcaption"); caption.textContent = block.caption; figure.append(caption); }
      nodes.push(figure);
    } else if (block.type === "pdf") {
      const link = document.createElement("a"); link.className = "art-file"; link.href = mediaUrl(client, block); link.target = "_blank"; link.rel = "noopener";
      link.innerHTML = `<span class="art-file-icon" aria-hidden="true">📄</span><span class="art-file-name"></span><span class="art-file-open">Ouvrir le PDF</span>`;
      link.querySelector(".art-file-name").textContent = block.name;
      nodes.push(link);
    } else if (block.type === "link") {
      if (!/^(https?:|mailto:)/i.test(block.url)) return;
      const link = document.createElement("a"); link.className = "art-link"; link.href = block.url; link.target = "_blank"; link.rel = "noopener";
      link.textContent = `🔗 ${block.label}`;
      nodes.push(link);
    }
  });
  const clear = document.createElement("div"); clear.className = "art-clear";
  container.append(...nodes, clear);
  return nodes;
}
