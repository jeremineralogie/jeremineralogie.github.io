export function bindFilterPanel(panel, selects, onChange) {
  const count = panel.querySelector(".filter-count");
  const reset = panel.querySelector(".filter-reset");
  const update = () => {
    const active = selects.filter(select => select.value).length;
    count.textContent = active ? `(${active})` : "";
    count.hidden = !active;
    reset.disabled = !active;
  };
  selects.forEach(select => select.addEventListener("change", () => { update(); onChange(); }));
  reset.addEventListener("click", () => { selects.forEach(select => { select.value = ""; }); update(); onChange(); });
  update();
  return update;
}

export function fillFilterOptions(selects, rows, valuesOf) {
  selects.forEach(select => {
    const selected = select.value;
    const firstOption = select.options[0];
    const values = new Set(rows.flatMap(row => valuesOf(row, select.dataset.filter)).map(value => String(value || "").trim()).filter(Boolean));
    select.replaceChildren(firstOption);
    [...values].sort((a, b) => a.localeCompare(b, "fr")).forEach(value => select.add(new Option(value, value)));
    select.value = values.has(selected) ? selected : "";
  });
}
