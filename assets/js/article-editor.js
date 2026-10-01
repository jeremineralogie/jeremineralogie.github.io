// Éditeur des articles (admin) : la case « Contenu » (ajout de textes, intertitres, images, PDF et liens)
// et l'éditeur plein écran « Mise en page » (mise en forme, alignement, déplacement, taille des images).
import { FONTS, mediaUrl, normalizeBlocks, sanitizeHtml } from "./article-content.js";

const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text != null) node.textContent = text; return node; };
const button = (label, title, className = "ce-btn") => { const node = el("button", className, label); node.type = "button"; if (title) { node.title = title; node.setAttribute("aria-label", title); } return node; };
const TYPE_LABELS = { text: "Texte", heading: "Intertitre", image: "Image", pdf: "PDF", link: "Lien" };

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
// Collage : texte brut uniquement (évite d'importer la mise en forme d'autres sites).
function plainPaste(event) {
  event.preventDefault();
  const text = event.clipboardData?.getData("text/plain") || "";
  document.execCommand("insertText", false, text);
}

// ---------- Case « Contenu » ----------
export function createContentEditor({ client, initial, onChange }) {
  let blocks = normalizeBlocks(initial);
  const root = el("div", "ce");
  const list = el("div", "ce-blocks");
  const add = el("div", "ce-add");
  const status = el("p", "ce-status");
  root.append(list, el("p", "ce-help", "Ajoutez vos blocs puis utilisez « Mise en page » pour la mise en forme, l’alignement et la disposition."), add, status);
  const changed = () => onChange?.(blocks);
  const say = (text, error = false) => { status.textContent = text; status.classList.toggle("is-error", error); };

  function render() {
    list.replaceChildren(...blocks.map((block, index) => {
      const row = el("div", "ce-block"); row.dataset.type = block.type;
      const side = el("div", "ce-side");
      side.append(el("span", "ce-type", TYPE_LABELS[block.type]));
      const up = button("↑", "Monter"), down = button("↓", "Descendre"), remove = button("✕", "Supprimer ce bloc", "ce-btn is-danger");
      up.disabled = index === 0; down.disabled = index === blocks.length - 1;
      up.addEventListener("click", () => { [blocks[index - 1], blocks[index]] = [blocks[index], blocks[index - 1]]; render(); changed(); });
      down.addEventListener("click", () => { [blocks[index + 1], blocks[index]] = [blocks[index], blocks[index + 1]]; render(); changed(); });
      remove.addEventListener("click", () => { if (confirm(`Supprimer ce bloc « ${TYPE_LABELS[block.type]} » ?`)) { blocks.splice(index, 1); render(); changed(); } });
      side.append(up, down, remove);
      const body = el("div", "ce-body");
      if (block.type === "text" || block.type === "heading") {
        const editable = el("div", block.type === "heading" ? "ce-text ce-heading" : "ce-text");
        editable.contentEditable = "true"; editable.innerHTML = sanitizeHtml(block.html);
        editable.dataset.placeholder = block.type === "heading" ? "Intertitre…" : "Écrivez votre texte…";
        if (block.align) editable.style.textAlign = block.align;
        editable.addEventListener("input", () => { block.html = editable.innerHTML; changed(); });
        editable.addEventListener("paste", plainPaste);
        body.append(editable);
      } else if (block.type === "image") {
        const image = el("img", "ce-thumb"); image.src = mediaUrl(client, block); image.alt = "";
        const caption = el("input", "ce-input"); caption.placeholder = "Légende (facultative)"; caption.value = block.caption;
        caption.addEventListener("input", () => { block.caption = caption.value; changed(); });
        body.append(image, caption, el("span", "ce-meta", `Largeur ${block.width} % · ${block.align === "left" ? "à gauche" : block.align === "right" ? "à droite" : "centrée"}`));
      } else if (block.type === "pdf") {
        const name = el("input", "ce-input"); name.placeholder = "Nom affiché"; name.value = block.name;
        name.addEventListener("input", () => { block.name = name.value; changed(); });
        body.append(el("span", "ce-file", "📄 Document PDF"), name);
      } else if (block.type === "link") {
        const label = el("input", "ce-input"); label.placeholder = "Texte du lien"; label.value = block.label;
        const url = el("input", "ce-input"); url.type = "url"; url.placeholder = "https://…"; url.value = block.url;
        label.addEventListener("input", () => { block.label = label.value; changed(); });
        url.addEventListener("input", () => { block.url = url.value.trim(); changed(); });
        body.append(label, url);
      }
      row.append(side, body);
      return row;
    }));
    if (!blocks.length) list.append(el("p", "ce-empty", "Le contenu est vide : ajoutez un premier bloc ci-dessous."));
  }

  const insert = block => { blocks.push(block); render(); changed(); list.lastElementChild?.querySelector("[contenteditable], input")?.focus(); };
  const addFile = async (accept, makeBlock, label) => {
    const file = await pickFile(accept);
    if (!file) return;
    say(`Envoi ${label}…`);
    try { insert(makeBlock(await uploadFile(client, file), file)); say(""); }
    catch (error) { console.error("Envoi du fichier :", error); say(`Envoi impossible : ${error.message}`, true); }
  };
  const actions = [
    ["+ Texte", () => insert({ type: "text", html: "", align: "" })],
    ["+ Intertitre", () => insert({ type: "heading", html: "", align: "" })],
    ["+ Image", () => addFile("image/jpeg,image/png,image/webp", stored => ({ type: "image", ...stored, width: 100, align: "center", caption: "" }), "de l’image")],
    ["+ PDF", () => addFile("application/pdf", (stored, file) => ({ type: "pdf", ...stored, name: file.name.replace(/\.pdf$/i, "") }), "du PDF")],
    ["+ Lien", () => insert({ type: "link", url: "", label: "" })]
  ];
  actions.forEach(([label, action]) => { const node = button(label, null, "ce-add-btn"); node.addEventListener("click", action); add.append(node); });
  render();
  return {
    element: root,
    getBlocks: () => blocks.map(block => (block.type === "text" || block.type === "heading") ? { ...block, html: sanitizeHtml(block.html) } : { ...block })
      .filter(block => (block.type !== "text" && block.type !== "heading") || block.html.replace(/<br>/g, "").trim()).filter(block => block.type !== "link" || block.url),
    setBlocks: next => { blocks = normalizeBlocks(next); render(); changed(); }
  };
}

// ---------- Éditeur « Mise en page » ----------
export function openLayoutEditor({ client, blocks: initial }) {
  return new Promise(resolve => {
    const blocks = normalizeBlocks(initial).map(block => ({ ...block }));
    let selected = -1;
    let savedRange = null;
    document.execCommand("styleWithCSS", false, true);

    const overlay = el("div", "le"); overlay.setAttribute("role", "dialog"); overlay.setAttribute("aria-label", "Mise en page de l’article");
    const bar = el("div", "le-bar");
    const bold = button("G", "Gras", "le-tool le-bold"), italic = button("I", "Italique", "le-tool le-italic");
    const font = el("select", "le-font"); font.setAttribute("aria-label", "Police");
    FONTS.forEach(([value, label]) => font.add(new Option(label, value)));
    const color = el("input", "le-color"); color.type = "color"; color.value = "#f3eaff"; color.title = "Couleur du texte"; color.setAttribute("aria-label", "Couleur du texte");
    const left = button("⇤", "Aligner à gauche", "le-tool"), center = button("≡", "Centrer", "le-tool"), right = button("⇥", "Aligner à droite", "le-tool");
    const remove = button("🗑", "Supprimer le bloc", "le-tool");
    const cancel = button("Annuler", null, "le-action"), done = button("Valider la mise en page", null, "le-action is-primary");
    const textTools = el("div", "le-group"); textTools.append(bold, italic, font, color);
    const alignTools = el("div", "le-group"); alignTools.append(left, center, right, remove);
    const finish = el("div", "le-group le-finish"); finish.append(cancel, done);
    bar.append(textTools, alignTools, finish);
    const hint = el("p", "le-hint", "Touchez un bloc pour le sélectionner. Poignée ⠿ : glisser pour déplacer. Image : glisser pour la déplacer, pincer (ou poignée ◢) pour l’agrandir ou la réduire.");
    const stage = el("div", "le-stage");
    const page = el("div", "le-page");
    stage.append(page);
    overlay.append(bar, hint, stage);
    document.body.append(overlay);
    document.body.classList.add("le-open");

    const syncTexts = () => page.querySelectorAll(".le-block").forEach(node => {
      const block = blocks[Number(node.dataset.index)];
      const editable = node.querySelector("[contenteditable]");
      if (block && editable) block.html = editable.innerHTML;
    });
    const isText = block => block && (block.type === "text" || block.type === "heading");

    function render() {
      page.replaceChildren(...blocks.map((block, index) => {
        const node = el("div", `le-block le-${block.type}${index === selected ? " is-selected" : ""}`); node.dataset.index = index;
        const handle = button("⠿", "Glisser pour déplacer", "le-handle");
        handle.addEventListener("pointerdown", event => startDrag(event, index));
        if (isText(block)) {
          const editable = el(block.type === "heading" ? "h2" : "p", "le-edit"); editable.contentEditable = "true";
          editable.innerHTML = sanitizeHtml(block.html); if (block.align) editable.style.textAlign = block.align;
          editable.addEventListener("input", () => { block.html = editable.innerHTML; });
          editable.addEventListener("paste", plainPaste);
          editable.addEventListener("focus", () => select(index, false));
          node.append(handle, editable);
        } else if (block.type === "image") {
          node.classList.add(`le-align-${block.align}`); node.style.width = `${block.width}%`;
          const image = el("img", "le-img"); image.src = mediaUrl(client, block); image.alt = block.caption || ""; image.draggable = false;
          const resize = button("◢", "Glisser pour agrandir ou réduire", "le-resize");
          node.append(handle, image, resize);
          if (block.caption) node.append(el("div", "le-caption", block.caption));
          bindImage(node, image, resize, index);
        } else {
          const label = block.type === "pdf" ? `📄 ${block.name} — Ouvrir le PDF` : `🔗 ${block.label || block.url}`;
          node.append(handle, el("div", "le-chip", label));
        }
        node.addEventListener("pointerdown", event => { if (!event.target.closest(".le-handle, .le-resize")) select(index, false); });
        return node;
      }), el("div", "le-clearfix"));
      updateTools();
    }
    function select(index, rerender = true) {
      if (selected === index) return;
      selected = index;
      page.querySelectorAll(".le-block").forEach(node => node.classList.toggle("is-selected", Number(node.dataset.index) === index));
      if (rerender) render(); else updateTools();
    }
    function updateTools() {
      const block = blocks[selected];
      [bold, italic, font, color].forEach(control => { control.disabled = !isText(block); });
      [left, center, right, remove].forEach(control => { control.disabled = !block; });
      [left, center, right].forEach((control, i) => control.classList.toggle("is-on", Boolean(block) && (block.align || (block.type === "image" ? "center" : "")) === ["left", "center", "right"][i]));
    }

    // Mise en forme du texte sélectionné (ou de tout le bloc si rien n'est sélectionné).
    document.addEventListener("selectionchange", rememberRange);
    function rememberRange() {
      const selection = document.getSelection();
      if (selection?.rangeCount && page.contains(selection.anchorNode)) savedRange = selection.getRangeAt(0).cloneRange();
    }
    function format(command, value) {
      const node = page.querySelector(`.le-block[data-index="${selected}"] [contenteditable]`);
      if (!node) return;
      node.focus();
      const selection = document.getSelection();
      if (savedRange && node.contains(savedRange.startContainer)) { selection.removeAllRanges(); selection.addRange(savedRange); }
      if (!selection.rangeCount || selection.isCollapsed || !node.contains(selection.anchorNode)) { const range = document.createRange(); range.selectNodeContents(node); selection.removeAllRanges(); selection.addRange(range); }
      document.execCommand(command, false, value);
      blocks[selected].html = node.innerHTML;
    }
    [bold, italic, left, center, right, remove].forEach(control => control.addEventListener("mousedown", event => event.preventDefault()));
    bold.addEventListener("click", () => format("bold"));
    italic.addEventListener("click", () => format("italic"));
    font.addEventListener("change", () => { format("fontName", font.value || "inherit"); font.value = ""; });
    color.addEventListener("input", () => format("foreColor", color.value));
    const align = value => { const block = blocks[selected]; if (!block) return; syncTexts(); block.align = value; render(); };
    left.addEventListener("click", () => align("left"));
    center.addEventListener("click", () => align(blocks[selected]?.type === "image" ? "center" : ""));
    right.addEventListener("click", () => align("right"));
    remove.addEventListener("click", () => { if (selected < 0 || !confirm("Supprimer ce bloc ?")) return; syncTexts(); blocks.splice(selected, 1); selected = -1; render(); });

    // Déplacement par glisser (poignée, ou l'image elle-même).
    function startDrag(event, index) {
      event.preventDefault();
      syncTexts(); select(index, false);
      const source = page.querySelector(`.le-block[data-index="${index}"]`);
      source.classList.add("is-dragging");
      const marker = el("div", "le-drop");
      let target = index;
      const move = moveEvent => {
        const y = moveEvent.clientY;
        const others = [...page.querySelectorAll(".le-block")].filter(node => node !== source);
        target = blocks.length - 1;
        let before = null;
        for (const node of others) { const rect = node.getBoundingClientRect(); if (y < rect.top + rect.height / 2) { before = node; break; } }
        if (before) { const beforeIndex = Number(before.dataset.index); target = beforeIndex > index ? beforeIndex - 1 : beforeIndex; page.insertBefore(marker, before); }
        else page.insertBefore(marker, page.querySelector(".le-clearfix"));
        const box = stage.getBoundingClientRect();
        if (y < box.top + 50) stage.scrollTop -= 14; else if (y > box.bottom - 50) stage.scrollTop += 14;
      };
      const end = () => {
        window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", end); window.removeEventListener("pointercancel", end);
        marker.remove(); source.classList.remove("is-dragging");
        if (target !== index) { const [moved] = blocks.splice(index, 1); blocks.splice(target, 0, moved); selected = target; }
        render();
      };
      window.addEventListener("pointermove", move); window.addEventListener("pointerup", end); window.addEventListener("pointercancel", end);
    }

    // Image : pincer pour la taille, glisser pour déplacer, poignée ◢ à la souris.
    function bindImage(node, image, resize, index) {
      const pointers = new Map();
      let pinch = null, pending = null;
      image.addEventListener("pointerdown", event => {
        select(index, false);
        pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        image.setPointerCapture?.(event.pointerId);
        if (pointers.size === 2) {
          const [a, b] = [...pointers.values()];
          pinch = { distance: Math.hypot(a.x - b.x, a.y - b.y) || 1, width: blocks[index].width }; pending = null;
        } else pending = { x: event.clientX, y: event.clientY, event };
      });
      image.addEventListener("pointermove", event => {
        if (!pointers.has(event.pointerId)) return;
        pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (pinch && pointers.size >= 2) {
          const [a, b] = [...pointers.values()];
          const width = Math.round(Math.min(100, Math.max(15, pinch.width * (Math.hypot(a.x - b.x, a.y - b.y) / pinch.distance))));
          blocks[index].width = width; node.style.width = `${width}%`;
        } else if (pending && Math.hypot(event.clientX - pending.x, event.clientY - pending.y) > 10) {
          pointers.clear(); pending = null; startDrag(event, index);
        }
      });
      const release = event => { pointers.delete(event.pointerId); if (pointers.size < 2) pinch = null; if (!pointers.size) pending = null; };
      image.addEventListener("pointerup", release); image.addEventListener("pointercancel", release);
      resize.addEventListener("pointerdown", event => {
        event.preventDefault(); event.stopPropagation(); select(index, false);
        const startX = event.clientX, startWidth = blocks[index].width, pageWidth = page.getBoundingClientRect().width;
        const sign = blocks[index].align === "right" ? -1 : 1;
        const move = moveEvent => {
          const delta = ((moveEvent.clientX - startX) * sign / pageWidth) * 100 * (blocks[index].align === "center" ? 2 : 1);
          const width = Math.round(Math.min(100, Math.max(15, startWidth + delta)));
          blocks[index].width = width; node.style.width = `${width}%`;
        };
        const end = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", end); };
        window.addEventListener("pointermove", move); window.addEventListener("pointerup", end);
      });
    }

    const close = result => {
      document.removeEventListener("selectionchange", rememberRange);
      overlay.remove(); document.body.classList.remove("le-open");
      resolve(result);
    };
    cancel.addEventListener("click", () => { if (confirm("Abandonner les changements de mise en page ?")) close(null); });
    done.addEventListener("click", () => { syncTexts(); close(blocks.map(block => isText(block) ? { ...block, html: sanitizeHtml(block.html) } : block)); });
    render();
  });
}
