// Statistiques de l'admin : éléments d'affichage partagés par toutes les pages (chiffres clés, courbe, tableaux avec barres).
import { bucketFor, niceStep, compareText } from "./admin-stats-logic.js";

const SVG = "http://www.w3.org/2000/svg";
export const SERIES_COLORS = ["#9b6cf0", "#d6a243"];
export const number = value => new Intl.NumberFormat("fr-FR").format(Math.round(value || 0));
export const element = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text != null) node.textContent = text; return node; };
const svg = (tag, attributes = {}) => { const node = document.createElementNS(SVG, tag); Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value)); return node; };

export const card = (title, ...children) => { const box = element("section", "stats-card"); if (title) box.append(element("h4", "", title)); box.append(...children.filter(Boolean)); return box; };
export const note = text => element("p", "stats-note", text);
export const empty = text => element("p", "admin-empty", text);
export const grid = (...cards) => { const box = element("div", "stats-grid-cards"); box.append(...cards); return box; };

// Chiffres clés : un grand nombre, son intitulé, et l'écart avec la période précédente (flèche + nombre, jamais de pourcentage).
export function kpis(ctx, items) {
  const row = element("div", `st-kpis st-kpis-${items.length}`);
  items.forEach(item => {
    const tile = element("div", "st-kpi");
    tile.append(element("span", "st-kpi-label", item.label), element("strong", "st-kpi-value", item.text != null ? item.text : item.value == null ? "—" : item.decimals ? Number(item.value).toLocaleString("fr-FR", { maximumFractionDigits: item.decimals }) : number(item.value)));
    const foot = element("div", "st-kpi-foot");
    if (item.value != null && item.before != null && item.text == null) {
      const diff = Math.round((item.value - item.before) * 10) / 10;
      const chip = element("span", `st-chip${diff > 0 ? " is-good" : diff < 0 ? " is-bad" : " is-flat"}`, diff > 0 ? `▲ +${diff.toLocaleString("fr-FR")}` : diff < 0 ? `▼ −${(-diff).toLocaleString("fr-FR")}` : "= stable");
      chip.title = `Par rapport ${compareText(ctx.days)}`;
      foot.append(chip);
    }
    if (item.note) foot.append(element("span", "st-kpi-note", item.note));
    tile.append(foot); row.append(tile);
  });
  return row;
}

// Tableau classé : la colonne « principale » porte une barre proportionnelle ; les autres colonnes sont des nombres ou du texte.
// columns : [{ label, key, bar?, text? }] — rows : [{ label, href?, tag?, <key>: valeur }]
export function rankTable(columns, rows, { first = "", limit = 10, emptyText = "Rien à afficher sur cette période." } = {}) {
  if (!rows.length) return empty(emptyText);
  const wrap = element("div", "st-table-wrap"); const table = element("table", "st-table");
  const head = element("tr"); head.append(element("th", "", first));
  columns.forEach(column => head.append(element("th", column.text ? "is-text" : "", column.label)));
  const thead = element("thead"); thead.append(head); table.append(thead);
  const body = element("tbody");
  const shown = rows.slice(0, limit);
  const max = Math.max(1, ...shown.map(row => Number(row[columns.find(column => column.bar)?.key]) || 0));
  shown.forEach(row => {
    const tr = element("tr");
    const name = element("td", "st-name");
    const label = row.href ? Object.assign(element("a", "link", row.label), { href: row.href, target: "_blank", rel: "noopener" }) : element("span", "", row.label);
    name.append(label); if (row.tag) name.append(element("small", "", row.tag));
    tr.append(name);
    columns.forEach(column => {
      const value = row[column.key];
      const cell = element("td", column.text ? "is-text" : "");
      if (column.text) cell.textContent = value ?? "—";
      else if (column.bar) {
        cell.classList.add("st-barcell");
        const bar = element("i"); bar.style.width = `${value ? Math.max(3, (value / max) * 100) : 0}%`;
        const track = element("span", "st-bartrack"); track.append(bar);
        cell.append(element("b", "", number(value)), track);
      }
      else cell.textContent = value == null ? "—" : number(value);
      tr.append(cell);
    });
    body.append(tr);
  });
  table.append(body); wrap.append(table);
  if (rows.length > limit) wrap.append(note(`Les ${limit} premiers sur ${number(rows.length)}.`));
  return wrap;
}

// Série de points pour la courbe : un point par jour (semaine ou mois pour les longues périodes), complété par des zéros.
// perDay : Map « AAAA-MM-JJ » → { clé: nombre } ; keys : clés des séries.
export function timeline(ctx, perDay, keys) {
  const pad = value => String(value).padStart(2, "0");
  const keyOf = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const days = [];
  for (const cursor = new Date(ctx.from.getFullYear(), ctx.from.getMonth(), ctx.from.getDate()); cursor <= ctx.to; cursor.setDate(cursor.getDate() + 1)) {
    const row = perDay.get(keyOf(cursor));
    days.push({ date: new Date(cursor), ...Object.fromEntries(keys.map(key => [key, row?.[key] || 0])) });
  }
  const bucket = bucketFor(ctx.days);
  if (bucket === "day") return { bucket, points: days.map(point => ({ ...point, start: point.date, end: point.date })) };
  const groups = new Map();
  days.forEach(point => {
    const start = new Date(point.date);
    if (bucket === "week") start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); else start.setDate(1);
    const key = keyOf(start);
    const group = groups.get(key) || { date: start, start, end: point.date, ...Object.fromEntries(keys.map(k => [k, 0])) };
    keys.forEach(k => { group[k] += point[k]; }); group.end = point.date; groups.set(key, group);
  });
  return { bucket, points: [...groups.values()] };
}
export const dayMap = (rows, dateKey, valueFn) => { const map = new Map(); (rows || []).forEach(row => { const key = String(row[dateKey]).slice(0, 10); map.set(key, { ...(map.get(key) || {}), ...valueFn(row, map.get(key) || {}) }); }); return map; };

// Courbe : une ou deux séries, survol (repère + bulle), légende quand il y a deux séries, chiffres en tableau repliable.
export function lineChart(ctx, title, { points, bucket, hourly }, series) {
  const box = card(title);
  const dayText = (date, options) => date.toLocaleDateString("fr-FR", options);
  const rows = hourly
    ? hourly.map(point => ({ label: `${point.hour} h`, long: `${point.hour} h – ${point.hour + 1} h`, ...point }))
    : points.map(point => ({
      ...point,
      label: bucket === "month" ? dayText(point.date, { month: "short", year: "2-digit" }) : dayText(point.date, { day: "numeric", month: "short" }),
      long: bucket === "month" ? dayText(point.date, { month: "long", year: "numeric" })
        : bucket === "week" ? `Semaine du ${dayText(point.start, { day: "numeric", month: "long" })} au ${dayText(point.end, { day: "numeric", month: "long" })}`
        : dayText(point.date, { weekday: "long", day: "numeric", month: "long" })
    }));
  if (series.length > 1) {
    const legend = element("div", "stats-legend");
    series.forEach((item, index) => { const swatch = element("i"); swatch.style.background = SERIES_COLORS[index]; const entry = element("span", "stats-legend-item"); entry.append(swatch, item.label); legend.append(entry); });
    box.append(legend);
  }
  if (rows.length < 2 || rows.every(row => series.every(item => !row[item.key]))) {
    box.append(empty(rows.length < 2 ? "Le graphique apparaît à partir de 3 jours d’historique." : "Aucune donnée sur cette période."));
    return box;
  }
  const W = Math.round(Math.max(280, Math.min(1000, (document.querySelector("#stats-body")?.clientWidth || 720) - 34))), H = W < 500 ? 200 : 260, M = { top: 14, right: 12, bottom: 28, left: 38 };
  const max = Math.max(4, ...rows.map(row => Math.max(...series.map(item => row[item.key] || 0))));
  const step = niceStep(max / 4), top = Math.ceil(max / step) * step;
  const x = index => M.left + (index / (rows.length - 1)) * (W - M.left - M.right);
  const y = value => H - M.bottom - (value / top) * (H - M.top - M.bottom);
  const chart = svg("svg", { viewBox: `0 0 ${W} ${H}`, class: "stats-chart", role: "img", "aria-label": title });
  for (let value = 0; value <= top; value += step) {
    chart.append(svg("line", { x1: M.left, x2: W - M.right, y1: y(value), y2: y(value), class: "stats-grid" }));
    const label = svg("text", { x: M.left - 8, y: y(value) + 4, "text-anchor": "end", class: "stats-axis" }); label.textContent = number(value); chart.append(label);
  }
  const every = Math.max(1, Math.ceil(rows.length / Math.max(3, Math.floor(W / 80))));
  rows.forEach((row, index) => {
    if ((index % every && index !== rows.length - 1) || (index !== rows.length - 1 && rows.length - 1 - index <= every / 2)) return;
    const label = svg("text", { x: x(index), y: H - 8, "text-anchor": index === 0 ? "start" : index === rows.length - 1 ? "end" : "middle", class: "stats-axis" }); label.textContent = row.label; chart.append(label);
  });
  const path = key => rows.map((row, index) => `${index ? "L" : "M"}${x(index).toFixed(1)},${y(row[key] || 0).toFixed(1)}`).join(" ");
  if (series.length === 1) chart.append(svg("path", { d: `${path(series[0].key)} L${x(rows.length - 1)},${y(0)} L${x(0)},${y(0)} Z`, fill: SERIES_COLORS[0], "fill-opacity": 0.12 }));
  series.forEach((item, index) => chart.append(svg("path", { d: path(item.key), fill: "none", stroke: SERIES_COLORS[index], "stroke-width": 2, "stroke-linejoin": "round", "stroke-linecap": "round" })));
  const cross = svg("line", { y1: M.top, y2: H - M.bottom, class: "stats-cross", visibility: "hidden" });
  const dots = series.map((item, index) => svg("circle", { r: 4.5, fill: SERIES_COLORS[index], stroke: "#0f0918", "stroke-width": 2, visibility: "hidden" }));
  const hit = svg("rect", { x: M.left, y: M.top, width: W - M.left - M.right, height: H - M.top - M.bottom, fill: "transparent" });
  chart.append(cross, ...dots, hit);
  const wrap = element("div", "stats-chart-wrap"); const tip = element("div", "stats-tip"); tip.hidden = true; wrap.append(chart, tip);
  const show = event => {
    const rect = chart.getBoundingClientRect();
    const px = ((event.touches?.[0] || event).clientX - rect.left) * (W / rect.width);
    const index = Math.max(0, Math.min(rows.length - 1, Math.round(((px - M.left) / (W - M.left - M.right)) * (rows.length - 1))));
    const row = rows[index];
    cross.setAttribute("x1", x(index)); cross.setAttribute("x2", x(index)); cross.setAttribute("visibility", "visible");
    dots.forEach((dot, slot) => { dot.setAttribute("cx", x(index)); dot.setAttribute("cy", y(row[series[slot].key] || 0)); dot.setAttribute("visibility", "visible"); });
    tip.replaceChildren(element("strong", "", row.long), ...series.map((item, slot) => {
      const line = element("span", "stats-tip-row"); const swatch = element("i"); swatch.style.background = SERIES_COLORS[slot];
      line.append(swatch, `${item.label} : `, element("b", "", number(row[item.key]))); return line;
    }));
    tip.hidden = false; tip.style.left = `${Math.min(Math.max((x(index) / W) * rect.width, 80), rect.width - 80)}px`;
  };
  const hide = () => { tip.hidden = true; cross.setAttribute("visibility", "hidden"); dots.forEach(dot => dot.setAttribute("visibility", "hidden")); };
  hit.addEventListener("pointermove", show); hit.addEventListener("pointerdown", show); hit.addEventListener("pointerleave", hide);
  box.append(wrap);
  const details = element("details", "stats-table"); details.append(element("summary", "", "Voir les chiffres en tableau"));
  const table = element("table"); const head = element("tr");
  ["Période", ...series.map(item => item.label)].forEach(label => head.append(element("th", "", label))); table.append(head);
  rows.slice().reverse().forEach(row => { const tr = element("tr"); tr.append(element("td", "", row.long), ...series.map(item => element("td", "", number(row[item.key])))); table.append(tr); });
  const scroll = element("div", "stats-scroll"); scroll.append(table); details.append(scroll); box.append(details);
  return box;
}

// Durée lisible : 125 s → « 2 min 05 s ».
export const duration = seconds => seconds == null ? "—" : seconds < 60 ? `${Math.round(seconds)} s` : `${Math.floor(seconds / 60)} min ${String(Math.round(seconds % 60)).padStart(2, "0")} s`;

// Histogramme en colonnes (heures de la journée, jours de la semaine) : la colonne la plus haute est mise en avant.
// items : [{ label, value, long }]
export function columnChart(title, items, { emptyText = "Pas encore de données.", every = 1, caption = null } = {}) {
  const box = card(title);
  if (caption) box.append(element("p", "st-peak", caption));
  const max = Math.max(0, ...items.map(item => item.value));
  if (!max) { box.append(empty(emptyText)); return box; }
  const chart = element("div", "st-cols"); chart.style.gridTemplateColumns = `repeat(${items.length}, minmax(0, 1fr))`;
  items.forEach((item, index) => {
    const column = element("div", `st-col${item.value === max ? " is-peak" : ""}`); column.title = `${item.long || item.label} : ${number(item.value)}`;
    const bar = element("i"); bar.style.height = `${item.value ? Math.max(3, (item.value / max) * 100) : 0}%`;
    column.append(element("b", "", item.value === max || items.length <= 7 ? number(item.value) : ""), bar, element("span", "", index % every === 0 ? item.label : ""));
    chart.append(column);
  });
  box.append(chart);
  return box;
}
