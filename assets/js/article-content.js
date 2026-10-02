// Contenu riche des articles : blocs de texte mis en forme, intertitres, images, PDF et liens.
// Format enregistré dans articles.body (JSON) :
//   { type: "text" | "heading", html, align }           align : "left" | "center" | "right" | "justify" (vide = alignement par défaut)
//   { type: "image", bucket, path, width, align, caption } width : pourcentage de la largeur (15 à 100)
//   { type: "pdf", bucket, path, name }
//   { type: "link", url, label }
//   { type: "rich", html }   texte libre : images, PDF et liens placés n'importe où dans le texte (format actuel de l'éditeur)
// Les anciens blocs { type: "paragraph" | "heading", text } restent lisibles.
export const FONTS = [
  ["", "Police par défaut"],
  ["'Cormorant Garamond', Georgia, serif", "Élégante (Cormorant)"],
  ["'EB Garamond', Georgia, serif", "Garamond"],
  ["'Playfair Display', Georgia, serif", "Playfair Display"],
  ["Lora, Georgia, serif", "Lora"],
  ["Merriweather, Georgia, serif", "Merriweather"],
  ["Georgia, 'Times New Roman', serif", "Classique (Georgia)"],
  ["'Times New Roman', Times, serif", "Times New Roman"],
  ["Cinzel, Georgia, serif", "Cinzel (majuscules antiques)"],
  ["Inter, system-ui, sans-serif", "Moderne (sans empattement)"],
  ["Montserrat, Arial, sans-serif", "Montserrat"],
  ["Poppins, Arial, sans-serif", "Poppins"],
  ["'Open Sans', Arial, sans-serif", "Open Sans"],
  ["Roboto, Arial, sans-serif", "Roboto"],
  ["Oswald, Arial, sans-serif", "Oswald (condensée)"],
  ["Arial, Helvetica, sans-serif", "Arial"],
  ["'Dancing Script', cursive", "Manuscrite (Dancing Script)"],
  ["'Great Vibes', cursive", "Calligraphie (Great Vibes)"],
  ["Caveat, cursive", "Écriture à la main (Caveat)"],
  ["'Courier New', monospace", "Machine à écrire"]
];
// Tailles proposées dans l'éditeur (en pixels) ; « 1em » = taille normale du texte autour.
export const FONT_SIZES = [10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 42, 48, 60, 72, 96];
const SAFE_SIZE = value => {
  const text = String(value || "").trim();
  if (text === "1em") return text;
  const match = /^(\d+(?:\.\d+)?)px$/.exec(text);
  return match && match[1] >= 10 && match[1] <= 96 ? `${match[1]}px` : null;
};
const ALIGNS = new Set(["left", "center", "right"]);
const TEXT_ALIGNS = new Set([...ALIGNS, "justify"]);
const escapeHtml = value => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function normalizeBlocks(body) {
  return (Array.isArray(body) ? body : []).map(block => {
    if (typeof block === "string") return { type: "text", html: escapeHtml(block).replace(/\n/g, "<br>"), align: "" };
    if (!block || typeof block !== "object") return null;
    if (block.type === "paragraph" || block.type === "text" || block.type === "heading") {
      const html = block.html != null ? String(block.html) : escapeHtml(block.text).replace(/\n/g, "<br>");
      return { type: block.type === "heading" ? "heading" : "text", html, align: TEXT_ALIGNS.has(block.align) ? block.align : "" };
    }
    if (block.type === "image" && block.path) return { type: "image", bucket: block.bucket || "site-media-public", path: block.path, width: Math.min(100, Math.max(15, Number(block.width) || 100)), align: ALIGNS.has(block.align) ? block.align : "center", caption: String(block.caption || "") };
    if (block.type === "pdf" && block.path) return { type: "pdf", bucket: block.bucket || "site-media-public", path: block.path, name: String(block.name || "Document PDF") };
    if (block.type === "rich") return { type: "rich", html: String(block.html || "") };
    if (block.type === "link" && block.url) return { type: "link", url: String(block.url), label: String(block.label || block.url) };
    return null;
  }).filter(Boolean);
}

// Texte brut (résumés, référencement).
const stripTags = html => html.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#39;/g, "'").replace(/&amp;/g, "&");
export function blocksToText(blocks) {
  return normalizeBlocks(blocks).flatMap(block => {
    if (block.type === "text" || block.type === "heading") return [stripTags(block.html).trim()];
    if (block.type === "rich") return stripTags(block.html.replace(/<a\b[^>]*class="[^"]*art-file-inline[^>]*>[\s\S]*?<\/a>/gi, "").replace(/<\/(p|h2|h3|li|blockquote)>/gi, "\n")).split(/\n+/).map(line => line.trim());
    return [];
  }).filter(Boolean);
}

// Anciens blocs → texte libre (ouverture d'un ancien article dans l'éditeur).
export function blocksToRichHtml(body) {
  const attr = value => escapeHtml(value).replace(/"/g, "&quot;");
  return normalizeBlocks(body).map(block => {
    const align = block.align ? ` style="text-align:${block.align}"` : "";
    if (block.type === "rich") return block.html;
    if (block.type === "text") return `<p${align}>${block.html}</p>`;
    if (block.type === "heading") return `<h2${align}>${block.html}</h2>`;
    if (block.type === "image") return `<p style="text-align:center"><img class="art-img art-img-${block.align === "left" || block.align === "right" ? block.align : "center"}" data-bucket="${attr(block.bucket)}" data-path="${attr(block.path)}" style="width:${block.width}%" alt="${attr(block.caption)}"></p>${block.caption ? `<p style="text-align:center"><i>${escapeHtml(block.caption)}</i></p>` : ""}`;
    if (block.type === "pdf") return `<p><a class="art-file-inline" data-bucket="${attr(block.bucket)}" data-path="${attr(block.path)}">📄 ${escapeHtml(block.name)}</a></p>`;
    if (block.type === "link") return `<p><a href="${attr(block.url)}">${escapeHtml(block.label)}</a></p>`;
    return "";
  }).join("");
}

// Nettoyage du HTML saisi : seuls gras, italique, souligné, couleur, police, retours à la ligne et liens sont conservés.
const SAFE_FONT = value => FONTS.some(([font]) => font && font === value) ? value : null;
const SAFE_COLOR = value => /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\))$/i.test(value.trim()) ? value.trim() : null;
// Espaces propres pour un texte justifié : les espaces insécables laissées par l'éditeur ne s'étirent pas
// et empêchent la césure, ce qui creuse de grands blancs. On ne garde l'insécable que là où la typographie
// française l'exige (avant ; : ! ? » % et après «) et on réduit les espaces multiples à une seule.
const tidySpaces = text => text
  .replace(/[ \u00a0]+/g, match => match.includes("\u00a0") ? "\u00a0" : " ")
  .replace(/\u00a0(?![;:!?»%\u00bb])/g, (match, offset, whole) => whole[offset - 1] === "«" ? match : " ");

export function sanitizeHtml(html) {
  const template = document.createElement("template");
  template.innerHTML = String(html ?? "");
  const clean = node => {
    const out = document.createDocumentFragment();
    node.childNodes.forEach(child => {
      if (child.nodeType === Node.TEXT_NODE) { out.append(tidySpaces(child.nodeValue)); return; }
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
      const size = SAFE_SIZE(child.style?.fontSize || "");
      const bold = /^(bold|[6-9]00)$/.test(child.style?.fontWeight || "");
      const italic = child.style?.fontStyle === "italic";
      if (color || font || size || bold || italic) {
        const span = document.createElement("span");
        if (color) span.style.color = color;
        if (font) span.style.fontFamily = font;
        if (size) span.style.fontSize = size;
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

// Texte libre : paragraphes, intertitres, listes, mise en forme, liens, images et PDF placés dans le texte.
// Les images et PDF ne sont acceptés que s'ils viennent du stockage du site (data-path).
const BLOCKS = { p: "p", div: "p", h1: "h2", h2: "h2", h3: "h3", blockquote: "blockquote", ul: "ul", ol: "ol", li: "li" };
const ROOT_BLOCKS = new Set(["P", "H2", "H3", "BLOCKQUOTE", "UL", "OL"]);
export function sanitizeRich(html, client, { editing = false } = {}) {
  const template = document.createElement("template");
  template.innerHTML = String(html ?? "");
  const media = (child, bucketDefault = "site-media-public") => ({ bucket: child.getAttribute("data-bucket") || bucketDefault, path: child.getAttribute("data-path") || "" });
  const clean = node => {
    const out = document.createDocumentFragment();
    node.childNodes.forEach(child => {
      if (child.nodeType === Node.TEXT_NODE) { out.append(tidySpaces(child.nodeValue)); return; }
      if (child.nodeType !== Node.ELEMENT_NODE) return;
      const tag = child.tagName.toLowerCase();
      if (["script", "style", "iframe", "object", "embed", "noscript", "template", "svg", "math"].includes(tag)) return;
      if (tag === "br") { out.append(document.createElement("br")); return; }
      if (tag === "img") {
        const file = media(child);
        if (!file.path) return;
        const image = document.createElement("img");
        const position = (child.className.match(/art-img-(inline|left|center|right)/) || [])[1] || "inline";
        image.className = `art-img art-img-${position}`;
        image.dataset.bucket = file.bucket; image.dataset.path = file.path;
        image.style.width = `${Math.min(100, Math.max(5, parseFloat(child.style.width) || 40))}%`;
        image.alt = child.getAttribute("alt") || "";
        image.src = mediaUrl(client, file);
        if (!editing) image.loading = "lazy";
        out.append(image); return;
      }
      if (tag === "a") {
        if (child.hasAttribute("data-path")) {
          const file = media(child);
          const link = document.createElement("a"); link.className = "art-file-inline";
          link.dataset.bucket = file.bucket; link.dataset.path = file.path; link.href = mediaUrl(client, file);
          link.textContent = child.textContent.trim() || "📄 Document";
          if (editing) link.contentEditable = "false"; else { link.target = "_blank"; link.rel = "noopener"; }
          out.append(link); return;
        }
        const href = child.getAttribute("href") || "";
        if (/^(https?:|mailto:)/i.test(href)) { const link = document.createElement("a"); link.href = href; if (!editing) { link.target = "_blank"; link.rel = "noopener"; } link.append(clean(child)); out.append(link); }
        else out.append(clean(child));
        return;
      }
      if (["b", "strong", "i", "em", "u"].includes(tag)) { const element = document.createElement(tag === "strong" ? "b" : tag === "em" ? "i" : tag); element.append(clean(child)); out.append(element); return; }
      if (BLOCKS[tag]) {
        const element = document.createElement(BLOCKS[tag]);
        const align = child.style?.textAlign || child.getAttribute("align") || "";
        if (TEXT_ALIGNS.has(align)) element.style.textAlign = align;
        element.append(clean(child)); out.append(element); return;
      }
      const color = SAFE_COLOR(child.style?.color || child.getAttribute("color") || "");
      const font = SAFE_FONT((child.style?.fontFamily || child.getAttribute("face") || "").replace(/"/g, "'"));
      const size = SAFE_SIZE(child.style?.fontSize || "");
      const bold = /^(bold|[6-9]00)$/.test(child.style?.fontWeight || "");
      const italic = child.style?.fontStyle === "italic";
      if (color || font || size || bold || italic) {
        const span = document.createElement("span");
        if (color) span.style.color = color;
        if (font) span.style.fontFamily = font;
        if (size) span.style.fontSize = size;
        if (bold) span.style.fontWeight = "700";
        if (italic) span.style.fontStyle = "italic";
        span.append(clean(child)); out.append(span);
      } else out.append(clean(child));
    });
    return out;
  };
  const cleaned = clean(template.content);
  // Tout contenu « en ligne » posé à la racine est regroupé dans des paragraphes.
  const holder = document.createElement("div");
  let paragraph = null;
  [...cleaned.childNodes].forEach(node => {
    if (node.nodeType === Node.ELEMENT_NODE && (ROOT_BLOCKS.has(node.tagName) || node.tagName === "LI")) {
      paragraph = null;
      if (node.tagName === "LI") { const p = document.createElement("p"); p.append(...node.childNodes); holder.append(p); } else holder.append(node);
      return;
    }
    if (!paragraph) { if (node.nodeType === Node.TEXT_NODE && !node.nodeValue.trim()) return; paragraph = document.createElement("p"); holder.append(paragraph); }
    paragraph.append(node);
  });
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
    if (block.type === "rich") {
      const element = document.createElement("div"); element.className = "art-rich";
      element.innerHTML = sanitizeRich(block.html, client);
      if (element.textContent.trim() || element.querySelector("img,a")) nodes.push(element);
    } else if (block.type === "text" || block.type === "heading") {
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
