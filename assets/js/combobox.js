// Champ de saisie avec suggestions qui pilote un <select> existant (resté caché).
// Taper filtre la liste (priorité aux noms qui commencent par la saisie, sans tenir compte des accents) ;
// une valeur absente de la liste est acceptée telle quelle via l'option « Autre » du select.
const fold = value => String(value ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLocaleLowerCase("fr").trim();
const nativeValue = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value");
const nativeInputValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
let uid = 0;

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
  select.after(wrap); wrap.append(input, clear, list);
  select.classList.add("combo-native"); select.tabIndex = -1; select.setAttribute("aria-hidden", "true");
  if (otherInput) otherInput.classList.add("combo-native");

  const hasOther = () => otherValue != null && [...select.options].some(option => option.value === otherValue);
  const choices = () => [...select.options].filter(option => option.value !== "" && option.value !== otherValue).map(option => ({ value: option.value, label: option.textContent.trim() }));
  const currentLabel = () => {
    const value = nativeValue.get.call(select);
    if (!value) return "";
    if (value === otherValue) return otherInput ? nativeInputValue.get.call(otherInput) : "";
    return select.options[select.selectedIndex]?.textContent.trim() || "";
  };
  const sync = () => { if (document.activeElement !== input) input.value = currentLabel(); clear.hidden = !input.value; };

  Object.defineProperty(select, "value", { configurable: true, get() { return nativeValue.get.call(this); }, set(v) { nativeValue.set.call(this, v); sync(); } });
  if (otherInput) Object.defineProperty(otherInput, "value", { configurable: true, get() { return nativeInputValue.get.call(this); }, set(v) { nativeInputValue.set.call(this, v); sync(); } });
  new MutationObserver(sync).observe(select, { childList: true });
  select.form?.addEventListener("reset", () => setTimeout(sync));

  let active = -1, items = [];
  const commit = (value, typed) => {
    const before = nativeValue.get.call(select) + "|" + (otherInput ? nativeInputValue.get.call(otherInput) : "");
    nativeValue.set.call(select, value);
    if (otherInput) nativeInputValue.set.call(otherInput, value === otherValue ? typed : "");
    input.value = currentLabel(); clear.hidden = !input.value;
    const after = nativeValue.get.call(select) + "|" + (otherInput ? nativeInputValue.get.call(otherInput) : "");
    if (before !== after) {
      select.dispatchEvent(new Event("change", { bubbles: true }));
      if (otherInput) otherInput.hidden = true;
    }
    if (onPick && value) { onPick(); input.value = currentLabel(); clear.hidden = !input.value; }
  };
  const close = () => { list.hidden = true; input.setAttribute("aria-expanded", "false"); active = -1; };
  const render = () => {
    const query = fold(input.value);
    const all = choices();
    const starts = [], contains = [];
    for (const choice of all) {
      const label = fold(choice.label);
      if (!query || label.startsWith(query) || label.split(/[\s'’-]+/).some(word => word.startsWith(query))) starts.push(choice);
      else if (label.includes(query)) contains.push(choice);
    }
    items = [...starts, ...contains].slice(0, 60);
    const exact = all.some(choice => fold(choice.label) === query);
    if (query && !exact && hasOther()) items.push({ value: otherValue, label: input.value.trim(), create: true });
    list.replaceChildren(...items.map((item, index) => {
      const li = document.createElement("li"); li.setAttribute("role", "option"); li.id = `${listId}-${index}`;
      li.className = item.create ? "combo-create" : "";
      li.textContent = item.create ? `➕ Ajouter « ${item.label} »` : item.label;
      li.addEventListener("mousedown", event => event.preventDefault());
      li.addEventListener("click", () => { commit(item.value, item.label); close(); });
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

  input.addEventListener("focus", () => { input.select(); render(); });
  input.addEventListener("input", render);
  input.addEventListener("keydown", event => {
    if (event.key === "ArrowDown") { event.preventDefault(); if (list.hidden) render(); active = Math.min(items.length - 1, active + 1); highlight(); }
    else if (event.key === "ArrowUp") { event.preventDefault(); active = Math.max(0, active - 1); highlight(); }
    else if (event.key === "Enter") {
      event.preventDefault();
      if (!list.hidden && active >= 0 && items[active]) commit(items[active].value, items[active].label); else settleTyped();
      close();
    } else if (event.key === "Escape") { input.value = currentLabel(); close(); }
  });
  input.addEventListener("blur", () => { settleTyped(); close(); });
  clear.addEventListener("mousedown", event => event.preventDefault());
  clear.addEventListener("click", () => { input.value = ""; commit("", ""); input.focus(); });
  sync();
}
