// Statistiques de l'admin : un onglet « Général » (tout le site) et un onglet par page du site.
// Chaque onglet de page montre tout ce que la mesure permet de dire sur cette page : chiffres clés, courbe, heures, jours, provenance, appareils, pages précédentes et suivantes, contenus les plus vus.
// Données : admin_page_report (une entrée par rubrique), plus les événements (jeux, clics, lectures) et les comptes.
import { kpis, card, grid, note, empty, rankTable, lineChart, columnChart, heatmap, timeline, dayMap, duration, number } from "./admin-stats-ui.js";

export const PAGE_TABS = [
  ["general", "Général"], ["accueil", "Accueil"], ["boutique", "Boutique"], ["collection", "Ma collection"], ["articles", "Articles"], ["archives", "Archives & documentation"],
  ["carte", "Carte"], ["apprendre", "Apprendre & fiches"], ["identification", "Identification"], ["jeux", "Jeux & quiz"], ["autres", "Autres pages"]
];

const PAGE_LABELS = {
  index: "Accueil", boutique: "Boutique (liste)", piece: "Fiches boutique", collection: "Ma collection (liste)", specimen: "Fiches collection",
  articles: "Articles (liste)", article: "Articles (lecture)", archives: "Archives & documentation (liste)", document: "Documents d’archive",
  carte: "Carte", recherche: "Recherche", fiche: "Fiches minéral, gisement, commune", departement: "Départements", theme: "Pages thèmes",
  apprendre: "Apprendre & glossaire", jeux: "Jeux & quiz", favoris: "Mes favoris", introuvable: "Page introuvable (lien cassé)", contact: "Contact", identification: "Identification",
  reseaux: "Mes réseaux", legal: "Informations légales", apropos: "À propos", "mon-espace": "Mon espace",
  "(arrivée sur le site)": "Arrivée sur le site", "(sortie du site)": "Sortie du site"
};
const DEVICE_LABELS = { mobile: "Téléphone", tablette: "Tablette", ordinateur: "Ordinateur" };
const WEEKDAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const GAME_LABELS = { mineral: "Trouve le minéral", quiz: "Le quiz du jour", geo: "Devine le gisement", "persona-mineral": "Quel minéral es-tu ?", "persona-prospecteur": "Quel prospecteur es-tu ?", "persona-outil": "Quel outil de prospecteur es-tu ?", "persona-collectionneur": "Quel collectionneur es-tu ?", "persona-forme": "Quelle forme cristalline es-tu ?", "vrai-faux": "Vrai ou faux minéralogique", "plus-dur": "Plus dur ou moins dur ?", pendu: "Le pendu minéralogique", "classe-les": "Classe-les !", glossaire: "Le glossaire en défi" };

const label = page => PAGE_LABELS[page] || page;
const sum = (rows, key) => (rows || []).reduce((total, row) => total + (Number(row[key]) || 0), 0);
const nameOf = (ctx, type, slug) => ctx.names.get(`${type}:${slug}`);
const clicks = (events, name) => events ? (events.clicks || []).filter(row => row.name === name).reduce((total, row) => total + row.n, 0) : null;
const waiting = text => [card("Statistiques", empty(text))];
const notReady = () => waiting("Ces statistiques seront disponibles dès que la mise à jour de la base de données aura été appliquée (fonction admin_page_report).");
const peak = (rows, key, text) => { const top = (rows || []).reduce((best, row) => (row.views > (best?.views ?? -1) ? row : best), null); return top && top.views ? text(top[key]) : "—"; };

// ───── Blocs communs ─────
function keyFigures(ctx, rep, before, { all = false } = {}) {
  const items = [
    { label: "Pages vues", value: rep.views, before: before?.views },
    { label: "Visiteurs", value: rep.visits, before: before?.visits },
    { label: all ? "Pages vues par visiteur" : "Pages de cette rubrique par visiteur", value: rep.visits ? rep.views / rep.visits : 0, before: before?.visits ? before.views / before.visits : null, decimals: 1 }
  ];
  if (!all) items.push({ label: "Pages vues par visiteur (tout le site)", value: Number(rep.avg_views) || 0, before: before ? Number(before.avg_views) || 0 : null, decimals: 1 });
  items.push(
    { label: all ? "Durée moyenne d’une visite" : "Durée moyenne des visites passées ici", text: duration(rep.avg_seconds == null ? null : Number(rep.avg_seconds)), note: "estimée, visites de 2 pages ou plus" },
    { label: "Heure de pointe", text: peak(rep.hours, "h", hour => `${hour} h – ${hour + 1} h`) },
    { label: "Jour le plus actif", text: peak(rep.weekdays, "dow", dow => WEEKDAYS[dow - 1]) },
    { label: all ? "Visites commencées" : "Arrivées sur le site par ici", value: rep.entries, before: before?.entries },
    { label: all ? "Visites terminées" : "Sorties du site depuis ici", value: rep.exits, before: before?.exits },
    { label: "Visites d’une seule page", value: rep.single, before: before?.single, note: rep.entries ? `sur ${number(rep.entries)} visites commencées ici` : "" }
  );
  const rows = []; for (let index = 0; index < items.length; index += 3) rows.push(kpis(ctx, items.slice(index, index + 3)));
  return rows;
}

function curve(ctx, rep, title) {
  const perDay = dayMap(rep.daily, "d", row => ({ views: row.views, visits: row.visits }));
  return lineChart(ctx, title, timeline(ctx, perDay, ["views", "visits"]), [{ key: "views", label: "Pages vues" }, { key: "visits", label: "Visiteurs" }]);
}

function rhythm(rep) {
  const byHour = new Map((rep.hours || []).map(row => [row.h, row.views]));
  const byDay = new Map((rep.weekdays || []).map(row => [row.dow, row.views]));
  return grid(
    columnChart("Pages vues selon l’heure (heure de Paris)", Array.from({ length: 24 }, (_, hour) => ({ label: String(hour), value: byHour.get(hour) || 0, long: `${hour} h – ${hour + 1} h` })), { every: 3 }),
    columnChart("Pages vues selon le jour de la semaine", WEEKDAYS.map((name, index) => ({ label: name.slice(0, 3), value: byDay.get(index + 1) || 0, long: name })))
  );
}

function audience(rep) {
  const sources = (rep.sources || []).map(row => ({ label: row.source, visits: row.visits }));
  const devices = (rep.devices || []).map(row => ({ label: DEVICE_LABELS[row.device] || row.device, visits: row.visits }));
  const hosts = (rep.referrers || []).map(row => ({ label: row.host, visits: row.visits }));
  return [
    grid(
      card("D’où viennent les visiteurs", rankTable([{ label: "Visiteurs", key: "visits", bar: true }], sources, { first: "Provenance", limit: 12, emptyText: "Aucune visite sur cette période." })),
      card("Appareils", rankTable([{ label: "Visiteurs", key: "visits", bar: true }], devices, { first: "Appareil", emptyText: "Aucune visite sur cette période." }))
    ),
    hosts.length ? card("Sites d’où arrivent les visiteurs (adresse exacte)", rankTable([{ label: "Visiteurs", key: "visits", bar: true }], hosts, { first: "Site", limit: 15 })) : null
  ].filter(Boolean);
}

function flow(rep) {
  const previous = (rep.previous || []).map(row => ({ label: label(row.page), n: row.n }));
  const next = (rep.next || []).map(row => ({ label: label(row.page), n: row.n }));
  return grid(
    card("Page vue juste avant", rankTable([{ label: "Fois", key: "n", bar: true }], previous, { first: "Venait de", limit: 10, emptyText: "Aucune donnée." })),
    card("Page vue juste après", rankTable([{ label: "Fois", key: "n", bar: true }], next, { first: "Allait vers", limit: 10, emptyText: "Aucune donnée." }))
  );
}

function pagesTable(rep, title = "Détail par page") {
  const rows = (rep.pages || []).map(row => ({ label: label(row.page), views: row.views, visits: row.visits, entries: row.entries, exits: row.exits }));
  return card(title, rankTable([{ label: "Pages vues", key: "views", bar: true }, { label: "Visiteurs", key: "visits" }, { label: "Arrivées", key: "entries" }, { label: "Sorties", key: "exits" }], rows, { first: "Page", limit: 30, emptyText: "Aucune page vue sur cette période." }));
}

// Contenus les plus vus d'un type (fiches, pièces, articles…) ; extra : colonnes supplémentaires { label, key } et une fonction qui les remplit.
function contents(ctx, rep, type, title, first, { extra = [], fill = () => ({}), limit = 20 } = {}) {
  const rows = (rep.entities || []).filter(row => row.type === type).map(row => {
    const info = nameOf(ctx, type, row.slug);
    return { label: info?.name || row.slug, tag: info?.detail, href: info?.href, views: row.views, visits: row.visits, ...fill(row) };
  });
  return card(title, rankTable([{ label: "Vues", key: "views", bar: true }, { label: "Visiteurs", key: "visits" }, ...extra], rows, { first, limit, emptyText: "Rien de consulté sur cette période." }));
}

const standard = (ctx, id, { curveTitle = "Pages vues et visiteurs" } = {}) => {
  const rep = ctx.report[id], before = ctx.previousReport?.[id];
  return [...keyFigures(ctx, rep, before), curve(ctx, rep, curveTitle), rhythm(rep), flow(rep), ...audience(rep)];
};

// ───── Général ─────
function general(ctx) {
  const rep = ctx.report.all, before = ctx.previousReport?.all;
  const { events, accounts, sections, previous } = ctx;
  const groups = PAGE_TABS.filter(([id]) => id !== "general").map(([id, name]) => ({ label: name, views: ctx.report[id].views, visits: ctx.report[id].visits, entries: ctx.report[id].entries, exits: ctx.report[id].exits }));
  const main = kpis(ctx, [
    { label: "Visiteurs", value: rep.visits, before: before?.visits },
    { label: "Pages vues", value: rep.views, before: before?.views },
    { label: "Comptes créés", value: accounts ? accounts.new_in_period : null, before: previous.accounts ? previous.accounts.new_in_period : null, note: accounts ? `${number(accounts.total)} au total` : "" },
    { label: "Parties jouées", value: events ? sum(events.games, "ends") : null, before: previous.events ? sum(previous.events.games, "ends") : null },
    { label: "Joueurs", value: sections ? sections.players : null, before: previous.sections ? previous.sections.players : null },
    { label: "Clics « Me contacter » sur une pièce", value: clicks(events, "contact-piece"), before: clicks(previous.events, "contact-piece") }
  ]);
  const out = [main, ...keyFigures(ctx, rep, before, { all: true }), curve(ctx, rep, "Pages vues et visiteurs"), rhythm(rep), heatmap("Quand viennent les visiteurs : jour et heure", rep.heat || [], WEEKDAYS)];
  out.push(...audience(rep));
  out.push(card("Les rubriques du site", rankTable([{ label: "Pages vues", key: "views", bar: true }, { label: "Visiteurs", key: "visits" }, { label: "Arrivées", key: "entries" }, { label: "Sorties", key: "exits" }], groups, { first: "Rubrique", limit: 12 }), note("Chaque rubrique a son onglet avec tous les détails.")));
  out.push(pagesTable(rep, "Toutes les pages du site"));
  if (accounts) out.push(card("Comptes joueurs", rankTable([{ label: "Nombre", key: "n" }], [
    { label: "Comptes créés (total)", n: accounts.total }, { label: "Créés sur la période", n: accounts.new_in_period }, { label: "Avec identifiant", n: accounts.identifiant },
    { label: "Avec Google", n: accounts.google }, { label: "Actifs sur 7 jours", n: accounts.active_7 }, { label: "Actifs sur 30 jours", n: accounts.active_30 }, { label: "Avec une progression enregistrée", n: accounts.with_progress }
  ], { first: "Comptes", limit: 10 }), note("Le compte administrateur est compris dans le total.")));
  return out;
}

// ───── Pages ─────
function boutique(ctx) {
  const rep = ctx.report.boutique, contacts = new Map((ctx.events?.clicks || []).filter(row => row.name === "contact-piece").map(row => [row.detail, row.n]));
  const total = clicks(ctx.events, "contact-piece");
  return [
    kpis(ctx, [{ label: "Clics « Me contacter » sur une pièce", value: total, before: clicks(ctx.previous.events, "contact-piece") }, { label: "Fiches de pièces vues", value: (rep.pages.find(row => row.page === "piece") || {}).views || 0 }, { label: "Liste de la boutique vue", value: (rep.pages.find(row => row.page === "boutique") || {}).views || 0 }]),
    ...standard(ctx, "boutique", { curveTitle: "Pages vues de la boutique" }),
    contents(ctx, rep, "piece", "Pièces les plus consultées", "Pièce", { extra: [{ label: "Me contacter", key: "contacts" }], fill: row => ({ contacts: contacts.get(row.slug) || 0 }) }),
    pagesTable(rep)
  ];
}
function collection(ctx) {
  const rep = ctx.report.collection;
  return [...standard(ctx, "collection", { curveTitle: "Pages vues de la collection" }), contents(ctx, rep, "specimen", "Spécimens les plus consultés", "Spécimen"), pagesTable(rep)];
}
function articles(ctx) {
  const rep = ctx.report.articles, reads = new Map((ctx.events?.reads || []).map(row => [row.slug, row.n]));
  return [
    kpis(ctx, [{ label: "Articles lus jusqu’au bout", value: ctx.events ? sum(ctx.events.reads, "n") : null, before: ctx.previous.events ? sum(ctx.previous.events.reads, "n") : null }]),
    ...standard(ctx, "articles", { curveTitle: "Pages vues des articles" }),
    contents(ctx, rep, "article", "Articles les plus consultés", "Article", { extra: [{ label: "Lus jusqu’au bout", key: "finished" }], fill: row => ({ finished: reads.get(row.slug) || 0 }) }),
    note("« Lu jusqu’au bout » : au moins 15 secondes sur l’article et 90 % de la page parcourue."), pagesTable(rep)
  ];
}
function archives(ctx) {
  const rep = ctx.report.archives;
  return [...standard(ctx, "archives", { curveTitle: "Pages vues des archives et de la documentation" }), contents(ctx, rep, "archive", "Documents les plus consultés", "Document"), pagesTable(rep)];
}
function carte(ctx) { return [...standard(ctx, "carte", { curveTitle: "Pages vues de la carte" }), pagesTable(ctx.report.carte)]; }
function accueil(ctx) { return [...standard(ctx, "accueil", { curveTitle: "Pages vues de l’accueil" })]; }
function identification(ctx) { return [...standard(ctx, "identification", { curveTitle: "Pages vues de l’identification" }), note("L’usage de l’outil d’identification n’est pas encore mesuré, seulement sa fréquentation.")]; }

function apprendre(ctx) {
  const rep = ctx.report.apprendre;
  const terms = (ctx.sections?.terms || []).map(row => { const info = nameOf(ctx, "term", row.slug); return { label: info?.name || row.slug, href: info?.href, views: row.views, visits: row.visits }; });
  return [
    kpis(ctx, [{ label: "Termes du glossaire consultés", value: ctx.sections ? ctx.sections.terms_total : null, before: ctx.previous.sections ? ctx.previous.sections.terms_total : null }]),
    ...standard(ctx, "apprendre", { curveTitle: "Pages vues d’Apprendre, des fiches et du glossaire" }),
    contents(ctx, rep, "mineral", "Fiches minéraux les plus consultées", "Minéral"),
    grid(contents(ctx, rep, "mine", "Gisements les plus consultés", "Gisement"), contents(ctx, rep, "locality", "Communes les plus consultées", "Commune")),
    contents(ctx, rep, "departement", "Départements les plus consultés", "Département"),
    card("Termes du glossaire les plus consultés", rankTable([{ label: "Vues", key: "views", bar: true }, { label: "Visiteurs", key: "visits" }], terms, { first: "Terme", limit: 20, emptyText: "Aucun terme consulté sur cette période." })),
    pagesTable(rep), note("Les tests et outils sont mesurés par leur fréquentation, pas encore par leur usage.")
  ];
}

function jeux(ctx) {
  const rep = ctx.report.jeux, events = ctx.events;
  if (!events) return [...standard(ctx, "jeux", { curveTitle: "Pages vues de la page Jeux" }), ...notReady()];
  const games = events.games || [];
  const rows = games.map(row => ({ label: GAME_LABELS[row.name] || row.name, ends: row.ends, starts: row.starts, players: row.players, avg: row.avg != null && !row.name.startsWith("persona-") ? Number(row.avg).toLocaleString("fr-FR") : "—" }));
  const plays = timeline(ctx, dayMap(events.daily, "d", row => ({ ends: row.ends, starts: row.starts })), ["ends", "starts"]);
  const results = ["persona-mineral", "persona-prospecteur", "persona-outil", "persona-collectionneur", "persona-forme"].map(name => {
    const list = (events.results || []).filter(row => row.name === name);
    return list.length ? card(`Résultats : ${GAME_LABELS[name]}`, rankTable([{ label: "Fois", key: "n", bar: true }], list.map(row => ({ label: ctx.resultNames.get(`${name}:${row.detail}`) || row.detail, n: row.n })), { first: "Résultat", limit: 12 })) : null;
  }).filter(Boolean);
  const shares = (events.shares || []).map(row => ({ label: row.name, n: row.n }));
  return [
    kpis(ctx, [
      { label: "Parties jouées", value: sum(games, "ends"), before: ctx.previous.events ? sum(ctx.previous.events.games, "ends") : null },
      { label: "Parties commencées", value: sum(games, "starts"), before: ctx.previous.events ? sum(ctx.previous.events.games, "starts") : null },
      { label: "Joueurs", value: ctx.sections ? ctx.sections.players : null, before: ctx.previous.sections ? ctx.previous.sections.players : null },
      { label: "Images partagées", value: sum(events.shares, "n"), before: ctx.previous.events ? sum(ctx.previous.events.shares, "n") : null }
    ]),
    lineChart(ctx, "Parties par jour", plays, [{ key: "ends", label: "Parties jouées" }, { key: "starts", label: "Parties commencées" }]),
    card("Parties par jeu", rankTable([{ label: "Parties jouées", key: "ends", bar: true }, { label: "Commencées", key: "starts" }, { label: "Joueurs", key: "players" }, { label: "Score moyen", key: "avg", text: true }], rows, { first: "Jeu", limit: 14, emptyText: "Aucune partie enregistrée sur cette période." }), note("Une partie est « jouée » quand elle est terminée.")),
    card("Images partagées par jeu", rankTable([{ label: "Partages", key: "n", bar: true }], shares, { first: "Image", limit: 20, emptyText: "Aucun partage sur cette période." })),
    ...results,
    ...standard(ctx, "jeux", { curveTitle: "Pages vues de la page Jeux & quiz" })
  ];
}

function autres(ctx) {
  const rep = ctx.report.autres, events = ctx.events;
  const searches = (rep.searches || []).map(row => ({ label: `« ${row.query} »`, n: row.n }));
  const empties = (ctx.more?.empty_searches || []).map(row => ({ label: `« ${row.query} »`, n: row.n }));
  const broken = (rep.broken || []).map(row => ({ label: row.path, n: row.n }));
  const clickLabel = row => {
    const from = label(row.detail);
    if (row.name === "contact-piece") return `« Me contacter » sur la pièce ${ctx.names.get(`piece:${row.detail}`)?.name || row.detail}`;
    if (row.name === "contact") return `Lien vers Contact depuis : ${from}`;
    if (row.name === "page-reseaux") return `Lien vers Mes réseaux depuis : ${from}`;
    if (row.name.startsWith("reseau-")) return `Clic vers ${row.name.slice(7)} depuis : ${from}`;
    return row.name;
  };
  const clickRows = (events?.clicks || []).map(row => ({ label: clickLabel(row), n: row.n }));
  return [
    ...standard(ctx, "autres", { curveTitle: "Pages vues des autres pages" }),
    pagesTable(rep, "Détail par page (recherche, contact, réseaux, favoris, mon espace, à propos, informations légales…)"),
    grid(
      card("Recherches tapées sur le site", rankTable([{ label: "Fois", key: "n", bar: true }], searches, { first: "Recherche", limit: 15, emptyText: "Aucune recherche sur cette période." })),
      card("Recherches sans résultat", rankTable([{ label: "Fois", key: "n", bar: true }], empties, { first: "Recherche", limit: 15, emptyText: "Aucune recherche sans résultat." }), note("Ce que les visiteurs cherchent et que le site ne contient pas encore."))
    ),
    card("Clics utiles (contact, réseaux sociaux)", rankTable([{ label: "Clics", key: "n", bar: true }], clickRows, { first: "Clic", limit: 20, emptyText: "Aucun clic enregistré sur cette période." })),
    card("Liens cassés à corriger", rankTable([{ label: "Fois", key: "n", bar: true }], broken, { first: "Adresse", limit: 15, emptyText: "Aucun lien cassé sur cette période." }), note("Adresses demandées qui n’existent pas : à corriger ou à rediriger."))
  ];
}

export function renderPage(id, ctx) {
  if (!ctx.report) return notReady();
  const pages = { general, accueil, boutique, collection, articles, archives, carte, apprendre, identification, jeux, autres };
  return (pages[id] || general)(ctx);
}
