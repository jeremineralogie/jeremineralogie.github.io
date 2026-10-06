// Statistiques de l'admin : calculs sans affichage (périodes, comparaisons, séries complétées, constats automatiques, export).
export const PERIODS = [
  { days: 1, label: "1 j", name: "Aujourd’hui" },
  { days: 3, label: "3 j", name: "3 derniers jours" },
  { days: 7, label: "7 j", name: "7 derniers jours" },
  { days: 15, label: "15 j", name: "15 derniers jours" },
  { days: 30, label: "30 j", name: "30 derniers jours" }
];

const startOfDay = date => { const copy = new Date(date); copy.setHours(0, 0, 0, 0); return copy; };
const shiftDays = (date, days) => { const copy = new Date(date); copy.setDate(copy.getDate() + days); return copy; };

// Période choisie : aujourd'hui compris (« 7 j » = aujourd'hui et les 6 jours précédents), comparée à la période juste avant, à la même heure.
export function ranges(days, now = new Date()) {
  const from = shiftDays(startOfDay(now), -(days - 1));
  return { from, to: now, previousFrom: shiftDays(from, -days), previousTo: shiftDays(now, -days) };
}

export function periodTitle(days) { return PERIODS.find(period => period.days === days)?.name || `${days} jours`; }
// « à hier à la même heure » / « aux 7 jours précédents » : complément de « comparé » ou de « par rapport ».
export function compareText(days) { return days === 1 ? "à hier à la même heure" : `aux ${days} jours précédents`; }

// Évolution entre deux valeurs : { pct, direction } ; null quand il n'y a rien à comparer.
export function delta(now, before) {
  if (before == null) return null;
  if (!before) return now ? { pct: null, direction: "up" } : { pct: 0, direction: "flat" };
  const pct = Math.round(((now - before) / before) * 100);
  return { pct, direction: pct > 0 ? "up" : pct < 0 ? "down" : "flat" };
}
export const percent = (part, total) => total ? Math.round((part / total) * 100) : 0;

const keyOf = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

// Un point par jour de la période, complété par des zéros.
export function dailyPoints(series, from, to) {
  const found = new Map((series || []).map(row => [String(row.t).slice(0, 10), row]));
  const points = [];
  for (const cursor = startOfDay(from); cursor <= to; cursor.setDate(cursor.getDate() + 1)) {
    const row = found.get(keyOf(cursor));
    points.push({ date: new Date(cursor), views: row?.views || 0, visits: row?.visits || 0 });
  }
  return points;
}

// Un point par heure (de minuit à l'heure actuelle) pour la période « aujourd'hui ».
export function hourlyPoints(hours, now = new Date()) {
  const found = new Map((hours || []).map(row => [row.h, row]));
  return Array.from({ length: now.getHours() + 1 }, (_, hour) => ({ hour, views: found.get(hour)?.views || 0, visits: found.get(hour)?.visits || 0 }));
}

// Pas « rond » pour l'axe vertical.
export function niceStep(raw) {
  const power = 10 ** Math.floor(Math.log10(Math.max(raw, 1)));
  const unit = raw / power;
  return (unit <= 1 ? 1 : unit <= 2 ? 2 : unit <= 5 ? 5 : 10) * power;
}

const WEEKDAYS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
const fr = new Intl.NumberFormat("fr-FR");
const plural = (count, one, many) => `${fr.format(count)} ${count > 1 ? many : one}`;

// Constats lisibles tirés des chiffres (aucune interprétation : seulement ce que les données montrent).
export function insights({ days, totals, previous, points, more, devices, sources, pageName, broken = 0, emptySearches = 0 }) {
  const out = [];
  if (!totals.visits) return out;
  const change = delta(totals.visits, previous?.visits);
  if (change) {
    const text = change.pct === null ? "nouvelle activité" : change.pct === 0 ? "stable" : `${change.pct > 0 ? "+" : "−"}${Math.abs(change.pct)} %`;
    out.push({ tone: change.direction === "down" ? "down" : change.direction === "up" ? "up" : "flat", text: `${plural(totals.visits, "visite", "visites")} : ${text} par rapport ${compareText(days)}.` });
  }
  if (days > 1 && points?.length) {
    const best = points.reduce((top, point) => point.visits > top.visits ? point : top, points[0]);
    if (best.visits) out.push({ tone: "info", text: `Meilleur jour : ${best.date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} (${plural(best.visits, "visite", "visites")}).` });
  }
  if (more?.hours?.length) {
    const top = more.hours.reduce((best, row) => row.visits > best.visits ? row : best, more.hours[0]);
    const all = more.hours.reduce((sum, row) => sum + row.visits, 0);
    if (top.visits) out.push({ tone: "info", text: `Heure la plus active : ${top.h} h (${percent(top.visits, all)} % des visites, heure de Paris).` });
  }
  if (days >= 7 && more?.weekdays?.length) {
    const top = more.weekdays.reduce((best, row) => row.visits > best.visits ? row : best, more.weekdays[0]);
    if (top.visits) out.push({ tone: "info", text: `Jour de la semaine le plus actif : ${WEEKDAYS[top.dow - 1]}.` });
  }
  const totalSources = (sources || []).reduce((sum, row) => sum + row.visits, 0);
  if (totalSources) out.push({ tone: "info", text: `Source principale : ${sources[0].source} (${percent(sources[0].visits, totalSources)} % des visites).` });
  const totalDevices = (devices || []).reduce((sum, row) => sum + row.visits, 0);
  const mobile = (devices || []).filter(row => row.device !== "ordinateur").reduce((sum, row) => sum + row.visits, 0);
  if (totalDevices) out.push({ tone: "info", text: `${percent(mobile, totalDevices)} % des visites se font sur téléphone ou tablette.` });
  if (more?.bounce?.visits) out.push({ tone: "info", text: `${percent(more.bounce.single, more.bounce.visits)} % des visites s'arrêtent à une seule page.` });
  if (pageName) out.push({ tone: "info", text: `Page la plus vue : ${pageName}.` });
  if (broken) out.push({ tone: "warn", text: `${plural(broken, "lien cassé détecté", "liens cassés détectés")} : onglet « À corriger ».`, goto: "fix" });
  if (emptySearches) out.push({ tone: "warn", text: `${plural(emptySearches, "recherche sans résultat", "recherches sans résultat")} : onglet « À corriger ».`, goto: "fix" });
  return out;
}

// Export du détail jour par jour (séparateur « ; » et virgule décimale : s'ouvre directement dans Excel en français).
export function toCsv(rows, columns) {
  const cell = value => `"${String(value ?? "").replace(/"/g, '""')}"`;
  return `﻿${[columns.map(column => cell(column.label)).join(";"), ...rows.map(row => columns.map(column => cell(column.value(row))).join(";"))].join("\r\n")}`;
}
