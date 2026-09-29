import { getSupabase } from "./supabase-client.js";

const client = getSupabase();
const content = document.querySelector("#department-live-content");
const code = new URLSearchParams(location.search).get("dep");

function line(container, text) { const p = document.createElement("p"); p.textContent = text; container.append(p); }
function section(title, entries) {
  const block = document.createElement("div");
  const heading = document.createElement("h3"); heading.textContent = title; block.append(heading);
  if (!entries.length) line(block, "Aucune donnée publiée.");
  else { const list = document.createElement("ul"); entries.forEach(entry => { const li = document.createElement("li"); li.textContent = entry.name; list.append(li); }); block.append(list); }
  content.append(block);
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
  if (regions?.length) {
    const regionBox = document.createElement("section"); regionBox.id = "supabase-region-index"; regionBox.className = "department-region";
    const regionHeading = document.createElement("h2"); regionHeading.textContent = "Régions du référentiel"; regionBox.append(regionHeading);
    const regionList = document.createElement("div"); regionList.className = "department-list";
    regions.forEach(region => { const item = document.createElement("span"); item.textContent = region.name; regionList.append(item); });
    regionBox.append(regionList); document.querySelector(".department-regions").prepend(regionBox);
  }
  const known = new Set();
  document.querySelectorAll("[data-department]").forEach(link => {
    const row = departments?.find(department => department.code === link.dataset.department);
    if (row) { link.textContent = `${row.name} (${row.code})`; known.add(row.code); }
  });
  const extra = (departments || []).filter(department => !known.has(department.code));
  if (extra.length) {
    const group = document.createElement("section"); group.id = "supabase-department-index"; group.className = "department-region";
    const heading = document.createElement("h2"); heading.textContent = "Départements du référentiel"; group.append(heading);
    const list = document.createElement("div"); list.className = "department-list";
    extra.forEach(department => { const link = document.createElement("a"); link.href = `departement.html?dep=${encodeURIComponent(department.code)}`; link.dataset.department = department.code; link.textContent = `${department.name} (${department.code})${regionById.get(department.region_id) ? ` · ${regionById.get(department.region_id)}` : ""}`; list.append(link); });
    document.querySelector(".department-regions").prepend(group); group.append(list);
  }
  if (code) {
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
  content.replaceChildren();
  const heading = document.createElement("h2"); heading.textContent = "Données publiées du référentiel"; content.append(heading);
  if (!client) throw new Error("La connexion à Supabase n’est pas configurée.");
  const { data: localities, error: localityError } = await client.from("localities").select("id,name,slug,department_code")
    .eq("department_code", code).eq("publication_status", "published").order("name");
  if (localityError) throw localityError;
  const ids = (localities || []).map(row => row.id);
  let mines = [];
  if (ids.length) { const { data, error } = await client.from("mines").select("name,slug,locality_id").in("locality_id", ids).eq("publication_status", "published").order("name"); if (error) throw error; mines = data || []; }
  const { data: occurrences, error: occurrenceError } = await client.from("mineral_occurrences").select("mineral_id,locality_id,source_note").eq("department_code", code);
  if (occurrenceError) throw occurrenceError;
  const mineralIds = [...new Set((occurrences || []).map(item => item.mineral_id))];
  let minerals = [];
  if (mineralIds.length) { const { data, error } = await client.from("minerals").select("id,name,slug").in("id", mineralIds).eq("publication_status", "published").order("name"); if (error) throw error; minerals = data || []; }
  section("Localités publiées", localities || []);
  section("Mines et gisements publiés", mines);
  section("Minéraux documentés", minerals);
}

async function refresh() {
  try { await loadDirectory(); await loadDepartment(); }
  catch (error) { content.hidden = false; content.replaceChildren(); line(content, "Les informations géographiques Supabase ne peuvent pas être chargées pour le moment."); console.error("Chargement du référentiel géographique :", error); }
}
await refresh();
if (client) {
  const queue = () => void refresh();
  const channel = client.channel("public-geography")
    .on("postgres_changes", { event: "*", schema: "public", table: "regions" }, queue)
    .on("postgres_changes", { event: "*", schema: "public", table: "departments" }, queue)
    .on("postgres_changes", { event: "*", schema: "public", table: "localities" }, queue)
    .on("postgres_changes", { event: "*", schema: "public", table: "mines" }, queue)
    .on("postgres_changes", { event: "*", schema: "public", table: "minerals" }, queue)
    .on("postgres_changes", { event: "*", schema: "public", table: "mineral_occurrences" }, queue)
    .subscribe();
  const timer = setInterval(queue, 60000);
  window.addEventListener("pagehide", () => { clearInterval(timer); void client.removeChannel(channel); }, { once: true });
}
