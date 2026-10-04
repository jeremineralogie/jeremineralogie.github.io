// Tableau de bord des visites (Paramètres → Statistiques). Données : table page_views, agrégées par admin_page_stats().
const $ = selector => document.querySelector(selector);
const SVG = "http://www.w3.org/2000/svg";
const COLORS = { views: "#9b6cf0", visits: "#b8842c" };
const PAGE_LABELS = {
  index: "Accueil", boutique: "Boutique", piece: "Fiches boutique", collection: "Ma collection", specimen: "Fiches collection",
  articles: "Articles (liste)", article: "Articles (lecture)", archives: "Archives & documentation", document: "Documents d’archive",
  carte: "Carte", recherche: "Recherche", fiche: "Fiches minéral / gisement / commune", departement: "Départements",
  apprendre: "Apprendre & identifier", jeux: "Jeux & quiz", favoris: "Mes favoris", introuvable: "Page introuvable (lien cassé)", contact: "Contact", identification: "Identification", reseaux: "Mes réseaux", legal: "Informations légales"
};
const TYPE_LABELS = { specimen: "Collection", piece: "Boutique", mineral: "Minéral", mine: "Gisement", locality: "Commune", article: "Article", archive: "Archive", departement: "Département" };
const DEVICE_LABELS = { mobile: "Téléphone", tablette: "Tablette", ordinateur: "Ordinateur" };
const number = value => new Intl.NumberFormat("fr-FR").format(value || 0);
const element = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text != null) node.textContent = text; return node; };
const svg = (tag, attributes = {}) => { const node = document.createElementNS(SVG, tag); Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value)); return node; };

let client = null;
let bound = false;
let days = 30;
let entityFilter = "";
let lastData = null;
let names = new Map();

export async function openStats(supabase) {
  client = supabase;
  if (!bound) {
    bound = true;
    let resizeTimer = null;
    window.addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { if (lastData && !$("#stats-panel").hidden) render(); }, 200); });
    document.querySelectorAll("#stats-panel [data-days]").forEach(button => button.addEventListener("click", () => {
      days = Number(button.dataset.days);
      document.querySelectorAll("#stats-panel [data-days]").forEach(item => item.classList.toggle("is-active", item === button));
      void load();
    }));
    // Purge des données de plus de 13 mois (durée maximale recommandée par la CNIL).
    const limit = new Date(); limit.setMonth(limit.getMonth() - 13);
    void client.from("page_views").delete().lt("created_at", limit.toISOString()).then(({ error }) => { if (error) console.error("Purge des statistiques :", error); });
  }
  await load();
}

function period() {
  const to = new Date();
  const from = new Date(to); from.setHours(0, 0, 0, 0);
  let bucket = "day";
  if (days >= 365) { from.setDate(1); from.setMonth(from.getMonth() - 11); bucket = "month"; }
  else { from.setDate(from.getDate() - (days - 1)); if (days > 60) bucket = "week"; }
  const previousFrom = new Date(from.getTime() - (to.getTime() - from.getTime()));
  return { from, to, bucket, previousFrom };
}

async function load() {
  const status = $("#stats-status");
  const body = $("#stats-body");
  status.textContent = "Chargement des statistiques…";
  const { from, to, bucket, previousFrom } = period();
  const [current, previous] = await Promise.all([
    client.rpc("admin_page_stats", { p_from: from.toISOString(), p_to: to.toISOString(), p_bucket: bucket }),
    client.rpc("admin_page_stats", { p_from: previousFrom.toISOString(), p_to: from.toISOString(), p_bucket: bucket })
  ]);
  if (current.error) { status.textContent = `Impossible de charger les statistiques : ${current.error.message}`; body.hidden = true; return; }
  lastData = { data: current.data, previous: previous.data?.totals || null, from, to, bucket };
  names = await resolveNames(current.data.entities || []);
  status.textContent = current.data.totals.views ? "" : "Aucune visite enregistrée sur cette période pour le moment.";
  render();
}

// Noms lisibles et liens publics des fiches consultées.
async function resolveNames(entities) {
  const map = new Map();
  const byType = {};
  entities.forEach(item => { (byType[item.type] ||= new Set()).add(item.slug); });
  const fetchers = {
    specimen: slugs => client.from("specimens").select("slug,mineral_name,provenance,mineral:minerals!specimens_mineral_id_fkey(name)").in("slug", slugs)
      .then(({ data }) => (data || []).forEach(row => map.set(`specimen:${row.slug}`, { name: row.mineral_name || row.mineral?.name || row.slug, detail: row.provenance || "", href: `../specimen.html?id=${encodeURIComponent(row.slug)}` }))),
    piece: slugs => client.from("shop_items").select("slug,reference,mineral_name,mineral:minerals!shop_items_mineral_id_fkey(name),mine:mines!shop_items_mine_id_fkey(name)").or(`reference.in.(${slugs.map(quote).join(",")}),slug.in.(${slugs.map(quote).join(",")})`)
      .then(({ data }) => (data || []).forEach(row => {
        const entry = { name: row.mineral_name || row.mineral?.name || row.reference, detail: [row.reference, row.mine?.name].filter(Boolean).join(" · "), href: `../piece.html?ref=${encodeURIComponent(row.reference || row.slug)}` };
        map.set(`piece:${row.reference}`, entry); map.set(`piece:${row.slug}`, entry);
      })),
    mineral: slugs => simple("minerals", "mineral", slugs, row => `../fiche.html?type=mineral&id=${encodeURIComponent(row.slug)}`),
    mine: slugs => simple("mines", "mine", slugs, row => `../fiche.html?type=mine&id=${encodeURIComponent(row.slug)}`),
    locality: slugs => simple("localities", "locality", slugs, row => `../fiche.html?type=locality&id=${encodeURIComponent(row.slug)}`),
    article: slugs => client.from("articles").select("slug,title").in("slug", slugs)
      .then(({ data }) => (data || []).forEach(row => map.set(`article:${row.slug}`, { name: row.title, href: `../article.html?slug=${encodeURIComponent(row.slug)}` }))),
    archive: slugs => client.from("archive_documents").select("slug,title").in("slug", slugs)
      .then(({ data }) => (data || []).forEach(row => map.set(`archive:${row.slug}`, { name: row.title, href: `../document.html?slug=${encodeURIComponent(row.slug)}` }))),
    departement: slugs => client.from("departments").select("code,name").in("code", slugs)
      .then(({ data }) => (data || []).forEach(row => map.set(`departement:${row.code}`, { name: `${row.name} (${row.code})`, href: `../departement.html?dep=${encodeURIComponent(row.code)}` })))
  };
  function simple(table, type, slugs, href) {
    return client.from(table).select("slug,name").in("slug", slugs).then(({ data }) => (data || []).forEach(row => map.set(`${type}:${row.slug}`, { name: row.name, href: href(row) })));
  }
  await Promise.all(Object.entries(byType).map(([type, slugs]) => fetchers[type]?.([...slugs]).catch(error => console.error(`Noms des fiches (${type}) :`, error))));
  return map;
}
function quote(value) { return `"${String(value).replace(/["\\]/g, "")}"`; }

function render() {
  const { data, previous, from, to, bucket } = lastData;
  const body = $("#stats-body");
  body.hidden = false;
  body.replaceChildren(tiles(data.totals, previous, data.devices), chartBlock(data.series, from, to, bucket), grid(
    card("Pages les plus consultées", barList(data.pages.map(row => ({ label: PAGE_LABELS[row.page] || row.page, value: row.views, note: `${number(row.visits)} visite${row.visits > 1 ? "s" : ""}` })), "vue")),
    entitiesCard(data.entities),
    card("Provenance des visiteurs", barList(data.sources.map(row => ({ label: row.source, value: row.visits })), "visite"),
      data.referrers.length ? detailsList("Sites exacts", data.referrers.map(row => `${row.host} — ${number(row.visits)}`)) : null),
    card("Appareils utilisés", barList(data.devices.map(row => ({ label: DEVICE_LABELS[row.device] || row.device, value: row.visits })), "visite", true)),
    card("Recherches tapées sur le site", data.searches.length ? barList(data.searches.map(row => ({ label: `« ${row.query} »`, value: row.count })), "fois") : element("p", "admin-empty", "Aucune recherche sur cette période."))
  ));
}

function tiles(totals, previous, devices) {
  const box = element("div", "stats-tiles");
  const perVisit = totals.visits ? totals.views / totals.visits : 0;
  const mobile = devices.filter(row => row.device !== "ordinateur").reduce((sum, row) => sum + row.visits, 0);
  const allDevices = devices.reduce((sum, row) => sum + row.visits, 0);
  const trend = (now, before) => {
    if (!before) return "";
    const change = Math.round(((now - before) / before) * 100);
    return change === 0 ? "= période précédente" : `${change > 0 ? "▲ +" : "▼ "}${change} % vs période précédente`;
  };
  [
    ["Visites", number(totals.visits), trend(totals.visits, previous?.visits)],
    ["Pages vues", number(totals.views), trend(totals.views, previous?.views)],
    ["Pages par visite", perVisit.toLocaleString("fr-FR", { maximumFractionDigits: 1 }), ""],
    ["Sur téléphone ou tablette", allDevices ? `${Math.round((mobile / allDevices) * 100)} %` : "—", ""]
  ].forEach(([label, value, note]) => {
    const tile = element("div", "stats-tile");
    tile.append(element("span", "stats-tile-label", label), element("strong", "stats-tile-value", value));
    if (note) tile.append(element("span", `stats-tile-note${note.startsWith("▼") ? " is-down" : ""}`, note));
    box.append(tile);
  });
  return box;
}

// Série temporelle complétée par des zéros pour chaque jour / semaine / mois de la période.
function fillSeries(series, from, to, bucket) {
  const key = date => bucket === "month" ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}` : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const found = new Map(series.map(row => [bucket === "month" ? row.t.slice(0, 7) : row.t.slice(0, 10), row]));
  const points = [];
  const cursor = new Date(from);
  if (bucket === "week") { const shift = (cursor.getDay() + 6) % 7; cursor.setDate(cursor.getDate() - shift); }
  while (cursor <= to) {
    const row = found.get(key(cursor));
    points.push({ date: new Date(cursor), views: row?.views || 0, visits: row?.visits || 0 });
    if (bucket === "month") cursor.setMonth(cursor.getMonth() + 1);
    else cursor.setDate(cursor.getDate() + (bucket === "week" ? 7 : 1));
  }
  return points;
}
function pointLabel(date, bucket, long = false) {
  if (bucket === "month") return date.toLocaleDateString("fr-FR", { month: long ? "long" : "short", year: long ? "numeric" : "2-digit" });
  if (bucket === "week") return `${long ? "Semaine du " : ""}${date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`;
  return date.toLocaleDateString("fr-FR", long ? { weekday: "long", day: "numeric", month: "long" } : { day: "numeric", month: "short" });
}

function chartBlock(series, from, to, bucket) {
  const points = fillSeries(series, from, to, bucket);
  const box = card(bucket === "month" ? "Visites et pages vues par mois" : bucket === "week" ? "Visites et pages vues par semaine" : "Visites et pages vues par jour");
  const legend = element("div", "stats-legend");
  [["views", "Pages vues"], ["visits", "Visites"]].forEach(([key, label]) => {
    const item = element("span", "stats-legend-item"); const swatch = element("i"); swatch.style.background = COLORS[key];
    item.append(swatch, label); legend.append(item);
  });
  box.append(legend);
  // Largeur réelle du panneau : les textes du graphique gardent leur taille sur téléphone.
  const W = Math.round(Math.max(280, Math.min(900, ($("#stats-body").clientWidth || 720) - 34))), H = W < 500 ? 210 : 260, M = { top: 16, right: 12, bottom: 30, left: 36 };
  const max = Math.max(4, ...points.map(point => point.views));
  const step = niceStep(max / 4);
  const top = Math.ceil(max / step) * step;
  const x = index => M.left + (points.length === 1 ? (W - M.left - M.right) / 2 : (index / (points.length - 1)) * (W - M.left - M.right));
  const y = value => H - M.bottom - (value / top) * (H - M.top - M.bottom);
  const chart = svg("svg", { viewBox: `0 0 ${W} ${H}`, class: "stats-chart", role: "img", "aria-label": "Courbe des visites et des pages vues" });
  for (let value = 0; value <= top; value += step) {
    chart.append(svg("line", { x1: M.left, x2: W - M.right, y1: y(value), y2: y(value), class: "stats-grid" }));
    const label = svg("text", { x: M.left - 8, y: y(value) + 4, "text-anchor": "end", class: "stats-axis" }); label.textContent = number(value); chart.append(label);
  }
  const every = Math.max(1, Math.ceil(points.length / Math.max(3, Math.floor(W / 95))));
  points.forEach((point, index) => {
    if (index % every && index !== points.length - 1) return;
    if (index !== points.length - 1 && points.length - 1 - index < every / 2) return;
    const label = svg("text", { x: x(index), y: H - 8, "text-anchor": index === 0 ? "start" : index === points.length - 1 ? "end" : "middle", class: "stats-axis" });
    label.textContent = pointLabel(point.date, bucket); chart.append(label);
  });
  ["visits", "views"].forEach(key => {
    const d = points.map((point, index) => `${index ? "L" : "M"}${x(index).toFixed(1)},${y(point[key]).toFixed(1)}`).join(" ");
    chart.append(svg("path", { d, fill: "none", stroke: COLORS[key], "stroke-width": 2, "stroke-linejoin": "round", "stroke-linecap": "round" }));
  });
  const cross = svg("line", { y1: M.top, y2: H - M.bottom, class: "stats-cross", visibility: "hidden" });
  const dots = ["views", "visits"].map(key => svg("circle", { r: 4.5, fill: COLORS[key], stroke: "#0f0918", "stroke-width": 2, visibility: "hidden" }));
  chart.append(cross, ...dots);
  const hit = svg("rect", { x: M.left, y: M.top, width: W - M.left - M.right, height: H - M.top - M.bottom, fill: "transparent" });
  chart.append(hit);
  const wrap = element("div", "stats-chart-wrap");
  const tip = element("div", "stats-tip"); tip.hidden = true;
  wrap.append(chart, tip);
  const show = event => {
    const rect = chart.getBoundingClientRect();
    const px = ((event.touches?.[0] || event).clientX - rect.left) * (W / rect.width);
    const index = Math.max(0, Math.min(points.length - 1, Math.round(((px - M.left) / (W - M.left - M.right)) * (points.length - 1))));
    const point = points[index];
    cross.setAttribute("x1", x(index)); cross.setAttribute("x2", x(index)); cross.setAttribute("visibility", "visible");
    dots[0].setAttribute("cx", x(index)); dots[0].setAttribute("cy", y(point.views)); dots[0].setAttribute("visibility", "visible");
    dots[1].setAttribute("cx", x(index)); dots[1].setAttribute("cy", y(point.visits)); dots[1].setAttribute("visibility", "visible");
    tip.replaceChildren(element("strong", "", pointLabel(point.date, bucket, true)), tipRow("views", "Pages vues", point.views), tipRow("visits", "Visites", point.visits));
    tip.hidden = false;
    const left = (x(index) / W) * rect.width;
    tip.style.left = `${Math.min(Math.max(left, 70), rect.width - 70)}px`;
  };
  const hide = () => { tip.hidden = true; cross.setAttribute("visibility", "hidden"); dots.forEach(dot => dot.setAttribute("visibility", "hidden")); };
  hit.addEventListener("pointermove", show); hit.addEventListener("pointerdown", show); hit.addEventListener("pointerleave", hide);
  box.append(wrap);
  const table = element("details", "stats-table");
  table.append(element("summary", "", "Voir les chiffres en tableau"));
  const tbl = element("table"); const head = element("tr");
  ["Période", "Pages vues", "Visites"].forEach(label => head.append(element("th", "", label)));
  tbl.append(head);
  points.slice().reverse().forEach(point => { const row = element("tr"); row.append(element("td", "", pointLabel(point.date, bucket, true)), element("td", "", number(point.views)), element("td", "", number(point.visits))); tbl.append(row); });
  table.append(tbl); box.append(table);
  return box;
}
function tipRow(key, label, value) { const row = element("span", "stats-tip-row"); const swatch = element("i"); swatch.style.background = COLORS[key]; row.append(swatch, `${label} : `, element("b", "", number(value))); return row; }
function niceStep(raw) { const power = 10 ** Math.floor(Math.log10(Math.max(raw, 1))); const unit = raw / power; return (unit <= 1 ? 1 : unit <= 2 ? 2 : unit <= 5 ? 5 : 10) * power; }

function entitiesCard(entities) {
  const box = card("Fiches les plus consultées");
  const types = [...new Set(entities.map(row => row.type))];
  if (entityFilter && !types.includes(entityFilter)) entityFilter = "";
  const chips = element("div", "stats-chips");
  [["", "Toutes"], ...types.map(type => [type, TYPE_LABELS[type] || type])].forEach(([type, label]) => {
    const chip = element("button", `admin-tab${entityFilter === type ? " is-active" : ""}`, label); chip.type = "button";
    chip.addEventListener("click", () => { entityFilter = type; render(); });
    chips.append(chip);
  });
  if (types.length > 1) box.append(chips);
  const rows = entities.filter(row => !entityFilter || row.type === entityFilter).slice(0, 25).map(row => {
    const info = names.get(`${row.type}:${row.slug}`);
    return { label: info?.name || row.slug, tag: TYPE_LABELS[row.type] || row.type, note: [info?.detail, `${number(row.visits)} visite${row.visits > 1 ? "s" : ""}`].filter(Boolean).join(" · "), value: row.views, href: info?.href };
  });
  box.append(rows.length ? barList(rows, "vue") : element("p", "admin-empty", "Aucune fiche consultée sur cette période."));
  return box;
}

function barList(rows, unit, percent = false) {
  const list = element("ol", "stats-bars");
  const max = Math.max(1, ...rows.map(row => row.value));
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  rows.forEach(row => {
    const item = element("li");
    const head = element("div", "stats-bar-head");
    const name = row.href ? element("a", "stats-bar-label link", row.label) : element("span", "stats-bar-label", row.label);
    if (row.href) { name.href = row.href; name.target = "_blank"; name.rel = "noopener"; }
    if (row.tag) head.append(element("span", "stats-bar-tag", row.tag));
    head.append(name, element("span", "stats-bar-value", percent && total ? `${number(row.value)} · ${Math.round((row.value / total) * 100)} %` : `${number(row.value)} ${unit}${row.value > 1 && unit !== "fois" ? "s" : ""}`));
    const track = element("div", "stats-bar-track"); const fill = element("div", "stats-bar-fill"); fill.style.width = `${Math.max(2, (row.value / max) * 100)}%`; track.append(fill);
    item.append(head, track);
    if (row.note) item.append(element("span", "stats-bar-note", row.note));
    list.append(item);
  });
  return list;
}
function detailsList(title, items) {
  const box = element("details", "stats-table"); box.append(element("summary", "", title));
  const list = element("ul", "stats-plain"); items.forEach(text => list.append(element("li", "", text))); box.append(list);
  return box;
}
function card(title, ...children) { const box = element("section", "stats-card"); box.append(element("h4", "", title), ...children.filter(Boolean)); return box; }
function grid(...cards) { const box = element("div", "stats-grid-cards"); box.append(...cards); return box; }
