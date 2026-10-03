import { getSupabase } from "./supabase-client.js";
import { ficheUrl } from "./entity-links.js";
import { articleUrl, documentUrl, pieceUrl, specimenUrl } from "./detail-nav.js";

const client = getSupabase();
const content = document.querySelector("#department-live-content");
const code = new URLSearchParams(location.search).get("dep");

function line(container, text) { const p = document.createElement("p"); p.textContent = text; container.append(p); }
function section(title, entries) {
  const block = document.createElement("div");
  const heading = document.createElement("h3"); heading.textContent = title; block.append(heading);
  if (!entries.length) line(block, "Aucune donnée publiée.");
  else {
    const list = document.createElement("ul");
    entries.forEach(entry => {
      const li = document.createElement("li");
      if (entry.href) { const a = document.createElement("a"); a.className = "link"; a.href = entry.href; a.textContent = entry.name; li.append(a); }
      else li.textContent = entry.name;
      list.append(li);
    });
    block.append(list);
  }
  content.append(block);
}
// Chaque bloc secondaire échoue indépendamment : une table indisponible ne vide pas la page.
async function safely(label, task) {
  try { return await task(); } catch (error) { console.error(`Département ${code} — ${label} :`, error); return null; }
}

async function loadDirectory() {
  if (!client) throw new Error("Configuration Supabase absente.");
  const [{ data: departments, error: departmentError }, { data: regions, error: regionError }] = await Promise.all([
    client.from("departments").select("code,name,region_id").order("name"),
    client.from("regions").select("id,name").order("name")
  ]);
  if (departmentError) throw departmentError; if (regionError) throw regionError;
  const regionById = new Map((regions || []).map(region => [region.id, region.name]));
  document.querySelector("#supabase-region-index")?.remove();
  document.querySelector("#supabase-department-index")?.remove();
  const known = new Set();
  document.querySelectorAll("[data-department]").forEach(link => {
    const row = departments?.find(department => department.code === link.dataset.department);
    if (row) { link.textContent = `${row.name} (${row.code})`; known.add(row.code); }
  });
  // Départements du référentiel absents de la liste statique (la liste statique reste la référence d'affichage).
  const extra = (departments || []).filter(department => !known.has(department.code));
  if (extra.length) {
    const group = document.createElement("section"); group.id = "supabase-department-index"; group.className = "department-region";
    const heading = document.createElement("h2"); heading.textContent = "Autres départements et provinces"; group.append(heading);
    const list = document.createElement("div"); list.className = "department-list";
    extra.forEach(department => { const link = document.createElement("a"); link.href = `departement.html?dep=${encodeURIComponent(department.code)}`; link.dataset.department = department.code; link.textContent = `${department.name}${/^(2[AB]|\d{2,3})$/i.test(department.code) ? ` (${department.code})` : ""}${regionById.get(department.region_id) ? ` · ${regionById.get(department.region_id)}` : ""}`; list.append(link); });
    document.querySelector(".department-regions").prepend(group); group.append(list);
  }
  if (code) {
    document.querySelectorAll("[data-department]").forEach(link => link.classList.toggle("active", link.dataset.department === code));
    const selected = (departments || []).find(department => department.code === code);
    if (selected) {
      const detail = document.querySelector("#department-detail"); detail.replaceChildren();
      const label = document.createElement("div"); label.className = "department-code"; label.textContent = `Département ${selected.code}`;
      const heading = document.createElement("h2"); heading.textContent = selected.name;
      const regionText = regionById.get(selected.region_id);
      const note = document.createElement("p"); note.textContent = regionText ? `Région : ${regionText}` : "Référentiel géographique Jeremineralogie.";
      detail.append(label, heading, note);
    }
  }
}

async function loadDepartment() {
  if (!code) return;
  content.hidden = false;
  if (!client) throw new Error("La connexion à Supabase n’est pas configurée.");
  const sections = [];
  const localities = await safely("localités", async () => {
    const { data, error } = await client.from("localities").select("id,name,slug,department_code").eq("department_code", code).eq("publication_status", "published").order("name");
    if (error) throw error; return data || [];
  }) || [];
  const ids = localities.map(row => row.id);
  const mines = ids.length ? await safely("mines", async () => {
    const { data, error } = await client.from("mines").select("id,name,slug,locality_id").in("locality_id", ids).eq("publication_status", "published").order("name");
    if (error) throw error; return data || [];
  }) || [] : [];
  const minerals = await safely("minéraux", async () => {
    const { data: occurrences, error } = await client.from("mineral_occurrences").select("mineral_id").eq("department_code", code);
    if (error) throw error;
    const mineralIds = [...new Set((occurrences || []).map(item => item.mineral_id))];
    if (!mineralIds.length) return [];
    const { data, error: mineralError } = await client.from("minerals").select("id,name,slug").in("id", mineralIds).eq("publication_status", "published").order("name");
    if (mineralError) throw mineralError; return data || [];
  }) || [];
  const specimens = await safely("collection", async () => {
    const { data, error } = await client.from("specimens").select("slug,mineral_name,provenance,locality_name,mineral:minerals!specimens_mineral_id_fkey(name)")
      .eq("department_code", code).eq("publication_status", "published").order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map(row => ({ name: [row.mineral_name ?? row.mineral?.name ?? "Spécimen", row.provenance, row.locality_name].filter(Boolean).join(" — "), href: specimenUrl({ id: row.slug }) }));
  }) || [];
  const shop = await safely("boutique", async () => {
    const { data, error } = await client.from("shop_items").select("reference,slug,title").eq("department_code", code).eq("publication_status", "published").eq("sale_status", "available").order("updated_at", { ascending: false });
    if (error) throw error;
    return (data || []).map(row => ({ name: `${row.title} (${row.reference})`, href: pieceUrl(row) }));
  }) || [];
  const archives = await safely("archives", async () => {
    const links = [];
    if (ids.length) {
      const { data, error } = await client.from("archive_localities").select("archive:archive_documents(id,title,slug)").in("locality_id", ids);
      if (error) throw error; links.push(...(data || []));
    }
    if (mines.length) {
      const { data, error } = await client.from("archive_mines").select("archive:archive_documents(id,title,slug)").in("mine_id", mines.map(mine => mine.id));
      if (error) throw error; links.push(...(data || []));
    }
    const seen = new Map(); links.forEach(link => { if (link.archive) seen.set(link.archive.id, link.archive); });
    return [...seen.values()].map(archive => ({ name: archive.title, href: documentUrl(archive) }));
  }) || [];
  const articles = await safely("articles", async () => {
    const links = [];
    if (ids.length) {
      const { data, error } = await client.from("article_localities").select("article:articles(id,title,slug)").in("locality_id", ids);
      if (error) throw error; links.push(...(data || []));
    }
    if (mines.length) {
      const { data, error } = await client.from("article_mines").select("article:articles(id,title,slug)").in("mine_id", mines.map(mine => mine.id));
      if (error) throw error; links.push(...(data || []));
    }
    const seen = new Map(); links.forEach(link => { if (link.article) seen.set(link.article.id, link.article); });
    return [...seen.values()].map(article => ({ name: article.title, href: articleUrl(article) }));
  }) || [];
  content.replaceChildren();
  const heading = document.createElement("h2"); heading.textContent = "Données publiées du référentiel"; content.append(heading);
  section("Spécimens de ma collection", specimens);
  section("Pièces disponibles en boutique", shop);
  section("Localités publiées", localities.map(row => ({ name: row.name, href: ficheUrl("locality", row.slug) })));
  section("Mines et gisements publiés", mines.map(row => ({ name: row.name, href: ficheUrl("mine", row.slug) })));
  section("Minéraux documentés", minerals.map(row => ({ name: row.name, href: ficheUrl("mineral", row.slug) })));
  section("Archives et documents associés", archives);
  section("Articles associés", articles);
}

async function refresh() {
  try { await loadDirectory(); await loadDepartment(); }
  catch (error) { content.hidden = false; content.replaceChildren(); line(content, "Les informations géographiques Supabase ne peuvent pas être chargées pour le moment."); console.error("Chargement du référentiel géographique :", error); }
}
await refresh();
if (client) {
  let queued = false;
  const queue = () => { if (queued) return; queued = true; setTimeout(() => { queued = false; void refresh(); }, 300); };
  const channel = client.channel("public-geography");
  ["regions", "departments", "localities", "mines", "minerals", "mineral_occurrences", "specimens", "shop_items"]
    .forEach(table => channel.on("postgres_changes", { event: "*", schema: "public", table }, queue));
  channel.subscribe();
  const timer = setInterval(queue, 60000);
  window.addEventListener("pagehide", () => { clearInterval(timer); void client.removeChannel(channel); }, { once: true });
}
