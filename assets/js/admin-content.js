import { ensureNamed, OTHER } from "./reference-resolver.js";

const PUBLIC_BUCKET = "site-media-public";
const DRAFT_BUCKET = "admin-staging";
const $ = (root, selector) => root.querySelector(selector);
const text = value => String(value ?? "").trim();
const slugify = value => text(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const sections = [
  { id: "shop", label: "Boutique", table: "shop_items", title: "Boutique", mediaTable: "shop_item_media", foreignKey: "shop_item_id", path: "shop", fields: [
    { key: "reference", label: "Référence", required: true }, { key: "title", label: "Titre", required: true },
    { key: "mineral_id", label: "Minéral", ref: "minerals", display: "name" }, { key: "mineral_association", label: "Association minérale", type: "textarea", notNull: true },
    { key: "provenance", label: "Provenance", notNull: true }, { key: "mine_id", label: "Gisement", ref: "mines", display: "name" },
    { key: "locality_id", label: "Localité", ref: "localities", display: "name" }, { key: "department_code", label: "Département", ref: "departments", display: "name", value: "code" },
    { key: "dimensions", label: "Dimensions", notNull: true }, { key: "weight_grams", label: "Poids (g)", type: "number", step: "0.001" },
    { key: "description", label: "Description", type: "textarea", notNull: true }, { key: "price_cents", label: "Prix (euros)", type: "number", step: "0.01", required: true, euros: true },
    { key: "sale_status", label: "Disponibilité", type: "select", options: [["available", "Disponible"], ["sold", "Vendu"], ["hidden", "Masqué"]] },
    { key: "publication_status", label: "Publication", type: "select", options: [["draft", "Brouillon"], ["published", "Publié"]] }
  ] },
  { id: "articles", label: "Articles", table: "articles", title: "Articles", mediaTable: "article_media", foreignKey: "article_id", path: "articles", links: [["article_specimens", "specimen_id", "specimens"], ["article_mines", "mine_id", "mines"], ["article_localities", "locality_id", "localities"], ["article_minerals", "mineral_id", "minerals"]], fields: [
    { key: "title", label: "Titre", required: true }, { key: "category", label: "Catégorie", required: true, type: "select", customOptions: true, options: [["mineralogie", "Minéralogie"], ["geologie", "Géologie"], ["cristallographie", "Cristallographie"], ["mines-histoire", "Mines & histoire"], ["decouvertes", "Découvertes"], ["identification", "Identification"], ["collection", "Collection"], ["pedagogie", "Pédagogie"]] },
    { key: "excerpt", label: "Résumé", type: "textarea", notNull: true }, { key: "body", label: "Contenu (un paragraphe par ligne vide)", type: "textarea", body: true, notNull: true },
    { key: "published_on", label: "Date de publication", type: "date" }, { key: "publication_status", label: "Publication", type: "select", options: [["draft", "Brouillon"], ["published", "Publié"]] },
    { key: "link_specimens", label: "Spécimens liés", ref: "specimens", display: "slug", multi: true }, { key: "link_mines", label: "Mines liées", ref: "mines", display: "name", multi: true }, { key: "link_localities", label: "Localités liées", ref: "localities", display: "name", multi: true }, { key: "link_minerals", label: "Minéraux liés", ref: "minerals", display: "name", multi: true }
  ] },
  { id: "archives", label: "Archives & Documentation", table: "archive_documents", title: "Archives & Documentation", singleFile: true, path: "archives", links: [["archive_specimens", "specimen_id", "specimens"], ["archive_articles", "article_id", "articles"], ["archive_mines", "mine_id", "mines"], ["archive_localities", "locality_id", "localities"], ["archive_minerals", "mineral_id", "minerals"]], fields: [
    { key: "title", label: "Titre", required: true }, { key: "category", label: "Catégorie", required: true, type: "select", customOptions: true, options: [["mine-gisement", "Mine / gisement"], ["archive-historique", "Archive historique"], ["plan-carte", "Plan / carte"], ["histoire-exploitation", "Histoire de l’exploitation"], ["publication-scientifique", "Publication scientifique"], ["catalogue", "Catalogue"], ["bibliographie", "Bibliographie"], ["photographie-ancienne", "Photographie ancienne"]] },
    { key: "description", label: "Description", type: "textarea", notNull: true }, { key: "document_date", label: "Date du document", type: "date" },
    { key: "rights_note", label: "Droits / crédit", type: "textarea", notNull: true }, { key: "publication_status", label: "Publication", type: "select", options: [["draft", "Brouillon"], ["published", "Publié"]] },
    { key: "link_specimens", label: "Spécimens liés", ref: "specimens", display: "slug", multi: true }, { key: "link_articles", label: "Articles liés", ref: "articles", display: "title", multi: true }, { key: "link_mines", label: "Mines liées", ref: "mines", display: "name", multi: true }, { key: "link_localities", label: "Localités liées", ref: "localities", display: "name", multi: true }, { key: "link_minerals", label: "Minéraux liés", ref: "minerals", display: "name", multi: true }
  ] },
  { id: "regions", label: "Régions", table: "regions", title: "Régions", fields: [{ key: "name", label: "Nom", required: true }] },
  { id: "departments", label: "Départements", table: "departments", title: "Départements", fields: [{ key: "code", label: "Code (identifiant)", required: true }, { key: "name", label: "Nom", required: true }, { key: "region_id", label: "Région", ref: "regions", display: "name" }] },
  { id: "localities", label: "Localités", table: "localities", title: "Localités", fields: [{ key: "name", label: "Nom", required: true }, { key: "department_code", label: "Département", ref: "departments", display: "name", value: "code" }, { key: "notes", label: "Notes", type: "textarea", notNull: true }, { key: "publication_status", label: "Publication", type: "select", options: [["draft", "Brouillon"], ["published", "Publié"]] }] },
  { id: "mines", label: "Mines & gisements", table: "mines", title: "Mines & gisements", fields: [{ key: "name", label: "Nom", required: true }, { key: "locality_id", label: "Localité", ref: "localities", display: "name" }, { key: "description", label: "Description", type: "textarea", notNull: true }, { key: "publication_status", label: "Publication", type: "select", options: [["draft", "Brouillon"], ["published", "Publié"]] }] },
  { id: "minerals", label: "Minéraux", table: "minerals", title: "Référentiel minéral", fields: [{ key: "name", label: "Nom", required: true }, { key: "formula", label: "Formule" }, { key: "crystal_system", label: "Système cristallin" }, { key: "hardness", label: "Dureté", type: "number", step: "0.01" }, { key: "density", label: "Densité", type: "number", step: "0.001" }, { key: "colors", label: "Couleurs (séparées par des virgules)", array: true }, { key: "luster", label: "Éclat" }, { key: "cleavage", label: "Clivage" }, { key: "habit", label: "Habitus" }, { key: "formation", label: "Formation", type: "textarea" }, { key: "publication_status", label: "Publication", type: "select", options: [["draft", "Brouillon"], ["published", "Publié"]] }] },
  { id: "occurrences", label: "Occurrences minérales", table: "mineral_occurrences", title: "Occurrences minérales", fields: [{ key: "mineral_id", label: "Minéral", ref: "minerals", display: "name", required: true }, { key: "department_code", label: "Département", ref: "departments", display: "name", value: "code", required: true }, { key: "locality_id", label: "Localité (facultative)", ref: "localities", display: "name" }, { key: "source_note", label: "Source / note", type: "textarea", notNull: true }] },
  { id: "settings", label: "Paramètres du site", table: "site_settings", title: "Paramètres du site", fields: [{ key: "key", label: "Clé", required: true }, { key: "value", label: "Valeur JSON", type: "textarea" }, { key: "is_public", label: "Visible publiquement", type: "checkbox" }] }
];

let client;
let tabs;
let workspace;
let status;
let activeSection;
let records = [];
let refs = {};
let selectedRecord = null;
let currentMedia = [];
let uploadInput;
const uploadedFileKeys = new Set();
let previewUrls = [];
let activeGroupId = null;
let activeViewId = null;
let viewMode = "both";
let openToken = 0;
let pendingLinkExtras = {};
let createdNames = [];
// Listes dont la valeur « Autre » crée une nouvelle fiche (ou une nouvelle catégorie) enregistrée pour les saisies suivantes.
const CREATABLE_REFS = ["minerals", "mines", "localities", "regions"];
const allowsOther = field => (field.ref && CREATABLE_REFS.includes(field.ref)) || Boolean(field.customOptions);

// Navigation : chaque groupe = une section principale ; chaque vue = un sous-onglet.
// mode « add » = formulaire seul, « list » = liste seule, « both » = liste + formulaire (référentiels).
const referentialViews = ["regions", "departments", "localities", "mines", "minerals", "occurrences", "settings"]
  .map(id => ({ id, label: sections.find(section => section.id === id).label, section: id, mode: "both" }));
const groups = {
  shop: { start: "list", views: [
    { id: "add", label: "Ajouter un produit", section: "shop", mode: "add" },
    { id: "list", label: "Produits dans la boutique", section: "shop", mode: "list" }] },
  articles: { start: "list", views: [
    { id: "add", label: "Créer un article", section: "articles", mode: "add" },
    { id: "list", label: "Articles en ligne", section: "articles", mode: "list" }] },
  archives: { start: "list", views: [
    { id: "add", label: "Ajouter une archive", section: "archives", mode: "add" },
    { id: "list", label: "Archives en ligne", section: "archives", mode: "list" }] },
  referentiels: { start: "regions", views: referentialViews }
};
const currentViews = () => groups[activeGroupId]?.views || [];
const currentView = () => currentViews().find(view => view.id === activeViewId);

function report(message, error = false) {
  status.textContent = message;
  status.classList.toggle("admin-error", error);
}

function errorText(error) {
  return [error?.message || "Erreur inconnue", error?.code && `Code : ${error.code}`, error?.details, error?.hint].filter(Boolean).join(" — ");
}

export async function initContentAdmin(supabase) {
  client = supabase;
  tabs = document.querySelector("#content-tabs");
  workspace = document.querySelector("#content-workspace");
  status = document.querySelector("#content-status");
  tabs.addEventListener("click", event => {
    const button = event.target.closest("[data-view]");
    if (button) void openView(button.dataset.view);
  });
}

export async function openGroup(groupId) {
  const group = groups[groupId];
  if (!group) throw new Error(`Section inconnue : ${groupId}`);
  activeGroupId = groupId;
  await openView(group.start);
}

function renderSubnav() {
  tabs.replaceChildren();
  currentViews().forEach(view => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "admin-tab";
    button.dataset.view = view.id;
    button.textContent = view.label;
    const active = view.id === activeViewId;
    button.classList.toggle("is-active", active);
    if (active) button.setAttribute("aria-current", "page");
    tabs.append(button);
  });
}

async function openView(viewId) {
  const view = currentViews().find(item => item.id === viewId);
  if (!view) return;
  activeViewId = view.id;
  viewMode = view.mode;
  renderSubnav();
  await openSection(sections.find(section => section.id === view.section));
}

// Après enregistrement / suppression / annulation : retour à la liste (sections avec onglets séparés).
function setListMode() {
  if (viewMode !== "add") return;
  const view = currentViews().find(item => item.section === activeSection.id && item.mode === "list");
  if (!view) return;
  viewMode = "list"; activeViewId = view.id; renderSubnav();
}
// Clic sur un élément de la liste : bascule sur le formulaire (onglet « Ajouter… » en mode modification).
function setFormMode() {
  if (viewMode !== "list") return;
  const view = currentViews().find(item => item.section === activeSection.id && item.mode === "add");
  if (!view) return;
  viewMode = "add"; activeViewId = view.id; renderSubnav();
}

async function openSection(section) {
  const token = ++openToken;
  clearNewMediaSelection();
  activeSection = section;
  selectedRecord = null;
  workspace.replaceChildren();
  report(`Chargement de ${section.title.toLocaleLowerCase("fr")}…`);
  try {
    await loadReferences(section);
    await loadRecords();
    if (token !== openToken) return;
    renderWorkspace();
    report(`${section.title} chargés depuis Supabase.`);
  } catch (error) {
    if (token !== openToken) return;
    workspace.replaceChildren();
    report(`Impossible de charger ${section.title.toLocaleLowerCase("fr")} : ${errorText(error)}`, true);
    console.error(`Chargement CMS ${section.id}:`, error);
  }
}

async function loadReferences(section) {
  refs = {};
  const tables = [...new Set(section.fields.filter(field => field.ref).map(field => field.ref))];
  for (const table of tables) {
    const select = table === "departments" ? "code,name" : table === "specimens" ? "id,slug" : table === "articles" ? "id,title" : "id,name";
    const { data, error } = await client.from(table).select(select).order(table === "departments" ? "name" : table === "specimens" ? "slug" : table === "articles" ? "title" : "name");
    if (error) throw error;
    refs[table] = data || [];
  }
}

async function loadRecords() {
  const ordering = activeSection.table === "departments" ? "code" : activeSection.table === "site_settings" ? "key" : "updated_at";
  let query = client.from(activeSection.table).select("*").order(ordering, { ascending: ordering !== "updated_at" });
  if (activeSection.table === "minerals" || activeSection.table === "localities" || activeSection.table === "mines") query = query.order("name");
  const { data, error } = await query;
  if (error) throw error;
  records = data || [];
  currentMedia = [];
}

function renderWorkspace() {
  workspace.replaceChildren();
  const wrapper = document.createElement("div");
  wrapper.className = viewMode === "both" ? "admin-columns" : "admin-single";
  if (viewMode !== "add") wrapper.append(buildListPanel());
  if (viewMode !== "list") wrapper.append(buildEditorPanel());
  workspace.append(wrapper);
}

function buildListPanel() {
  const listPanel = document.createElement("section");
  listPanel.className = "admin-panel";
  const toolbar = document.createElement("div"); toolbar.className = "admin-toolbar";
  const heading = document.createElement("h3"); heading.textContent = viewMode === "both" ? activeSection.title : (currentView()?.label || activeSection.title);
  toolbar.append(heading);
  if (viewMode === "both") {
    const add = document.createElement("button"); add.type = "button"; add.className = "admin-secondary"; add.textContent = "Nouveau";
    add.addEventListener("click", () => { clearNewMediaSelection(); selectedRecord = null; currentMedia = []; renderWorkspace(); report(`Nouveau contenu — ${activeSection.title.toLocaleLowerCase("fr")}.`); });
    toolbar.append(add);
  }
  listPanel.append(toolbar);
  const list = document.createElement("div"); list.className = "admin-list";
  records.forEach(record => {
    const button = document.createElement("button"); button.type = "button";
    const labelField = activeSection.table === "shop_items" || activeSection.table === "articles" || activeSection.table === "archive_documents" ? "title" : activeSection.table === "site_settings" ? "key" : "name";
    const label = record[labelField] || record.code || record.reference || (activeSection.table === "mineral_occurrences" ? `${refs.minerals?.find(item => item.id === record.mineral_id)?.name || "Minéral"} · ${refs.departments?.find(item => item.code === record.department_code)?.name || record.department_code}` : "Entrée");
    button.textContent = `${label}${record.publication_status ? ` — ${record.publication_status === "published" ? "publié" : "brouillon"}` : ""}`;
    button.addEventListener("click", () => void selectRecord(record)); list.append(button);
  });
  if (!records.length) { const empty = document.createElement("p"); empty.className = "admin-empty"; empty.textContent = "Aucun élément enregistré pour le moment."; list.append(empty); }
  listPanel.append(list);
  return listPanel;
}

function buildEditorPanel() {
  const editorPanel = document.createElement("section"); editorPanel.className = "admin-panel";
  const title = document.createElement("h3");
  title.textContent = selectedRecord ? "Modifier" : (viewMode === "add" ? (currentView()?.label || "Nouveau contenu") : "Nouveau contenu"); editorPanel.append(title);
  const form = document.createElement("form"); form.noValidate = true;
  activeSection.fields.forEach(field => form.append(createField(field, selectedRecord?.[field.key])));
  if (activeSection.mediaTable || activeSection.singleFile) appendMediaControls(form);
  const actions = document.createElement("div"); actions.className = "admin-actions";
  const save = document.createElement("button"); save.className = "btn"; save.type = "submit"; save.textContent = selectedRecord ? "Enregistrer les modifications" : "Créer"; actions.append(save);
  if (viewMode === "add") {
    const cancel = document.createElement("button"); cancel.type = "button"; cancel.className = "admin-secondary"; cancel.textContent = "Annuler";
    cancel.addEventListener("click", () => { clearNewMediaSelection(); selectedRecord = null; currentMedia = []; setListMode(); renderWorkspace(); report("Modification annulée."); });
    actions.append(cancel);
  }
  if (selectedRecord) {
    const remove = document.createElement("button"); remove.type = "button"; remove.className = "admin-danger"; remove.textContent = "Supprimer";
    remove.addEventListener("click", () => void deleteRecord()); actions.append(remove);
  }
  form.append(actions);
  form.addEventListener("submit", event => { event.preventDefault(); void saveRecord(form); });
  editorPanel.append(form);
  return editorPanel;
}

function createField(field, value) {
  const wrapper = document.createElement("div");
  const label = document.createElement("label"); label.textContent = field.label; wrapper.append(label);
  let input;
  if (field.ref) {
    input = document.createElement("select");
    if (field.multi) input.multiple = true;
    if (!field.multi) { const blank = document.createElement("option"); blank.value = ""; blank.textContent = "— Aucun —"; input.append(blank); }
    for (const optionData of refs[field.ref] || []) {
      const option = document.createElement("option"); option.value = optionData[field.value || "id"];
      option.textContent = optionData[field.display] || option.value; option.selected = field.multi && (selectedRecord?._links?.[field.key] || []).includes(option.value); input.append(option);
    }
  } else if (field.options) {
    input = document.createElement("select");
    const known = new Set(field.options.map(([key]) => key));
    field.options.forEach(([key, labelText]) => { const option = document.createElement("option"); option.value = key; option.textContent = labelText; input.append(option); });
    if (field.customOptions) {
      const custom = new Set(records.map(record => record[field.key]).filter(item => item && !known.has(item)));
      if (value && !known.has(value)) custom.add(value);
      [...custom].sort((x, y) => x.localeCompare(y, "fr")).forEach(item => { const option = document.createElement("option"); option.value = item; option.textContent = item; input.append(option); });
    }
  } else if (field.type === "textarea") input = document.createElement("textarea");
  else if (field.type === "checkbox") input = document.createElement("input");
  else input = document.createElement("input");
  if (field.type === "checkbox") input.type = "checkbox";
  else if (field.type !== "textarea" && !field.options && !field.ref) input.type = field.type || "text";
  if (field.step) input.step = field.step;
  if (field.required) { input.required = true; label.textContent += " *"; }
  if (field.type === "checkbox") input.checked = Boolean(value);
  else if (value != null && value !== "") input.value = field.body ? bodyToText(value) : field.key === "value" ? JSON.stringify(value, null, 2) : field.euros ? (Number(value) / 100).toFixed(2) : field.array && Array.isArray(value) ? value.join(", ") : String(value);
  label.htmlFor = `content-${field.key}`; input.id = label.htmlFor; input.name = field.key;
  if (allowsOther(field) && !field.multi) { const other = document.createElement("option"); other.value = OTHER; other.textContent = "Autre (saisir une valeur)…"; input.append(other); }
  wrapper.append(input);
  if (allowsOther(field)) {
    const box = document.createElement("input"); box.type = "text"; box.name = `${field.key}__other`; box.id = `content-${field.key}__other`;
    if (field.multi) { box.placeholder = "Autres, séparés par des virgules (créés automatiquement)"; }
    else { box.hidden = true; box.placeholder = "Saisir la nouvelle valeur"; input.addEventListener("change", () => { box.hidden = input.value !== OTHER; if (!box.hidden) box.focus(); }); }
    wrapper.append(box);
  }
  return wrapper;
}

function bodyToText(body) {
  if (typeof body === "string") return body;
  if (!Array.isArray(body)) return "";
  return body.map(block => typeof block === "string" ? block : block.text || "").join("\n\n");
}

function appendMediaControls(panel) {
  const title = document.createElement("h4"); title.textContent = activeSection.singleFile ? "Document" : "Images"; panel.append(title);
  const container = document.createElement("div"); container.className = "admin-content-media"; container.dataset.mediaContainer = ""; panel.append(container);
  if (activeSection.singleFile && selectedRecord?.storage_path) {
    const link = document.createElement("a"); link.textContent = `Document actuel (${selectedRecord.bucket_id})`;
    link.target = "_blank"; link.rel = "noopener"; void setMediaLink(link, selectedRecord.bucket_id, selectedRecord.storage_path); container.append(link);
    const remove = document.createElement("button"); remove.type = "button"; remove.className = "admin-danger"; remove.textContent = "Supprimer le document";
    remove.addEventListener("click", () => { if (confirm("Supprimer le document lié à cette archive ?")) { selectedRecord._removeFile = true; link.remove(); remove.remove(); } }); container.append(remove);
  } else if (activeSection.mediaTable) {
    currentMedia.forEach(item => {
      const row = document.createElement("div"); row.className = "admin-content-media-item";
      const img = document.createElement("img"); img.alt = item.alt_text || "Média enregistré"; void setMediaImage(img, item.bucket_id, item.storage_path); row.append(img);
      const file = document.createElement("input"); file.type = "file"; file.accept = "image/jpeg,image/png,image/webp"; row.append(file);
      const replace = document.createElement("button"); replace.type = "button"; replace.className = "admin-secondary"; replace.textContent = "Remplacer";
      replace.disabled = true; file.addEventListener("change", () => { replace.disabled = !file.files?.length; });
      replace.addEventListener("click", () => void replaceMedia(item, file.files[0], img, replace)); row.append(replace);
      const remove = document.createElement("button"); remove.type = "button"; remove.className = "admin-danger"; remove.textContent = "Supprimer";
      remove.addEventListener("click", () => void deleteMedia(item, row)); row.append(remove); container.append(row);
    });
  }
  if (activeSection.mediaTable || activeSection.singleFile) {
    uploadInput = document.createElement("input"); uploadInput.type = "file"; uploadInput.accept = activeSection.singleFile ? ".pdf,image/*" : "image/jpeg,image/png,image/webp";
    uploadInput.multiple = Boolean(activeSection.mediaTable); uploadInput.setAttribute("aria-label", "Ajouter un média");
    uploadInput.addEventListener("change", renderNewMediaPreview); container.append(uploadInput);
    const previews = document.createElement("div"); previews.className = "admin-content-media"; previews.dataset.newMediaPreview = ""; container.append(previews);
  }
}

function renderNewMediaPreview() {
  previewUrls.forEach(url => URL.revokeObjectURL(url)); previewUrls = [];
  const previews = $(workspace, "[data-new-media-preview]"); if (!previews) return;
  previews.replaceChildren();
  for (const file of uploadInput.files || []) {
    const item = document.createElement("div"); item.className = "admin-content-media-item";
    if (file.type.startsWith("image/")) { const image = document.createElement("img"); const url = URL.createObjectURL(file); previewUrls.push(url); image.src = url; image.alt = file.name; item.append(image); }
    const label = document.createElement("span"); label.textContent = file.name; item.append(label); previews.append(item);
  }
}

function clearNewMediaSelection() {
  previewUrls.forEach(url => URL.revokeObjectURL(url)); previewUrls = [];
  if (uploadInput) uploadInput.value = "";
  const previews = $(workspace, "[data-new-media-preview]"); previews?.replaceChildren();
  uploadedFileKeys.clear();
}

function fileKey(file) { return `${file.name}:${file.size}:${file.lastModified}:${file.type}`; }

async function resolveMediaUrl(bucket, path) {
  if (bucket === PUBLIC_BUCKET) return client.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  const { data, error } = await client.storage.from(bucket).createSignedUrl(path, 3600); if (error) throw error; return data.signedUrl;
}
async function setMediaImage(image, bucket, path) { try { image.src = await resolveMediaUrl(bucket, path); } catch (error) { console.error("Prévisualisation média :", error); image.alt = "Aperçu indisponible"; report(`La fiche est chargée, mais l’aperçu du média est indisponible : ${errorText(error)}`, true); } }
async function setMediaLink(link, bucket, path) { try { link.href = await resolveMediaUrl(bucket, path); } catch (error) { console.error("Lien média :", error); link.textContent += " — aperçu indisponible"; report(`Le document est référencé, mais son aperçu n’a pas pu être chargé : ${errorText(error)}`, true); } }

async function selectRecord(record) {
  clearNewMediaSelection();
  selectedRecord = { ...record };
  try {
    if (activeSection.links) {
      selectedRecord._links = {};
      for (const [table, column] of activeSection.links) {
        const { data, error } = await client.from(table).select(column).eq(activeSection.id === "articles" ? "article_id" : "archive_id", record.id);
        if (error) throw error;
        const fieldKey = `link_${table.replace(activeSection.id === "articles" ? "article_" : "archive_", "")}`;
        selectedRecord._links[fieldKey] = (data || []).map(row => String(row[column]));
      }
    }
    if (activeSection.mediaTable) { const { data, error } = await client.from(activeSection.mediaTable).select("*").eq(activeSection.foreignKey, record.id).order("position"); if (error) throw error; currentMedia = data || []; }
    else currentMedia = [];
    setFormMode();
    renderWorkspace();
  } catch (error) { report(`Impossible de charger les médias : ${errorText(error)}`, true); console.error(error); }
}

async function saveRecord(form) {
  const section = activeSection;
  let databaseSaved = false;
  pendingLinkExtras = {}; createdNames = [];
  report("Enregistrement…");
  try {
    const record = {};
    for (const field of section.fields) {
      const input = form.elements.namedItem(field.key);
      if (!input) throw new Error(`Le champ « ${field.label} » est introuvable dans le formulaire.`);
      let value = field.type === "checkbox" ? input.checked : field.multi ? [...input.selectedOptions].map(option => option.value) : text(input.value);
      if (!field.multi && value === OTHER) {
        const typed = text(form.elements.namedItem(`${field.key}__other`)?.value);
        if (field.ref) value = typed ? String(await ensureRef(field.ref, typed)) : "";
        else value = typed;
      }
      if (field.required && !value && value !== 0 && value !== false) throw new Error(`Le champ « ${field.label} » est requis par le schéma actuel.`);
      if (field.euros && value !== "") { const amount = Number(value); if (!Number.isFinite(amount) || amount < 0) throw new Error("Le prix doit être un nombre positif ou nul."); value = Math.round(amount * 100); }
      else if (field.type === "number" && value !== "") { value = Number(value); if (!Number.isFinite(value)) throw new Error(`Valeur numérique invalide pour « ${field.label} ».`); }
      if (field.body) value = value ? value.split(/\n\s*\n/).map(paragraph => ({ type: "paragraph", text: paragraph.trim() })).filter(block => block.text) : [];
      if (field.array) value = value ? value.split(",").map(part => part.trim()).filter(Boolean) : [];
      if (field.key === "value") { try { value = value ? JSON.parse(value) : {}; } catch { throw new Error("La valeur du paramètre doit être du JSON valide."); } }
      if (field.multi) {
        const typedList = text(form.elements.namedItem(`${field.key}__other`)?.value).split(",").map(part => part.trim()).filter(Boolean);
        pendingLinkExtras[field.key] = [];
        for (const typed of typedList) pendingLinkExtras[field.key].push(String(await ensureRef(field.ref, typed)));
        continue;
      }
      record[field.key] = value === "" ? (field.notNull ? "" : field.key === "value" ? {} : null) : value;
    }
    if (section.id === "settings") {
      const payload = { key: record.key, value: record.value, is_public: record.is_public };
      const { error } = await client.from(section.table).upsert(payload, { onConflict: "key" }).select("key").single(); if (error) throw error;
      databaseSaved = true;
      report("Paramètre enregistré dans Supabase.");
    } else {
      const current = selectedRecord;
      if (["regions", "localities", "mines", "minerals"].includes(section.id)) record.slug = current?.slug || await uniqueSlug(record.name, section.table);
      if (["shop", "articles", "archives"].includes(section.id)) record.slug = current?.slug || await uniqueSlug(record.title, section.table);
      if (section.id === "shop" && !record.mine_id && record.provenance) {
        const mine = await ensureNamed(client, "mines", record.provenance, { locality_id: record.locality_id || null });
        if (mine) { record.mine_id = mine.id; if (mine.created) createdNames.push(mine.name); }
      }
      if (section.id === "shop" && record.price_cents == null) throw new Error("Le schéma de la boutique exige un prix (0 est accepté).");
      let saved;
      if (current?.id || current?.code) {
        const key = current.id ? "id" : "code";
        const { data, error } = await client.from(section.table).update(record).eq(key, current[key]).select("*").single(); if (error) throw error; saved = data;
      } else {
        const { data, error } = await client.from(section.table).insert(record).select("*").single(); if (error) throw error; saved = data;
      }
      selectedRecord = saved;
      databaseSaved = true;
      report("Fiche enregistrée dans Supabase. Traitement des médias…");
      if (section.links) await saveLinks(saved, form);
      if (section.mediaTable) await uploadMedia(saved);
      if (section.singleFile) await saveArchiveFile(saved, current);
      if (section.mediaTable && current && current.publication_status !== saved.publication_status) await syncMedia(saved);
      report("Contenu enregistré. Rechargement de la liste…");
    }
    await loadReferences(section); await loadRecords(); selectedRecord = null; clearNewMediaSelection(); setListMode(); renderWorkspace();
    report(`Enregistrement terminé. La liste est à jour.${createdNames.length ? ` Nouvelles valeurs ajoutées aux listes : ${createdNames.join(", ")}.` : ""}`);
  } catch (error) {
    console.error(`Échec enregistrement CMS ${section.id}:`, error);
    report(`${databaseSaved ? "Le contenu principal est enregistré en base, mais une opération secondaire a échoué" : "Enregistrement impossible"} : ${errorText(error)}`, true);
  }
}

async function ensureRef(table, name) {
  const result = await ensureNamed(client, table, name);
  if (result.created) createdNames.push(result.name);
  return result.id;
}

async function saveLinks(parent, form) {
  const isArticle = activeSection.id === "articles";
  for (const [table, column] of activeSection.links) {
    const ownerColumn = isArticle ? "article_id" : "archive_id";
    const fieldKey = `link_${table.replace(isArticle ? "article_" : "archive_", "")}`;
    const linkField = form.elements.namedItem(fieldKey);
    if (!linkField) throw new Error(`Le champ de relations « ${fieldKey} » est introuvable.`);
    const desired = [...new Set([...[...linkField.selectedOptions].map(option => option.value), ...(pendingLinkExtras[fieldKey] || [])])];
    const { data: current, error: readError } = await client.from(table).select(column).eq(ownerColumn, parent.id);
    if (readError) throw readError;
    const currentIds = (current || []).map(row => String(row[column]));
    const toAdd = desired.filter(id => !currentIds.includes(id));
    const toRemove = currentIds.filter(id => !desired.includes(id));
    if (toAdd.length) { const { error } = await client.from(table).insert(toAdd.map(id => ({ [ownerColumn]: parent.id, [column]: id }))); if (error) throw error; }
    if (toRemove.length) { const { error } = await client.from(table).delete().eq(ownerColumn, parent.id).in(column, toRemove); if (error) throw error; }
  }
}

async function uniqueSlug(name, table) {
  const base = slugify(name) || `${table}-${crypto.randomUUID()}`;
  let slug = base; let suffix = 2;
  while (true) { const { data, error } = await client.from(table).select("id").eq("slug", slug).maybeSingle(); if (error) throw error; if (!data) return slug; slug = `${base}-${suffix++}`; }
}

async function uploadMedia(parent) {
  const files = [...(uploadInput?.files || [])]; if (!files.length) return;
  const bucket = parent.publication_status === "published" ? PUBLIC_BUCKET : DRAFT_BUCKET;
  const currentPosition = currentMedia.reduce((max, item) => Math.max(max, Number(item.position) || 0), -1) + 1;
  for (const [index, file] of files.entries()) {
    const key = fileKey(file);
    if (uploadedFileKeys.has(key)) continue;
    const name = file.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9.-]+/g, "-");
    const path = `${activeSection.path}/${parent.slug}/${crypto.randomUUID()}-${name}`;
    const { error: uploadError } = await client.storage.from(bucket).upload(path, file, { upsert: false, contentType: file.type }); if (uploadError) throw uploadError;
    const row = { [activeSection.foreignKey]: parent.id, bucket_id: bucket, storage_path: path, alt_text: file.name, position: currentPosition + index };
    const { error: insertError } = await client.from(activeSection.mediaTable).insert(row);
    if (insertError) { await removeStorageIfUnreferenced(bucket, path, activeSection.mediaTable); throw insertError; }
    uploadedFileKeys.add(key);
  }
}

async function deleteMedia(item, row) {
  if (!confirm("Supprimer définitivement ce média ?")) return;
  try {
    const { data: deleted, error } = await client.from(activeSection.mediaTable).delete().eq("id", item.id).select("id").maybeSingle(); if (error) throw error;
    if (!deleted) throw new Error("La référence média est introuvable ou les droits de suppression sont insuffisants.");
    await removeStorageIfUnreferenced(item.bucket_id, item.storage_path, activeSection.mediaTable);
    row.remove(); report("Média supprimé.");
  } catch (error) { console.error("Suppression média :", error); report(`Suppression du média échouée : ${errorText(error)}`, true); }
}

async function replaceMedia(item, file, image, button) {
  if (!file) return;
  button.disabled = true; report("Remplacement du média…");
  const bucket = selectedRecord.publication_status === "published" ? PUBLIC_BUCKET : DRAFT_BUCKET;
  const path = `${activeSection.path}/${selectedRecord.slug}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.-]+/g, "-")}`;
  try {
    const { error: uploadError } = await client.storage.from(bucket).upload(path, file, { upsert: false, contentType: file.type }); if (uploadError) throw uploadError;
    const { error: updateError } = await client.from(activeSection.mediaTable).update({ bucket_id: bucket, storage_path: path, alt_text: file.name }).eq("id", item.id).select("id").single();
    if (updateError) { await removeStorageIfUnreferenced(bucket, path, activeSection.mediaTable); throw updateError; }
    await removeStorageIfUnreferenced(item.bucket_id, item.storage_path, activeSection.mediaTable);
    image.src = bucket === PUBLIC_BUCKET ? client.storage.from(bucket).getPublicUrl(path).data.publicUrl : (await client.storage.from(bucket).createSignedUrl(path, 3600)).data.signedUrl;
    item.bucket_id = bucket; item.storage_path = path; item.alt_text = file.name; report("Média remplacé.");
  } catch (error) { console.error("Remplacement média :", error); report(`Remplacement échoué : ${errorText(error)}`, true); }
  finally { button.disabled = false; }
}

async function removeStorageIfUnreferenced(bucket, path, exceptTable = null) {
  const mediaTables = ["specimen_media", "shop_item_media", "article_media"];
  for (const table of mediaTables) {
    if (table === exceptTable) continue;
    const { data, error } = await client.from(table).select("id").eq("bucket_id", bucket).eq("storage_path", path).limit(1);
    if (error) throw error;
    if (data?.length) return;
  }
  const { data: archiveRefs, error: archiveError } = await client.from("archive_documents").select("id").eq("bucket_id", bucket).eq("storage_path", path).limit(1);
  if (archiveError) throw archiveError;
  if (archiveRefs?.length) return;
  const { error } = await client.storage.from(bucket).remove([path]); if (error) throw error;
}

async function syncMedia(parent) {
  const { data, error } = await client.from(activeSection.mediaTable).select("*").eq(activeSection.foreignKey, parent.id); if (error) throw error;
  const destinationBucket = parent.publication_status === "published" ? PUBLIC_BUCKET : DRAFT_BUCKET;
  for (const item of data || []) {
    if (item.bucket_id === destinationBucket) continue;
    const { data: blob, error: downloadError } = await client.storage.from(item.bucket_id).download(item.storage_path); if (downloadError) throw downloadError;
    const path = `${activeSection.path}/${parent.slug}/${crypto.randomUUID()}-${item.storage_path.split("/").pop()}`;
    const { error: uploadError } = await client.storage.from(destinationBucket).upload(path, blob, { upsert: false }); if (uploadError) throw uploadError;
    const { error: updateError } = await client.from(activeSection.mediaTable).update({ bucket_id: destinationBucket, storage_path: path }).eq("id", item.id).select("id").single();
    if (updateError) { await client.storage.from(destinationBucket).remove([path]); throw updateError; }
    await removeStorageIfUnreferenced(item.bucket_id, item.storage_path, activeSection.mediaTable);
  }
}

async function saveArchiveFile(parent, previous) {
  const file = uploadInput?.files?.[0];
  const removeRequested = Boolean(previous?._removeFile);
  const oldPath = previous?.storage_path || null;
  const publicationBucket = parent.publication_status === "published" ? PUBLIC_BUCKET : DRAFT_BUCKET;
  if (!file && !removeRequested && oldPath && previous.bucket_id !== publicationBucket) {
    const { data: blob, error: downloadError } = await client.storage.from(previous.bucket_id).download(oldPath); if (downloadError) throw downloadError;
    const newPath = `${activeSection.path}/${parent.slug}/${crypto.randomUUID()}-${oldPath.split("/").pop()}`;
    const { error: uploadError } = await client.storage.from(publicationBucket).upload(newPath, blob, { upsert: false }); if (uploadError) throw uploadError;
    const { error: updateError } = await client.from(activeSection.table).update({ bucket_id: publicationBucket, storage_path: newPath }).eq("id", parent.id).select("id").single();
    if (updateError) { await client.storage.from(publicationBucket).remove([newPath]); throw updateError; }
    await removeStorageIfUnreferenced(previous.bucket_id, oldPath); return;
  }
  if (!file && !removeRequested) {
    if (previous?.bucket_id !== publicationBucket) {
      const { error } = await client.from(activeSection.table).update({ bucket_id: publicationBucket }).eq("id", parent.id).select("id").single();
      if (error) throw error;
    }
    return;
  }
  const bucket = publicationBucket;
  let path = removeRequested ? null : oldPath;
  if (file) {
    const name = file.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9.-]+/g, "-");
    path = `${activeSection.path}/${parent.slug}/${crypto.randomUUID()}-${name}`;
    const { error } = await client.storage.from(bucket).upload(path, file, { upsert: false, contentType: file.type }); if (error) throw error;
  }
  const { error: updateError } = await client.from(activeSection.table).update({ bucket_id: bucket, storage_path: path }).eq("id", parent.id).select("id").single();
  if (updateError) { if (file) await client.storage.from(bucket).remove([path]); throw updateError; }
  if (oldPath && (oldPath !== path || previous.bucket_id !== bucket)) await removeStorageIfUnreferenced(previous.bucket_id, oldPath);
}

async function deleteRecord() {
  if (!selectedRecord || !confirm("Supprimer définitivement cet élément ?")) return;
  const section = activeSection;
  let mediaToClean = [];
  try {
    if (section.mediaTable) {
      const { data, error } = await client.from(section.mediaTable).select("*").eq(section.foreignKey, selectedRecord.id); if (error) throw error;
      mediaToClean = data || [];
    }
    const archiveFile = section.singleFile && selectedRecord.storage_path ? { bucket_id: selectedRecord.bucket_id, storage_path: selectedRecord.storage_path } : null;
    const key = selectedRecord.id ? "id" : selectedRecord.code != null ? "code" : "key";
    const primaryColumn = key;
    const { data: deleted, error } = await client.from(section.table).delete().eq(primaryColumn, selectedRecord[primaryColumn]).select(primaryColumn).maybeSingle(); if (error) throw error;
    if (!deleted) throw new Error("La fiche est introuvable ou les droits de suppression sont insuffisants.");
    const storageErrors = [];
    for (const item of [...mediaToClean, ...(archiveFile ? [archiveFile] : [])]) {
      try { await removeStorageIfUnreferenced(item.bucket_id, item.storage_path); }
      catch (storageError) { storageErrors.push(`${item.storage_path} : ${errorText(storageError)}`); }
    }
    await loadRecords(); selectedRecord = null; clearNewMediaSelection(); setListMode(); renderWorkspace(); report("Élément supprimé.");
    if (storageErrors.length) report(`Élément supprimé de la base, mais certains fichiers Storage restent à nettoyer : ${storageErrors.join(" ; ")}`, true);
  } catch (error) { console.error("Suppression CMS :", error); report(`Suppression incomplète : ${errorText(error)}`, true); }
}
