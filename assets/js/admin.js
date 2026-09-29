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
const photoPreview = document.querySelector("#existing-photos");
const client = getSupabase();
let minerals = [];
let regions = [];
let departments = [];
let media = [];

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
    return;
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
}

function resetEditor(open = false) {
  form.reset();
  document.querySelector("#specimen-id").value = "";
  document.querySelector("#editor-title").textContent = "Nouveau spécimen";
  document.querySelector("#delete-specimen").hidden = true;
  photoPreview.replaceChildren();
  media = [];
  editor.hidden = !open;
  if (open) editor.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function editSpecimen(id) {
  const { data, error } = await client.from("specimens").select("*,specimen_media(*)").eq("id", id).single();
  if (error) return message(error.message, true);
  document.querySelector("#specimen-id").value = data.id;
  document.querySelector("#specimen-slug").value = data.slug;
  mineralInput.value = minerals.find(mineral => mineral.id === data.mineral_id)?.name || "";
  document.querySelector("#country").value = data.country || "";
  const department = departments.find(item => item.code === data.department_code);
  document.querySelector("#region").value = regions.find(item => item.id === department?.region_id)?.name || "";
  document.querySelector("#department").value = department?.name || data.department_code || "";
  document.querySelector("#provenance").value = data.provenance || "";
  document.querySelector("#locality").value = data.locality_id ? await getLocalityName(data.locality_id) : "";
  document.querySelector("#site-type").value = data.site_type || "";
  document.querySelector("#dimensions").value = data.dimensions || "";
  document.querySelector("#weight").value = data.weight_grams ?? "";
  document.querySelector("#keywords").value = data.keywords || "";
  document.querySelector("#specimen-date").value = formatSpecimenDate(data.discovered_on, data.discovery_year);
  document.querySelector("#description").value = data.description || "";
  document.querySelector("#publication-status").value = data.publication_status;
  media = data.specimen_media || [];
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
  photoPreview.replaceChildren();
  media.sort((a, b) => a.position - b.position).forEach(item => {
    const image = document.createElement("img");
    image.alt = item.alt_text || "Photo du spécimen";
    photoPreview.append(image);
    if (item.bucket_id === "site-media-public") {
      image.src = client.storage.from(item.bucket_id).getPublicUrl(item.storage_path).data.publicUrl;
    } else {
      void client.storage.from(item.bucket_id).createSignedUrl(item.storage_path, 300).then(({ data }) => {
        if (data) image.src = data.signedUrl;
      });
    }
  });
}

async function saveSpecimen(event) {
  event.preventDefault();
  if (!mineralInput.value.trim()) return message("Saisissez le nom du minéral.", true);
  const id = document.querySelector("#specimen-id").value;
  let slug = document.querySelector("#specimen-slug").value.trim();
  const localityName = document.querySelector("#locality").value.trim();
  const regionName = document.querySelector("#region").value.trim();
  const departmentName = document.querySelector("#department").value.trim();
  const siteType = document.querySelector("#site-type").value;
  let specimenDate;
  try {
    specimenDate = parseSpecimenDate(document.querySelector("#specimen-date").value);
  } catch (error) {
    return message(error.message, true);
  }
  message("Enregistrement…");
  try {
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
      discovered_on: specimenDate.discoveredOn, discovery_year: specimenDate.discoveryYear,
      description: document.querySelector("#description").value.trim(),
      publication_status: document.querySelector("#publication-status").value
    };
    let saved;
    if (id) {
      const result = await client.from("specimens").update(record).eq("id", id).select("id").single();
      if (result.error) throw result.error;
      saved = result.data;
    } else {
      const result = await client.from("specimens").insert(record).select("id").single();
      if (result.error) throw result.error;
      saved = result.data;
    }
    await syncMediaVisibility(saved.id, slug, record.publication_status === "published" ? "site-media-public" : "admin-staging");
    await uploadPhotos(saved.id, slug);
    await loadDashboard();
    resetEditor(false);
    message("Spécimen enregistré.");
  } catch (error) {
    message(error.message || "Enregistrement impossible.", true);
  }
}

function normalizeGeographicName(value) {
  return value.trim().replace(/\s+/g, " ").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr");
}

function parseSpecimenDate(value) {
  const date = value.trim();
  if (!date) return { discoveredOn: null, discoveryYear: null };
  if (/^\d{4}$/.test(date)) {
    const year = Number(date);
    if (year < 1000 || year > 2100) throw new Error("Saisissez une année entre 1000 et 2100.");
    return { discoveredOn: null, discoveryYear: year };
  }
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(date);
  if (!match) throw new Error("Saisissez une date au format JJ/MM/AAAA ou une année seule (AAAA).");
  const [, day, month, year] = match.map(Number);
  const parsed = new Date(0);
  parsed.setUTCHours(0, 0, 0, 0);
  parsed.setUTCFullYear(year, month - 1, day);
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) {
    throw new Error("La date saisie n'est pas valide.");
  }
  const isoDate = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return { discoveredOn: isoDate, discoveryYear: null };
}

function formatSpecimenDate(discoveredOn, discoveryYear) {
  if (discoveryYear) return String(discoveryYear);
  if (!discoveredOn) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(discoveredOn);
  if (!match) return discoveredOn;
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
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
  const files = [...document.querySelector("#photos").files];
  const bucket = document.querySelector("#publication-status").value === "published" ? "site-media-public" : "admin-staging";
  for (const [index, file] of files.entries()) {
    const safeName = file.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9.-]+/g, "-");
    const storagePath = `collection/${slug}/${Date.now()}-${index}-${safeName}`;
    const { error: uploadError } = await client.storage.from(bucket).upload(storagePath, file, { upsert: false, contentType: file.type });
    if (uploadError) throw uploadError;
    const { error } = await client.from("specimen_media").insert({ specimen_id: specimenId, bucket_id: bucket, storage_path: storagePath, role: index ? "detail" : "general", alt_text: `${mineralInput.value.trim()} — ${file.name}`, position: media.length + index });
    if (error) throw error;
  }
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
