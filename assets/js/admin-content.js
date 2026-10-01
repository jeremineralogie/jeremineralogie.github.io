import { ensureDepartment, ensureNamed, isFrenchDepartmentCode, normalizeName, OTHER, SITE_TYPES } from "./reference-resolver.js";
import { enhanceCombobox, enhanceMulti } from "./combobox.js";
import { backfillLocalities, communeLabel, communeUpdate, departmentOfCommune, findCommune, searchCommunes } from "./geo-communes.js";
import { createPointTool, pickPoint, pointKey, savePendingPoints } from "./point-picker.js";
import { createContentEditor } from "./article-editor.js";
import { blocksToText } from "./article-content.js";
import { formatDiscoveryDate, parseDiscoveryDate, parseWeight } from "./specimen-fields.js";
import { nextReference, referencePrefix } from "./shop-reference.js";

const PUBLIC_BUCKET = "site-media-public";
const DRAFT_BUCKET = "admin-staging";
const $ = (root, selector) => root.querySelector(selector);
const text = value => String(value ?? "").trim();
const slugify = value => text(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const MINERAL_CLASSES = ["Éléments natifs", "Sulfures et sulfosels", "Halogénures", "Oxydes et hydroxydes", "Carbonates", "Borates", "Sulfates, chromates, molybdates et tungstates",
  "Phosphates, arséniates et vanadates", "Silicates (nésosilicates)", "Silicates (sorosilicates)", "Silicates (cyclosilicates)", "Silicates (inosilicates)",
  "Silicates (phyllosilicates)", "Silicates (tectosilicates)", "Composés organiques"];
const CRYSTAL_SYSTEMS = ["Cubique", "Quadratique", "Hexagonal", "Trigonal", "Orthorhombique", "Monoclinique", "Triclinique", "Amorphe"];

const PUBLICATION_OPTIONS = [["draft", "Brouillon"], ["published", "Publié"]];

// Une section = un formulaire. Options possibles :
//   mediaTable / foreignKey / path : photos ; mediaFirst : photos en tête du formulaire ; mediaRow(parent, file, position) : colonnes en plus pour chaque photo
//   links : tables de liaison (champs « link_… ») ; linkExclude : valeur de la fiche à ne pas reprendre dans une liaison ; countryField : champ Pays rempli « France » avec un département français
//   duplicate : { fields, title } bouton « Dupliquer » ; autoReference : référence produit construite automatiquement (shop-reference.js) ; listLabel(record) : texte d'une ligne de la liste
//   prepare(record) : valeurs affichées à l'ouverture ; complete(record, context) : colonnes calculées avant l'enregistrement
// Champs : ref (liste liée à une table), multi, options, blank (choix vide), customOptions, help (aide sous le champ), suggest (propositions de saisie)…
const sections = [
  { id: "collection", label: "Ma collection", table: "specimens", title: "Ma collection", mediaTable: "specimen_media", foreignKey: "specimen_id", path: "collection", mediaFirst: true,
    links: [["specimen_associations", "mineral_id", "minerals"]], linkOwner: "specimen_id", linkPrefix: "specimen_", linkExclude: { link_associations: "mineral_id" }, countryField: "country",
    duplicate: { title: "Nouveau spécimen (copie)", fields: ["mineral_id", "mine_id", "locality_id", "department_code", "region_id", "country", "site_type"] },
    listLabel: record => `${record.title || record.mineral_name || "Spécimen"} — ${record.slug}`,
    prepare: prepareSpecimen, complete: completeSpecimen,
    mediaRow: (parent, file, position) => ({ role: position ? "detail" : "general", alt_text: `${parent.mineral_name || "Spécimen"} — ${file.name}` }),
    fields: [
    { key: "title", label: "Titre (visible seulement dans l’admin)" },
    { key: "mineral_id", label: "Minéral principal", ref: "minerals", display: "name" }, { key: "link_associations", label: "Minéraux associés (secondaires)", ref: "minerals", display: "name", multi: true },
    { key: "mine_id", label: "Gisement", ref: "mines", display: "name" }, { key: "locality_id", label: "Commune", ref: "localities", display: "name" },
    { key: "department_code", label: "Département", ref: "departments", display: "name", value: "code" }, { key: "region_id", label: "Région", ref: "regions", display: "name" },
    { key: "country", label: "Pays", suggest: ["France"] },
    { key: "site_type", label: "Type de site", type: "select", blank: "— Non renseigné —", customOptions: true, options: SITE_TYPES },
    { key: "dimensions", label: "Dimensions", notNull: true }, { key: "weight_text", label: "Poids", help: "grammes" },
    { key: "description", label: "Description", type: "textarea", notNull: true }, { key: "keywords", label: "Mots-clés" },
    { key: "discovery_date_text", label: "Date de découverte", placeholder: "AAAA, MM/AAAA ou JJ/MM/AAAA", help: "Exemples : 2018, 09/2018 ou 29/09/2018." },
    { key: "publication_status", label: "Publication", type: "select", options: [["published", "Publié"], ["draft", "Brouillon"]] }
  ] },
  { id: "shop", label: "Boutique", table: "shop_items", title: "Boutique", mediaTable: "shop_item_media", foreignKey: "shop_item_id", path: "shop", mediaFirst: true,
    links: [["shop_item_associations", "mineral_id", "minerals"]], linkOwner: "shop_item_id", linkPrefix: "shop_item_", countryField: "provenance",
    duplicate: { title: "Nouveau produit (copie)", fields: ["mineral_id", "provenance", "mine_id", "locality_id", "department_code", "region_id"] }, autoReference: true, fields: [
    { key: "title", label: "Titre (visible seulement dans l’admin)" },
    { key: "reference", label: "Référence (créée automatiquement)", required: true, help: "JM + 2 lettres du minéral + lettres du gisement (à défaut : commune, département, région, pays) + numéro, ex. JMFLLB1. Modifiable si besoin." },
    { key: "mineral_id", label: "Minéral principal", ref: "minerals", display: "name" }, { key: "link_associations", label: "Minéraux associés (secondaires)", ref: "minerals", display: "name", multi: true },
    { key: "mine_id", label: "Gisement", ref: "mines", display: "name" }, { key: "locality_id", label: "Commune", ref: "localities", display: "name" },
    { key: "department_code", label: "Département", ref: "departments", display: "name", value: "code" }, { key: "region_id", label: "Région", ref: "regions", display: "name" },
    { key: "provenance", label: "Pays", notNull: true },
    { key: "dimensions", label: "Dimensions", notNull: true }, { key: "weight_grams", label: "Poids (g)", type: "number", step: "0.001" },
    { key: "description", label: "Description", type: "textarea", notNull: true }, { key: "price_cents", label: "Prix (euros)", type: "number", step: "0.01", required: true, euros: true },
    { key: "sale_status", label: "Disponibilité", type: "select", options: [["available", "Disponible"], ["sold", "Vendu"], ["hidden", "Masqué"]] },
    { key: "publication_status", label: "Publication", type: "select", options: PUBLICATION_OPTIONS },
    { key: "keywords", label: "Mots-clés" }, { key: "discovery_date_text", label: "Date de découverte", placeholder: "AAAA, MM/AAAA ou JJ/MM/AAAA" }
  ] },
  { id: "articles", label: "Articles", table: "articles", title: "Articles", mediaTable: "article_media", foreignKey: "article_id", path: "articles", mediaAfter: "body", singleCover: true,
    links: [["article_minerals", "mineral_id", "minerals"], ["archive_articles", "archive_id", "archive_documents"], ["article_mines", "mine_id", "mines"], ["article_localities", "locality_id", "localities"], ["article_departments", "department_code", "departments"], ["article_regions", "region_id", "regions"]], fields: [
    { key: "title", label: "Titre", required: true },
    { key: "category", label: "Catégorie", required: true, type: "select", customOptions: true, options: [["autre", "Autre"], ["mineralogie", "Minéralogie"], ["geologie", "Géologie"], ["cristallographie", "Cristallographie"], ["mines-histoire", "Mines & histoire"], ["decouvertes", "Découvertes"], ["identification", "Identification"], ["collection", "Collection"], ["pedagogie", "Pédagogie"]] },
    { key: "body", label: "Contenu", richBody: true, notNull: true },
    { key: "link_minerals", label: "Minéraux liés", ref: "minerals", display: "name", multi: true }, { key: "link_archive_articles", label: "Archives liées", ref: "archive_documents", display: "title", multi: true },
    { key: "link_mines", label: "Gisements liés", ref: "mines", display: "name", multi: true },
    { key: "link_localities", label: "Communes liées", ref: "localities", display: "name", multi: true },
    { key: "link_departments", label: "Départements liés", ref: "departments", display: "name", value: "code", multi: true }, { key: "link_regions", label: "Régions liées", ref: "regions", display: "name", multi: true },
    { key: "excerpt", label: "Résumé", type: "textarea", notNull: true },
    { key: "published_on", label: "Date de publication", type: "date" }, { key: "publication_status", label: "Publication", type: "select", options: PUBLICATION_OPTIONS }
  ] },
  { id: "archives", label: "Archives & Documentation", table: "archive_documents", title: "Archives & Documentation", singleFile: true, path: "archives", mediaAfter: "cover_path",
    links: [["archive_minerals", "mineral_id", "minerals"], ["archive_articles", "article_id", "articles"], ["archive_mines", "mine_id", "mines"], ["archive_localities", "locality_id", "localities"], ["archive_departments", "department_code", "departments"], ["archive_regions", "region_id", "regions"]], fields: [
    { key: "title", label: "Titre", required: true },
    { key: "category", label: "Catégorie", required: true, type: "select", customOptions: true, options: [["autre", "Autre"], ["mine-gisement", "Mine / gisement"], ["archive-historique", "Archive historique"], ["plan-carte", "Plan / carte"], ["histoire-exploitation", "Histoire de l’exploitation"], ["publication-scientifique", "Publication scientifique"], ["catalogue", "Catalogue"], ["bibliographie", "Bibliographie"], ["photographie-ancienne", "Photographie ancienne"]] },
    { key: "cover_path", label: "Image de fiche (illustration de la carte côté public)", cover: true },
    { key: "body", label: "Description", richBody: true, notNull: true, plainText: "description" },
    { key: "link_minerals", label: "Minéraux liés", ref: "minerals", display: "name", multi: true }, { key: "link_articles", label: "Articles liés", ref: "articles", display: "title", multi: true },
    { key: "link_mines", label: "Gisements liés", ref: "mines", display: "name", multi: true }, { key: "link_localities", label: "Communes liées", ref: "localities", display: "name", multi: true },
    { key: "link_departments", label: "Départements liés", ref: "departments", display: "name", value: "code", multi: true }, { key: "link_regions", label: "Régions liées", ref: "regions", display: "name", multi: true },
    { key: "summary", label: "Résumé", type: "textarea", notNull: true }, { key: "rights_note", label: "Droits et crédits", type: "textarea", notNull: true },
    { key: "links", label: "Liens (un par ligne : « Texte | https://… » ou simplement l’adresse)", type: "textarea", lines: true },
    { key: "document_date", label: "Date du document", type: "date" }, { key: "publication_status", label: "Publication", type: "select", options: PUBLICATION_OPTIONS }
  ] },
  { id: "regions", label: "Régions", table: "regions", title: "Régions", fields: [{ key: "name", label: "Nom", required: true }] },
  { id: "departments", label: "Départements", table: "departments", title: "Départements", fields: [{ key: "code", label: "Code (identifiant)", required: true }, { key: "name", label: "Nom", required: true }, { key: "region_id", label: "Région", ref: "regions", display: "name" }] },
  { id: "localities", label: "Communes", table: "localities", title: "Communes", fields: [{ key: "name", label: "Nom", required: true }, { key: "department_code", label: "Département", ref: "departments", display: "name", value: "code" }, { key: "postal_code", label: "Code postal" }, { key: "insee_code", label: "Code INSEE" }, { key: "latitude", label: "Latitude", type: "number", step: "0.000001" }, { key: "longitude", label: "Longitude", type: "number", step: "0.000001" }, { key: "notes", label: "Notes", type: "textarea", notNull: true }, { key: "publication_status", label: "Publication", type: "select", options: PUBLICATION_OPTIONS }] },
  { id: "mines", label: "Mines & gisements", table: "mines", title: "Mines & gisements", fields: [{ key: "name", label: "Nom", required: true }, { key: "locality_id", label: "Commune", ref: "localities", display: "name" }, { key: "latitude", label: "Latitude du gisement", type: "number", step: "0.000001" }, { key: "longitude", label: "Longitude du gisement", type: "number", step: "0.000001" }, { key: "description", label: "Description", type: "textarea", notNull: true }, { key: "publication_status", label: "Publication", type: "select", options: PUBLICATION_OPTIONS }] },
  { id: "minerals", label: "Minéraux", table: "minerals", title: "Référentiel minéral (fiches Apprendre)", mediaTable: "mineral_media", foreignKey: "mineral_id", path: "minerals", mediaAfter: "etymology", fields: [
    { key: "name", label: "Nom", required: true }, { key: "formula", label: "Formule chimique (ex. CaCO₃)" },
    { key: "chemical_class", label: "Famille chimique", type: "select", customOptions: true, options: MINERAL_CLASSES.map(value => [value, value]) },
    { key: "crystal_system", label: "Système cristallin", type: "select", customOptions: true, options: CRYSTAL_SYSTEMS.map(value => [value, value]) },
    { key: "hardness", label: "Dureté minimale (Mohs)", type: "number", step: "0.01" }, { key: "hardness_max", label: "Dureté maximale (Mohs)", type: "number", step: "0.01" },
    { key: "density", label: "Densité minimale", type: "number", step: "0.001" }, { key: "density_max", label: "Densité maximale", type: "number", step: "0.001" },
    { key: "colors", label: "Couleurs (séparées par des virgules)", array: true }, { key: "streak", label: "Trait" }, { key: "luster", label: "Éclat" }, { key: "transparency", label: "Transparence" },
    { key: "cleavage", label: "Clivage" }, { key: "fracture", label: "Cassure" }, { key: "habit", label: "Habitus", type: "textarea" }, { key: "fluorescence", label: "Fluorescence" },
    { key: "description", label: "Présentation", type: "textarea" }, { key: "formation", label: "Formation et gisements", type: "textarea" },
    { key: "varieties", label: "Variétés", type: "textarea" }, { key: "confusions", label: "Confusions possibles", type: "textarea" }, { key: "etymology", label: "Étymologie", type: "textarea" },
    { key: "photo_credit", label: "Crédit / licence des photos", placeholder: "ex. Photo : Jean Dupont — CC BY-SA 4.0", help: "Affiché sous vos photos sur la fiche. À laisser vide pour vos propres photos." },
    { key: "publication_status", label: "Publication", type: "select", options: PUBLICATION_OPTIONS }] },
  { id: "glossary", label: "Glossaire", table: "glossary_terms", title: "Glossaire (onglet Apprendre)", fields: [
    { key: "term", label: "Terme", required: true },
    { key: "domain", label: "Domaine", type: "select", required: true, options: [["mineralogie", "Minéralogie"], ["geologie", "Géologie"], ["cristallographie", "Cristallographie"]] },
    { key: "definition", label: "Définition", type: "textarea", notNull: true },
    { key: "see_also", label: "Voir aussi : autres termes du glossaire (séparés par des virgules)", array: true },
    { key: "related_minerals", label: "Minéraux liés (noms séparés par des virgules) : liens vers les fiches, la collection et la boutique", array: true },
    { key: "publication_status", label: "Publication", type: "select", options: [["published", "Publié"], ["draft", "Brouillon"]] }] },
  { id: "occurrences", label: "Occurrences minérales", table: "mineral_occurrences", title: "Occurrences minérales", fields: [{ key: "mineral_id", label: "Minéral", ref: "minerals", display: "name", required: true }, { key: "department_code", label: "Département", ref: "departments", display: "name", value: "code", required: true }, { key: "locality_id", label: "Commune (facultative)", ref: "localities", display: "name" }, { key: "source_note", label: "Source / note", type: "textarea", notNull: true }] },
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
const refNames = new Map(); // « table:identifiant » → nom, pour les valeurs créées pendant l'enregistrement
let pointTool = null;
let prefill = null;
let contentEditor = null;
const resolvedLocalities = new Map();
// Listes dont la valeur « Autre » crée une nouvelle fiche (ou une nouvelle catégorie) enregistrée pour les saisies suivantes.
const CREATABLE_REFS = ["minerals", "mines", "localities", "regions", "departments"];
const allowsOther = field => (field.ref && CREATABLE_REFS.includes(field.ref)) || Boolean(field.customOptions);

// Navigation : chaque groupe = une section principale ; chaque vue = un sous-onglet.
// mode « add » = formulaire seul, « list » = liste seule, « both » = liste + formulaire (référentiels).
const referentialViews = ["regions", "departments", "localities", "mines", "minerals", "glossary", "occurrences", "settings"]
  .map(id => ({ id, label: sections.find(section => section.id === id).label, section: id, mode: "both" }));
const groups = {
  collection: { start: "list", views: [
    { id: "add", label: "Ajouter un spécimen", section: "collection", mode: "add" },
    { id: "list", label: "Ma collection", section: "collection", mode: "list" }] },
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

let reportTimer = null;
function report(message, error = false) {
  status.textContent = message;
  status.classList.toggle("admin-error", error);
  status.hidden = !message;
  clearTimeout(reportTimer);
  if (message && !error && !message.endsWith("…")) reportTimer = setTimeout(() => { status.hidden = true; }, 3500);
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

// Ouverture directe d'une fiche (depuis le tableau de bord) : groupe, sous-onglet puis enregistrement.
export async function openRecord(groupId, viewId, recordId) {
  if (!groups[groupId]) throw new Error(`Section inconnue : ${groupId}`);
  activeGroupId = groupId;
  await openView(viewId);
  const record = records.find(item => String(item.id) === String(recordId));
  if (record) await selectRecord(record);
  else report("Cette fiche est introuvable (supprimée entre-temps ?).", true);
  workspace.scrollIntoView({ behavior: "smooth", block: "start" });
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
    report("");
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
    const select = table === "departments" ? "code,name,region_id" : table === "specimens" ? "id,slug" : table === "articles" || table === "archive_documents" ? "id,title" : table === "mines" ? "id,name,locality_id,locality:localities(name)" : table === "localities" ? "id,name,department_code,postal_code,latitude,longitude" : "id,name";
    const { data, error } = await client.from(table).select(select).order(table === "departments" ? "name" : table === "specimens" ? "slug" : table === "articles" || table === "archive_documents" ? "title" : "name");
    if (error) throw error;
    refs[table] = data || [];
  }
  if (refs.localities) disambiguate(refs.localities, item => item.postal_code || item.department_code);
  if (refs.mines) {
    const communeName = id => (refs.localities || []).find(item => String(item.id) === String(id))?.plainName;
    disambiguate(refs.mines, item => item.locality?.name || communeName(item.locality_id));
  }
}

// Homonymes (communes, gisements) : précision ajoutée au nom affiché dans les listes ; le nom d'origine reste dans plainName.
function disambiguate(list, detail) {
  const count = new Map();
  list.forEach(item => { const key = normalizeName(item.name); count.set(key, (count.get(key) || 0) + 1); });
  list.forEach(item => { item.plainName = item.name; if (count.get(normalizeName(item.name)) > 1) item.name = `${item.name} (${detail(item) || "?"})`; });
}

async function loadRecords() {
  const ordering = activeSection.table === "departments" ? "code" : activeSection.table === "site_settings" ? "key" : "updated_at";
  let query = client.from(activeSection.table).select("*").order(ordering, { ascending: ordering !== "updated_at" });
  if (activeSection.table === "minerals" || activeSection.table === "localities" || activeSection.table === "mines") query = client.from(activeSection.table).select("*").order("name");
  if (activeSection.table === "glossary_terms") query = client.from(activeSection.table).select("*").order("term");
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
    const labelField = activeSection.table === "shop_items" || activeSection.table === "articles" || activeSection.table === "archive_documents" ? "title" : activeSection.table === "site_settings" ? "key" : activeSection.table === "glossary_terms" ? "term" : "name";
    const label = activeSection.listLabel?.(record) || record[labelField] || record.code || record.reference || (activeSection.table === "mineral_occurrences" ? `${refs.minerals?.find(item => item.id === record.mineral_id)?.name || "Minéral"} · ${refs.departments?.find(item => item.code === record.department_code)?.name || record.department_code}` : "Entrée");
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
  const copy = selectedRecord ? null : prefill; prefill = null;
  if (copy) title.textContent = activeSection.duplicate.title;
  const form = document.createElement("form"); form.noValidate = true;
  if (activeSection.mediaFirst) appendMediaControls(form);
  contentEditor = null;
  const source = selectedRecord || copy?.values || {};
  const values = activeSection.prepare ? activeSection.prepare(source) : source;
  activeSection.fields.forEach(field => {
    form.append(createField(field, values[field.key], values._typed?.[field.key]));
    if (activeSection.mediaAfter === field.key) appendMediaControls(form);
  });
  if (activeSection.id === "articles") {
    const layout = document.createElement("div"); layout.className = "layout-tool";
    const open = document.createElement("button"); open.type = "button"; open.className = "admin-secondary layout-btn"; open.textContent = "🖌 Mise en page";
    const note = document.createElement("small"); note.textContent = "Ouvre le contenu en plein écran pour écrire et mettre en page confortablement (gras, italique, police, couleur, alignement, images, PDF et liens n’importe où dans le texte).";
    open.addEventListener("click", () => contentEditor?.toggleFullscreen(true));
    layout.append(open, note); form.append(layout);
  }
  if (activeSection.autoReference && !selectedRecord) wireAutoReference(form);
  wireGeoAutofill(form);
  if (activeSection.id === "localities") addLocateTool(form);
  else if (activeSection.id === "mines") addMinePointTool(form);
  else addPointTool(form);
  if ((activeSection.mediaTable || activeSection.singleFile) && !activeSection.mediaFirst && !activeSection.mediaAfter) appendMediaControls(form);
  const actions = document.createElement("div"); actions.className = "admin-actions";
  const save = document.createElement("button"); save.className = "btn"; save.type = "submit"; save.textContent = selectedRecord ? "Enregistrer les modifications" : "Créer"; actions.append(save);
  if (viewMode === "add") {
    const cancel = document.createElement("button"); cancel.type = "button"; cancel.className = "admin-secondary"; cancel.textContent = "Annuler";
    cancel.addEventListener("click", () => { clearNewMediaSelection(); selectedRecord = null; currentMedia = []; setListMode(); renderWorkspace(); report("Modification annulée."); });
    actions.append(cancel);
  }
  if (selectedRecord && activeSection.duplicate) {
    const duplicate = document.createElement("button"); duplicate.type = "button"; duplicate.className = "admin-secondary"; duplicate.textContent = "Dupliquer";
    duplicate.addEventListener("click", () => duplicateRecord(selectedRecord)); actions.append(duplicate);
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

// typed : valeur libre à afficher dans « Autre » quand la fiche n'a qu'un nom, sans lien vers le référentiel (anciennes fiches).
function createField(field, value, typed = "") {
  const wrapper = document.createElement("div");
  const label = document.createElement("label"); label.textContent = field.label; wrapper.append(label);
  if (field.cover) {
    const hidden = document.createElement("input"); hidden.type = "hidden"; hidden.name = field.key; hidden.value = value || "";
    const box = document.createElement("div"); box.className = "cover-field";
    if (value) {
      const preview = document.createElement("img"); preview.className = "cover-preview"; preview.alt = "Image de fiche actuelle";
      preview.src = client.storage.from(selectedRecord?.cover_bucket || PUBLIC_BUCKET).getPublicUrl(value).data.publicUrl;
      const remove = document.createElement("label"); remove.className = "cover-remove";
      const check = document.createElement("input"); check.type = "checkbox"; check.name = `${field.key}__remove`;
      remove.append(check, " Retirer cette image");
      box.append(preview, remove);
    }
    const file = document.createElement("input"); file.type = "file"; file.accept = "image/jpeg,image/png,image/webp"; file.name = `${field.key}__file`;
    label.htmlFor = file.id = `content-${field.key}`;
    box.append(file); wrapper.append(hidden, box);
    return wrapper;
  }
  if (field.richBody) {
    // Fiche enregistrée avant l'éditeur : l'ancien texte brut sert de point de départ.
    if (!(value || []).length && field.plainText && selectedRecord?.[field.plainText]) value = [String(selectedRecord[field.plainText])];
    const hidden = document.createElement("input"); hidden.type = "hidden"; hidden.name = field.key; hidden.value = JSON.stringify(value || []);
    contentEditor = createContentEditor({ client, initial: value || [], onChange: blocks => { hidden.value = JSON.stringify(blocks); } });
    wrapper.className = "rich-field"; wrapper.append(hidden, contentEditor.element);
    return wrapper;
  }
  let input;
  if (field.ref) {
    input = document.createElement("select");
    if (field.multi) input.multiple = true;
    if (!field.multi) { const blank = document.createElement("option"); blank.value = ""; blank.textContent = "— Aucun —"; input.append(blank); }
    if (allowsOther(field) && !field.multi) { const other = document.createElement("option"); other.value = OTHER; other.textContent = "➕ Autre (saisir une valeur)…"; input.append(other); }
    for (const optionData of refs[field.ref] || []) {
      const option = document.createElement("option"); option.value = optionData[field.value || "id"];
      option.textContent = optionData[field.display] || option.value; option.selected = field.multi && (selectedRecord?._links?.[field.key] || []).includes(option.value); input.append(option);
    }
  } else if (field.options) {
    input = document.createElement("select");
    if (field.blank) { const blank = document.createElement("option"); blank.value = ""; blank.textContent = field.blank; input.append(blank); }
    if (allowsOther(field)) { const other = document.createElement("option"); other.value = OTHER; other.textContent = "➕ Autre (saisir une valeur)…"; input.append(other); }
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
  if (field.placeholder) input.placeholder = field.placeholder;
  if (field.required) { input.required = true; label.textContent += " *"; }
  if (field.type === "checkbox") input.checked = Boolean(value);
  else if (field.lines && Array.isArray(value)) input.value = value.join("\n");
  else if (value != null && value !== "") input.value = field.body ? bodyToText(value) : field.key === "value" ? JSON.stringify(value, null, 2) : field.euros ? (Number(value) / 100).toFixed(2) : field.array && Array.isArray(value) ? value.join(", ") : String(value);
  label.htmlFor = `content-${field.key}`; input.id = label.htmlFor; input.name = field.key;
  wrapper.append(input);
  if (field.suggest) {
    const list = document.createElement("datalist"); list.id = `${input.id}-suggestions`; input.setAttribute("list", list.id);
    const known = [...field.suggest, ...records.map(record => record[field.key])].map(text).filter(Boolean);
    [...new Set(known)].sort((a, b) => a.localeCompare(b, "fr")).forEach(item => { const option = document.createElement("option"); option.value = item; list.append(option); });
    wrapper.append(list);
  }
  if (field.help) { const help = document.createElement("small"); help.textContent = field.help; wrapper.append(help); }
  if (allowsOther(field)) {
    const box = document.createElement("input"); box.type = "text"; box.name = `${field.key}__other`; box.id = `content-${field.key}__other`;
    if (field.multi) { box.placeholder = "Autres, séparés par des virgules (créés automatiquement)"; }
    else { box.hidden = true; box.placeholder = "Saisir la nouvelle valeur"; input.addEventListener("change", () => { box.hidden = input.value !== OTHER; if (!box.hidden) box.focus(); }); }
    if (!field.multi && !input.value && text(typed)) { input.value = OTHER; box.value = text(typed); }
    wrapper.append(box);
    if (!field.multi) enhanceCombobox(input, { otherValue: OTHER, otherInput: box, placeholder: `${field.label}…` });
    else enhanceMulti(input, { otherInput: box, placeholder: "Tapez pour ajouter…" });
  }
  return wrapper;
}

function bodyToText(body) {
  if (typeof body === "string") return body;
  if (!Array.isArray(body)) return "";
  return body.map(block => typeof block === "string" ? block : block.text || "").join("\n\n");
}

function appendMediaControls(panel) {
  const title = document.createElement("h4"); title.textContent = activeSection.singleFile ? "Fichier (texte, PDF ou photo)" : activeSection.singleCover ? "Image de fiche (illustration de l’article côté public)" : "Photos"; panel.append(title);
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
    uploadInput = document.createElement("input"); uploadInput.type = "file"; uploadInput.accept = activeSection.singleFile ? ".pdf,image/*,.txt,.rtf,.doc,.docx,.odt,text/plain" : "image/jpeg,image/png,image/webp";
    uploadInput.multiple = Boolean(activeSection.mediaTable) && !activeSection.singleCover; uploadInput.setAttribute("aria-label", "Ajouter un média");
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
        const { data, error } = await client.from(table).select(column).eq(linkOwner(activeSection), record.id);
        if (error) throw error;
        const fieldKey = `link_${table.replace(linkPrefix(activeSection), "")}`;
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
  pendingLinkExtras = {}; createdNames = []; resolvedLocalities.clear(); refNames.clear();
  const pointTargets = pointTool?.targets() || [];
  report("Enregistrement…");
  try {
    const record = {};
    let typedMine = ""; // gisement saisi en « Autre » : reconnu par son nom et sa commune, une fois la commune connue
    for (const field of section.fields) {
      const input = form.elements.namedItem(field.key);
      if (!input) throw new Error(`Le champ « ${field.label} » est introuvable dans le formulaire.`);
      let value = field.type === "checkbox" ? input.checked : field.multi ? [...input.selectedOptions].map(option => option.value) : text(input.value);
      if (!field.multi && value === OTHER) {
        const typed = text(form.elements.namedItem(`${field.key}__other`)?.value);
        if (field.ref === "mines") { typedMine = typed; value = ""; }
        else if (field.ref) value = typed ? String(await ensureRef(field.ref, typed)) : "";
        else value = typed;
      }
      if (field.required && !value && value !== 0 && value !== false) throw new Error(`Le champ « ${field.label} » est requis par le schéma actuel.`);
      if (field.euros && value !== "") { const amount = Number(value); if (!Number.isFinite(amount) || amount < 0) throw new Error("Le prix doit être un nombre positif ou nul."); value = Math.round(amount * 100); }
      else if (field.type === "number" && value !== "") { value = Number(value); if (!Number.isFinite(value)) throw new Error(`Valeur numérique invalide pour « ${field.label} ».`); }
      if (field.richBody) value = contentEditor ? contentEditor.getBlocks() : JSON.parse(input.value || "[]");
      // Copie en texte brut (recherche, référencement) d'un contenu mis en forme.
      if (field.plainText) record[field.plainText] = blocksToText(value).join("\n\n");
      if (field.lines) value = String(input.value || "").split("\n").map(line => line.trim()).filter(Boolean);
      if (field.cover) {
        const chosen = form.elements.namedItem(`${field.key}__file`)?.files?.[0];
        if (chosen) {
          const name = chosen.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9.-]+/g, "-");
          const coverPath = `${section.path}/couvertures/${crypto.randomUUID()}-${name}`;
          const { error: coverError } = await client.storage.from(PUBLIC_BUCKET).upload(coverPath, chosen, { upsert: false, contentType: chosen.type });
          if (coverError) throw coverError;
          value = coverPath; record.cover_bucket = PUBLIC_BUCKET;
        } else if (form.elements.namedItem(`${field.key}__remove`)?.checked) value = "";
      }
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
    if (typedMine) record.mine_id = String(await ensureRef("mines", typedMine, { locality_id: record.locality_id || null }));
    // Référence automatique : numéro recalculé sur les références enregistrées au moment même de l'enregistrement.
    if (section.autoReference && !selectedRecord && form.elements.namedItem("reference")?.dataset.auto === "1") {
      const prefix = referencePrefix(refName("minerals", record.mineral_id),
        [refName("mines", record.mine_id), refName("localities", record.locality_id), refName("departments", record.department_code), refName("regions", record.region_id), record.provenance]);
      if (!prefix) throw new Error("Choisissez le minéral principal pour créer la référence (ou saisissez-la à la main).");
      const { data, error } = await client.from(section.table).select("reference").ilike("reference", `${prefix}%`);
      if (error) throw error;
      record.reference = nextReference(prefix, (data || []).map(row => row.reference));
    }
    // Département sans région (nouveau département ou province étrangère) : rattaché à la région choisie dans la fiche.
    if (record.department_code && record.region_id && section.id !== "departments") {
      const department = (refs.departments || []).find(item => String(item.code) === String(record.department_code));
      if (department && !department.region_id) {
        const { error } = await client.from("departments").update({ region_id: record.region_id }).eq("code", department.code).is("region_id", null);
        if (!error) department.region_id = record.region_id;
      }
    }
    if (section.id === "settings") {
      const payload = { key: record.key, value: record.value, is_public: record.is_public };
      const { error } = await client.from(section.table).upsert(payload, { onConflict: "key" }).select("key").single(); if (error) throw error;
      databaseSaved = true;
      report("Paramètre enregistré.");
    } else {
      const current = selectedRecord;
      if (["regions", "localities", "mines", "minerals"].includes(section.id)) record.slug = current?.slug || await uniqueSlug(record.name, section.table);
      if (section.id === "shop" && !record.title) {
        const mineralName = (refs.minerals || []).find(item => String(item.id) === String(record.mineral_id))?.name || "";
        record.title = [mineralName, record.reference].filter(Boolean).join(" ") || record.reference;
      }
      if (["shop", "articles", "archives"].includes(section.id)) record.slug = current?.slug || await uniqueSlug(record.title || record.reference, section.table);
      if (section.id === "glossary") record.slug = current?.slug || await uniqueSlug(record.term, section.table);
      if (section.id === "shop" && record.price_cents == null) throw new Error("Le schéma de la boutique exige un prix (0 est accepté).");
      if (section.complete) await section.complete(record, { current });
      let saved;
      if (current?.id || current?.code) {
        const key = current.id ? "id" : "code";
        const { data, error } = await client.from(section.table).update(record).eq(key, current[key]).select("*").single(); if (error) throw error; saved = data;
      } else {
        const { data, error } = await client.from(section.table).insert(record).select("*").single(); if (error) throw error; saved = data;
      }
      selectedRecord = saved;
      databaseSaved = true;
      report("Fiche enregistrée. Traitement des médias…");
      if (section.links) await saveLinks(saved, form);
      if (pointTargets.length) await savePendingPoints(client, pointTool, pointTargets, target => target.id || (saved.locality_id && !form.elements.namedItem("link_localities") ? saved.locality_id : resolvedLocalities.get(normalizeName(target.name))));
      if (section.mediaTable) await uploadMedia(saved);
      if (section.singleFile) await saveArchiveFile(saved, current);
      if (section.mediaTable && current && current.publication_status !== saved.publication_status) await syncMedia(saved);
      report("Contenu enregistré. Rechargement de la liste…");
    }
    await loadReferences(section); await loadRecords(); selectedRecord = null; clearNewMediaSelection(); setListMode(); renderWorkspace();
    report(`Enregistrement terminé. La liste est à jour.${createdNames.length ? ` Nouvelles valeurs ajoutées aux listes : ${createdNames.join(", ")}.` : ""}`);
    void backfillLocalities(client).catch(problem => console.error("Localisation automatique des communes :", problem));
  } catch (error) {
    console.error(`Échec enregistrement CMS ${section.id}:`, error);
    report(`${databaseSaved ? "Le contenu principal est enregistré en base, mais une opération secondaire a échoué" : "Enregistrement impossible"} : ${errorText(error)}`, true);
  }
}

// « Dupliquer » : nouvelle fiche reprenant uniquement le minéral principal et la localisation (champs listés dans duplicate.fields).
// Rien d'autre n'est copié : ni titre, référence, prix, dimensions, poids, description, minéraux associés ni photos.
function duplicateRecord(source) {
  prefill = { values: Object.fromEntries(activeSection.duplicate.fields.map(key => [key, source[key]])) };
  clearNewMediaSelection(); selectedRecord = null; currentMedia = [];
  setFormMode(); renderWorkspace();
  workspace.querySelector("form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  report("Copie prête : minéral principal et localisation repris. Complétez le reste puis enregistrez.");
}

// Référence produit remplie en direct à partir du minéral principal et du lieu (gisement, sinon commune, département, région, pays),
// tant qu'elle n'est pas modifiée à la main.
function wireAutoReference(form) {
  const input = form.elements.namedItem("reference");
  if (!input) return;
  input.placeholder = "Choisissez le minéral et le gisement";
  input.dataset.auto = "1";
  const nameOf = (key, table) => {
    const select = form.elements.namedItem(key);
    if (!select?.value) return "";
    return select.value === OTHER ? text(form.elements.namedItem(`${key}__other`)?.value) : refName(table, select.value);
  };
  const update = () => {
    if (input.dataset.auto !== "1") return;
    const places = [nameOf("mine_id", "mines"), nameOf("locality_id", "localities"), nameOf("department_code", "departments"), nameOf("region_id", "regions"), text(form.elements.namedItem("provenance")?.value)];
    input.value = nextReference(referencePrefix(nameOf("mineral_id", "minerals"), places), records.map(record => record.reference));
  };
  input.addEventListener("input", () => { input.dataset.auto = input.value.trim() ? "0" : "1"; if (input.dataset.auto === "1") update(); });
  form.addEventListener("change", event => { if (event.target !== input) update(); });
  update();
}

// Localités : recherche des coordonnées officielles, avec choix quand plusieurs communes portent le même nom.
function addLocateTool(form) {
  const box = document.createElement("div"); box.className = "locate-tool";
  const button = document.createElement("button"); button.type = "button"; button.className = "admin-secondary"; button.textContent = "📍 Localiser la commune";
  const results = document.createElement("div"); results.className = "locate-results";
  const manual = document.createElement("button"); manual.type = "button"; manual.className = "admin-secondary"; manual.textContent = "🖐 Poser le point à la main sur la carte";
  box.append(button, manual, results);
  manual.addEventListener("click", async () => {
    const value = key => { const number = Number(form.elements.namedItem(key)?.value); return form.elements.namedItem(key)?.value !== "" && Number.isFinite(number) ? number : null; };
    const departmentValue = form.elements.namedItem("department_code")?.value;
    try {
      const point = await pickPoint({ name: form.elements.namedItem("name").value.trim(), department: departmentValue && departmentValue !== OTHER ? departmentValue : "", latitude: value("latitude"), longitude: value("longitude") });
      if (!point) return;
      form.elements.namedItem("latitude").value = point.latitude; form.elements.namedItem("longitude").value = point.longitude;
      results.textContent = "Point posé à la main. Pensez à enregistrer.";
    } catch (error) { results.textContent = error.message; }
  });
  const anchor = form.elements.namedItem("latitude")?.closest("div");
  (anchor || form.lastElementChild)?.before(box);
  button.addEventListener("click", async () => {
    const name = form.elements.namedItem("name").value.trim();
    const departmentSelect = form.elements.namedItem("department_code");
    const department = departmentSelect?.value && departmentSelect.value !== OTHER ? departmentSelect.value : "";
    if (!name) { results.textContent = "Indiquez d’abord le nom de la commune."; return; }
    results.textContent = "Recherche…";
    try {
      let matches = await findCommune(name, department);
      if (!matches.length) matches = await searchCommunes(name, department);
      if (!matches.length) { results.textContent = "Aucune commune trouvée. Vérifiez l’orthographe, ou saisissez la latitude et la longitude à la main."; return; }
      const fill = match => {
        const values = communeUpdate(match, department);
        ["latitude", "longitude", "insee_code", "postal_code"].forEach(key => { const input = form.elements.namedItem(key); if (input) input.value = values[key] ?? ""; });
        if (!department && departmentSelect) departmentSelect.value = match.department;
        results.textContent = `Commune retenue : ${communeLabel(match)}. Pensez à enregistrer.`;
      };
      if (matches.length === 1) { fill(matches[0]); return; }
      results.replaceChildren(document.createTextNode("Plusieurs communes correspondent, choisissez la bonne :"));
      matches.slice(0, 10).forEach(match => {
        const choice = document.createElement("button"); choice.type = "button"; choice.className = "admin-secondary"; choice.textContent = communeLabel(match);
        choice.addEventListener("click", () => fill(match)); results.append(choice);
      });
    } catch (error) { results.textContent = `Recherche impossible : ${error.message}`; }
  });
}

// Gisements : point propre sur la carte, posé à la main (plusieurs gisements d'une même commune = plusieurs points).
// Sans point, le gisement s'affiche au point de sa commune. La carte s'ouvre sur la commune pour viser plus vite.
function addMinePointTool(form) {
  pointTool = null;
  const field = key => form.elements.namedItem(key);
  const number = key => { const raw = field(key)?.value; const value = Number(raw); return raw !== "" && raw != null && Number.isFinite(value) ? value : null; };
  const box = document.createElement("div"); box.className = "point-tool";
  const row = document.createElement("div"); row.className = "point-row";
  const state = document.createElement("span");
  const place = document.createElement("button"); place.type = "button"; place.className = "admin-secondary";
  const clear = document.createElement("button"); clear.type = "button"; clear.className = "admin-secondary"; clear.textContent = "Retirer le point";
  row.append(state, place, clear); box.append(row);
  const commune = () => (refs.localities || []).find(item => String(item.id) === String(field("locality_id")?.value));
  const refresh = () => {
    const located = number("latitude") != null && number("longitude") != null;
    const town = commune();
    state.className = `point-state ${located ? "is-ok" : "is-missing"}`;
    state.textContent = located ? `Gisement placé sur la carte (${number("latitude").toFixed(5)}, ${number("longitude").toFixed(5)}).`
      : town ? `Pas encore de point propre : le gisement apparaît au point de la commune ${town.name}. Posez son point pour le distinguer des autres gisements de la commune.`
      : "Pas encore de point : choisissez la commune ou posez le point du gisement sur la carte.";
    place.textContent = located ? "Déplacer le point du gisement" : "📍 Poser le point du gisement sur la carte";
    clear.hidden = !located;
  };
  place.addEventListener("click", async () => {
    const town = commune();
    place.disabled = true;
    try {
      const start = number("latitude") != null ? { latitude: number("latitude"), longitude: number("longitude") } : { latitude: town?.latitude ?? null, longitude: town?.longitude ?? null };
      const point = await pickPoint({ name: field("name")?.value.trim() || town?.name || "", department: town?.department_code || "", ...start });
      if (point) { field("latitude").value = point.latitude; field("longitude").value = point.longitude; }
    } catch (error) { state.textContent = error.message; }
    place.disabled = false; refresh();
  });
  clear.addEventListener("click", () => { field("latitude").value = ""; field("longitude").value = ""; refresh(); });
  (field("latitude")?.closest("div") || form.lastElementChild)?.before(box);
  form.addEventListener("change", refresh); form.addEventListener("input", refresh);
  refresh();
}

// Fiches liées à une commune : position sur la carte posable à la main sous le champ « Localité ».
function addPointTool(form) {
  pointTool = null;
  const single = form.elements.namedItem("locality_id");
  const multi = form.elements.namedItem("link_localities");
  const select = single || multi;
  if (!select) return;
  const department = () => { const value = form.elements.namedItem("department_code")?.value; return value && value !== OTHER ? value : ""; };
  const fromRef = id => {
    const known = (refs.localities || []).find(item => String(item.id) === String(id));
    return known && { key: pointKey(known.id), id: known.id, name: known.name, department: department() || known.department_code, latitude: known.latitude, longitude: known.longitude };
  };
  const typed = name => ({ key: pointKey(null, name), id: null, name, department: department() });
  const targets = () => {
    const other = text(form.elements.namedItem(`${select.name}__other`)?.value);
    if (single) return single.value === OTHER ? (other ? [typed(other)] : []) : [fromRef(single.value)].filter(Boolean);
    return [...[...multi.selectedOptions].map(option => fromRef(option.value)).filter(Boolean), ...other.split(",").map(part => part.trim()).filter(Boolean).map(typed)];
  };
  const tool = createPointTool(targets);
  tool.targets = targets;
  pointTool = tool;
  (select.closest("div") || select).after(tool.element);
  form.addEventListener("change", () => tool.refresh());
  tool.refresh();
}

// Remplissage automatique : gisement → localité → département.
function wireGeoAutofill(form) {
  const field = name => form.elements.namedItem(name);
  const setValue = (name, value) => {
    const select = field(name);
    if (!select || select.tagName !== "SELECT" || value == null || value === "" || ![...select.options].some(option => option.value === String(value))) return false;
    select.value = String(value);
    const other = form.elements.namedItem(`${name}__other`); if (other && other.type === "text") other.hidden = true;
    return true;
  };
  // Département → région ; pays « France » si la case est vide et le département français.
  const fromDepartment = code => {
    const department = (refs.departments || []).find(item => String(item.code) === String(code));
    if (department?.region_id) setValue("region_id", department.region_id);
    const country = activeSection.countryField && field(activeSection.countryField);
    if (department && country && !country.value.trim() && isFrenchDepartmentCode(department.code)) country.value = "France";
  };
  const fromLocality = id => { const locality = (refs.localities || []).find(item => String(item.id) === String(id)); if (locality?.department_code && setValue("department_code", locality.department_code)) fromDepartment(locality.department_code); };
  field("department_code")?.addEventListener?.("change", event => fromDepartment(event.target.value));
  field("mine_id")?.addEventListener?.("change", event => {
    const mine = (refs.mines || []).find(item => String(item.id) === String(event.target.value));
    if (mine?.locality_id && setValue("locality_id", mine.locality_id)) fromLocality(mine.locality_id);
  });
  field("locality_id")?.addEventListener?.("change", async event => {
    if (event.target.value !== OTHER) { fromLocality(event.target.value); return; }
    // Nouvelle commune saisie : son département est cherché dans la base officielle des communes.
    const code = await departmentOfCommune(field("locality_id__other")?.value);
    if (code && setValue("department_code", code)) fromDepartment(code);
  });
  // Fiches liées (articles, archives) : chaque commune ajoutée ajoute son département et sa région.
  const select = (name, value) => {
    const list = field(name);
    const option = list?.multiple && [...list.options].find(item => item.value === String(value));
    if (!option || option.selected) return;
    option.selected = true; list.dispatchEvent(new Event("change", { bubbles: true }));
  };
  const fromLinkedDepartment = code => { select("link_departments", code); const department = (refs.departments || []).find(item => String(item.code) === String(code)); if (department?.region_id) select("link_regions", department.region_id); };
  field("link_localities")?.addEventListener?.("change", () => {
    [...field("link_localities").selectedOptions].forEach(option => { const locality = (refs.localities || []).find(item => String(item.id) === option.value); if (locality?.department_code) fromLinkedDepartment(locality.department_code); });
  });
  const typedLocalities = field("link_localities__other");
  typedLocalities?.addEventListener?.("change", async () => {
    for (const name of typedLocalities.value.split(",").map(part => part.trim()).filter(Boolean)) { const code = await departmentOfCommune(name); if (code) fromLinkedDepartment(code); }
  });
  field("link_departments")?.addEventListener?.("change", () => { [...field("link_departments").selectedOptions].forEach(option => { const department = (refs.departments || []).find(item => String(item.code) === option.value); if (department?.region_id) select("link_regions", department.region_id); }); });
}

async function ensureRef(table, name, extra = {}) {
  if (table === "departments") {
    // Département connu (nom ou numéro), sinon créé : provinces et départements étrangers acceptés.
    const result = await ensureDepartment(client, name);
    if (result.created) { createdNames.push(result.name); (refs.departments ||= []).push({ code: result.code, name: result.name, region_id: null }); }
    refNames.set(`${table}:${result.code}`, result.name);
    return result.code;
  }
  const result = await ensureNamed(client, table, name, extra);
  if (result.created) createdNames.push(result.name);
  if (table === "localities") resolvedLocalities.set(normalizeName(name), result.id);
  refNames.set(`${table}:${result.id}`, result.name);
  return result.id;
}

// Nom d'une valeur liée (référentiel chargé ou valeur créée pendant l'enregistrement), sans la précision ajoutée aux communes homonymes.
function refName(table, id) {
  if (id == null || id === "") return "";
  const known = (refs[table] || []).find(item => String(table === "departments" ? item.code : item.id) === String(id));
  return known ? known.plainName ?? known.name : refNames.get(`${table}:${id}`) || "";
}

// ---------- Ma collection ----------
// À l'ouverture : date et poids des fiches anciennes remis au format de saisie ; nom sans lien vers le référentiel proposé en « Autre ».
function prepareSpecimen(record) {
  const typed = {};
  [["mineral_id", "mineral_name"], ["mine_id", "provenance"], ["locality_id", "locality_name"], ["department_code", "department_name"], ["region_id", "region_name"]]
    .forEach(([key, nameKey]) => { if (!record[key] && text(record[nameKey])) typed[key] = record[nameKey]; });
  return {
    ...record,
    weight_text: record.weight_text ?? (record.weight_grams != null ? String(record.weight_grams) : ""),
    discovery_date_text: record.discovery_date_text ?? formatDiscoveryDate(record),
    _typed: typed
  };
}
// Avant l'enregistrement : noms recopiés (utilisés par les pages publiques), poids en grammes, date exploitable et adresse de la fiche.
async function completeSpecimen(record, { current }) {
  record.mineral_name = refName("minerals", record.mineral_id) || null;
  record.provenance = refName("mines", record.mine_id);
  record.locality_name = refName("localities", record.locality_id) || null;
  record.department_name = refName("departments", record.department_code) || null;
  record.region_name = refName("regions", record.region_id) || null;
  Object.assign(record, parseWeight(record.weight_text), parseDiscoveryDate(record.discovery_date_text));
  if (!current) record.slug = await uniqueSlug([record.mineral_name, record.provenance, record.locality_name].filter(Boolean).join("-"), "specimens");
}

function linkOwner(section) { return section.linkOwner || (section.id === "articles" ? "article_id" : "archive_id"); }
function linkPrefix(section) { return section.linkPrefix || (section.id === "articles" ? "article_" : "archive_"); }

async function saveLinks(parent, form) {
  for (const [table, column] of activeSection.links) {
    const ownerColumn = linkOwner(activeSection);
    const fieldKey = `link_${table.replace(linkPrefix(activeSection), "")}`;
    const linkField = form.elements.namedItem(fieldKey);
    if (!linkField) throw new Error(`Le champ de relations « ${fieldKey} » est introuvable.`);
    const excluded = activeSection.linkExclude?.[fieldKey];
    const desired = [...new Set([...[...linkField.selectedOptions].map(option => option.value), ...(pendingLinkExtras[fieldKey] || [])])]
      .filter(id => !excluded || id !== String(parent[excluded]));
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
    const position = currentPosition + index;
    const row = { [activeSection.foreignKey]: parent.id, bucket_id: bucket, storage_path: path, alt_text: file.name, position, ...activeSection.mediaRow?.(parent, file, position) };
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
  const mediaTables = ["specimen_media", "shop_item_media", "article_media", "mineral_media"];
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
