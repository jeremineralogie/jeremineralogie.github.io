import { getSupabase } from "./supabase-client.js";

const status = document.querySelector("#admin-status");
const loginPanel = document.querySelector("#login-panel");
const cmsPanel = document.querySelector("#cms-panel");
const editor = document.querySelector("#editor-panel");
const form = document.querySelector("#specimen-form");
const list = document.querySelector("#specimen-list");
const mineralSelect = document.querySelector("#mineral-id");
const photoPreview = document.querySelector("#existing-photos");
const client = getSupabase();
let minerals = [];
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
  const [mineralResult, specimenResult] = await Promise.all([
    client.from("minerals").select("id,name").order("name"),
    client.from("specimens").select("id,slug,publication_status,mineral:minerals(name)").order("updated_at", { ascending: false })
  ]);
  if (mineralResult.error || specimenResult.error) {
    message((mineralResult.error || specimenResult.error).message, true);
    return;
  }
  minerals = mineralResult.data || [];
  mineralSelect.replaceChildren(...minerals.map(mineral => new Option(mineral.name, mineral.id)));
  list.replaceChildren();
  (specimenResult.data || []).forEach(specimen => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = `${specimen.mineral?.name || "Minéral"} — ${specimen.slug} (${specimen.publication_status === "published" ? "publié" : "brouillon"})`;
    button.addEventListener("click", () => void editSpecimen(specimen.id));
    list.append(button);
  });
  if (!minerals.length) message("Ajoutez d’abord les minéraux nécessaires dans le référentiel Supabase.", true);
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
  const { data, error } = await client.from("specimens").select("*,specimen_associations(mineral_id,mineral:minerals(name)),specimen_media(*)").eq("id", id).single();
  if (error) return message(error.message, true);
  document.querySelector("#specimen-id").value = data.id;
  document.querySelector("#specimen-slug").value = data.slug;
  document.querySelector("#mineral-id").value = data.mineral_id;
  document.querySelector("#provenance").value = data.provenance || "";
  document.querySelector("#locality").value = data.locality_id ? await getLocalityName(data.locality_id) : "";
  document.querySelector("#department-code").value = data.department_code || "";
  document.querySelector("#dimensions").value = data.dimensions || "";
  document.querySelector("#weight").value = data.weight_grams ?? "";
  document.querySelector("#discovery-year").value = data.discovery_year ?? "";
  document.querySelector("#associations").value = (data.specimen_associations || []).map(item => item.mineral?.name).join(", ");
  document.querySelector("#description").value = data.description || "";
  document.querySelector("#history").value = data.history || "";
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
  if (!minerals.length) return message("Aucun minéral disponible dans le référentiel.", true);
  const id = document.querySelector("#specimen-id").value;
  const slug = document.querySelector("#specimen-slug").value.trim();
  const localityName = document.querySelector("#locality").value.trim();
  message("Enregistrement…");
  try {
    let localityId = null;
    if (localityName) {
      const localitySlug = localityName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const { data, error } = await client.from("localities").upsert({ slug: localitySlug, name: localityName, department_code: document.querySelector("#department-code").value || null, publication_status: document.querySelector("#publication-status").value }, { onConflict: "slug" }).select("id").single();
      if (error) throw error;
      localityId = data.id;
    }
    const record = {
      slug, mineral_id: mineralSelect.value, provenance: document.querySelector("#provenance").value.trim(),
      locality_id: localityId, department_code: document.querySelector("#department-code").value.trim() || null,
      dimensions: document.querySelector("#dimensions").value.trim(),
      weight_grams: document.querySelector("#weight").value || null,
      discovery_year: document.querySelector("#discovery-year").value || null,
      description: document.querySelector("#description").value.trim(), history: document.querySelector("#history").value.trim(),
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
    await saveAssociations(saved.id, document.querySelector("#associations").value);
    await uploadPhotos(saved.id, slug);
    await loadDashboard();
    resetEditor(false);
    message("Spécimen enregistré.");
  } catch (error) {
    message(error.message || "Enregistrement impossible.", true);
  }
}

async function saveAssociations(specimenId, input) {
  const names = [...new Set(input.split(",").map(name => name.trim()).filter(Boolean))];
  const { error: deleteError } = await client.from("specimen_associations").delete().eq("specimen_id", specimenId);
  if (deleteError) throw deleteError;
  for (const name of names) {
    let mineral = minerals.find(item => item.name.toLocaleLowerCase("fr") === name.toLocaleLowerCase("fr"));
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
    const { error } = await client.from("specimen_media").insert({ specimen_id: specimenId, bucket_id: bucket, storage_path: storagePath, role: index ? "detail" : "general", alt_text: `${document.querySelector("#mineral-id").selectedOptions[0].text} — ${file.name}`, position: media.length + index });
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
