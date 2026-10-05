// Tableau de bord Statistiques : blocs détaillés (fréquentation jour par jour, jeux et quiz, comptes joueurs, clics utiles).
// Les fonctions de dessin (cartes, barres) viennent de admin-stats.js ; les données de admin_more_stats(), admin_event_stats() et admin_account_stats().
const GAME_LABELS = { mineral: "Trouve le minéral", quiz: "Le quiz du jour", geo: "Devine le gisement", "persona-mineral": "Quel minéral es-tu ?", "persona-prospecteur": "Quel prospecteur es-tu ?", "persona-outil": "Quel outil de prospecteur es-tu ?", "persona-collectionneur": "Quel collectionneur es-tu ?", "persona-forme": "Quelle forme cristalline es-tu ?", "vrai-faux": "Vrai ou faux minéralogique", glossaire: "Le glossaire en défi" };
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

export function extraBlocks({ extra, from, to, names, ui }) {
  const { element, card, grid, barList, number, PAGE_LABELS, TYPE_LABELS } = ui;
  const heading = text => element("h3", "stats-heading", text);
  const emptyNote = text => element("p", "admin-empty", text);
  const plural = (count, one, many) => `${number(count)} ${count > 1 ? many : one}`;
  const dayLabel = value => new Date(`${String(value).slice(0, 10)}T12:00:00`).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", year: "2-digit" });
  const pct = (part, total) => total ? Math.round((part / total) * 100) : 0;
  const pageName = row => { const info = row.type && row.slug ? names.get(`${row.type}:${row.slug}`) : null; return info?.name || (row.slug ? `${TYPE_LABELS[row.type] || row.type} : ${row.slug}` : PAGE_LABELS[row.page] || row.page); };

  if (!extra) return [heading("Statistiques détaillées"), card("À activer", emptyNote("Les statistiques détaillées (jour par jour, jeux, comptes…) seront disponibles dès que la mise à jour de la base de données aura été appliquée."))];
  const { more, events, accounts } = extra;

  const dailyCard = rows => {
    const box = card("Jour par jour");
    if (!rows.length) { box.append(emptyNote("Pas encore de données.")); return box; }
    const wrap = element("div", "stats-scroll");
    const table = element("table", "stats-daily"); const head = element("tr");
    ["Jour", "Visites", "Pages vues", "Source principale", "Page la plus vue"].forEach(label => head.append(element("th", "", label)));
    table.append(head);
    rows.forEach(row => { const tr = element("tr"); tr.append(element("td", "", dayLabel(row.d)), element("td", "", number(row.visits)), element("td", "", number(row.views)), element("td", "", row.source || "—"), element("td", "", PAGE_LABELS[row.page] || row.page || "—")); table.append(tr); });
    wrap.append(table); box.append(wrap);
    return box;
  };
  const hoursChart = rows => {
    const byHour = new Map(rows.map(row => [row.h, row.visits]));
    const max = Math.max(1, ...rows.map(row => row.visits));
    const chart = element("div", "stats-hours");
    for (let hour = 0; hour < 24; hour += 1) {
      const value = byHour.get(hour) || 0;
      const column = element("div", "stats-hour"); column.title = `${hour} h : ${plural(value, "visite", "visites")}`;
      const bar = element("i"); bar.style.height = `${value ? Math.max(4, (value / max) * 100) : 0}%`;
      column.append(bar, element("span", "", hour % 3 === 0 ? String(hour) : ""));
      chart.append(column);
    }
    return chart;
  };
  const bounceCard = bounce => {
    const box = card("Visites d’une seule page");
    if (!bounce.visits) { box.append(emptyNote("Pas encore de données.")); return box; }
    box.append(element("p", "stats-big", `${pct(bounce.single, bounce.visits)} %`), element("p", "stats-note", `${plural(bounce.single, "visite", "visites")} sur ${number(bounce.visits)} se sont arrêtées à une seule page. Plus ce chiffre est bas, plus les visiteurs explorent le site.`));
    const rows = bounce.sources.filter(row => row.visits >= 3).map(row => ({ label: row.source, value: pct(row.single, row.visits), note: `${number(row.single)} sur ${number(row.visits)} visites` }));
    if (rows.length) box.append(barList(rows, "%"));
    return box;
  };

  // Nombre de chaque jour de la semaine dans la période, pour des moyennes justes.
  const counts = Array(7).fill(0);
  for (const cursor = new Date(from); cursor <= to; cursor.setDate(cursor.getDate() + 1)) counts[(cursor.getDay() + 6) % 7] += 1;
  const blocks = [heading("Fréquentation détaillée"), dailyCard(more.daily), grid(
    card("Jours de la semaine", more.weekdays.length ? barList(WEEKDAYS.map((label, index) => {
      const visits = more.weekdays.find(item => item.dow === index + 1)?.visits || 0;
      const average = counts[index] ? visits / counts[index] : 0;
      return { label, value: visits, note: counts[index] ? `${average.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} par ${label.toLowerCase()} en moyenne` : "" };
    }), "visite") : emptyNote("Pas encore de données.")),
    card("Heures de la journée (heure de Paris)", more.hours.length ? hoursChart(more.hours) : emptyNote("Pas encore de données.")),
    card("Pages d’entrée", more.entries.length ? barList(more.entries.map(row => ({ label: pageName(row), value: row.visits, href: row.type ? names.get(`${row.type}:${row.slug}`)?.href : null })), "visite") : emptyNote("Pas encore de données."),
      element("p", "stats-note", "Première page vue par les visiteurs arrivés sur le site.")),
    card("Pages de sortie", more.exits.length ? barList(more.exits.map(row => ({ label: PAGE_LABELS[row.page] || row.page, value: row.visits })), "visite") : emptyNote("Pas encore de données."),
      element("p", "stats-note", "Dernière page vue avant de quitter le site.")),
    bounceCard(more.bounce),
    card("Liens cassés (page introuvable)", more.broken.length ? barList(more.broken.map(row => ({ label: row.path, value: row.n })), "fois") : emptyNote("Aucun lien cassé sur cette période."),
      element("p", "stats-note", "Adresses demandées qui n’existent pas : à corriger ou à rediriger.")),
    card("Recherches sans résultat", more.empty_searches.length ? barList(more.empty_searches.map(row => ({ label: `« ${row.query} »`, value: row.n })), "fois") : emptyNote("Aucune recherche sans résultat sur cette période (ou mesure récente)."),
      element("p", "stats-note", "Ce que les visiteurs cherchent et que le site ne contient pas encore."))
  )];

  // Jeux et quiz
  const shareLabel = file => ({ "vrai-faux-mineralogique": "Vrai ou faux minéralogique", "glossaire-en-defi": "Le glossaire en défi" }[file] || (file.startsWith("mineral-") ? "Quel minéral es-tu ?" : file.startsWith("prospecteur-") ? "Quel prospecteur es-tu ?" : file.startsWith("outil-") ? "Quel outil de prospecteur es-tu ?" : file.startsWith("collectionneur-") ? "Quel collectionneur es-tu ?" : file.startsWith("forme-") ? "Quelle forme cristalline es-tu ?" : "Jeux du jour"));
  const gamesBlock = () => {
    const wrap = element("div");
    const games = events.games.map(row => ({ label: GAME_LABELS[row.name] || row.name, value: row.ends, note: `${plural(row.starts, "partie commencée", "parties commencées")} · ${plural(row.ends, "terminée", "terminées")}${row.avg != null && !row.name.startsWith("persona-") ? ` · moyenne ${Number(row.avg).toLocaleString("fr-FR", { maximumFractionDigits: 1 })}` : ""} · ${plural(row.players, "joueur", "joueurs")}` }));
    const personas = ["persona-mineral", "persona-prospecteur", "persona-outil", "persona-collectionneur", "persona-forme"].map(name => {
      const rows = events.results.filter(row => row.name === name);
      return card(`Résultats : ${GAME_LABELS[name]}`, rows.length ? barList(rows.slice(0, 12).map(row => ({ label: resultNames.get(`${name}:${row.detail}`) || row.detail, value: row.n })), "fois") : emptyNote("Pas encore de résultats."));
    });
    wrap.append(grid(
      card("Parties terminées par jeu", games.length ? barList(games, "partie") : emptyNote("Aucune partie enregistrée sur cette période pour le moment.")),
      card("Partages d’images", events.shares.length ? barList(events.shares.map(row => ({ label: shareLabel(row.name), value: row.n })), "fois") : emptyNote("Aucun partage sur cette période.")),
      ...personas
    ));
    if (events.daily.length) {
      const details = element("details", "stats-table"); details.append(element("summary", "", "Parties jour par jour"));
      const table = element("table", "stats-daily"); const head = element("tr");
      ["Jour", "Commencées", "Terminées"].forEach(label => head.append(element("th", "", label))); table.append(head);
      events.daily.forEach(row => { const tr = element("tr"); tr.append(element("td", "", dayLabel(row.d)), element("td", "", number(row.starts)), element("td", "", number(row.ends))); table.append(tr); });
      const scroll = element("div", "stats-scroll"); scroll.append(table); details.append(scroll); wrap.append(details);
    }
    return wrap;
  };
  blocks.push(heading("Jeux et quiz"), events ? gamesBlock() : card("Jeux et quiz", emptyNote("Pas encore de données.")));

  // Comptes joueurs
  const accountsBlock = () => {
    const tiles = element("div", "stats-tiles");
    [["Comptes créés", number(accounts.total), `dont ${number(accounts.identifiant)} avec identifiant, ${number(accounts.google)} avec Google`],
     ["Nouveaux comptes", number(accounts.new_in_period), "sur la période choisie"],
     ["Actifs sur 7 jours", number(accounts.active_7), "progression enregistrée récemment"],
     ["Actifs sur 30 jours", number(accounts.active_30), `${number(accounts.with_progress)} comptes avec une progression`]].forEach(([label, value, note]) => {
      const tile = element("div", "stats-tile"); tile.append(element("span", "stats-tile-label", label), element("strong", "stats-tile-value", value), element("span", "stats-tile-note", note)); tiles.append(tile);
    });
    const wrap = element("div"); wrap.append(tiles, element("p", "stats-note", "Le compte administrateur est compris dans le total."));
    return wrap;
  };
  blocks.push(heading("Comptes joueurs"), accounts ? accountsBlock() : card("Comptes joueurs", emptyNote("Données indisponibles.")));

  // Clics utiles et lectures
  const clickLabel = row => {
    const from = PAGE_LABELS[row.detail] || row.detail;
    if (row.name === "contact-piece") return `« Me contacter » sur la pièce ${names.get(`piece:${row.detail}`)?.name || row.detail}`;
    if (row.name === "contact") return `Lien vers Contact depuis : ${from}`;
    if (row.name === "page-reseaux") return `Lien vers Mes réseaux depuis : ${from}`;
    if (row.name.startsWith("reseau-")) return `Clic vers ${row.name.slice(7)} depuis : ${from}`;
    return row.name;
  };
  blocks.push(heading("Clics utiles et lectures"), events ? grid(
    card("Clics utiles", events.clicks.length ? barList(events.clicks.map(row => ({ label: clickLabel(row), value: row.n, href: row.name === "contact-piece" ? names.get(`piece:${row.detail}`)?.href : null })), "clic") : emptyNote("Aucun clic enregistré sur cette période.")),
    card("Articles lus jusqu’au bout", events.reads.length ? barList(events.reads.map(row => ({ label: names.get(`article:${row.slug}`)?.name || row.slug, value: row.n, href: names.get(`article:${row.slug}`)?.href })), "lecture") : emptyNote("Aucune lecture complète enregistrée sur cette période."),
      element("p", "stats-note", "Compté quand un visiteur passe au moins 15 secondes sur l’article et en parcourt 90 %."))
  ) : card("Clics utiles", emptyNote("Pas encore de données.")));
  return blocks;
}
