const $ = selector => document.querySelector(selector);
const KIND = { contact: "Contact", identification: "Identification" };
let client = null;
let rows = [];
let openId = null;
let bound = false;

const dateText = value => new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
const element = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text != null) node.textContent = text; return node; };

export async function refreshBadge(supabase) {
  client = supabase;
  const { count, error } = await client.from("messages").select("id", { count: "exact", head: true }).eq("status", "nouveau");
  ["#messages-badge", "#settings-badge"].forEach(selector => {
    const badge = $(selector);
    if (!badge) return;
    badge.hidden = Boolean(error) || !count;
    badge.textContent = count > 99 ? "99+" : String(count || "");
  });
  const toggle = $("#settings-toggle");
  if (toggle) toggle.setAttribute("aria-label", count ? `Paramètres — ${count} nouveau${count > 1 ? "x" : ""} message${count > 1 ? "s" : ""}` : "Paramètres");
}

export async function openMessages(supabase) {
  client = supabase;
  if (!bound) {
    bound = true;
    $("#messages-filter").addEventListener("change", () => { openId = null; void load(); });
    $("#messages-refresh").addEventListener("click", () => void load());
  }
  await load();
}

async function load() {
  const status = $("#messages-status");
  status.textContent = "Chargement des messages…";
  let query = client.from("messages").select("*").order("created_at", { ascending: false }).limit(200);
  const filter = $("#messages-filter").value;
  if (filter) query = query.eq("status", filter);
  const { data, error } = await query;
  if (error) { status.textContent = `Impossible de charger les messages : ${error.message}`; return; }
  rows = data || [];
  status.textContent = rows.length ? "" : filter === "nouveau" ? "Aucun nouveau message." : "Aucun message.";
  renderList();
  void refreshBadge(client);
}

function renderList() {
  const list = $("#messages-list");
  list.replaceChildren(...rows.map(row => {
    const button = element("button", `message-row${row.status === "nouveau" ? " is-new" : ""}`);
    button.type = "button";
    button.append(
      element("span", "message-kind", KIND[row.kind] || row.kind),
      element("strong", "", row.name),
      element("span", "message-date", dateText(row.created_at)),
      element("span", "message-summary", [row.subject, row.body].filter(Boolean).join(" — ") || "(sans texte)")
    );
    button.addEventListener("click", () => { openId = openId === row.id ? null : row.id; renderDetail(); });
    return button;
  }));
  renderDetail();
}

async function renderDetail() {
  const box = $("#messages-detail");
  const row = rows.find(item => item.id === openId);
  if (!row) { box.hidden = true; box.replaceChildren(); return; }
  box.hidden = false;
  const detail = element("div", "message-detail");
  detail.append(element("h3", "", `${KIND[row.kind] || row.kind} — ${row.name}`));
  const list = element("dl");
  const add = (label, value) => { if (!value) return; list.append(element("dt", "", label)); const dd = element("dd"); if (value instanceof Node) dd.append(value); else dd.textContent = value; list.append(dd); };
  add("Reçu le", dateText(row.created_at));
  const mail = element("a", "link", row.email); mail.href = `mailto:${row.email}`;
  add("E-mail", mail);
  if (row.kind === "contact") add("Motif", row.subject);
  add("Pièce concernée", row.reference);
  Object.entries(row.details || {}).forEach(([label, value]) => add(label, String(value)));
  add("Statut", row.status === "traite" ? "Traité" : "Nouveau");
  detail.append(list);
  if (row.body) detail.append(element("div", "message-body", row.body));
  if (row.photo_paths?.length) {
    const photos = element("div", "message-photos");
    detail.append(element("h4", "", `Photographies (${row.photo_paths.length})`), photos);
    const { data } = await client.storage.from("admin-staging").createSignedUrls(row.photo_paths, 3600);
    (data || []).forEach((item, index) => {
      if (!item.signedUrl) return;
      const link = element("a"); link.href = item.signedUrl; link.target = "_blank"; link.rel = "noopener";
      const image = element("img"); image.src = item.signedUrl; image.alt = `Photo ${index + 1}`; image.loading = "lazy";
      link.append(image); photos.append(link);
    });
  }
  const actions = element("div", "admin-actions");
  const reply = element("a", "btn", "Répondre par e-mail");
  reply.href = `mailto:${row.email}?subject=${encodeURIComponent(`Re : ${row.subject || "votre message"} — Jeremineralogie`)}`;
  const toggle = element("button", "admin-secondary", row.status === "traite" ? "Marquer comme nouveau" : "Marquer comme traité");
  toggle.type = "button";
  toggle.addEventListener("click", async () => {
    const next = row.status === "traite" ? "nouveau" : "traite";
    const { error } = await client.from("messages").update({ status: next }).eq("id", row.id);
    if (error) { alert(`Mise à jour impossible : ${error.message}`); return; }
    row.status = next;
    if ($("#messages-filter").value && $("#messages-filter").value !== next) { openId = null; rows = rows.filter(item => item.id !== row.id); }
    renderList(); void refreshBadge(client);
  });
  const remove = element("button", "admin-danger", "Supprimer");
  remove.type = "button";
  remove.addEventListener("click", async () => {
    if (!confirm(`Supprimer définitivement le message de ${row.name} ?`)) return;
    if (row.photo_paths?.length) await client.storage.from("admin-staging").remove(row.photo_paths);
    const { error } = await client.from("messages").delete().eq("id", row.id);
    if (error) { alert(`Suppression impossible : ${error.message}`); return; }
    rows = rows.filter(item => item.id !== row.id); openId = null;
    renderList(); void refreshBadge(client);
  });
  actions.append(reply, toggle, remove);
  detail.append(actions);
  if (row.id === openId) box.replaceChildren(detail);
}
