// Mots-clés des fiches boutique et collection : remplis automatiquement avec toutes les informations saisies dans le formulaire
// (minéral et ses propriétés, minéraux associés, gisement, commune, département, région, pays, type de site, dimensions, poids, date…).
// Tant que le champ n'est pas modifié à la main, il suit le formulaire ; « Régénérer » le remet en mode automatique.
const clean = value => String(value ?? "").replace(/\s+/g, " ").trim();
const lower = value => clean(value).toLocaleLowerCase("fr");

export function keywordsFrom(info) {
  const terms = [];
  const add = value => { const text = clean(value); if (text) terms.push(text); };
  const mineral = info.mineral || {};
  add(info.mineralName || mineral.name); add(mineral.formula); add(mineral.chemical_class);
  if (mineral.crystal_system) add(`système ${lower(mineral.crystal_system)}`);
  (mineral.colors || []).forEach(add);
  if (mineral.hardness != null) {
    const low = Number(mineral.hardness), high = Number(mineral.hardness_max ?? mineral.hardness);
    add(high !== low ? `dureté ${String(low).replace(".", ",")} à ${String(high).replace(".", ",")}` : `dureté ${String(low).replace(".", ",")}`);
  }
  (info.associated || []).forEach(add);
  add(info.mine); add(info.locality);
  add(info.department); if (info.departmentCode && /^(2[AB]|\d{2,3})$/i.test(info.departmentCode)) add(info.departmentCode);
  add(info.region); add(info.country); add(info.siteType);
  add(info.dimensions); add(info.weight); add(info.discovery); add(info.reference);
  const seen = new Set();
  return terms.filter(term => { const key = lower(term); if (seen.has(key)) return false; seen.add(key); return true; }).join(", ");
}

// refs : listes de référence chargées par l'admin ; form : le formulaire de fiche (boutique ou collection).
export function wireKeywordsAuto(form, refs) {
  const keywords = form.elements.namedItem("keywords");
  if (!keywords) return;
  const field = name => form.elements.namedItem(name);
  const selected = (name, list, pick = item => item.plainName || item.name) => {
    const select = field(name); if (!select) return "";
    const typed = clean(field(`${name}__other`)?.value);
    if (select.value && select.value !== "__other__") { const item = (list || []).find(entry => String(entry.id ?? entry.code) === String(select.value)); return item ? pick(item) : ""; }
    return typed;
  };
  const selectedMany = name => {
    const select = field(name); if (!select) return [];
    const picked = [...(select.selectedOptions || [])].map(option => { const item = (refs.minerals || []).find(entry => String(entry.id) === option.value); return item?.plainName || item?.name || ""; });
    const typed = clean(field(`${name}__other`)?.value).split(",").map(clean);
    return [...picked, ...typed].filter(Boolean);
  };
  const compute = () => {
    const mineralSelect = field("mineral_id");
    const mineral = mineralSelect?.value && mineralSelect.value !== "__other__" ? (refs.minerals || []).find(item => String(item.id) === String(mineralSelect.value)) : null;
    const departmentCode = field("department_code")?.value;
    const siteSelect = field("site_type");
    const siteType = siteSelect ? (clean(field("site_type__other")?.value) || (siteSelect.value && siteSelect.value !== "__other__" ? siteSelect.options[siteSelect.selectedIndex]?.text : "")) : "";
    const weightGrams = clean(field("weight_grams")?.value);
    return keywordsFrom({
      mineral, mineralName: mineral ? "" : selected("mineral_id", refs.minerals), associated: selectedMany("link_associations"),
      mine: selected("mine_id", refs.mines), locality: selected("locality_id", refs.localities),
      department: selected("department_code", refs.departments), departmentCode: departmentCode && departmentCode !== "__other__" ? departmentCode : "",
      region: selected("region_id", refs.regions), country: clean(field("country")?.value || field("provenance")?.value),
      siteType: siteType && !/^—/.test(siteType) ? siteType : "",
      dimensions: field("dimensions")?.value, weight: clean(field("weight_text")?.value) || (weightGrams ? `${weightGrams.replace(".", ",")} g` : ""),
      discovery: field("discovery_date_text")?.value, reference: field("reference")?.value
    });
  };
  let auto = !clean(keywords.value) || clean(keywords.value) === compute();
  const status = document.createElement("small");
  const button = document.createElement("button"); button.type = "button"; button.className = "admin-secondary"; button.textContent = "↻ Régénérer à partir de la fiche";
  const paint = () => { status.textContent = auto ? "Rempli automatiquement avec toutes les informations de la fiche ; il se met à jour tout seul." : "Modifié à la main : il ne suit plus la fiche. Utilisez « Régénérer » pour le remplir de nouveau."; button.hidden = auto; };
  const refresh = () => { if (auto) keywords.value = compute(); };
  keywords.addEventListener("input", () => { auto = false; paint(); });
  button.addEventListener("click", () => { auto = true; keywords.value = compute(); paint(); });
  form.addEventListener("input", event => { if (event.target !== keywords) refresh(); });
  form.addEventListener("change", event => { if (event.target !== keywords) refresh(); });
  // Au moment d'enregistrer, un champ resté vide est rempli.
  form.addEventListener("submit", () => { if (!clean(keywords.value)) keywords.value = compute(); }, true);
  keywords.closest("div")?.append(status, button);
  refresh(); paint();
}
