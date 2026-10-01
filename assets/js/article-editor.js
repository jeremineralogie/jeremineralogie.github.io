// Éditeur des articles (admin) : un seul texte libre, comme un traitement de texte.
// Images, PDF et liens s'insèrent à l'endroit du curseur, n'importe où dans le texte (même entre deux mots).
// Une image touchée se règle (taille, position dans le texte / à gauche / centrée / à droite), se déplace
// par glisser-déposer (ordinateur) ou avec « Déplacer » puis un toucher dans le texte (téléphone), et se pince pour changer de taille.
import { FONTS, blocksToRichHtml, sanitizeRich } from "./article-content.js";

const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text != null) node.textContent = text; return node; };
const tool = (label, title, className = "ce-tool") => { const node = el("button", className, label); node.type = "button"; node.title = title; node.setAttribute("aria-label", title); node.addEventListener("mousedown", event => event.preventDefault()); return node; };
const POSITIONS = [["inline", "Dans le texte"], ["left", "À gauche"], ["center", "Centrée"], ["right", "À droite"]];

async function uploadFile(client, file) {
  const name = file.name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9.-]+/g, "-");
  const path = `articles/contenu/${crypto.randomUUID()}-${name}`;
  const { error } = await client.storage.from("site-media-public").upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw error;
  return { bucket: "site-media-public", path };
}
function pickFile(accept) {
  return new Promise(resolve => {
    const input = el("input"); input.type = "file"; input.accept = accept;
    input.addEventListener("change", () => resolve(input.files?.[0] || null), { once: true });
    input.click();
  });
}
function caretFromPoint(x, y) {
  if (document.caretRangeFromPoint) return document.caretRangeFromPoint(x, y);
  const position = document.caretPositionFromPoint?.(x, y);
  if (!position) return null;
  const range = document.createRange(); range.setStart(position.offsetNode, position.offset); range.collapse(true); return range;
}

export function createContentEditor({ client, initial, onChange }) {
  const root = el("div", "ce");
  const bar = el("div", "ce-bar");
  const imageBar = el("div", "ce-imgbar"); imageBar.hidden = true;
  const doc = el("div", "ce-doc art-rich");
  doc.contentEditable = "true"; doc.spellcheck = true; doc.dataset.placeholder = "Écrivez votre article… Placez le curseur où vous voulez puis ajoutez une image, un PDF ou un lien.";
  const status = el("p", "ce-status");
  root.append(bar, imageBar, doc, status);

  let saved = null, selectedImage = null, moving = null, dragged = null;
  const say = (text, error = false) => { status.textContent = text; status.classList.toggle("is-error", error); };
  const changed = () => onChange?.(getBlocks());
  const insideDoc = node => node && doc.contains(node.nodeType === Node.ELEMENT_NODE ? node : node.parentNode);

  const onSelection = () => {
    if (!doc.isConnected) { document.removeEventListener("selectionchange", onSelection); return; }
    const selection = getSelection();
    if (selection.rangeCount && insideDoc(selection.anchorNode)) saved = selection.getRangeAt(0).cloneRange();
  };
  document.addEventListener("selectionchange", onSelection);
  const restore = () => {
    doc.focus({ preventScroll: true });
    if (saved && insideDoc(saved.startContainer)) { const selection = getSelection(); selection.removeAllRanges(); selection.addRange(saved); }
  };
  const exec = (command, value) => { restore(); document.execCommand("styleWithCSS", false, true); document.execCommand(command, false, value); changed(); };

  function placeCaretAfter(node) {
    const range = document.createRange(); range.setStartAfter(node); range.collapse(true);
    const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range); saved = range.cloneRange();
  }
  function insertAt(node, range) {
    if (!range || !insideDoc(range.startContainer)) { range = document.createRange(); range.selectNodeContents(doc.lastElementChild?.tagName === "P" ? doc.lastElementChild : doc); range.collapse(false); }
    range.deleteContents(); range.insertNode(node); placeCaretAfter(node); changed();
  }
  const insertNode = node => { restore(); const selection = getSelection(); insertAt(node, selection.rangeCount ? selection.getRangeAt(0) : saved); };

  // ---------- Barre d'outils ----------
  const bold = tool("G", "Gras", "ce-tool ce-bold"), italic = tool("I", "Italique", "ce-tool ce-italic"), underline = tool("S", "Souligné", "ce-tool ce-underline");
  bold.addEventListener("click", () => exec("bold")); italic.addEventListener("click", () => exec("italic")); underline.addEventListener("click", () => exec("underline"));
  const heading = tool("Intertitre", "Transformer la ligne en intertitre (ou revenir au texte normal)");
  heading.addEventListener("click", () => {
    restore(); const node = getSelection().anchorNode; const current = (node?.nodeType === 1 ? node : node?.parentElement)?.closest("h2");
    document.execCommand("formatBlock", false, current && doc.contains(current) ? "p" : "h2"); changed();
  });
  const font = el("select", "ce-font"); font.dataset.noCombo = "1"; font.title = "Police";
  FONTS.forEach(([value, label]) => { const option = el("option", "", label); option.value = value; font.append(option); });
  font.addEventListener("change", () => { if (font.value) exec("fontName", font.value); else exec("removeFormat"); font.value = ""; });
  const color = el("input", "ce-color"); color.type = "color"; color.value = "#e6dcf5"; color.title = "Couleur du texte";
  color.addEventListener("input", () => exec("foreColor", color.value));
  const aligns = [["⇤", "left", "justifyLeft", "Aligner à gauche"], ["↔", "center", "justifyCenter", "Centrer"], ["⇥", "right", "justifyRight", "Aligner à droite"]].map(([label, position, command, title]) => {
    const button = tool(label, title);
    button.addEventListener("click", () => { if (selectedImage) setPosition(position); else exec(command); });
    return button;
  });
  const addImage = tool("🖼 Image", "Insérer une image à l’endroit du curseur", "ce-tool ce-insert");
  const addPdf = tool("📄 PDF", "Insérer un PDF à l’endroit du curseur", "ce-tool ce-insert");
  const addLink = tool("🔗 Lien", "Insérer un lien (ou transformer le texte sélectionné en lien)", "ce-tool ce-insert");
  const full = tool("⛶ Plein écran", "Agrandir l’éditeur sur tout l’écran", "ce-tool ce-full");
  bar.append(bold, italic, underline, heading, font, color, ...aligns, addImage, addPdf, addLink, full);

  async function insertImageFile(file, range) {
    say("Envoi de l’image…");
    try {
      const stored = await uploadFile(client, file);
      const image = el("img", "art-img art-img-inline");
      image.dataset.bucket = stored.bucket; image.dataset.path = stored.path; image.style.width = "40%"; image.alt = "";
      image.src = client.storage.from(stored.bucket).getPublicUrl(stored.path).data.publicUrl;
      if (range) insertAt(image, range); else insertNode(image);
      selectImage(image); say("Image ajoutée. Touchez-la pour régler sa taille et sa position.");
    } catch (error) { say(`Envoi impossible : ${error.message || error}`, true); }
  }
  addImage.addEventListener("click", async () => { const keep = saved; const file = await pickFile("image/jpeg,image/png,image/webp,image/gif"); saved = keep; if (file) await insertImageFile(file); });
  addPdf.addEventListener("click", async () => {
    const keep = saved; const file = await pickFile("application/pdf,.pdf"); saved = keep;
    if (!file) return;
    const name = (prompt("Nom affiché pour ce PDF :", file.name.replace(/\.pdf$/i, "")) ?? "").trim() || file.name;
    say("Envoi du PDF…");
    try {
      const stored = await uploadFile(client, file);
      const link = el("a", "art-file-inline", `📄 ${name}`); link.contentEditable = "false";
      link.dataset.bucket = stored.bucket; link.dataset.path = stored.path;
      link.href = client.storage.from(stored.bucket).getPublicUrl(stored.path).data.publicUrl;
      insertNode(link); say("PDF ajouté.");
    } catch (error) { say(`Envoi impossible : ${error.message || error}`, true); }
  });
  addLink.addEventListener("click", () => {
    const keep = saved && !saved.collapsed ? saved.cloneRange() : null;
    const url = (prompt("Adresse du lien (https://…) :", "https://") ?? "").trim();
    if (!/^(https?:\/\/.+|mailto:.+)/i.test(url)) { if (url && url !== "https://") say("Adresse invalide : elle doit commencer par https:// ou mailto:", true); return; }
    if (keep) { saved = keep; exec("createLink", url); return; }
    const label = (prompt("Texte du lien :", url) ?? "").trim() || url;
    const link = el("a", "", label); link.href = url; insertNode(link);
  });
  full.addEventListener("click", () => toggleFullscreen());
  function toggleFullscreen(force) {
    const on = root.classList.toggle("is-full", force);
    document.body.classList.toggle("ce-open", on);
    full.textContent = on ? "✓ Terminer" : "⛶ Plein écran";
    if (!on) say("Pensez à enregistrer l’article.");
    doc.focus({ preventScroll: true });
  }

  // ---------- Image sélectionnée ----------
  const sizeLabel = el("label", "ce-size");
  const size = el("input"); size.type = "range"; size.min = "5"; size.max = "100"; size.step = "1";
  const sizeValue = el("span", "ce-size-value");
  sizeLabel.append("Taille ", size, sizeValue);
  const positionButtons = POSITIONS.map(([position, label]) => { const button = tool(label, `Image : ${label.toLowerCase()}`, "ce-tool ce-pos"); button.dataset.position = position; button.addEventListener("click", () => setPosition(position)); return button; });
  const move = tool("✥ Déplacer", "Déplacer l’image : touchez ensuite l’endroit du texte où la placer", "ce-tool");
  const alt = tool("Description", "Description de l’image (pour l’accessibilité et Google)", "ce-tool");
  const remove = tool("✕ Retirer", "Retirer l’image du texte", "ce-tool is-danger");
  imageBar.append(sizeLabel, ...positionButtons, move, alt, remove);

  function selectImage(image) {
    selectedImage?.classList.remove("is-selected");
    selectedImage = image;
    imageBar.hidden = !image;
    if (!image) return;
    image.classList.add("is-selected");
    const width = Math.round(parseFloat(image.style.width) || 40); size.value = width; sizeValue.textContent = `${width} %`;
    const position = (image.className.match(/art-img-(inline|left|center|right)/) || [])[1] || "inline";
    positionButtons.forEach(button => button.classList.toggle("is-on", button.dataset.position === position));
  }
  function setPosition(position) {
    if (!selectedImage) return;
    selectedImage.className = selectedImage.className.replace(/art-img-(inline|left|center|right)/, `art-img-${position}`);
    selectImage(selectedImage); changed();
  }
  size.addEventListener("input", () => { if (!selectedImage) return; selectedImage.style.width = `${size.value}%`; sizeValue.textContent = `${size.value} %`; changed(); });
  move.addEventListener("click", () => { if (!selectedImage) return; moving = selectedImage; doc.classList.add("is-moving"); say("Touchez l’endroit du texte où placer l’image (entre deux mots si vous voulez)."); });
  alt.addEventListener("click", () => { if (!selectedImage) return; const value = prompt("Description de l’image :", selectedImage.alt || ""); if (value != null) { selectedImage.alt = value.trim(); changed(); } });
  remove.addEventListener("click", () => { if (!selectedImage) return; const image = selectedImage; selectImage(null); image.remove(); changed(); });

  doc.addEventListener("click", event => {
    if (moving) {
      event.preventDefault();
      const range = caretFromPoint(event.clientX, event.clientY);
      if (range && insideDoc(range.startContainer) && range.startContainer !== moving) { insertAt(moving, range); selectImage(moving); say("Image déplacée."); }
      moving = null; doc.classList.remove("is-moving"); return;
    }
    selectImage(event.target.tagName === "IMG" ? event.target : null);
  });
  // Glisser-déposer (ordinateur) : image ou PDF déplacé à l'endroit exact du dépôt ; une image déposée depuis l'ordinateur est envoyée.
  doc.addEventListener("dragstart", event => {
    const target = event.target.closest?.("img, a.art-file-inline");
    if (!target || !doc.contains(target)) return;
    dragged = target; event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", " ");
  });
  doc.addEventListener("dragover", event => { if (dragged || event.dataTransfer?.types?.includes("Files")) event.preventDefault(); });
  doc.addEventListener("drop", event => {
    const range = caretFromPoint(event.clientX, event.clientY);
    if (dragged) {
      event.preventDefault();
      if (range && insideDoc(range.startContainer) && !dragged.contains(range.startContainer)) insertAt(dragged, range);
      if (dragged.tagName === "IMG") selectImage(dragged);
      dragged = null; return;
    }
    const file = [...(event.dataTransfer?.files || [])].find(item => item.type.startsWith("image/"));
    if (file) { event.preventDefault(); void insertImageFile(file, range); }
  });
  doc.addEventListener("dragend", () => { dragged = null; });
  // Pincement sur l'image sélectionnée (téléphone) : change sa taille.
  const pointers = new Map(); let pinch = null;
  const spread = () => { const [a, b] = [...pointers.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
  doc.addEventListener("pointerdown", event => {
    if (event.target !== selectedImage || event.pointerType !== "touch") return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 2) pinch = { distance: spread(), width: parseFloat(selectedImage.style.width) || 40 };
  });
  doc.addEventListener("pointermove", event => {
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pinch && pointers.size === 2 && selectedImage) {
      const width = Math.round(Math.min(100, Math.max(5, pinch.width * spread() / pinch.distance)));
      selectedImage.style.width = `${width}%`; size.value = width; sizeValue.textContent = `${width} %`;
    }
  });
  const endPointer = event => { if (!pointers.delete(event.pointerId)) return; if (pointers.size < 2 && pinch) { pinch = null; changed(); } };
  doc.addEventListener("pointerup", endPointer); doc.addEventListener("pointercancel", endPointer);

  // Saisie et collage (texte brut : pas de mise en forme importée d'autres sites).
  doc.addEventListener("input", () => changed());
  doc.addEventListener("paste", event => {
    const file = [...(event.clipboardData?.files || [])].find(item => item.type.startsWith("image/"));
    event.preventDefault();
    if (file) { void insertImageFile(file); return; }
    document.execCommand("insertText", false, event.clipboardData?.getData("text/plain") || "");
  });
  doc.addEventListener("keydown", event => {
    if (event.key === "Escape" && root.classList.contains("is-full")) toggleFullscreen(false);
  });

  // ---------- Lecture / écriture ----------
  function getBlocks() {
    const clone = doc.cloneNode(true);
    clone.querySelectorAll(".is-selected").forEach(node => node.classList.remove("is-selected"));
    clone.querySelectorAll("img[data-path]").forEach(node => { node.removeAttribute("src"); node.removeAttribute("loading"); if (!node.getAttribute("class")) node.removeAttribute("class"); });
    clone.querySelectorAll("[contenteditable]").forEach(node => node.removeAttribute("contenteditable"));
    const html = clone.innerHTML.trim();
    return clone.textContent.trim() || clone.querySelector("img,a") ? [{ type: "rich", html }] : [];
  }
  function setBlocks(blocks) { selectImage(null); doc.innerHTML = sanitizeRich(blocksToRichHtml(blocks), client, { editing: true }); }
  document.execCommand("defaultParagraphSeparator", false, "p");
  setBlocks(initial);
  return { element: root, getBlocks, setBlocks, toggleFullscreen };
}
