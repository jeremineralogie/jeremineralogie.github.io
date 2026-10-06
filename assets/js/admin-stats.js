// Statistiques de l'admin (Paramètres → Statistiques) : périodes 1 / 3 / 7 / 15 / 30 jours, comparaison avec la période précédente, six onglets.
// Données : agrégats SQL admin_page_stats, admin_more_stats, admin_event_stats, admin_account_stats (période choisie et période précédente).
import { PERIODS, ranges, compareText, delta, percent, dailyPoints, hourlyPoints, niceStep, insights, toCsv } from "./admin-stats-logic.js";
import { loadResultNames, pagesSection, visitorsSection, gamesSection, accountsSection, fixSection } from "./admin-stats-more.js";
const $ = selector => document.querySelector(selector);
const SVG = "http://www.w3.org/2000/svg";
const COLORS = { views: "#9b6cf0", visits: "#d6a243" };
const PAGE_LABELS = {
  index: "Accueil", boutique: "Boutique", piece: "Fiches boutique", collection: "Ma collection", specimen: "Fiches collection",
  articles: "Articles (liste)", article: "Articles (lecture)", archives: "Archives & documentation", document: "Documents d’archive",
  carte: "Carte", recherche: "Recherche", fiche: "Fiches minéral / gisement / commune", departement: "Départements",
  apprendre: "Apprendre & identifier", jeux: "Jeux & quiz", favoris: "Mes favoris", introuvable: "Page introuvable (lien cassé)", contact: "Contact", identification: "Identification", reseaux: "Mes réseaux", legal: "Informations légales"
};
const TYPE_LABELS = { specimen: "Collection", piece: "Boutique", mineral: "Minéral", mine: "Gisement", locality: "Commune", article: "Article", archive: "Archive", departement: "Département" };
const DEVICE_LABELS = { mobile: "Téléphone", tablette: "Tablette", ordinateur: "Ordinateur" };
const TABS = [["overview", "Vue d’ensemble"], ["pages", "Pages & contenus"], ["visitors", "Visiteurs"], ["games", "Jeux & quiz"], ["accounts", "Comptes & clics"], ["fix", "À corriger"]];
const number = value => new Intl.NumberFormat("fr-FR").format(value || 0);
const element = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text != null) node.textContent = text; return node; };
const svg = (tag, attributes = {}) => { const node = document.createElementNS(SVG, tag); Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value)); return node; };
const remember = (key, value) => { try { sessionStorage.setItem(`jm-stats-${key}`, String(value)); } catch { /* stockage indisponible */ } };
const recall = key => { try { return sessionStorage.getItem(`jm-stats-${key}`); } catch { return null; } };

let client = null;
let bound = false;
let days = [1, 3, 7, 15, 30].includes(Number(recall("days"))) ? Number(recall("days")) : 7;
let tab = TABS.some(([id]) => id === recall("tab")) ? recall("tab") : "overview";
let entityFilter = "";
let view = null;          // tout ce qui est affiché : données, période précédente, noms lisibles
let names = new Map();
let requestId = 0;

export async function openStats(supabase) {
  client = supabase;
  document.documentElement.style.setProperty("--st-top", `${document.querySelector(".admin-topbar")?.offsetHeight || 50}px`);
  if (!bound) {
    bound = true;
    let resizeTimer = null;
    window.addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { if (view && !$("#stats-panel").hidden && tab === "overview") render(); }, 200); });
    const group = $("#stats-periods");
    group.replaceChildren(...PERIODS.map(period => {
      const button = element("button", "st-seg-btn", period.label); button.type = "button"; button.dataset.days = period.days; button.title = period.name;
      button.addEventListener("click", () => { days = period.days; remember("days", days); markPeriod(); void load(); });
      return button;
    }));
    markPeriod();
    // Purge des données de plus de 13 mois (durée maximale recommandée par la CNIL).
    const limit = new Date(); limit.setMonth(limit.getMonth() - 13);
    void client.from("page_views").delete().lt("created_at", limit.toISOString()).then(({ error }) => { if (error) console.error("Purge des statistiques :", error); });
    void client.from("site_events").delete().lt("created_at", limit.toISOString()).then(({ error }) => { if (error) console.error("Purge des événements :", error); });
  }
  await load();
}

function markPeriod() {
  document.querySelectorAll("#stats-periods .st-seg-btn").forEach(button => { const active = Number(button.dataset.days) === days; button.classList.toggle("is-active", active); button.setAttribute("aria-pressed", String(active)); });
}

async function load() {
  const mine = ++requestId;
  const status = $("#stats-status"), body = $("#stats-body");
  status.textContent = "Chargement des statistiques…"; status.hidden = false;
  const { from, to, previousFrom, previousTo } = ranges(days);
  $("#stats-range").textContent = `${rangeText(from, to)} · comparé ${compareText(days)}`;
  const iso = date => date.toISOString();
  const pageArgs = (a, b) => ({ p_from: iso(a), p_to: iso(b), p_bucket: "day" });
  const span = (a, b) => ({ p_from: iso(a), p_to: iso(b) });
  const [current, previous] = await Promise.all([client.rpc("admin_page_stats", pageArgs(from, to)), client.rpc("admin_page_stats", pageArgs(previousFrom, previousTo))]);
  if (mine !== requestId) return;
  if (current.error) { status.textContent = `Impossible de charger les statistiques : ${current.error.message}`; body.hidden = true; return; }
  // Détails : si les fonctions SQL ne sont pas encore créées, le tableau de bord de base reste affiché.
  const [more, events, accounts, moreBefore, eventsBefore, accountsBefore] = await Promise.all([
    client.rpc("admin_more_stats", span(from, to)), client.rpc("admin_event_stats", span(from, to)), client.rpc("admin_account_stats", span(from, to)),
    client.rpc("admin_more_stats", span(previousFrom, previousTo)), client.rpc("admin_event_stats", span(previousFrom, previousTo)), client.rpc("admin_account_stats", span(previousFrom, previousTo))
  ]);
  if (mine !== requestId) return;
  const extra = more.error ? null : { more: more.data, events: events.error ? null : events.data, accounts: accounts.error ? null : accounts.data };
  if (more.error) console.warn("Statistiques détaillées indisponibles :", more.error.message);
  const wanted = [...(current.data.entities || [])];
  (extra?.more.entries || []).forEach(row => { if (row.type && row.slug) wanted.push({ type: row.type, slug: row.slug }); });
  (extra?.events?.reads || []).forEach(row => wanted.push({ type: "article", slug: row.slug }));
  (extra?.events?.clicks || []).forEach(row => { if (row.name === "contact-piece" && row.detail) wanted.push({ type: "piece", slug: row.detail }); });
  [names] = await Promise.all([resolveNames(wanted), loadResultNames()]);
  if (mine !== requestId) return;
  view = { days, from, to, data: current.data, before: previous.data?.totals || null, extra, beforeExtra: { more: moreBefore.error ? null : moreBefore.data, events: eventsBefore.error ? null : eventsBefore.data, accounts: accountsBefore.error ? null : accountsBefore.data } };
  status.textContent = current.data.totals.views ? "" : "Aucune visite enregistrée sur cette période pour le moment.";
  status.hidden = !status.textContent;
  render();
}

function rangeText(from, to) {
  const day = date => date.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
  return days === 1 ? `Aujourd’hui, ${day(to)}` : `Du ${day(from)} au ${day(to)}`;
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


// ───────────── affichage ─────────────
function render() {
  const body = $("#stats-body");
  body.hidden = false;
  const ctx = context();
  renderTabs(ctx);
  const sections = { overview: overviewSection, pages: pagesSection, visitors: visitorsSection, games: gamesSection, accounts: accountsSection, fix: fixSection };
  body.replaceChildren(...(sections[tab] || overviewSection)(ctx));
}

function context() {
  const { data, before, extra, beforeExtra, from, to } = view;
  return { days: view.days, data, before, extra, beforeExtra, from, to, names, ui: { element, card, grid, barList, number, percent, PAGE_LABELS, TYPE_LABELS, DEVICE_LABELS, delta, chip, entitiesCard, svg } };
}

function renderTabs(ctx) {
  const nav = $("#stats-tabs");
  const broken = (ctx.extra?.more.broken || []).length + (ctx.extra?.more.empty_searches || []).length;
  nav.replaceChildren(...TABS.map(([id, label]) => {
    const button = element("button", `st-tab${id === tab ? " is-active" : ""}`, label); button.type = "button"; button.setAttribute("role", "tab"); button.setAttribute("aria-selected", String(id === tab));
    if (id === "fix" && broken) button.append(element("span", "st-badge", String(broken)));
    button.addEventListener("click", () => { tab = id; remember("tab", id); render(); window.scrollTo?.({ top: Math.max(0, nav.getBoundingClientRect().top + window.scrollY - 12), behavior: "smooth" }); });
    return button;
  }));
}

// Pastille d'évolution : flèche + pourcentage (jamais la couleur seule). goodWhen « down » : une baisse est une bonne nouvelle (visites d'une seule page).
function chip(change, goodWhen = "up") {
  if (!change) return element("span", "st-chip is-none", "—");
  const text = change.pct === null ? "▲ nouveau" : change.direction === "flat" ? "= stable" : `${change.direction === "up" ? "▲ +" : "▼ −"}${Math.abs(change.pct)} %`;
  const good = change.direction === "flat" ? "" : change.direction === goodWhen ? " is-good" : " is-bad";
  return element("span", `st-chip${good}${change.direction === "flat" ? " is-flat" : ""}`, text);
}

function overviewSection(ctx) {
  const { data, before, extra, beforeExtra, from, to } = ctx;
  const totals = data.totals, previousTotals = before;
  const points = ctx.days === 1 ? null : dailyPoints(data.series, from, to);
  const hourly = ctx.days === 1 ? hourlyPoints(extra?.more.hours, to) : null;
  const bounceNow = extra?.more.bounce?.visits ? percent(extra.more.bounce.single, extra.more.bounce.visits) : null;
  const bounceBefore = beforeExtra.more?.bounce?.visits ? percent(beforeExtra.more.bounce.single, beforeExtra.more.bounce.visits) : null;
  const plays = extra?.events ? extra.events.games.reduce((sum, row) => sum + (row.ends || 0), 0) : null;
  const playsBefore = beforeExtra.events ? beforeExtra.events.games.reduce((sum, row) => sum + (row.ends || 0), 0) : null;
  const shares = extra?.events ? extra.events.shares.reduce((sum, row) => sum + row.n, 0) : null;
  const sharesBefore = beforeExtra.events ? beforeExtra.events.shares.reduce((sum, row) => sum + row.n, 0) : null;
  const contactClicks = events => events ? events.clicks.filter(row => row.name === "contact-piece").reduce((sum, row) => sum + row.n, 0) : null;
  const contacts = contactClicks(extra?.events), contactsBefore = contactClicks(beforeExtra.events);
  const perVisit = totals.visits ? totals.views / totals.visits : 0;
  const perVisitBefore = previousTotals?.visits ? previousTotals.views / previousTotals.visits : null;
  const kpis = [
    { label: "Visites", value: number(totals.visits), change: delta(totals.visits, previousTotals?.visits), spark: points?.map(point => point.visits) },
    { label: "Pages vues", value: number(totals.views), change: delta(totals.views, previousTotals?.views), spark: points?.map(point => point.views) },
    { label: "Pages par visite", value: perVisit.toLocaleString("fr-FR", { maximumFractionDigits: 1 }), change: perVisitBefore == null ? null : delta(Math.round(perVisit * 10), Math.round(perVisitBefore * 10)) },
    { label: "Visites d’une page", value: bounceNow == null ? "—" : `${bounceNow} %`, change: bounceNow == null || bounceBefore == null ? null : delta(bounceNow, bounceBefore), goodWhen: "down" },
    { label: "Parties terminées", value: plays == null ? "—" : number(plays), change: plays == null || playsBefore == null ? null : delta(plays, playsBefore) },
    { label: "Images partagées", value: shares == null ? "—" : number(shares), change: shares == null || sharesBefore == null ? null : delta(shares, sharesBefore) },
    { label: "Clics « Me contacter »", value: contacts == null ? "—" : number(contacts), change: contacts == null || contactsBefore == null ? null : delta(contacts, contactsBefore) },
    { label: "Nouveaux comptes", value: extra?.accounts ? number(extra.accounts.new_in_period) : "—", change: extra?.accounts && beforeExtra.accounts ? delta(extra.accounts.new_in_period, beforeExtra.accounts.new_in_period) : null }
  ];
  const tiles = element("div", "st-kpis");
  kpis.forEach(item => {
    const tile = element("div", "st-kpi");
    tile.append(element("span", "st-kpi-label", item.label), element("strong", "st-kpi-value", item.value));
    const foot = element("div", "st-kpi-foot"); foot.append(chip(item.change, item.goodWhen || "up"));
    if (item.spark?.length > 1) foot.append(sparkline(item.spark));
    tile.append(foot); tiles.append(tile);
  });
  const notes = insights({ days: ctx.days, totals, previous: previousTotals, points, more: extra?.more, devices: data.devices, sources: data.sources,
    pageName: data.pages[0] ? PAGE_LABELS[data.pages[0].page] || data.pages[0].page : "", broken: (extra?.more.broken || []).length, emptySearches: (extra?.more.empty_searches || []).length });
  const insightBox = card("À retenir");
  if (!notes.length) insightBox.append(element("p", "admin-empty", "Pas encore assez de visites sur cette période pour en tirer des constats."));
  else {
    const list = element("ul", "st-insights");
    notes.forEach(note => {
      const item = element("li", `st-insight is-${note.tone}`);
      item.append(element("span", "st-insight-dot", note.tone === "up" ? "▲" : note.tone === "down" ? "▼" : note.tone === "warn" ? "!" : "•"));
      if (note.goto) { const link = element("button", "st-linkbtn", note.text); link.type = "button"; link.addEventListener("click", () => { tab = note.goto; remember("tab", tab); render(); }); item.append(link); }
      else item.append(element("span", "", note.text));
      list.append(item);
    });
    insightBox.append(list);
  }
  const topPages = card("Pages les plus vues", data.pages.length ? barList(data.pages.slice(0, 6).map(row => ({ label: PAGE_LABELS[row.page] || row.page, value: row.views, note: `${number(row.visits)} visite${row.visits > 1 ? "s" : ""}` })), "vue") : element("p", "admin-empty", "Aucune page vue."), more("Toutes les pages", "pages"));
  const topSources = card("D’où viennent les visiteurs", data.sources.length ? barList(data.sources.slice(0, 6).map(row => ({ label: row.source, value: row.visits })), "visite", true) : element("p", "admin-empty", "Aucune visite."), more("Détail des visiteurs", "visitors"));
  const triple = grid(insightBox, topPages, topSources); triple.classList.add("st-overview-grid");
  return [tiles, chartCard(ctx, points, hourly), triple, dailyDetail(ctx)];
}
function more(label, target) { const link = element("button", "st-linkbtn st-more", `${label} →`); link.type = "button"; link.addEventListener("click", () => { tab = target; remember("tab", tab); render(); }); return link; }

function sparkline(values) {
  const W = 84, H = 26, max = Math.max(1, ...values);
  const x = index => (index / (values.length - 1)) * (W - 2) + 1, y = value => H - 2 - (value / max) * (H - 5);
  const chart = svg("svg", { viewBox: `0 0 ${W} ${H}`, class: "st-spark", "aria-hidden": "true" });
  chart.append(svg("path", { d: values.map((value, index) => `${index ? "L" : "M"}${x(index).toFixed(1)},${y(value).toFixed(1)}`).join(" "), fill: "none", stroke: "#9b6cf0", "stroke-width": 1.6, "stroke-linejoin": "round", "stroke-linecap": "round" }));
  return chart;
}

// Graphique principal : visites et pages vues, par heure (aujourd'hui) ou par jour.
function chartCard(ctx, points, hourly) {
  const series = hourly
    ? hourly.map(point => ({ label: `${point.hour} h`, long: `${point.hour} h – ${point.hour + 1} h`, visits: point.visits, views: point.views }))
    : points.map(point => ({ label: point.date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }), long: point.date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }), visits: point.visits, views: point.views }));
  const box = card(hourly ? "Visites et pages vues, heure par heure" : "Visites et pages vues, jour par jour");
  const legend = element("div", "stats-legend");
  [["visits", "Visites"], ["views", "Pages vues"]].forEach(([key, label]) => { const item = element("span", "stats-legend-item"); const swatch = element("i"); swatch.style.background = COLORS[key]; item.append(swatch, label); legend.append(item); });
  box.append(legend);
  if (series.length < 2) { box.append(element("p", "admin-empty", "Le graphique apparaîtra dès qu’il y aura plusieurs points à comparer."), tableOf(series)); return box; }
  const W = Math.round(Math.max(280, Math.min(1000, ($("#stats-body").clientWidth || 720) - 34))), H = W < 500 ? 220 : 280, M = { top: 14, right: 12, bottom: 30, left: 38 };
  const max = Math.max(4, ...series.map(point => Math.max(point.views, point.visits)));
  const step = niceStep(max / 4), top = Math.ceil(max / step) * step;
  const x = index => M.left + (index / (series.length - 1)) * (W - M.left - M.right);
  const y = value => H - M.bottom - (value / top) * (H - M.top - M.bottom);
  const chart = svg("svg", { viewBox: `0 0 ${W} ${H}`, class: "stats-chart", role: "img", "aria-label": "Courbes des visites et des pages vues" });
  for (let value = 0; value <= top; value += step) {
    chart.append(svg("line", { x1: M.left, x2: W - M.right, y1: y(value), y2: y(value), class: "stats-grid" }));
    const label = svg("text", { x: M.left - 8, y: y(value) + 4, "text-anchor": "end", class: "stats-axis" }); label.textContent = number(value); chart.append(label);
  }
  const every = Math.max(1, Math.ceil(series.length / Math.max(3, Math.floor(W / 80))));
  series.forEach((point, index) => {
    if (index % every && index !== series.length - 1) return;
    if (index !== series.length - 1 && series.length - 1 - index <= every / 2) return;
    const label = svg("text", { x: x(index), y: H - 8, "text-anchor": index === 0 ? "start" : index === series.length - 1 ? "end" : "middle", class: "stats-axis" }); label.textContent = point.label; chart.append(label);
  });
  const line = key => series.map((point, index) => `${index ? "L" : "M"}${x(index).toFixed(1)},${y(point[key]).toFixed(1)}`).join(" ");
  chart.append(svg("path", { d: `${line("visits")} L${x(series.length - 1)},${y(0)} L${x(0)},${y(0)} Z`, fill: COLORS.visits, "fill-opacity": 0.1 }));
  ["views", "visits"].forEach(key => chart.append(svg("path", { d: line(key), fill: "none", stroke: COLORS[key], "stroke-width": 2, "stroke-linejoin": "round", "stroke-linecap": "round" })));
  const cross = svg("line", { y1: M.top, y2: H - M.bottom, class: "stats-cross", visibility: "hidden" });
  const dots = ["views", "visits"].map(key => svg("circle", { r: 4.5, fill: COLORS[key], stroke: "#0f0918", "stroke-width": 2, visibility: "hidden" }));
  const hit = svg("rect", { x: M.left, y: M.top, width: W - M.left - M.right, height: H - M.top - M.bottom, fill: "transparent" });
  chart.append(cross, ...dots, hit);
  const wrap = element("div", "stats-chart-wrap"); const tip = element("div", "stats-tip"); tip.hidden = true; wrap.append(chart, tip);
  const show = event => {
    const rect = chart.getBoundingClientRect();
    const px = ((event.touches?.[0] || event).clientX - rect.left) * (W / rect.width);
    const index = Math.max(0, Math.min(series.length - 1, Math.round(((px - M.left) / (W - M.left - M.right)) * (series.length - 1))));
    const point = series[index];
    cross.setAttribute("x1", x(index)); cross.setAttribute("x2", x(index)); cross.setAttribute("visibility", "visible");
    [["views", 0], ["visits", 1]].forEach(([key, slot]) => { dots[slot === 0 ? 0 : 1].setAttribute("cx", x(index)); dots[slot === 0 ? 0 : 1].setAttribute("cy", y(point[key])); dots[slot === 0 ? 0 : 1].setAttribute("visibility", "visible"); });
    tip.replaceChildren(element("strong", "", point.long), tipRow("visits", "Visites", point.visits), tipRow("views", "Pages vues", point.views));
    tip.hidden = false;
    tip.style.left = `${Math.min(Math.max((x(index) / W) * rect.width, 80), rect.width - 80)}px`;
  };
  const hide = () => { tip.hidden = true; cross.setAttribute("visibility", "hidden"); dots.forEach(dot => dot.setAttribute("visibility", "hidden")); };
  hit.addEventListener("pointermove", show); hit.addEventListener("pointerdown", show); hit.addEventListener("pointerleave", hide);
  box.append(wrap, tableOf(series));
  return box;
}
function tableOf(series) {
  const table = element("details", "stats-table");
  table.append(element("summary", "", "Voir les chiffres en tableau"));
  const tbl = element("table"); const head = element("tr");
  ["Période", "Visites", "Pages vues"].forEach(label => head.append(element("th", "", label))); tbl.append(head);
  series.slice().reverse().forEach(point => { const row = element("tr"); row.append(element("td", "", point.long), element("td", "", number(point.visits)), element("td", "", number(point.views))); tbl.append(row); });
  const scroll = element("div", "stats-scroll"); scroll.append(tbl); table.append(scroll);
  return table;
}
function tipRow(key, label, value) { const row = element("span", "stats-tip-row"); const swatch = element("i"); swatch.style.background = COLORS[key]; row.append(swatch, `${label} : `, element("b", "", number(value))); return row; }

// Détail jour par jour (période de plusieurs jours) avec export CSV.
function dailyDetail(ctx) {
  const rows = ctx.extra?.more.daily || [];
  if (ctx.days === 1 || !rows.length) return element("div");
  const box = card("Détail jour par jour");
  const day = value => new Date(`${String(value).slice(0, 10)}T12:00:00`).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
  const wrap = element("div", "stats-scroll"); const table = element("table", "stats-daily"); const head = element("tr");
  ["Jour", "Visites", "Pages vues", "Source principale", "Page la plus vue"].forEach(label => head.append(element("th", "", label))); table.append(head);
  rows.forEach(row => { const tr = element("tr"); tr.append(element("td", "", day(row.d)), element("td", "", number(row.visits)), element("td", "", number(row.views)), element("td", "", row.source || "—"), element("td", "", PAGE_LABELS[row.page] || row.page || "—")); table.append(tr); });
  wrap.append(table);
  const exportButton = element("button", "admin-secondary st-export", "Exporter en CSV"); exportButton.type = "button";
  exportButton.addEventListener("click", () => {
    const csv = toCsv(rows, [{ label: "Jour", value: row => String(row.d).slice(0, 10) }, { label: "Visites", value: row => row.visits }, { label: "Pages vues", value: row => row.views }, { label: "Source principale", value: row => row.source || "" }, { label: "Page la plus vue", value: row => PAGE_LABELS[row.page] || row.page || "" }]);
    const link = element("a"); link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); link.download = `statistiques-${ctx.days}j.csv`; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 2000);
  });
  box.append(wrap, exportButton);
  return box;
}

function entitiesCard(entities) {
  const box = card("Fiches les plus consultées");
  const types = [...new Set(entities.map(row => row.type))];
  if (entityFilter && !types.includes(entityFilter)) entityFilter = "";
  const chips = element("div", "stats-chips");
  [["", "Toutes"], ...types.map(type => [type, TYPE_LABELS[type] || type])].forEach(([type, label]) => {
    const item = element("button", `admin-tab${entityFilter === type ? " is-active" : ""}`, label); item.type = "button";
    item.addEventListener("click", () => { entityFilter = type; render(); });
    chips.append(item);
  });
  if (types.length > 1) box.append(chips);
  const rows = entities.filter(row => !entityFilter || row.type === entityFilter).slice(0, 25).map(row => {
    const info = names.get(`${row.type}:${row.slug}`);
    return { label: info?.name || row.slug, tag: TYPE_LABELS[row.type] || row.type, note: [info?.detail, `${number(row.visits)} visite${row.visits > 1 ? "s" : ""}`].filter(Boolean).join(" · "), value: row.views, href: info?.href };
  });
  box.append(rows.length ? barList(rows, "vue") : element("p", "admin-empty", "Aucune fiche consultée sur cette période."));
  return box;
}

function barList(rows, unit, percentage = false) {
  const list = element("ol", "stats-bars");
  const max = Math.max(1, ...rows.map(row => row.value));
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  rows.forEach(row => {
    const item = element("li");
    const head = element("div", "stats-bar-head");
    const name = row.href ? element("a", "stats-bar-label link", row.label) : element("span", "stats-bar-label", row.label);
    if (row.href) { name.href = row.href; name.target = "_blank"; name.rel = "noopener"; }
    if (row.tag) head.append(element("span", "stats-bar-tag", row.tag));
    head.append(name, element("span", "stats-bar-value", unit === "%" ? `${number(row.value)} %` : percentage && total ? `${number(row.value)} · ${Math.round((row.value / total) * 100)} %` : `${number(row.value)} ${unit}${row.value > 1 && unit !== "fois" ? "s" : ""}`));
    const track = element("div", "stats-bar-track"); const fill = element("div", "stats-bar-fill"); fill.style.width = `${Math.max(2, (row.value / max) * 100)}%`; track.append(fill);
    item.append(head, track);
    if (row.note) item.append(element("span", "stats-bar-note", row.note));
    list.append(item);
  });
  return list;
}
function card(title, ...children) { const box = element("section", "stats-card"); box.append(element("h4", "", title), ...children.filter(Boolean)); return box; }
function grid(...cards) { const box = element("div", "stats-grid-cards"); box.append(...cards); return box; }
