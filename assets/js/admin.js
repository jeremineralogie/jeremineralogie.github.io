import { getSupabase } from "./supabase-client.js";
import { resolveReferences, ensureNamed, normalizeName, OTHER, SITE_TYPES } from "./reference-resolver.js";

const status = document.querySelector("#admin-status");
const editorStatus = document.querySelector("#specimen-status");
const loginPanel = document.querySelector("#login-panel");
const cmsPanel = document.querySelector("#cms-panel");
const editor = document.querySelector("#editor-panel");
const form = document.querySelector("#specimen-form");
const list = document.querySelector("#specimen-list");
const mainNav = document.querySelector("#admin-main-nav");
const collectionPanel = document.querySelector("#collection-panel");
const collectionTabs = document.querySelector("#collection-tabs");
const collectionAddView = document.querySelector("#collection-add-view");
const collectionListView = document.querySelector("#collection-list-view");
const contentManager = document.querySelector("#content-manager");
const appearancePanel = document.querySelector("#appearance-panel");
const mineralInput = document.querySelector("#mineral-name");
const mineralAssociationSelect = document.querySelector("#mineral-association-select");
const mineralAssociationOther = document.querySelector("#mineral-association-other");
const mineralAssociationAddBtn = document.querySelector("#mineral-association-add");
const mineralAssociationList = document.querySelector("#mineral-association-list");
const mineralAssociationData = document.querySelector("#mineral-association-data");
const siteTypeSelect = document.querySelector("#site-type");
let mineralAssociationItems = [];
const siteTypeOther = document.querySelector("#site-type-other");
const photoInput = document.querySelector("#photos");
const existingPhotoGroup = document.querySelector("#existing-photo-group");
const existingPhotoPreview = document.querySelector("#existing-photos");
const selectedPhotoGroup = document.querySelector("#selected-photo-group");
const selectedPhotoPreview = document.querySelector("#selected-photos");
const client = getSupabase();
let media = [];
let selectedPhotoUrls = [];
let mediaRenderVersion = 0;
let editorLoadVersion = 0;
let editingSpecimen = null;
let contentAdminInitialized = false;
let knownCustomSiteTypes = [];
let contentModule = null;
let activeMain = "collection";
const dirtyReferenceFields = new Set();

function message(text, isError = false) {
  status.textContent = text;
  status.classList.toggle("admin-error", isError);
  status.hidden = false;
  if (!editor.hidden && editorStatus) {
    editorStatus.textContent = text;
    editorStatus.classList.toggle("admin-error", isError);
    editorStatus.hidden = false;
  }
}

function describeError(error) {
  if (!error) return "Erreur inconnue.";
  return [error.message, error.code && `Code : ${error.code}`, error.details, error.hint && `Indication : ${error.hint}`]
    .filter(Boolean).join(" — ");
}

if (!client) {
  message("Configuration Supabase absente : renseignez l’URL et la clé publique dans assets/js/supabase-config.js.", true);
} else {
  document.querySelector("#login-form").addEventListener("submit", async event => {
    event.preventDefault();
    message("Connexion en cours…");
    const { error } = await client.auth.signInWithPassword({
      email: document.querySelector("#login-email").value,
      password: document.querySelector("#login-password").value
    });
    if (error) message(error.message, true);
    else {
      const { data } = await client.auth.getSession();
      await showSession(data.session);
    }
  });
  document.querySelector("#logout").addEventListener("click", async () => {
    await client.auth.signOut();
    await showSession(null);
  });
  mainNav.addEventListener("click", event => {
    const button = event.target.closest("[data-main]");
    if (button) void showMainSection(button.dataset.main);
  });
  collectionTabs.addEventListener("click", event => {
    const button = event.target.closest("[data-collection-view]");
    if (!button) return;
    if (button.dataset.collectionView === "add") resetEditor(true);
    else setCollectionView("list");
  });
  document.querySelector("#cancel-edit").addEventListener("click", () => resetEditor(false));
  document.querySelector("#delete-specimen").addEventListener("click", deleteSpecimen);
  [mineralInput, document.querySelector("#region"), document.querySelector("#department"), document.querySelector("#locality"), document.querySelector("#provenance")]
    .forEach(select => {
      select.addEventListener("change", () => {
        dirtyReferenceFields.add(select.id);
        const otherInput = document.querySelector(`#${select.id}-other`);
        if (otherInput) otherInput.hidden = select.value !== "OTHER";
        if (select.value === "OTHER" && otherInput) otherInput.focus();
      });
    });
  mineralAssociationSelect.addEventListener("change", () => {
    if (mineralAssociationSelect.value === "OTHER") {
      mineralAssociationOther.hidden = false;
      mineralAssociationOther.focus();
    } else {
      mineralAssociationOther.hidden = true;
    }
  });
  mineralAssociationAddBtn.addEventListener("click", addMineralAssociation);
  mineralAssociationSelect.addEventListener("keypress", (e) => {
    if (e.key === "Enter") { e.preventDefault(); addMineralAssociation(); }
  });
  mineralAssociationOther.addEventListener("keypress", (e) => {
    if (e.key === "Enter") { e.preventDefault(); addMineralAssociation(); }
  });
  photoInput.addEventListener("change", renderSelectedPhotoPreviews);
  siteTypeSelect.addEventListener("change", syncSiteTypeOther);
  setSiteType("");
  form.addEventListener("submit", saveSpecimen);
  void client.auth.getSession().then(({ data }) => showSession(data.session));
}

async function showSession(session) {
  loginPanel.hidden = true;
  cmsPanel.hidden = true;
  if (!session) {
    loginPanel.hidden = false;
    activeMain = "collection";
    message("Connectez-vous avec le compte administrateur.");
    return;
  }
  const { data, error } = await client.rpc("is_admin");
  if (error || data !== true) {
    await client.auth.signOut();
    loginPanel.hidden = false;
    message("Ce compte n’a pas le rôle administrateur.", true);
    return;
  }
  cmsPanel.hidden = false;
  message("Connecté à l’espace privé.");
  resetEditor(false);
  await showMainSection(activeMain);
  await loadDashboard();
  if (!contentAdminInitialized) {
    try {
      const module = await import("./admin-content.js");
      await module.initContentAdmin(client);
      contentModule = module;
      contentAdminInitialized = true;
    } catch (error) {
      console.error("Impossible de charger les autres sections du CMS :", error);
      message(`Ma collection est disponible, mais les autres sections n’ont pas pu être chargées : ${describeError(error)}`, true);
    }
  }
  if (contentModule && activeMain !== "collection") await showMainSection(activeMain);
}

// Navigation principale : Ma collection / Boutique / Articles / Archives / Référentiels.
async function showMainSection(id) {
  activeMain = id;
  mainNav.querySelectorAll("[data-main]").forEach(button => {
    const active = button.dataset.main === id;
    button.classList.toggle("is-active", active);
    if (active) button.setAttribute("aria-current", "page"); else button.removeAttribute("aria-current");
  });
  const isCollection = id === "collection";
  const isAppearance = id === "appearance";
  collectionPanel.hidden = !isCollection;
  contentManager.hidden = isCollection || isAppearance;
  appearancePanel.hidden = !isAppearance;
  if (isAppearance) {
    const frame = appearancePanel.querySelector("iframe");
    if (!frame.src) frame.src = frame.dataset.src;
    return;
  }
  if (isCollection) return;
  if (!contentModule) {
    message("Chargement de la section…");
    return;
  }
  await contentModule.openGroup(id);
}

// Sous-onglets de Ma collection : « Ajouter un spécimen » (formulaire) / « Ma collection » (liste).
function setCollectionView(view) {
  const isAdd = view === "add";
  collectionAddView.hidden = !isAdd;
  collectionListView.hidden = isAdd;
  collectionTabs.querySelectorAll("[data-collection-view]").forEach(button => {
    const active = button.dataset.collectionView === view;
    button.classList.toggle("is-active", active);
    if (active) button.setAttribute("aria-current", "page"); else button.removeAttribute("aria-current");
  });
}

async function loadDashboard() {
  const { data: specimens, error } = await client.from("specimens")
    .select("id,slug,publication_status,mineral_name,mineral:minerals!specimens_mineral_id_fkey(name)")
    .order("updated_at", { ascending: false });
  if (error) {
    list.replaceChildren();
    console.error("Erreur Supabase pendant le chargement du dashboard :", error);
    message(describeError(error), true);
    return false;
  }
  list.replaceChildren();
  (specimens || []).forEach(specimen => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = `${specimen.mineral_name ?? specimen.mineral?.name ?? "Spécimen"} — ${specimen.slug} (${specimen.publication_status === "published" ? "publié" : "brouillon"})`;
    button.addEventListener("click", () => void editSpecimen(specimen.id));
    list.append(button);
  });
  void loadSuggestions();
  return true;
}

// ----- Type de site (liste + « Autre ») et listes de suggestions alimentées par les référentiels -----
function renderSiteTypeOptions(selected) {
  siteTypeSelect.replaceChildren();
  const add = (value, label) => { const option = document.createElement("option"); option.value = value; option.textContent = label; siteTypeSelect.append(option); };
  add("", "— Non renseigné —");
  SITE_TYPES.forEach(([value, label]) => add(value, label));
  const extras = new Set(knownCustomSiteTypes);
  if (selected && !SITE_TYPES.some(([value]) => value === selected)) extras.add(selected);
  [...extras].sort((a, b) => a.localeCompare(b, "fr")).forEach(value => add(value, value));
  add(OTHER, "Autre (saisir une valeur)…");
}
function setSiteType(value) {
  const clean = (value ?? "").trim();
  const byLabel = SITE_TYPES.find(([, label]) => normalizeName(label) === normalizeName(clean));
  renderSiteTypeOptions(byLabel ? "" : clean);
  siteTypeSelect.value = byLabel ? byLabel[0] : clean;
  siteTypeOther.value = "";
  syncSiteTypeOther();
}
function syncSiteTypeOther() {
  siteTypeOther.hidden = siteTypeSelect.value !== OTHER;
  if (!siteTypeOther.hidden) siteTypeOther.focus();
}
function getSiteType() {
  return siteTypeSelect.value === OTHER ? siteTypeOther.value.trim() : siteTypeSelect.value;
}
function fillDatalist(id, values) {
  const datalist = document.querySelector(id);
  datalist.replaceChildren(...[...new Set(values.filter(Boolean).map(value => String(value).trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "fr")).map(value => { const option = document.createElement("option"); option.value = value; return option; }));
}
async function loadSuggestions() {
  try {
    const getAll = async (table, column = "name") => { const { data, error } = await client.from(table).select("*"); if (error) throw error; return data || []; };
    const getNames = async (table, column = "name") => { const { data, error } = await client.from(table).select(column); if (error) throw error; return (data || []).map(row => row[column]); };
    const [mineralData, mineData, localityData, regionData, departmentData, specimenRows] = await Promise.all([
      getAll("minerals"), getAll("mines"), getAll("localities"), getAll("regions"), getAll("departments"),
      client.from("specimens").select("country,site_type").then(({ data, error }) => { if (error) throw error; return data || []; })
    ]);

    // Populate select elements
    populateSelect("#mineral-name", mineralData, "name", "id");
    populateSelect("#mineral-association-select", mineralData, "name", "id");
    populateSelect("#region", regionData, "name", "id");
    populateSelect("#department", departmentData, "name", "code");
    populateSelect("#locality", localityData, "name", "id");
    populateSelect("#provenance", mineData, "name", "id");

    fillDatalist("#dl-countries", ["France", ...specimenRows.map(row => row.country).filter(Boolean)]);
    const baseKeys = SITE_TYPES.map(([key]) => key);
    knownCustomSiteTypes = specimenRows.map(row => row.site_type).filter(value => value && !baseKeys.includes(value));
    const current = getSiteType();
    if (siteTypeSelect.value !== OTHER) setSiteType(current);
  } catch (error) {
    console.error("Chargement des suggestions de saisie :", error);
  }
}

function populateSelect(selector, data, displayField, valueField) {
  const select = document.querySelector(selector);
  if (!select) return;
  select.replaceChildren();
  const blank = document.createElement("option");
  blank.value = "";
  blank.textContent = "— Aucun —";
  select.append(blank);
  data.forEach(item => {
    const option = document.createElement("option");
    option.value = item[valueField];
    option.textContent = item[displayField];
    select.append(option);
  });
  const other = document.createElement("option");
  other.value = "OTHER";
  other.textContent = "Autre (ajouter une nouvelle valeur)…";
  select.append(other);
}

function populateSelectMultiple(selector, data, displayField, valueField) {
  const select = document.querySelector(selector);
  if (!select) return;
  select.replaceChildren();
  data.forEach(item => {
    const option = document.createElement("option");
    option.value = item[valueField];
    option.textContent = item[displayField];
    select.append(option);
  });
}

function addMineralAssociation() {
  let id = "", name = "";
  if (mineralAssociationSelect.value === "OTHER") {
    name = mineralAssociationOther.value.trim();
  } else {
    id = mineralAssociationSelect.value;
    name = mineralAssociationSelect.options[mineralAssociationSelect.selectedIndex]?.text || "";
  }
  if (!id && !name) return;

  // Éviter les doublons
  if (mineralAssociationItems.some(item => item.id === id && item.name === name)) {
    mineralAssociationSelect.value = "";
    mineralAssociationOther.value = "";
    mineralAssociationOther.hidden = true;
    return;
  }

  mineralAssociationItems.push({ id, name });
  renderMineralAssociationList();
  mineralAssociationSelect.value = "";
  mineralAssociationOther.value = "";
  mineralAssociationOther.hidden = true;
}

function removeMineralAssociation(index) {
  mineralAssociationItems.splice(index, 1);
  renderMineralAssociationList();
}

function renderMineralAssociationList() {
  mineralAssociationList.replaceChildren();
  mineralAssociationItems.forEach((item, index) => {
    const tag = document.createElement("div");
    tag.style.cssText = "display:flex;align-items:center;gap:8px;background:#1a1222;border:1px solid #2b2033;border-radius:999px;padding:6px 12px;font-size:0.94rem";
    tag.textContent = item.name;
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.textContent = "×";
    removeBtn.style.cssText = "background:transparent;border:none;color:#f4f1f5;cursor:pointer;font-size:1.2rem;padding:0;line-height:1";
    removeBtn.addEventListener("click", () => removeMineralAssociation(index));
    tag.append(removeBtn);
    mineralAssociationList.append(tag);
  });
  // Mettre à jour le champ caché avec les IDs
  mineralAssociationData.value = JSON.stringify(mineralAssociationItems.map(item => item.id).filter(Boolean));
}

function setSelectValue(selector, id, fallbackName) {
  const select = document.querySelector(selector);
  const otherInput = document.querySelector(`${selector}-other`);
  if (!select) return;
  if (id) {
    select.value = id;
    if (otherInput) otherInput.hidden = true;
  } else if (fallbackName && fallbackName.trim()) {
    // Custom value not in list
    select.value = "OTHER";
    if (otherInput) {
      otherInput.hidden = false;
      otherInput.value = fallbackName;
    }
  } else {
    select.value = "";
    if (otherInput) otherInput.hidden = true;
  }
}

function getSelectValue(selector) {
  const select = document.querySelector(selector);
  if (!select) return { id: null, text: "" };
  if (select.value === "OTHER") {
    const otherInput = document.querySelector(`${selector}-other`);
    return { id: null, text: otherInput?.value || "" };
  }
  return { id: select.value || null, text: select.options[select.selectedIndex]?.text || "" };
}

function resetEditor(open = false) {
  editorLoadVersion += 1;
  dirtyReferenceFields.clear();
  clearPhotoState();
  form.reset();
  document.querySelector("#specimen-id").value = "";
  document.querySelector("#specimen-slug").value = "";
  document.querySelector("#editor-title").textContent = "Nouveau spécimen";
  document.querySelector("#delete-specimen").hidden = true;
  setSiteType("");
  // Reset selects
  document.querySelectorAll("#mineral-name, #region, #department, #locality, #provenance").forEach(select => {
    select.value = "";
    const otherInput = document.querySelector(`#${select.id}-other`);
    if (otherInput) otherInput.hidden = true;
  });
  // Reset mineral association tags
  mineralAssociationItems = [];
  mineralAssociationSelect.value = "";
  mineralAssociationOther.value = "";
  mineralAssociationOther.hidden = true;
  renderMineralAssociationList();
  editingSpecimen = null;
  if (editorStatus) {
    editorStatus.textContent = "";
    editorStatus.classList.remove("admin-error");
    editorStatus.hidden = true;
  }
  editor.hidden = !open;
  setCollectionView(open ? "add" : "list");
  if (open) editor.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function editSpecimen(id) {
  resetEditor(false);
  const loadVersion = editorLoadVersion;
  message("Chargement du spécimen…");
  try {
    const { data, error } = await client.from("specimens").select("*").eq("id", id).single();
    if (loadVersion !== editorLoadVersion) return;
    if (error) throw error;
    if (!data) throw new Error("La fiche demandée est introuvable.");

    editingSpecimen = data;
    document.querySelector("#specimen-id").value = data.id;
    document.querySelector("#specimen-slug").value = data.slug;
    // Set select values by ID when available, fallback to custom text
    setSelectValue("#mineral-name", data.mineral_id, data.mineral_name);
    // Load associated minerals
    mineralAssociationItems = [];
    const associatedIds = data.mineral_association_ids ? (typeof data.mineral_association_ids === "string" ? JSON.parse(data.mineral_association_ids) : data.mineral_association_ids) : [];
    if (Array.isArray(associatedIds) && associatedIds.length > 0) {
      // Find mineral names for the IDs
      const mineralOptions = mineralAssociationSelect.options;
      associatedIds.forEach(id => {
        const option = Array.from(mineralOptions).find(opt => opt.value === id);
        if (option) {
          mineralAssociationItems.push({ id, name: option.text });
        }
      });
      renderMineralAssociationList();
    }
    document.querySelector("#country").value = data.country ?? "";
    setSelectValue("#region", data.region_id, data.region_name);
    setSelectValue("#department", data.department_code, data.department_name);
    setSelectValue("#locality", data.locality_id, data.locality_name);
    setSelectValue("#provenance", data.mine_id, data.provenance);
    setSiteType(data.site_type);
    document.querySelector("#dimensions").value = data.dimensions || "";
    document.querySelector("#weight").value = data.weight_text ?? data.weight_grams ?? "";
    document.querySelector("#keywords").value = data.keywords || "";
    document.querySelector("#specimen-date").value = data.discovery_date_text ?? formatSpecimenDate(data.discovered_on, data.discovery_year, data.discovery_month);
    document.querySelector("#description").value = data.description || "";
    document.querySelector("#publication-status").value = data.publication_status;
    media = [];
    document.querySelector("#editor-title").textContent = "Modifier le spécimen";
    document.querySelector("#delete-specimen").hidden = false;
    editor.hidden = false;
    setCollectionView("add");
    editor.scrollIntoView({ behavior: "smooth", block: "start" });
    message("Fiche chargée. Chargement des anciennes relations et des photos…");

    const secondaryErrors = [];
    const relationRequests = [
      ["mineral", "minerals", "id", data.mineral_id, "mineral_name"],
      ["region", "regions", "id", data.region_id, "region_name"],
      ["department", "departments", "code", data.department_code, "department_name"],
      ["locality", "localities", "id", data.locality_id, "locality_name"]
    ];
    const relationResults = await Promise.all(relationRequests.map(async ([key, table, column, value, rawField]) => {
      if (!value || data[rawField] != null) return [key, null, null];
      try {
        const result = await client.from(table).select("*").eq(column, value).maybeSingle();
        return [key, result.data, result.error];
      } catch (relationError) {
        return [key, null, relationError];
      }
    }));
    if (loadVersion !== editorLoadVersion) return;
    const relationLabels = {};
    for (const [key, relation, relationError] of relationResults) {
      if (relationError) secondaryErrors.push(`Référence ${key} non chargée : ${describeError(relationError)}`);
      else if (relation?.name) relationLabels[key] = relation.name;
      if (key === "department" && relation?.region_id && !data.region_id) {
        try {
          const { data: parentRegion, error: parentError } = await client.from("regions").select("name").eq("id", relation.region_id).maybeSingle();
          if (parentError) throw parentError;
          relationLabels.region = parentRegion?.name || "";
        } catch (regionError) {
          secondaryErrors.push(`Région non chargée : ${describeError(regionError)}`);
        }
      }
    }
    editingSpecimen = { ...data, relationLabels };
    if (data.mineral_name == null) mineralInput.value = relationLabels.mineral || "";
    if (data.region_name == null) document.querySelector("#region").value = relationLabels.region || "";
    if (data.department_name == null) document.querySelector("#department").value = relationLabels.department || data.department_code || "";
    if (data.locality_name == null) document.querySelector("#locality").value = relationLabels.locality || "";
    if (loadVersion !== editorLoadVersion) return;

    try {
      const { data: specimenMedia, error: mediaError } = await client.from("specimen_media")
        .select("*").eq("specimen_id", data.id).order("position", { ascending: true });
      if (mediaError) throw mediaError;
      if (loadVersion !== editorLoadVersion) return;
      media = specimenMedia || [];
      await renderMedia();
    } catch (mediaError) {
      secondaryErrors.push(`Photos non chargées : ${describeError(mediaError)}`);
    }
    if (loadVersion !== editorLoadVersion) return;
    if (secondaryErrors.length) message(`Fiche modifiable. ${secondaryErrors.join(" ")}`, true);
    else message("Fiche chargée et prête à être modifiée.");
  } catch (error) {
    if (loadVersion !== editorLoadVersion) return;
    console.error("Chargement de la fiche spécimen :", error);
    message(`Impossible de charger la fiche : ${describeError(error)}`, true);
    status.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

async function getLocalityName(id) {
  const { data, error } = await client.from("localities").select("name").eq("id", id).maybeSingle();
  if (error) throw error;
  return data?.name || "";
}

async function renderMedia() {
  const renderVersion = ++mediaRenderVersion;
  existingPhotoPreview.replaceChildren();
  const currentMedia = media.filter(item => item.specimen_id === document.querySelector("#specimen-id").value)
    .sort((a, b) => a.position - b.position);
  existingPhotoGroup.hidden = currentMedia.length === 0;
  for (const item of currentMedia) {
    const card = document.createElement("div");
    card.className = "admin-photo-item";
    const image = document.createElement("img");
    image.alt = item.alt_text || "Photo du spécimen";
    card.append(image);
    const actions = document.createElement("div");
    actions.className = "admin-photo-actions";
    const replaceButton = document.createElement("button");
    replaceButton.type = "button";
    replaceButton.className = "admin-secondary";
    replaceButton.textContent = "Remplacer";
    replaceButton.addEventListener("click", () => chooseReplacementPhoto(item));
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "admin-danger";
    deleteButton.textContent = "Supprimer";
    deleteButton.addEventListener("click", () => void deleteSpecimenPhoto(item));
    actions.append(replaceButton, deleteButton);
    card.append(actions);
    existingPhotoPreview.append(card);
    if (item.bucket_id === "site-media-public") {
      image.src = client.storage.from(item.bucket_id).getPublicUrl(item.storage_path).data.publicUrl;
    } else {
      const { data, error } = await client.storage.from(item.bucket_id).createSignedUrl(item.storage_path, 300);
      if (error) throw error;
      if (renderVersion !== mediaRenderVersion) return;
      if (data) image.src = data.signedUrl;
    }
  }
}

function chooseReplacementPhoto(item) {
  const picker = document.createElement("input");
  picker.type = "file";
  picker.accept = "image/jpeg,image/png,image/webp";
  picker.addEventListener("change", () => {
    const file = picker.files?.[0];
    if (file) void replaceSpecimenPhoto(item, file);
  }, { once: true });
  picker.click();
}

async function hasOtherMediaReference(item) {
  let specimenMediaQuery = client.from("specimen_media").select("id").eq("bucket_id", item.bucket_id)
    .eq("storage_path", item.storage_path).limit(1);
  if (item.id) specimenMediaQuery = specimenMediaQuery.neq("id", item.id);
  const checks = await Promise.all([
    specimenMediaQuery,
    client.from("shop_item_media").select("id").eq("bucket_id", item.bucket_id).eq("storage_path", item.storage_path).limit(1),
    client.from("article_media").select("id").eq("bucket_id", item.bucket_id).eq("storage_path", item.storage_path).limit(1),
    client.from("archive_documents").select("id").eq("bucket_id", item.bucket_id).eq("storage_path", item.storage_path).limit(1)
  ]);
  const failed = checks.find(result => result.error);
  if (failed) throw failed.error;
  return checks.some(result => (result.data || []).length > 0);
}

async function deleteMediaEntry(item) {
  const { data, error } = await client.from("specimen_media").delete()
    .eq("id", item.id).eq("specimen_id", item.specimen_id).select("id").maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("La photo n'est plus associée à ce spécimen.");
}

async function removeUnusedStorageFile(item) {
  if (await hasOtherMediaReference(item)) return false;
  const { error } = await client.storage.from(item.bucket_id).remove([item.storage_path]);
  if (error) throw error;
  return true;
}

async function refreshMediaPreview() {
  try {
    await renderMedia();
    return "";
  } catch (error) {
    console.error("Actualisation des aperçus photo :", error);
    return ` L'aperçu n'a pas pu être actualisé : ${describeError(error)}`;
  }
}

async function deleteSpecimenPhoto(item) {
  if (!window.confirm("Supprimer définitivement cette photo du spécimen ?")) return;
  message("Suppression de la photo…");
  try {
    await deleteMediaEntry(item);
    media = media.filter(existing => existing.id !== item.id);
    let notice = await refreshMediaPreview();
    let shared;
    try {
      shared = await hasOtherMediaReference(item);
    } catch (referenceError) {
      console.error("La référence photo a été supprimée, mais les références Storage n'ont pas pu être vérifiées :", referenceError);
      message(`Photo supprimée de la fiche. Le fichier Storage est conservé car ses autres références n’ont pas pu être vérifiées : ${describeError(referenceError)}${notice}`, true);
      return;
    }
    if (!shared) {
      try {
        const removed = await removeUnusedStorageFile(item);
        if (!removed) notice += " Le fichier reste présent car une autre entrée média l'utilise.";
      } catch (storageError) {
        console.error("La référence photo est supprimée, mais le fichier Storage reste présent :", storageError);
        notice += ` L'entrée photo est supprimée, mais le fichier Storage n'a pas pu être supprimé : ${describeError(storageError)}`;
      }
    }
    message(`Photo supprimée.${shared ? " Le fichier reste présent car une autre entrée média l'utilise." : ""}${notice}`, Boolean(notice));
  } catch (error) {
    console.error("Suppression de la photo du spécimen :", error);
    message(`Impossible de supprimer la photo : ${describeError(error)}`, true);
  }
}

async function replaceSpecimenPhoto(item, file) {
  message("Remplacement de la photo…");
  const specimenId = document.querySelector("#specimen-id").value;
  if (!specimenId || specimenId !== item.specimen_id || !editingSpecimen || editingSpecimen.id !== item.specimen_id) {
    message("Impossible de remplacer une photo qui n'appartient pas à la fiche ouverte.", true);
    return;
  }
  const safeName = file.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9.-]+/g, "-");
  let storagePath = "";
  let uploaded = false;
  let inserted = false;
  try {
    storagePath = `collection/${editingSpecimen.slug}/${crypto.randomUUID()}-${safeName}`;
    const sharedBefore = await hasOtherMediaReference(item);
    const { error: uploadError } = await client.storage.from(item.bucket_id).upload(storagePath, file, {
      upsert: false, contentType: file.type
    });
    if (uploadError) throw uploadError;
    uploaded = true;
    const { data: newMedia, error: insertError } = await client.from("specimen_media").insert({
      specimen_id: item.specimen_id, bucket_id: item.bucket_id, storage_path: storagePath,
      role: item.role, alt_text: item.alt_text || `${mineralInput.value.trim() || "Spécimen"} — ${file.name}`,
      position: item.position
    }).select("*").single();
    if (insertError) throw insertError;
    inserted = true;
    await deleteMediaEntry(item);
    media = media.map(existing => existing.id === item.id ? newMedia : existing);
    let notice = await refreshMediaPreview();
    if (!sharedBefore) {
      try {
        const removed = await removeUnusedStorageFile(item);
        if (!removed) notice += " L'ancien fichier reste présent car une autre entrée média l'utilise.";
      } catch (storageError) {
        console.error("Nouvelle photo enregistrée, mais l'ancien fichier Storage reste présent :", storageError);
        notice += ` L'ancienne entrée a été remplacée, mais son fichier Storage n'a pas pu être supprimé : ${describeError(storageError)}`;
      }
    }
    message(`Photo remplacée.${sharedBefore ? " L'ancien fichier est conservé car une autre entrée média l'utilise." : ""}${notice}`, Boolean(notice));
  } catch (error) {
    console.error("Remplacement de la photo du spécimen :", error);
    if (uploaded) {
      const cleanupErrors = [];
      let referenceRemoved = !inserted;
      if (inserted) {
        try {
          const { data: deleted, error: deleteError } = await client.from("specimen_media").delete()
            .eq("specimen_id", specimenId).eq("storage_path", storagePath).select("id").maybeSingle();
          referenceRemoved = !deleteError && Boolean(deleted);
          if (!referenceRemoved) cleanupErrors.push(`référence photo : ${describeError(deleteError) || "l'entrée n'a pas pu être supprimée"}`);
        } catch (cleanupError) {
          cleanupErrors.push(`référence photo : ${describeError(cleanupError)}`);
        }
      }
      if (referenceRemoved) {
        try {
          const { error: storageError } = await client.storage.from(item.bucket_id).remove([storagePath]);
          if (storageError) cleanupErrors.push(`fichier temporaire : ${describeError(storageError)}`);
        } catch (cleanupError) {
          cleanupErrors.push(`fichier temporaire : ${describeError(cleanupError)}`);
        }
      }
      if (cleanupErrors.length) error = new Error(`${describeError(error)} Nettoyage incomplet (${cleanupErrors.join("; ")}).`);
    }
    message(`Impossible de remplacer la photo : ${describeError(error)}`, true);
  }
}

function clearSelectedPhotoPreviews(clearInput = false) {
  selectedPhotoUrls.forEach(url => URL.revokeObjectURL(url));
  selectedPhotoUrls = [];
  selectedPhotoPreview.replaceChildren();
  selectedPhotoGroup.hidden = true;
  if (clearInput) photoInput.value = "";
}

function clearPhotoState() {
  mediaRenderVersion += 1;
  clearSelectedPhotoPreviews(true);
  existingPhotoPreview.replaceChildren();
  existingPhotoGroup.hidden = true;
  media = [];
}

function renderSelectedPhotoPreviews() {
  clearSelectedPhotoPreviews();
  const files = [...photoInput.files];
  selectedPhotoGroup.hidden = files.length === 0;
  files.forEach(file => {
    const url = URL.createObjectURL(file);
    selectedPhotoUrls.push(url);
    const image = document.createElement("img");
    image.src = url;
    image.alt = `Aperçu temporaire — ${file.name}`;
    selectedPhotoPreview.append(image);
  });
}

async function saveSpecimen(event) {
  event.preventDefault();
  let id = "";
  let slug = "";
  let saved;
  let unresolvedDepartment = false;
  const created = [];
  try {
    message("Enregistrement…");
    id = document.querySelector("#specimen-id").value;
    slug = document.querySelector("#specimen-slug").value.trim();
    const mineralValue = getSelectValue("#mineral-name");
    const regionValue = getSelectValue("#region");
    const departmentValue = getSelectValue("#department");
    const localityValue = getSelectValue("#locality");
    const provenanceValue = getSelectValue("#provenance");

    // Récupérer les IDs des minéraux associés depuis la liste de tags
    const associatedMineralIds = mineralAssociationItems.map(item => item.id).filter(Boolean);

    const values = {
      mineral: mineralValue.text,
      mineralId: mineralValue.id,
      mineralAssociationIds: associatedMineralIds,
      country: document.querySelector("#country").value,
      region: regionValue.text,
      regionId: regionValue.id,
      department: departmentValue.text,
      departmentCode: departmentValue.id,
      locality: localityValue.text,
      localityId: localityValue.id,
      provenance: provenanceValue.text,
      mineId: provenanceValue.id,
      siteType: getSiteType(),
      dimensions: document.querySelector("#dimensions").value,
      weight: document.querySelector("#weight").value,
      description: document.querySelector("#description").value,
      keywords: document.querySelector("#keywords").value,
      discoveryDate: document.querySelector("#specimen-date").value
    };
    const old = editingSpecimen || {};
    const relationLabels = old.relationLabels || {};
    const numericWeight = /^\d+(?:[.,]\d{1,3})?$/.test(values.weight.trim())
      ? Number(values.weight.trim().replace(",", ".")) : null;
    const unchangedReference = (key, value, rawValue, legacyLabel, referenceId) => {
      if (!isUpdate || !referenceId) return null;
      if (!dirtyReferenceFields.has(key)) return referenceId;
      return value === (rawValue ?? legacyLabel ?? "") ? referenceId : null;
    };
    const parsedDate = parseSpecimenDate(values.discoveryDate);
    const isUpdate = Boolean(id);
    let newSpecimenId = null;
    if (!isUpdate) {
      newSpecimenId = crypto.randomUUID();
      slug = await generateSpecimenSlug(values.mineral, values.provenance, values.locality, newSpecimenId);
      document.querySelector("#specimen-slug").value = slug;
    }
    const record = {
      slug,
      mineral_name: values.mineral || null,
      mineral_association_ids: values.mineralAssociationIds.length > 0 ? JSON.stringify(values.mineralAssociationIds) : null,
      mineral_id: values.mineralId || unchangedReference("mineral-name", values.mineral, old.mineral_name, relationLabels.mineral, old.mineral_id),
      country: values.country || null,
      region_name: values.region || null,
      region_id: values.regionId || unchangedReference("region", values.region, old.region_name, relationLabels.region, old.region_id),
      department_name: values.department || null,
      department_code: values.departmentCode || unchangedReference("department", values.department, old.department_name, relationLabels.department, old.department_code),
      locality_name: values.locality || null,
      locality_id: values.localityId || unchangedReference("locality", values.locality, old.locality_name, relationLabels.locality, old.locality_id),
      provenance: values.provenance,
      mine_id: values.mineId || null,
      site_type: values.siteType || null,
      dimensions: values.dimensions,
      weight_text: values.weight || null,
      weight_grams: Number.isFinite(numericWeight) && numericWeight <= 9999999.999 ? numericWeight : null,
      discovery_date_text: values.discoveryDate || null,
      discovered_on: parsedDate.discoveredOn,
      discovery_year: parsedDate.discoveryYear,
      discovery_month: parsedDate.discoveryMonth,
      keywords: values.keywords || null,
      description: values.description,
      publication_status: document.querySelector("#publication-status").value
    };
    const resolved = await resolveReferences(client, values);
    record.mineral_id = record.mineral_id ?? resolved.mineralId;
    record.region_id = record.region_id ?? resolved.regionId;
    record.locality_id = record.locality_id ?? resolved.localityId;
    if (resolved.department) { record.department_code = resolved.department.code; record.department_name = resolved.department.name; }
    else if (values.department.trim() && !record.department_code) unresolvedDepartment = true;
    // Créer les nouvelles références si nécessaire (valeurs "Autre" non enregistrées)
    const track = result => { if (result?.created) created.push(result.name); return result; };
    if (!record.mineral_id && values.mineral.trim()) record.mineral_id = track(await ensureNamed(client, "minerals", values.mineral))?.id ?? null;
    if (!record.region_id && values.region.trim()) record.region_id = track(await ensureNamed(client, "regions", values.region))?.id ?? null;
    if (!record.locality_id && values.locality.trim()) record.locality_id = track(await ensureNamed(client, "localities", values.locality, { department_code: record.department_code || null }))?.id ?? null;
    const gisement = values.provenance.trim();
    if (!gisement) record.mine_id = null;
    else if (!record.mine_id) record.mine_id = track(await ensureNamed(client, "mines", gisement, { locality_id: record.locality_id || null }))?.id ?? null;
    if (isUpdate) {
      const result = await client.from("specimens").update(record).eq("id", id).select("id").single();
      if (result.error) throw result.error;
      saved = result.data;
    } else {
      const result = await client.from("specimens").insert({ id: newSpecimenId, ...record }).select("id").single();
      if (result.error) throw result.error;
      saved = result.data;
    }
  } catch (error) {
    console.error("Échec de l’enregistrement du spécimen :", error);
    let details = describeError(error) || "Enregistrement impossible.";
    try {
      clearSelectedPhotoPreviews(true);
    } catch (cleanupError) {
      details += ` Le nettoyage des prévisualisations a échoué (${cleanupError.message}).`;
    }
    message(`Enregistrement impossible : ${details}`, true);
    return;
  }

  message("Spécimen enregistré en base.");
  const secondaryErrors = [];
  if (unresolvedDepartment) secondaryErrors.push("Département non reconnu dans le référentiel : la fiche est enregistrée, mais sans lien vers la page département (saisissez le nom exact ou le code, ex. « Puy-de-Dôme » ou « 63 »).");
  if (id && editingSpecimen?.publication_status !== document.querySelector("#publication-status").value) {
    try {
      const targetBucket = document.querySelector("#publication-status").value === "published" ? "site-media-public" : "admin-staging";
      await syncMediaVisibility(saved.id, slug, targetBucket);
    } catch (error) {
      console.error("Échec du changement de visibilité des photos :", error);
      secondaryErrors.push(`La fiche est enregistrée, mais certaines photos n’ont pas pu changer de visibilité : ${describeError(error)}`);
    }
  }
  try {
    await uploadPhotos(saved.id, slug);
  } catch (error) {
    console.error("Échec du traitement des opérations secondaires du spécimen :", error);
    secondaryErrors.push(`La fiche est enregistrée, mais les photos n’ont pas pu être traitées : ${describeError(error)}`);
    try {
      clearSelectedPhotoPreviews(true);
    } catch (cleanupError) {
      secondaryErrors.push(`Le nettoyage des prévisualisations a échoué : ${cleanupError.message}.`);
    }
  }

  let refreshed = false;
  try {
    refreshed = await loadDashboard();
  } catch (error) {
    console.error("Échec du rafraîchissement du dashboard après sauvegarde :", error);
    secondaryErrors.push(`La fiche est enregistrée, mais le rafraîchissement de la liste a échoué : ${describeError(error)}`);
  }
  if (!refreshed && !secondaryErrors.some(error => error.includes("rafraîchissement"))) {
    secondaryErrors.push("La fiche est enregistrée, mais la liste n’a pas pu être actualisée. Rechargez la page.");
  }
  resetEditor(false);
  if (secondaryErrors.length) message(secondaryErrors.join(" "), true);
  else message(`Spécimen enregistré en base et liste actualisée.${created.length ? ` Nouvelles fiches créées dans les référentiels : ${created.join(", ")}.` : ""}`);
  status.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function parseSpecimenDate(value) {
  const date = value.trim();
  if (!date) return { discoveredOn: null, discoveryYear: null, discoveryMonth: null };
  if (/^\d{4}$/.test(date)) {
    const year = Number(date);
    return { discoveredOn: null, discoveryYear: year >= 1000 && year <= 2100 ? year : null, discoveryMonth: null };
  }
  const monthMatch = /^(\d{2})\/(\d{4})$/.exec(date);
  if (monthMatch) {
    const [, month, year] = monthMatch.map(Number);
    const valid = month >= 1 && month <= 12 && year >= 1000 && year <= 2100;
    return { discoveredOn: null, discoveryYear: valid ? year : null, discoveryMonth: valid ? month : null };
  }
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(date);
  if (!match) return { discoveredOn: null, discoveryYear: null, discoveryMonth: null };
  const [, day, month, year] = match.map(Number);
  const parsed = new Date(0);
  parsed.setUTCHours(0, 0, 0, 0);
  parsed.setUTCFullYear(year, month - 1, day);
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day)
    return { discoveredOn: null, discoveryYear: null, discoveryMonth: null };
  const isoDate = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return { discoveredOn: isoDate, discoveryYear: null, discoveryMonth: null };
}

function formatSpecimenDate(discoveredOn, discoveryYear, discoveryMonth) {
  if (discoveredOn) {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(discoveredOn);
    if (match) {
      const [, year, month, day] = match;
      return `${day}/${month}/${year}`;
    }
    return discoveredOn;
  }
  if (discoveryYear && discoveryMonth) return `${String(discoveryMonth).padStart(2, "0")}/${discoveryYear}`;
  if (discoveryYear) return String(discoveryYear);
  return "";
}

async function generateSpecimenSlug(mineralName, provenance, localityName, fallbackId = null) {
  const base = [mineralName, provenance, localityName].filter(value => value.trim()).join("-");
  const baseSlug = base.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `specimen-${fallbackId || crypto.randomUUID()}`;
  let slug = baseSlug;
  let suffix = 2;
  while (true) {
    const { data, error } = await client.from("specimens").select("id").eq("slug", slug).maybeSingle();
    if (error) throw error;
    if (!data) return slug;
    slug = `${baseSlug}-${suffix++}`;
  }
}

async function uploadPhotos(specimenId, slug) {
  const files = [...photoInput.files];
  if (!files.length) return [];
  const bucket = document.querySelector("#publication-status").value === "published" ? "site-media-public" : "admin-staging";
  const uploaded = [];
  const nextPosition = media.reduce((highest, item) => Math.max(highest, Number(item.position) || 0), -1) + 1;
  try {
    for (const [index, file] of files.entries()) {
      const safeName = file.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9.-]+/g, "-");
      const storagePath = `collection/${slug}/${crypto.randomUUID()}-${index}-${safeName}`;
      const item = { bucketId: bucket, storagePath, mediaId: null };
      uploaded.push(item);
      const { error: uploadError } = await client.storage.from(bucket).upload(storagePath, file, { upsert: false, contentType: file.type });
      if (uploadError) throw uploadError;
      const { data, error } = await client.from("specimen_media").insert({
        specimen_id: specimenId,
        bucket_id: bucket,
        storage_path: storagePath,
        role: index ? "detail" : "general",
        alt_text: `${mineralInput.value.trim() || "Spécimen"} — ${file.name}`,
        position: nextPosition + index
      }).select("id").single();
      if (error) throw error;
      item.mediaId = data.id;
    }
    return uploaded;
  } catch (error) {
    let cleanupErrors = [];
    try {
      cleanupErrors = await cleanupUploadedPhotos(specimenId, uploaded);
    } catch (cleanupError) {
      cleanupErrors.push(`nettoyage des nouvelles photos : ${cleanupError.message}`);
    }
    if (cleanupErrors.length) {
      throw new Error(`${error.message || "Échec du téléversement."} Nettoyage incomplet : ${cleanupErrors.join(" ")}`);
    }
    throw error;
  }
}

async function cleanupUploadedPhotos(specimenId, uploaded) {
  const errors = [];
  for (const item of uploaded) {
    let referencesRemoved = false;
    try {
      const { error } = await client.from("specimen_media").delete()
        .eq("specimen_id", specimenId).eq("bucket_id", item.bucketId).eq("storage_path", item.storagePath);
      if (error) throw error;
      referencesRemoved = true;
    } catch (error) {
      errors.push(`suppression de la référence ${item.storagePath} : ${describeError(error)}`);
    }
    if (!referencesRemoved) continue;
    try {
      if (await hasOtherMediaReference({ bucket_id: item.bucketId, storage_path: item.storagePath })) continue;
      const { error } = await client.storage.from(item.bucketId).remove([item.storagePath]);
      if (error) throw error;
    } catch (error) {
      errors.push(`suppression du fichier ${item.storagePath} : ${describeError(error)}`);
    }
  }
  return errors;
}

async function syncMediaVisibility(specimenId, slug, targetBucket) {
  const { data, error } = await client.from("specimen_media").select("*").eq("specimen_id", specimenId);
  if (error) throw error;
  for (const item of data || []) {
    if (item.bucket_id === targetBucket) continue;
    const source = client.storage.from(item.bucket_id);
    const destination = client.storage.from(targetBucket);
    const { data: download, error: downloadError } = await source.download(item.storage_path);
    if (downloadError) throw downloadError;
    const targetPath = `collection/${slug}/${item.storage_path.split("/").pop()}`;
    const { error: uploadError } = await destination.upload(targetPath, download, { upsert: false, contentType: download.type || "image/jpeg" });
    if (uploadError) throw uploadError;
    const { error: updateError } = await client.from("specimen_media").update({ bucket_id: targetBucket, storage_path: targetPath }).eq("id", item.id);
    if (updateError) {
      await destination.remove([targetPath]);
      throw updateError;
    }
    if (!await hasOtherMediaReference(item)) {
      const { error: removeError } = await source.remove([item.storage_path]);
      if (removeError) throw removeError;
    }
  }
}

async function deleteSpecimen() {
  const id = document.querySelector("#specimen-id").value;
  if (!id) return;
  if (!window.confirm("Supprimer cette fiche et ses associations ? Les fichiers photo liés seront également supprimés.")) return;
  message("Suppression du spécimen…");
  let specimenMedia;
  try {
    const { data, error: mediaError } = await client.from("specimen_media").select("*").eq("specimen_id", id);
    if (mediaError) throw mediaError;
    specimenMedia = data || [];
  } catch (error) {
    console.error("Chargement des médias avant suppression du spécimen :", error);
    message(`Suppression annulée : les photos n’ont pas pu être vérifiées. ${describeError(error)}`, true);
    return;
  }
  let shareStatus;
  try {
    shareStatus = await Promise.all(specimenMedia.map(item => hasOtherMediaReference(item)));
  } catch (error) {
    console.error("Vérification des fichiers liés au spécimen :", error);
    message(`Suppression annulée : impossible de vérifier les références photo. ${describeError(error)}`, true);
    return;
  }
  const { data: deleted, error } = await client.from("specimens").delete().eq("id", id).select("id").maybeSingle();
  if (error) {
    console.error("Suppression du spécimen :", error);
    return message(describeError(error), true);
  }
  if (!deleted) return message("Le spécimen n’a pas été supprimé : la fiche est introuvable ou les droits sont insuffisants.", true);
  const cleanupErrors = [];
  for (const [index, item] of specimenMedia.entries()) {
    if (shareStatus[index]) continue;
    try {
      await removeUnusedStorageFile(item);
    } catch (storageError) {
      cleanupErrors.push(`${item.storage_path} : ${describeError(storageError)}`);
    }
  }
  media = [];
  resetEditor(false);
  let refreshed = false;
  try { refreshed = await loadDashboard(); }
  catch (refreshError) { cleanupErrors.push(`actualisation de la liste : ${describeError(refreshError)}`); }
  message(cleanupErrors.length
    ? `Spécimen supprimé, mais le nettoyage est incomplet : ${cleanupErrors.join(" ; ")}`
    : refreshed ? "Spécimen supprimé et liste actualisée." : "Spécimen supprimé ; la liste n’a pas pu être actualisée.", !refreshed || cleanupErrors.length > 0);
}

window.addEventListener("message", event => {
  if (event.origin !== location.origin || !event.data || event.data.ed !== "fs") return;
  const frame = document.querySelector("#appearance-frame");
  const on = frame.classList.toggle("is-fullscreen");
  document.body.style.overflow = on ? "hidden" : "";
});
