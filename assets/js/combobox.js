// Champ de saisie avec suggestions qui pilote un <select> existant (resté caché).
// Taper filtre la liste (priorité aux noms qui commencent par la saisie, sans tenir compte des accents) ;
// une valeur absente de la liste est acceptée telle quelle via l'option « Autre » du select.
const fold = value => String(value ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLocaleLowerCase("fr").trim();
const nativeValue = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value");
const nativeInputValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
let uid = 0;

// Classement des suggestions : d'abord les noms (ou un de leurs mots) qui commencent par la saisie, puis ceux qui la contiennent.
function rank(all, query) {
  const starts = [], contains = [];
  for (const choice of all) {
    const label = fold(choice.label);
    if (!query || label.startsWith(query) || label.split(/[\s'’()-]+/).some(word => word.startsWith(query))) starts.push(choice);
    else if (label.includes(query)) contains.push(choice);
  }
  return [...starts, ...contains];
}
const toggleButton = () => { const button = document.createElement("button"); button.type = "button"; button.className = "combo-toggle"; button.setAttribute("aria-label", "Afficher toute la liste"); button.title = "Afficher toute la liste"; button.textContent = "▾"; button.addEventListener("mousedown", event => event.preventDefault()); return button; };

export function enhanceCombobox(select, { otherValue, otherInput, placeholder = "Tapez pour rechercher…", onPick } = {}) {
  if (!select || select.dataset.combobox) return;
  select.dataset.combobox = "1";
  const listId = `combo-list-${++uid}`;
  const wrap = document.createElement("div"); wrap.className = "combo";
  const input = document.createElement("input");
  input.type = "text"; input.className = "combo-input"; input.autocomplete = "off"; input.spellcheck = false;
  input.placeholder = placeholder; input.setAttribute("role", "combobox"); input.setAttribute("aria-autocomplete", "list");
  input.setAttribute("aria-expanded", "false"); input.setAttribute("aria-controls", listId);
  if (select.id) { input.id = `${select.id}-combo`; const label = document.querySelector(`label[for="${select.id}"]`); if (label) label.htmlFor = input.id; }
  const list = document.createElement("ul"); list.className = "combo-list"; list.id = listId; list.setAttribute("role", "listbox"); list.hidden = true;
  const clear = document.createElement("button"); clear.type = "button"; clear.className = "combo-clear"; clear.setAttribute("aria-label", "Effacer"); clear.textContent = "×";
  const toggle = toggleButton();
  select.after(wrap); wrap.append(input, clear, toggle, list);
  select.classList.add("combo-native"); select.tabIndex = -1; select.setAttribute("aria-hidden", "true");
  if (select.required) { select.required = false; input.required = true; }
  if (select.disabled) input.disabled = true;
  if (otherInput) otherInput.classList.add("combo-native");

  const hasOther = () => otherValue != null && [...select.options].some(option => option.value === otherValue);
  const choices = () => [...select.options].filter(option => option.value !== "" && option.value !== otherValue).map(option => ({ value: option.value, label: option.textContent.trim() }));
  const currentLabel = () => {
    const value = nativeValue.get.call(select);
    if (!value) return "";
    if (value === otherValue) return otherInput ? nativeInputValue.get.call(otherInput) : "";
    return select.options[select.selectedIndex]?.textContent.trim() || "";
  };
  const hasBlank = () => [...select.options].some(option => option.value === "");
  const sync = () => { if (document.activeElement !== input) input.value = currentLabel(); clear.hidden = !input.value || !hasBlank(); };

  Object.defineProperty(select, "value", { configurable: true, get() { return nativeValue.get.call(this); }, set(v) { nativeValue.set.call(this, v); sync(); } });
  const nativeIndex = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "selectedIndex");
  Object.defineProperty(select, "selectedIndex", { configurable: true, get() { return nativeIndex.get.call(this); }, set(v) { nativeIndex.set.call(this, v); sync(); } });
  select.addEventListener("change", sync);
  if (otherInput) Object.defineProperty(otherInput, "value", { configurable: true, get() { return nativeInputValue.get.call(this); }, set(v) { nativeInputValue.set.call(this, v); sync(); } });
  new MutationObserver(sync).observe(select, { childList: true });
  select.form?.addEventListener("reset", () => setTimeout(sync));

  let active = -1, items = [];
  const commit = (value, typed) => {
    if (value === "" && !hasBlank()) { input.value = currentLabel(); return; }
    const before = nativeValue.get.call(select) + "|" + (otherInput ? nativeInputValue.get.call(otherInput) : "");
    nativeValue.set.call(select, value);
    if (otherInput) nativeInputValue.set.call(otherInput, value === otherValue ? typed : "");
    input.value = currentLabel(); clear.hidden = !input.value || !hasBlank();
    const after = nativeValue.get.call(select) + "|" + (otherInput ? nativeInputValue.get.call(otherInput) : "");
    if (before !== after) {
      select.dispatchEvent(new Event("change", { bubbles: true }));
      if (otherInput) otherInput.hidden = true;
    }
    if (onPick && value) { onPick(); input.value = currentLabel(); clear.hidden = !input.value; }
  };
  let otherMode = false;
  const close = () => { list.hidden = true; input.setAttribute("aria-expanded", "false"); active = -1; if (otherMode) { otherMode = false; input.placeholder = placeholder; } };
  // « Autre » : on vide le champ pour saisir une nouvelle valeur.
  const startOther = () => { otherMode = true; input.value = ""; input.placeholder = "Saisissez la nouvelle valeur puis Entrée"; input.focus(); render(); };
  const render = (showAll = false) => {
    const query = showAll ? "" : fold(input.value);
    const all = choices();
    if (otherMode && !query) { const li = document.createElement("li"); li.className = "combo-empty"; li.textContent = "Tapez la nouvelle valeur, puis Entrée."; items = []; list.replaceChildren(li); list.hidden = false; input.setAttribute("aria-expanded", "true"); active = -1; return; }
    items = rank(all, query).slice(0, showAll ? 500 : 80);
    const exact = all.some(choice => fold(choice.label) === query);
    if (query && !exact && hasOther()) items.push({ value: otherValue, label: input.value.trim(), create: true });
    if (!query && hasOther()) items.push({ ask: true });
    list.replaceChildren(...items.map((item, index) => {
      const li = document.createElement("li"); li.setAttribute("role", "option"); li.id = `${listId}-${index}`;
      li.className = item.create || item.ask ? "combo-create" : "";
      li.textContent = item.ask ? "➕ Autre (saisir une nouvelle valeur)…" : item.create ? `➕ Ajouter « ${item.label} »` : item.label;
      li.addEventListener("mousedown", event => event.preventDefault());
      li.addEventListener("click", () => { if (item.ask) { startOther(); return; } commit(item.value, item.label); close(); });
      return li;
    }));
    if (!items.length) { const li = document.createElement("li"); li.className = "combo-empty"; li.textContent = "Aucun résultat"; list.replaceChildren(li); }
    list.hidden = false; input.setAttribute("aria-expanded", "true");
    active = items.length && query ? 0 : -1; highlight();
  };
  const highlight = () => {
    [...list.children].forEach((li, index) => li.classList.toggle("is-active", index === active));
    if (active >= 0) { input.setAttribute("aria-activedescendant", `${listId}-${active}`); list.children[active]?.scrollIntoView({ block: "nearest" }); }
    else input.removeAttribute("aria-activedescendant");
  };
  const settleTyped = () => {
    const typed = input.value.trim();
    if (!typed) { if (nativeValue.get.call(select)) commit("", ""); return; }
    const match = choices().find(choice => fold(choice.label) === fold(typed));
    if (match) commit(match.value, typed);
    else if (hasOther()) commit(otherValue, typed);
    else input.value = currentLabel();
  };

  input.addEventListener("focus", () => { input.select(); render(true); });
  input.addEventListener("input", () => render());
  toggle.addEventListener("click", () => { if (!list.hidden) { close(); return; } input.focus(); render(true); });
  input.addEventListener("keydown", event => {
    if (event.key === "ArrowDown") { event.preventDefault(); if (list.hidden) render(true); active = Math.min(items.length - 1, active + 1); highlight(); }
    else if (event.key === "ArrowUp") { event.preventDefault(); active = Math.max(0, active - 1); highlight(); }
    else if (event.key === "Enter") {
      event.preventDefault();
      if (!list.hidden && active >= 0 && items[active]?.ask) { startOther(); return; }
      if (!list.hidden && active >= 0 && items[active]) commit(items[active].value, items[active].label); else settleTyped();
      close();
    } else if (event.key === "Escape") { input.value = currentLabel(); close(); }
  });
  input.addEventListener("blur", () => { settleTyped(); close(); });
  clear.addEventListener("mousedown", event => event.preventDefault());
  clear.addEventListener("click", () => { input.value = ""; commit("", ""); input.focus(); });
  sync();
}

// Liste à choix multiples (minéraux liés, communes liées…) : on tape, on choisit, chaque choix devient une étiquette.
// Avec otherInput (liste « Autres » séparée par des virgules), un nom absent de la liste peut être ajouté.
export function enhanceMulti(select, { otherInput, placeholder = "Tapez pour ajouter…" } = {}) {
  if (!select || select.dataset.combobox) return;
  select.dataset.combobox = "1";
  const listId = `combo-list-${++uid}`;
  const wrap = document.createElement("div"); wrap.className = "combo combo-multi";
  const chips = document.createElement("div"); chips.className = "combo-chips";
  const row = document.createElement("div"); row.className = "combo-row";
  const input = document.createElement("input");
  input.type = "text"; input.className = "combo-input"; input.autocomplete = "off"; input.spellcheck = false; input.placeholder = placeholder;
  input.setAttribute("role", "combobox"); input.setAttribute("aria-autocomplete", "list"); input.setAttribute("aria-expanded", "false"); input.setAttribute("aria-controls", listId);
  if (select.id) { input.id = `${select.id}-combo`; const label = document.querySelector(`label[for="${select.id}"]`); if (label) label.htmlFor = input.id; }
  const toggle = toggleButton();
  const list = document.createElement("ul"); list.className = "combo-list"; list.id = listId; list.setAttribute("role", "listbox"); list.hidden = true;
  row.append(input, toggle, list); wrap.append(chips, row);
  select.after(wrap);
  select.classList.add("combo-native"); select.tabIndex = -1; select.setAttribute("aria-hidden", "true");
  if (otherInput) otherInput.classList.add("combo-native");

  const typed = () => otherInput ? otherInput.value.split(",").map(part => part.trim()).filter(Boolean) : [];
  const setTyped = names => { otherInput.value = names.join(", "); otherInput.dispatchEvent(new Event("input", { bubbles: true })); otherInput.dispatchEvent(new Event("change", { bubbles: true })); };
  const changed = () => select.dispatchEvent(new Event("change", { bubbles: true }));
  const chip = (label, onRemove, created) => {
    const node = document.createElement("span"); node.className = created ? "combo-chip is-new" : "combo-chip";
    node.append(created ? `➕ ${label}` : label);
    const remove = document.createElement("button"); remove.type = "button"; remove.textContent = "×"; remove.setAttribute("aria-label", `Retirer ${label}`);
    remove.addEventListener("click", () => { onRemove(); renderChips(); });
    node.append(remove); return node;
  };
  function renderChips() {
    chips.replaceChildren(
      ...[...select.selectedOptions].map(option => chip(option.textContent.trim(), () => { option.selected = false; changed(); })),
      ...typed().map(name => chip(name, () => setTyped(typed().filter(item => item !== name)), true))
    );
    chips.hidden = !chips.childElementCount;
  }
  let active = -1, items = [];
  const close = () => { list.hidden = true; input.setAttribute("aria-expanded", "false"); active = -1; };
  const highlight = () => {
    [...list.children].forEach((li, index) => li.classList.toggle("is-active", index === active));
    if (active >= 0) list.children[active]?.scrollIntoView({ block: "nearest" });
  };
  const askOther = () => { input.value = ""; input.placeholder = "Saisissez la nouvelle valeur puis Entrée"; input.focus(); list.hidden = true; };
  const pick = item => {
    if (item.ask) { askOther(); return; }
    if (item.create) { if (!typed().some(name => fold(name) === fold(item.label))) setTyped([...typed(), item.label]); }
    else { const option = [...select.options].find(candidate => candidate.value === item.value); if (option && !option.selected) { option.selected = true; changed(); } }
    input.value = ""; renderChips(); render();
  };
  function render(showAll = false) {
    const query = showAll ? "" : fold(input.value);
    const all = [...select.options].filter(option => option.value !== "" && !option.selected).map(option => ({ value: option.value, label: option.textContent.trim() }));
    items = rank(all, query).slice(0, showAll ? 500 : 80);
    const exact = [...select.options].some(option => fold(option.textContent) === query);
    if (query && !exact && otherInput) items.push({ label: input.value.trim(), create: true });
    if (!query && otherInput) items.push({ ask: true });
    list.replaceChildren(...items.map(item => {
      const li = document.createElement("li"); li.setAttribute("role", "option"); li.className = item.create || item.ask ? "combo-create" : "";
      li.textContent = item.ask ? "➕ Autre (saisir une nouvelle valeur)…" : item.create ? `➕ Ajouter « ${item.label} »` : item.label;
      li.addEventListener("mousedown", event => event.preventDefault());
      li.addEventListener("click", () => item.ask ? askOther() : pick(item));
      return li;
    }));
    if (!items.length) { const li = document.createElement("li"); li.className = "combo-empty"; li.textContent = query ? "Aucun résultat" : "Tout est déjà choisi"; list.replaceChildren(li); }
    list.hidden = false; input.setAttribute("aria-expanded", "true");
    active = items.length && query ? 0 : -1; highlight();
  }
  input.addEventListener("focus", () => render(true));
  input.addEventListener("input", () => render());
  toggle.addEventListener("click", () => { if (!list.hidden) { close(); return; } input.focus(); render(true); });
  input.addEventListener("keydown", event => {
    if (event.key === "ArrowDown") { event.preventDefault(); if (list.hidden) render(true); active = Math.min(items.length - 1, active + 1); highlight(); }
    else if (event.key === "ArrowUp") { event.preventDefault(); active = Math.max(0, active - 1); highlight(); }
    else if (event.key === "Enter" || (event.key === "," && otherInput)) {
      event.preventDefault();
      const query = fold(input.value);
      const exact = items.find(item => !item.create && fold(item.label) === query);
      if (exact) pick(exact); else if (active >= 0 && items[active]) pick(items[active]); else if (query && otherInput) pick({ label: input.value.trim(), create: true });
    } else if (event.key === "Backspace" && !input.value) {
      const names = typed();
      if (names.length) setTyped(names.slice(0, -1));
      else { const last = [...select.selectedOptions].pop(); if (last) { last.selected = false; changed(); } }
      renderChips();
    } else if (event.key === "Escape") { input.value = ""; close(); }
  });
  input.addEventListener("blur", () => { input.value = ""; input.placeholder = placeholder; close(); });
  new MutationObserver(renderChips).observe(select, { childList: true, subtree: true, attributes: true, attributeFilter: ["selected"] });
  select.addEventListener("change", renderChips);
  otherInput?.addEventListener("input", renderChips);
  select.form?.addEventListener("reset", () => setTimeout(renderChips));
  renderChips();
}

// Toutes les listes déroulantes d'une zone (et celles ajoutées plus tard) deviennent des champs où l'on peut écrire.
export function autoEnhanceSelects(root = document.body) {
  const enhance = scope => {
    const selects = scope.matches?.("select") ? [scope] : [...(scope.querySelectorAll?.("select") || [])];
    selects.forEach(select => {
      if (select.dataset.combobox || select.dataset.noCombo || select.closest("template,[data-no-combo]")) return;
      if (select.multiple) enhanceMulti(select);
      else enhanceCombobox(select, { placeholder: "Tapez ou choisissez…" });
    });
  };
  enhance(root);
  let queued = false;
  new MutationObserver(() => {
    if (queued) return; queued = true;
    queueMicrotask(() => { queued = false; enhance(root); });
  }).observe(root, { childList: true, subtree: true });
}
