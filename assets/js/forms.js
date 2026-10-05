import { getSupabase } from "./supabase-client.js";

const MAX_PHOTOS = 8;
const MAX_SIDE = 1800;

function resize(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, MAX_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(image.naturalWidth * scale);
      canvas.height = Math.round(image.naturalHeight * scale);
      canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Conversion de la photo impossible.")), "image/jpeg", 0.85);
    };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error(`La photo « ${file.name} » n’a pas pu être lue.`)); };
    image.src = url;
  });
}

function show(status, text, isError = false) {
  status.textContent = text;
  status.hidden = false;
  status.classList.toggle("form-error", isError);
}

document.querySelectorAll("form[data-message-form]").forEach(form => {
  const status = form.querySelector(".form-status");
  const button = form.querySelector("button[type=submit]");
  const label = button.textContent;
  const reference = new URLSearchParams(location.search).get("reference");
  if (reference && form.elements.reference) form.elements.reference.value = reference.slice(0, 100);

  // Joueur connecté : nom et adresse e-mail repris du dernier message envoyé depuis son compte (modifiables).
  void (async () => {
    try {
      const client = getSupabase(); if (!client) return;
      const { data: { session } = {} } = await client.auth.getSession(); if (!session) return;
      const { data } = await client.from("messages").select("name,email").eq("user_id", session.user.id).order("created_at", { ascending: false }).limit(1);
      const last = data?.[0]; if (!last) return;
      if (form.elements.name && !form.elements.name.value) form.elements.name.value = last.name;
      if (form.elements.email && !form.elements.email.value) form.elements.email.value = last.email;
    } catch { /* préremplissage facultatif */ }
  })();

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const value = name => (form.elements[name]?.value || "").trim();
    if (value("website")) { form.reset(); show(status, "Merci, votre message a bien été envoyé."); return; }
    if (!value("name") || !value("email") || !form.elements.email.checkValidity()) { show(status, "Merci d’indiquer votre nom et une adresse e-mail valide.", true); return; }
    if (form.dataset.kind === "contact" && !value("body")) { show(status, "Merci d’écrire votre message.", true); return; }
    const files = [...(form.elements.photos?.files || [])].filter(file => file.type.startsWith("image/"));
    if (files.length > MAX_PHOTOS) { show(status, `Vous pouvez joindre ${MAX_PHOTOS} photos au maximum.`, true); return; }
    const client = getSupabase();
    if (!client) { show(status, "L’envoi est momentanément indisponible. Réessayez plus tard.", true); return; }

    button.disabled = true;
    button.textContent = "Envoi en cours…";
    try {
      const folder = `messages/${crypto.randomUUID()}`;
      const photoPaths = [];
      for (const [index, file] of files.entries()) {
        show(status, `Envoi des photos (${index + 1}/${files.length})…`);
        const blob = await resize(file);
        const path = `${folder}/${index + 1}.jpg`;
        const { error } = await client.storage.from("admin-staging").upload(path, blob, { contentType: "image/jpeg", upsert: false });
        if (error) throw error;
        photoPaths.push(path);
      }
      // Joueur connecté : le message est rattaché à son compte (historique dans « Mon espace »).
      const { data: { session } = {} } = await client.auth.getSession();
      const details = {};
      form.querySelectorAll("[data-detail]").forEach(field => { if (field.value.trim()) details[field.dataset.detail] = field.value.trim(); });
      const { error } = await client.from("messages").insert({
        kind: form.dataset.kind,
        name: value("name"),
        email: value("email"),
        subject: form.dataset.kind === "identification" ? (details["Minéral supposé"] || "Demande d’identification") : value("subject"),
        reference: value("reference"),
        details,
        body: value("body"),
        photo_paths: photoPaths,
        user_id: session?.user?.id ?? null
      });
      if (error) throw error;
      form.reset();
      if (reference && form.elements.reference) form.elements.reference.value = reference.slice(0, 100);
      show(status, "Merci, votre message a bien été envoyé. Je vous répondrai par e-mail.");
    } catch (error) {
      console.error("Échec de l’envoi du formulaire :", error);
      show(status, "L’envoi n’a pas abouti. Vérifiez votre connexion puis réessayez.", true);
    } finally {
      button.disabled = false;
      button.textContent = label;
    }
  });
});
