// Statistiques de l'admin : contenu des onglets (pages, visiteurs, jeux et quiz, comptes et clics, à corriger).
// Les fonctions de dessin (cartes, barres) viennent de admin-stats.js ; les données de admin_more_stats(), admin_event_stats() et admin_account_stats().
const GAME_LABELS = { mineral: "Trouve le minéral", quiz: "Le quiz du jour", geo: "Devine le gisement", "persona-mineral": "Quel minéral es-tu ?", "persona-prospecteur": "Quel prospecteur es-tu ?", "persona-outil": "Quel outil de prospecteur es-tu ?", "persona-collectionneur": "Quel collectionneur es-tu ?", "persona-forme": "Quelle forme cristalline es-tu ?", "vrai-faux": "Vrai ou faux minéralogique", "plus-dur": "Plus dur ou moins dur ?", pendu: "Le pendu minéralogique", "classe-les": "Classe-les !", glossaire: "Le glossaire en défi" };
const WEEKDAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const resultNames = new Map();

export async function loadResultNames() {
  if (resultNames.size) return;
  try {
    const [{ QUIZ }, { QUIZ_PROSPECTEUR }, { QUIZ_OUTIL }, { QUIZ_COLLECTIONNEUR }, { QUIZ_FORME }] = await Promise.all([import("./quiz-data.js"), import("./quiz-prospecteur-data.js"), import("./quiz-outil-data.js"), import("./quiz-collectionneur-data.js"), import("./quiz-forme-data.js")]);
    QUIZ.minerals.forEach(item => resultNames.set(`persona-mineral:${item.slug}`, item.name));
    QUIZ_PROSPECTEUR.profiles.forEach(item => resultNames.set(`persona-prospecteur:${item.slug}`, item.name));
    QUIZ_OUTIL.profiles.forEach(item => resultNames.set(`persona-outil:${item.slug}`, item.name));
    QUIZ_COLLECTIONNEUR.profiles.forEach(item => resultNames.set(`persona-collectionneur:${item.slug}`, item.name));
    QUIZ_FORME.profiles.forEach(item => resultNames.set(`persona-forme:${item.slug}`, item.name));
  } catch (error) { console.error("Noms des résultats de quiz :", error); }
}


const pluralText = (count, one, many) => `${new Intl.NumberFormat("fr-FR").format(count)} ${count > 1 ? many : one}`;
const notReady = ui => [ui.card("Statistiques détaillées", ui.element("p", "admin-empty", "Ces statistiques seront disponibles dès que la mise à jour de la base de données aura été appliquée."))];

// ───── Pages & contenus ─────
export function pagesSection(ctx) {
  const { data, extra, names, ui } = ctx; const { element, card, grid, barList, number, PAGE_LABELS, TYPE_LABELS, entitiesCard } = ui;
  const empty = text => element("p", "admin-empty", text);
  const pageName = row => { const info = row.type && row.slug ? names.get(`${row.type}:${row.slug}`) : null; return info?.name || (row.slug ? `${TYPE_LABELS[row.type] || row.type} : ${row.slug}` : PAGE_LABELS[row.page] || row.page); };
  const out = [grid(
    card("Pages les plus vues", data.pages.length ? barList(data.pages.map(row => ({ label: PAGE_LABELS[row.page] || row.page, value: row.views, note: `${number(row.visits)} visite${row.visits > 1 ? "s" : ""}` })), "vue") : empty("Aucune page vue sur cette période.")),
    entitiesCard(data.entities)
  )];
  if (!extra) return [...out, ...notReady(ui)];
  const { more, events } = extra;
  out.push(grid(
    card("Pages d’entrée", more.entries.length ? barList(more.entries.map(row => ({ label: pageName(row), value: row.visits, href: row.type ? names.get(`${row.type}:${row.slug}`)?.href : null })), "visite") : empty("Pas encore de données."), element("p", "stats-note", "Première page vue par les visiteurs arrivés sur le site.")),
    card("Pages de sortie", more.exits.length ? barList(more.exits.map(row => ({ label: PAGE_LABELS[row.page] || row.page, value: row.visits })), "visite") : empty("Pas encore de données."), element("p", "stats-note", "Dernière page vue avant de quitter le site."))
  ));
  if (events) out.push(card("Articles lus jusqu’au bout", events.reads.length ? barList(events.reads.map(row => ({ label: names.get(`article:${row.slug}`)?.name || row.slug, value: row.n, href: names.get(`article:${row.slug}`)?.href })), "lecture") : empty("Aucune lecture complète enregistrée sur cette période."),
    element("p", "stats-note", "Compté quand un visiteur passe au moins 15 secondes sur l’article et en parcourt 90 %.")));
  return out;
}

// ───── Visiteurs ─────
export function visitorsSection(ctx) {
  const { data, extra, from, to, ui } = ctx; const { element, card, grid, barList, number, percent, DEVICE_LABELS } = ui;
  const empty = text => element("p", "admin-empty", text);
  const out = [grid(
    card("Provenance des visiteurs", data.sources.length ? barList(data.sources.map(row => ({ label: row.source, value: row.visits })), "visite", true) : empty("Aucune visite sur cette période."),
      data.referrers.length ? (() => { const box = element("details", "stats-table"); box.append(element("summary", "", "Sites exacts")); const list = element("ul", "stats-plain"); data.referrers.forEach(row => list.append(element("li", "", `${row.host} — ${number(row.visits)}`))); box.append(list); return box; })() : null),
    card("Appareils utilisés", data.devices.length ? barList(data.devices.map(row => ({ label: DEVICE_LABELS[row.device] || row.device, value: row.visits })), "visite", true) : empty("Aucune visite sur cette période."))
  )];
  if (!extra) return [...out, ...notReady(ui)];
  const { more } = extra;
  const hoursChart = rows => {
    const byHour = new Map(rows.map(row => [row.h, row.visits])); const max = Math.max(1, ...rows.map(row => row.visits));
    const chart = element("div", "stats-hours");
    for (let hour = 0; hour < 24; hour += 1) {
      const value = byHour.get(hour) || 0; const column = element("div", "stats-hour"); column.title = `${hour} h : ${pluralText(value, "visite", "visites")}`;
      const bar = element("i"); bar.style.height = `${value ? Math.max(4, (value / max) * 100) : 0}%`;
      column.append(bar, element("span", "", hour % 3 === 0 ? String(hour) : "")); chart.append(column);
    }
    return chart;
  };
  const counts = Array(7).fill(0);
  for (const cursor = new Date(from); cursor <= to; cursor.setDate(cursor.getDate() + 1)) counts[(cursor.getDay() + 6) % 7] += 1;
  const bounce = more.bounce;
  const bounceCard = card("Visites d’une seule page", bounce.visits ? element("p", "stats-big", `${percent(bounce.single, bounce.visits)} %`) : empty("Pas encore de données."),
    bounce.visits ? element("p", "stats-note", `${pluralText(bounce.single, "visite", "visites")} sur ${number(bounce.visits)} se sont arrêtées à une seule page. Plus ce chiffre est bas, plus les visiteurs explorent le site.`) : null,
    bounce.visits && bounce.sources.some(row => row.visits >= 3) ? barList(bounce.sources.filter(row => row.visits >= 3).map(row => ({ label: row.source, value: percent(row.single, row.visits), note: `${number(row.single)} sur ${number(row.visits)} visites` })), "%") : null);
  out.push(grid(
    card("Heures de la journée (heure de Paris)", more.hours.length ? hoursChart(more.hours) : empty("Pas encore de données.")),
    card("Jours de la semaine", more.weekdays.length ? (() => {
      const values = WEEKDAYS.map((label, index) => more.weekdays.find(item => item.dow === index + 1)?.visits || 0);
      const max = Math.max(1, ...values);
      const chart = element("div", "st-days");
      WEEKDAYS.forEach((label, index) => {
        const column = element("div", "st-day"); column.title = `${label} : ${pluralText(values[index], "visite", "visites")}${counts[index] ? ` · ${(values[index] / counts[index]).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} par ${label.toLowerCase()} en moyenne` : ""}`;
        const bar = element("i"); bar.style.height = `${values[index] ? Math.max(4, (values[index] / max) * 100) : 0}%`;
        column.append(element("b", "", number(values[index])), bar, element("span", "", label.slice(0, 3))); chart.append(column);
      });
      return chart;
    })() : empty("Pas encore de données."), element("p", "stats-note", "Visites cumulées sur la période, par jour de la semaine.")),
    bounceCard
  ));
  return out;
}

// ───── Jeux & quiz ─────
  const shareLabel = file => ({ "vrai-faux-mineralogique": "Vrai ou faux minéralogique", "glossaire-en-defi": "Le glossaire en défi", "plus-dur-ou-moins-dur": "Plus dur ou moins dur ?", "pendu-mineralogique": "Le pendu minéralogique", "classe-les": "Classe-les !" }[file] || (file.startsWith("mineral-") ? "Quel minéral es-tu ?" : file.startsWith("prospecteur-") ? "Quel prospecteur es-tu ?" : file.startsWith("outil-") ? "Quel outil de prospecteur es-tu ?" : file.startsWith("collectionneur-") ? "Quel collectionneur es-tu ?" : file.startsWith("forme-") ? "Quelle forme cristalline es-tu ?" : "Jeux du jour"));

export function gamesSection(ctx) {
  const { extra, days, ui } = ctx; const { element, card, grid, barList, number, percent } = ui;
  const empty = text => element("p", "admin-empty", text);
  if (!extra?.events) return notReady(ui);
  const { events } = extra;
  const starts = events.games.reduce((sum, row) => sum + (row.starts || 0), 0), ends = events.games.reduce((sum, row) => sum + (row.ends || 0), 0);
  const players = Math.max(0, ...events.games.map(row => row.players || 0));
  const tiles = element("div", "st-kpis st-kpis-4");
  [["Parties commencées", number(starts)], ["Parties terminées", number(ends)], ["Taux d’achèvement", starts ? `${percent(ends, starts)} %` : "—"], ["Images partagées", number(events.shares.reduce((sum, row) => sum + row.n, 0))]].forEach(([label, value]) => {
    const tile = element("div", "st-kpi"); tile.append(element("span", "st-kpi-label", label), element("strong", "st-kpi-value", value)); tiles.append(tile);
  });
  const games = events.games.map(row => ({ label: GAME_LABELS[row.name] || row.name, value: row.ends, note: `${pluralText(row.starts, "partie commencée", "parties commencées")} · ${pluralText(row.ends, "terminée", "terminées")}${row.starts ? ` (${percent(row.ends, row.starts)} %)` : ""}${row.avg != null && !row.name.startsWith("persona-") ? ` · moyenne ${Number(row.avg).toLocaleString("fr-FR")}` : ""}` }));
  const personaNames = ["persona-mineral", "persona-prospecteur", "persona-outil", "persona-collectionneur", "persona-forme"];
  const withResults = personaNames.filter(name => events.results.some(row => row.name === name));
  const personas = withResults.length ? withResults.map(name => card(`Résultats : ${GAME_LABELS[name]}`, barList(events.results.filter(row => row.name === name).slice(0, 12).map(row => ({ label: resultNames.get(`${name}:${row.detail}`) || row.detail, value: row.n })), "fois")))
    : [card("Résultats des quiz « Quel … es-tu ? »", empty("Pas encore de résultats sur cette période."))];
  const out = [tiles, grid(
    card("Parties terminées par jeu", games.length ? barList(games, "partie") : empty(`Aucune partie enregistrée sur ${days === 1 ? "la journée" : "cette période"} pour le moment.`)),
    card("Partages d’images", events.shares.length ? barList(events.shares.map(row => ({ label: shareLabel(row.name), value: row.n })), "fois") : empty("Aucun partage sur cette période."))
  ), grid(...personas)];
  if (events.daily.length && days > 1) {
    const details = element("details", "stats-table"); details.append(element("summary", "", "Parties jour par jour"));
    const table = element("table", "stats-daily"); const head = element("tr");
    ["Jour", "Commencées", "Terminées"].forEach(label => head.append(element("th", "", label))); table.append(head);
    events.daily.forEach(row => { const tr = element("tr"); tr.append(element("td", "", new Date(`${String(row.d).slice(0, 10)}T12:00:00`).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })), element("td", "", number(row.starts)), element("td", "", number(row.ends))); table.append(tr); });
    const scroll = element("div", "stats-scroll"); scroll.append(table); details.append(scroll); out.push(details);
  }
  void players;
  return out;
}

// ───── Comptes & clics ─────
export function accountsSection(ctx) {
  const { extra, names, ui } = ctx; const { element, card, grid, barList, number, PAGE_LABELS } = ui;
  const empty = text => element("p", "admin-empty", text);
  const out = [];
  const accounts = extra?.accounts;
  if (accounts) {
    const tiles = element("div", "st-kpis st-kpis-4");
    [["Comptes créés", number(accounts.total), `dont ${number(accounts.identifiant)} avec identifiant, ${number(accounts.google)} avec Google`],
     ["Nouveaux comptes", number(accounts.new_in_period), "sur la période choisie"],
     ["Actifs sur 7 jours", number(accounts.active_7), "progression enregistrée récemment"],
     ["Actifs sur 30 jours", number(accounts.active_30), `${number(accounts.with_progress)} comptes avec une progression`]].forEach(([label, value, note]) => {
      const tile = element("div", "st-kpi"); tile.append(element("span", "st-kpi-label", label), element("strong", "st-kpi-value", value), element("span", "st-kpi-note", note)); tiles.append(tile);
    });
    out.push(tiles, element("p", "stats-note", "Le compte administrateur est compris dans le total."));
  } else out.push(card("Comptes joueurs", empty("Données indisponibles.")));
  const clickLabel = row => {
    const from = PAGE_LABELS[row.detail] || row.detail;
    if (row.name === "contact-piece") return `« Me contacter » sur la pièce ${names.get(`piece:${row.detail}`)?.name || row.detail}`;
    if (row.name === "contact") return `Lien vers Contact depuis : ${from}`;
    if (row.name === "page-reseaux") return `Lien vers Mes réseaux depuis : ${from}`;
    if (row.name.startsWith("reseau-")) return `Clic vers ${row.name.slice(7)} depuis : ${from}`;
    return row.name;
  };

  if (extra?.events) out.push(card("Clics utiles", extra.events.clicks.length ? barList(extra.events.clicks.map(row => ({ label: clickLabel(row), value: row.n, href: row.name === "contact-piece" ? names.get(`piece:${row.detail}`)?.href : null })), "clic") : empty("Aucun clic enregistré sur cette période.")));
  void grid;
  return out;
}

// ───── À corriger ─────
export function fixSection(ctx) {
  const { data, extra, ui } = ctx; const { element, card, grid, barList } = ui;
  const empty = text => element("p", "admin-empty", text);
  if (!extra) return notReady(ui);
  const { more } = extra;
  return [grid(
    card("Liens cassés (page introuvable)", more.broken.length ? barList(more.broken.map(row => ({ label: row.path, value: row.n })), "fois") : empty("Aucun lien cassé sur cette période."), element("p", "stats-note", "Adresses demandées qui n’existent pas : à corriger ou à rediriger.")),
    card("Recherches sans résultat", more.empty_searches.length ? barList(more.empty_searches.map(row => ({ label: `« ${row.query} »`, value: row.n })), "fois") : empty("Aucune recherche sans résultat sur cette période (ou mesure récente)."), element("p", "stats-note", "Ce que les visiteurs cherchent et que le site ne contient pas encore."))
  ), card("Recherches tapées sur le site", data.searches.length ? barList(data.searches.map(row => ({ label: `« ${row.query} »`, value: row.count })), "fois") : empty("Aucune recherche sur cette période."))];
}
