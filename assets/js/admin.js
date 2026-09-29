import { getSupabase } from "./supabase-client.js";

const status = document.querySelector("#admin-status");
const loginPanel = document.querySelector("#login-panel");
const cmsPanel = document.querySelector("#cms-panel");
const editor = document.querySelector("#editor-panel");
const form = document.querySelector("#specimen-form");
const list = document.querySelector("#specimen-list");
const mineralInput = document.querySelector("#mineral-name");
const mineralOptions = document.querySelector("#mineral-options");
const regionOptions = document.querySelector("#region-options");
const departmentOptions = document.querySelector("#department-options");
const photoInput = document.querySelector("#photos");
const existingPhotoGroup = document.querySelector("#existing-photo-group");
const existingPhotoPreview = document.querySelector("#existing-photos");
const selectedPhotoGroup = document.querySelector("#selected-photo-group");
const selectedPhotoPreview = document.querySelector("#selected-photos");
const client = getSupabase();
let minerals = [];
let regions = [];
let departments = [];
let media = [];
let selectedPhotoUrls = [];
let mediaRenderVersion = 0;
let editorLoadVersion = 0;
let editingSpecimen = null;

function message(text, isError = false) {
  status.textContent = text;
  status.classList.toggle("admin-error", isError);
  status.hidden = false;
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
  document.querySelector("#new-specimen").addEventListener("click", () => resetEditor(true));
  document.querySelector("#cancel-edit").addEventListener("click", () => resetEditor(false));
  document.querySelector("#delete-specimen").addEventListener("click", deleteSpecimen);
  photoInput.addEventListener("change", renderSelectedPhotoPreviews);
  form.addEventListener("submit", saveSpecimen);
  void client.auth.getSession().then(({ data }) => showSession(data.session));
}

async function showSession(session) {
  loginPanel.hidden = true;
  cmsPanel.hidden = true;
  if (!session) {
    loginPanel.hidden = false;
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
  await loadDashboard();
}

async function loadDashboard() {
  const [mineralResult, specimenResult, regionResult, departmentResult] = await Promise.all([
    client.from("minerals").select("id,name").order("name"),
    client.from("specimens").select("id,slug,publication_status,mineral:minerals!specimens_mineral_id_fkey(name)").order("updated_at", { ascending: false }),
    client.from("regions").select("id,name").order("name"),
    client.from("departments").select("code,name,region_id").order("name")
  ]);
  const failedResult = [mineralResult, specimenResult, regionResult, departmentResult].find(result => result.error);
  if (failedResult) {
    message(failedResult.error.message, true);
    return false;
  }
  minerals = mineralResult.data || [];
  regions = regionResult.data || [];
  departments = departmentResult.data || [];
  mineralOptions.replaceChildren(...minerals.map(mineral => {
    const option = document.createElement("option");
    option.value = mineral.name;
    return option;
  }));
  regionOptions.replaceChildren(...regions.map(region => {
    const option = document.createElement("option");
    option.value = region.name;
    return option;
  }));
  departmentOptions.replaceChildren(...departments.map(department => {
    const option = document.createElement("option");
    option.value = department.name;
    option.label = `${department.name} (${department.code})`;
    return option;
  }));
  list.replaceChildren();
  (specimenResult.data || []).forEach(specimen => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = `${specimen.mineral?.name || "Minéral"} — ${specimen.slug} (${specimen.publication_status === "published" ? "publié" : "brouillon"})`;
    button.addEventListener("click", () => void editSpecimen(specimen.id));
    list.append(button);
  });
  return true;
}

function resetEditor(open = false) {
  editorLoadVersion += 1;
  clearPhotoState();
  form.reset();
  document.querySelector("#specimen-id").value = "";
  document.querySelector("#specimen-slug").value = "";
  document.querySelector("#editor-title").textContent = "Nouveau spécimen";
  document.querySelector("#delete-specimen").hidden = true;
  editingSpecimen = null;
  editor.hidden = !open;
  if (open) editor.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function editSpecimen(id) {
  resetEditor(false);
  const loadVersion = editorLoadVersion;
  const { data, error } = await client.from("specimens").select("*,specimen_media(*)").eq("id", id).single();
  if (loadVersion !== editorLoadVersion) return;
  if (error) return message(error.message, true);
  editingSpecimen = data;
  document.querySelector("#specimen-id").value = data.id;
  document.querySelector("#specimen-slug").value = data.slug;
  mineralInput.value = minerals.find(mineral => mineral.id === data.mineral_id)?.name || "";
  document.querySelector("#country").value = data.country || "";
  const department = departments.find(item => item.code === data.department_code);
  document.querySelector("#region").value = regions.find(item => item.id === department?.region_id)?.name || "";
  document.querySelector("#department").value = department?.name || data.department_code || "";
  document.querySelector("#provenance").value = data.provenance || "";
  const localityName = data.locality_id ? await getLocalityName(data.locality_id) : "";
  if (loadVersion !== editorLoadVersion) return;
  document.querySelector("#locality").value = localityName;
  document.querySelector("#site-type").value = data.site_type || "";
  document.querySelector("#dimensions").value = data.dimensions || "";
  document.querySelector("#weight").value = data.weight_grams ?? "";
  document.querySelector("#keywords").value = data.keywords || "";
  document.querySelector("#specimen-date").value = formatSpecimenDate(data.discovered_on, data.discovery_year, data.discovery_month);
  document.querySelector("#description").value = data.description || "";
  document.querySelector("#publication-status").value = data.publication_status;
  media = [...(data.specimen_media || [])];
  renderMedia();
  document.querySelector("#editor-title").textContent = "Modifier le spécimen";
  document.querySelector("#delete-specimen").hidden = false;
  editor.hidden = false;
  editor.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function getLocalityName(id) {
  const { data } = await client.from("localities").select("name").eq("id", id).maybeSingle();
  return data?.name || "";
}

async function renderMedia() {
  const renderVersion = ++mediaRenderVersion;
  existingPhotoPreview.replaceChildren();
  const currentMedia = media.filter(item => item.specimen_id === document.querySelector("#specimen-id").value)
    .sort((a, b) => a.position - b.position);
  existingPhotoGroup.hidden = currentMedia.length === 0;
  for (const item of currentMedia) {
    const image = document.createElement("img");
    image.alt = item.alt_text || "Photo du spécimen";
    existingPhotoPreview.append(image);
    if (item.bucket_id === "site-media-public") {
      image.src = client.storage.from(item.bucket_id).getPublicUrl(item.storage_path).data.publicUrl;
    } else {
      const { data } = await client.storage.from(item.bucket_id).createSignedUrl(item.storage_path, 300);
      if (renderVersion !== mediaRenderVersion) return;
      if (data) image.src = data.signedUrl;
    }
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
  let isNewSpecimen = true;
  let slug = "";
  let savedSpecimenId = null;
  let specimenSaved = false;
  let previousRecord = null;
  try {
    message("Enregistrement…");
    if (!form.checkValidity()) {
      const invalidField = form.querySelector(":invalid");
      const fieldLabel = invalidField?.labels?.[0]?.textContent.trim() || invalidField?.id || "Un champ";
      const reason = invalidField?.validationMessage || "vérifiez sa valeur.";
      invalidField?.focus();
      throw new Error(`${fieldLabel} : ${reason}`);
    }
    if (!mineralInput.value.trim()) throw new Error("Saisissez le nom du minéral.");

    id = document.querySelector("#specimen-id").value;
    isNewSpecimen = !id;
    slug = document.querySelector("#specimen-slug").value.trim();
    const localityName = document.querySelector("#locality").value.trim();
    const regionName = document.querySelector("#region").value.trim();
    const departmentName = document.querySelector("#department").value.trim();
    const siteType = document.querySelector("#site-type").value;
    const specimenDate = parseSpecimenDate(document.querySelector("#specimen-date").value);

    const region = regionName ? regions.find(item => normalizeGeographicName(item.name) === normalizeGeographicName(regionName)) : null;
    if (regionName && !region) throw new Error("Choisissez une région existante dans la liste.");
    const department = departmentName ? departments.find(item =>
      normalizeGeographicName(item.name) === normalizeGeographicName(departmentName)
      || normalizeGeographicName(item.code) === normalizeGeographicName(departmentName)
    ) : null;
    if (departmentName && !department) throw new Error("Choisissez un département existant par son nom ou son code.");
    if (region && !department) throw new Error("Choisissez aussi un département pour rattacher le spécimen à cette région.");
    if (region && department.region_id !== region.id) throw new Error("Le département choisi n'est pas rattaché à cette région.");
    const mineralId = await resolveMineralId(mineralInput.value);
    let localityId = null;
    if (localityName) {
      const localitySlug = localityName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const { data, error } = await client.from("localities").upsert({ slug: localitySlug, name: localityName, department_code: department?.code || null, publication_status: document.querySelector("#publication-status").value }, { onConflict: "slug" }).select("id").single();
      if (error) throw error;
      localityId = data.id;
    }
    if (!id) slug = await generateSpecimenSlug(mineralInput.value, document.querySelector("#provenance").value, localityName);
    const record = {
      slug, mineral_id: mineralId, country: document.querySelector("#country").value.trim() || null,
      site_type: siteType || null, keywords: document.querySelector("#keywords").value.trim() || null,
      provenance: document.querySelector("#provenance").value.trim(),
      locality_id: localityId, department_code: department?.code || null,
      dimensions: document.querySelector("#dimensions").value.trim(),
      weight_grams: document.querySelector("#weight").value || null,
      discovered_on: specimenDate.discoveredOn,
      discovery_year: specimenDate.discoveryYear,
      discovery_month: specimenDate.discoveryMonth,
      description: document.querySelector("#description").value.trim(),
      publication_status: document.querySelector("#publication-status").value
    };
    let saved;
    if (id) {
      const fieldsToRestore = Object.keys(record);
      previousRecord = Object.fromEntries(fieldsToRestore.map(field => [field, editingSpecimen?.[field] ?? null]));
      const result = await client.from("specimens").update(record).eq("id", id).select("id").single();
      if (result.error) throw result.error;
      saved = result.data;
      savedSpecimenId = saved.id;
      specimenSaved = true;
    } else {
      const result = await client.from("specimens").insert(record).select("id").single();
      if (result.error) throw result.error;
      saved = result.data;
      savedSpecimenId = saved.id;
      specimenSaved = true;
    }
    if (id && editingSpecimen?.publication_status !== record.publication_status) {
      await syncMediaVisibility(saved.id, slug, record.publication_status === "published" ? "site-media-public" : "admin-staging");
    }
    await uploadPhotos(saved.id, slug);
    const refreshed = await loadDashboard();
    resetEditor(false);
    message(refreshed ? "Spécimen enregistré et liste actualisée." : "Spécimen enregistré, mais la liste n’a pas pu être actualisée. Rechargez la page.", !refreshed);
  } catch (error) {
    const cleanupErrors = [];
    try {
      if (isNewSpecimen && savedSpecimenId && specimenSaved) {
        const { error: deleteError } = await client.from("specimens").delete().eq("id", savedSpecimenId);
        if (deleteError) {
          cleanupErrors.push(`La fiche créée partiellement n’a pas pu être supprimée (${deleteError.message}).`);
          document.querySelector("#specimen-id").value = savedSpecimenId;
          document.querySelector("#specimen-slug").value = slug;
          document.querySelector("#editor-title").textContent = "Modifier le spécimen";
          document.querySelector("#delete-specimen").hidden = false;
        }
      } else if (!isNewSpecimen && specimenSaved && previousRecord) {
        const { error: restoreError } = await client.from("specimens").update(previousRecord).eq("id", id);
        if (restoreError) cleanupErrors.push(`La restauration des champs modifiés a échoué (${restoreError.message}).`);
      }
    } catch (cleanupError) {
      cleanupErrors.push(`Le nettoyage après échec a rencontré une erreur (${cleanupError.message}).`);
    }
    try {
      clearSelectedPhotoPreviews(true);
    } catch (cleanupError) {
      cleanupErrors.push(`Le nettoyage des prévisualisations a échoué (${cleanupError.message}).`);
    }
    const details = [error.message || "Enregistrement impossible.", ...cleanupErrors].join(" ");
    message(details, true);
  }
}

function normalizeGeographicName(value) {
  return value.trim().replace(/\s+/g, " ").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr");
}

function parseSpecimenDate(value) {
  const date = value.trim();
  if (!date) return { discoveredOn: null, discoveryYear: null, discoveryMonth: null };
  if (/^\d{4}$/.test(date)) {
    const year = Number(date);
    if (year < 1000 || year > 2100) throw new Error("Saisissez une année entre 1000 et 2100.");
    return { discoveredOn: null, discoveryYear: year, discoveryMonth: null };
  }
  const monthMatch = /^(\d{2})\/(\d{4})$/.exec(date);
  if (monthMatch) {
    const [, month, year] = monthMatch.map(Number);
    if (month < 1 || month > 12) throw new Error("Le mois doit être compris entre 01 et 12.");
    if (year < 1000 || year > 2100) throw new Error("Saisissez une année entre 1000 et 2100.");
    return { discoveredOn: null, discoveryYear: year, discoveryMonth: month };
  }
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(date);
  if (!match) throw new Error("Saisissez une année (AAAA), un mois et une année (MM/AAAA) ou une date complète (JJ/MM/AAAA).");
  const [, day, month, year] = match.map(Number);
  const parsed = new Date(0);
  parsed.setUTCHours(0, 0, 0, 0);
  parsed.setUTCFullYear(year, month - 1, day);
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) {
    throw new Error("La date saisie n'est pas valide.");
  }
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

async function generateSpecimenSlug(mineralName, provenance, localityName) {
  const base = [mineralName, provenance, localityName].filter(value => value.trim()).join("-");
  const baseSlug = base.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `specimen-${Date.now()}`;
  let slug = baseSlug;
  let suffix = 2;
  while (true) {
    const { data, error } = await client.from("specimens").select("id").eq("slug", slug).maybeSingle();
    if (error) throw error;
    if (!data) return slug;
    slug = `${baseSlug}-${suffix++}`;
  }
}

function normalizeMineralName(name) {
  return name.trim().replace(/\s+/g, " ").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr");
}

async function resolveMineralId(inputName) {
  const name = inputName.trim();
  if (!name) throw new Error("Saisissez le nom du minéral.");

  const { data: currentMinerals, error: fetchError } = await client
    .from("minerals").select("id,name,slug").order("name");
  if (fetchError) throw fetchError;
  minerals = currentMinerals || [];

  const normalizedName = normalizeMineralName(name);
  const existing = minerals.find(mineral => normalizeMineralName(mineral.name) === normalizedName);
  if (existing) return existing.id;

  const baseSlug = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!baseSlug) throw new Error("Le nom du minéral doit contenir des lettres ou des chiffres.");
  let slug = baseSlug;
  let suffix = 2;
  while (minerals.some(mineral => mineral.slug === slug)) slug = `${baseSlug}-${suffix++}`;

  const { data, error } = await client.from("minerals").insert({
    name,
    slug,
    publication_status: document.querySelector("#publication-status").value
  }).select("id,name,slug").single();
  if (error) {
    if (error.code === "23505") {
      const { data: refreshed, error: refreshError } = await client.from("minerals").select("id,name,slug");
      if (!refreshError) {
        minerals = refreshed || [];
        const duplicate = minerals.find(mineral => normalizeMineralName(mineral.name) === normalizedName);
        if (duplicate) return duplicate.id;
      }
    }
    throw error;
  }
  minerals.push(data);
  return data.id;
}

async function saveAssociations(specimenId, input) {
  const names = [...new Set(input.split(",").map(name => name.trim()).filter(Boolean))];
  const { error: deleteError } = await client.from("specimen_associations").delete().eq("specimen_id", specimenId);
  if (deleteError) throw deleteError;
  for (const name of names) {
    let mineral = minerals.find(item => normalizeMineralName(item.name) === normalizeMineralName(name));
    if (!mineral) {
      const slug = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const { data, error } = await client.from("minerals").upsert({ name, slug, publication_status: document.querySelector("#publication-status").value }, { onConflict: "slug" }).select("id,name").single();
      if (error) throw error;
      mineral = data;
      minerals.push(mineral);
    }
    const { error } = await client.from("specimen_associations").insert({ specimen_id: specimenId, mineral_id: mineral.id });
    if (error) throw error;
  }
}

async function uploadPhotos(specimenId, slug) {
  const files = [...photoInput.files];
  if (!files.length) return [];
  const bucket = document.querySelector("#publication-status").value === "published" ? "site-media-public" : "admin-staging";
  const uploaded = [];
  try {
    for (const [index, file] of files.entries()) {
      const safeName = file.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9.-]+/g, "-");
      const storagePath = `collection/${slug}/${Date.now()}-${index}-${safeName}`;
      const item = { bucketId: bucket, storagePath, mediaId: null };
      uploaded.push(item);
      const { error: uploadError } = await client.storage.from(bucket).upload(storagePath, file, { upsert: false, contentType: file.type });
      if (uploadError) throw uploadError;
      const { data, error } = await client.from("specimen_media").insert({
        specimen_id: specimenId,
        bucket_id: bucket,
        storage_path: storagePath,
        role: index ? "detail" : "general",
        alt_text: `${mineralInput.value.trim()} — ${file.name}`,
        position: media.length + index
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
  const storagePaths = uploaded.map(item => item.storagePath);
  if (storagePaths.length) {
    try {
      const { error } = await client.from("specimen_media").delete().eq("specimen_id", specimenId).in("storage_path", storagePaths);
      if (error) errors.push(`suppression des références photo : ${error.message}`);
    } catch (error) {
      errors.push(`suppression des références photo : ${error.message}`);
    }
  }
  const buckets = [...new Set(uploaded.map(item => item.bucketId))];
  for (const bucket of buckets) {
    const paths = uploaded.filter(item => item.bucketId === bucket).map(item => item.storagePath);
    try {
      const { error } = await client.storage.from(bucket).remove(paths);
      if (error) errors.push(`suppression des fichiers dans ${bucket} : ${error.message}`);
    } catch (error) {
      errors.push(`suppression des fichiers dans ${bucket} : ${error.message}`);
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
    const { error: removeError } = await source.remove([item.storage_path]);
    if (removeError) throw removeError;
  }
}

async function deleteSpecimen() {
  const id = document.querySelector("#specimen-id").value;
  if (!id) return;
  if (!window.confirm("Supprimer cette fiche et ses associations ? Les fichiers photo liés seront également supprimés.")) return;
  const { error } = await client.from("specimens").delete().eq("id", id);
  if (error) return message(error.message, true);
  for (const bucket of ["site-media-public", "admin-staging"]) {
    const paths = media.filter(item => item.bucket_id === bucket).map(item => item.storage_path);
    if (paths.length) {
      const { error: storageError } = await client.storage.from(bucket).remove(paths);
      if (storageError) message(`Fiche supprimée, nettoyage Storage incomplet : ${storageError.message}`, true);
    }
  }
  media = [];
  resetEditor(false);
  await loadDashboard();
  message("Fiche supprimée.");
}
