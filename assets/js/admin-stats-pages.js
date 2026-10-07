// Statistiques de l'admin : un onglet « Général » (le trafic du site) puis un onglet par page, dans l'ordre validé.
// Règle : chaque information n'apparaît qu'une seule fois sur l'ensemble des onglets ; une page ne montre que ce qui la concerne.
// Données : admin_page_report (une entrée par rubrique), événements (jeux, clics, lectures), comptes, termes du glossaire.
import { kpis, card, grid, note, empty, rankTable, lineChart, columnChart, timeline, dayMap, duration, number } from "./admin-stats-ui.js";

export const PAGE_TABS = [
  ["general", "Général"], ["boutique", "Boutique"], ["jeux", "Jeux & quiz"], ["collection", "Ma collection"], ["articles", "Articles"],
  ["archives", "Archives & documentation"], ["carte", "Carte"], ["apprendre", "Apprendre & fiches"], ["identification", "Identification"], ["autres", "Autres pages"]
];

const PAGE_LABELS = {
  index: "Accueil", boutique: "Boutique (liste)", piece: "Fiches boutique", collection: "Ma collection (liste)", specimen: "Fiches collection", articles: "Articles (liste)", article: "Articles (lecture)",
  archives: "Archives & documentation (liste)", document: "Documents d’archive", carte: "Carte", fiche: "Fiches minéral, gisement, commune", departement: "Départements", theme: "Pages thèmes",
  apprendre: "Apprendre & glossaire", jeux: "Jeux & quiz", identification: "Identification", recherche: "Recherche", contact: "Contact", reseaux: "Mes réseaux", favoris: "Mes favoris", legal: "Informations légales", apropos: "À propos", "mon-espace": "Mon espace", introuvable: "Page introuvable (lien cassé)"
};
const DEVICE_LABELS = { mobile: "Téléphone", tablette: "Tablette", ordinateur: "Ordinateur" };
const WEEKDAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const GAME_LABELS = { mineral: "Trouve le minéral", quiz: "Le quiz du jour", geo: "Devine le gisement", "persona-mineral": "Quel minéral es-tu ?", "persona-prospecteur": "Quel prospecteur es-tu ?", "persona-outil": "Quel outil de prospecteur es-tu ?", "persona-collectionneur": "Quel collectionneur es-tu ?", "persona-forme": "Quelle forme cristalline es-tu ?", "vrai-faux": "Vrai ou faux minéralogique", "plus-dur": "Plus dur ou moins dur ?", pendu: "Le pendu minéralogique", "classe-les": "Classe-les !", glossaire: "Le glossaire en défi" };
// Nom lisible d'une image partagée (le nom du fichier indique le jeu).
const shareLabel = file => ({ "vrai-faux-mineralogique": "Vrai ou faux minéralogique", "glossaire-en-defi": "Le glossaire en défi", "plus-dur-ou-moins-dur": "Plus dur ou moins dur ?", "pendu-mineralogique": "Le pendu minéralogique", "classe-les": "Classe-les !" }[file]
  || (file.startsWith("mineral-") ? "Quel minéral es-tu ?" : file.startsWith("prospecteur-") ? "Quel prospecteur es-tu ?" : file.startsWith("outil-") ? "Quel outil de prospecteur es-tu ?" : file.startsWith("collectionneur-") ? "Quel collectionneur es-tu ?" : file.startsWith("forme-") ? "Quelle forme cristalline es-tu ?" : "Jeux du jour"));
const PERSONAS = ["persona-mineral", "persona-prospecteur", "persona-outil", "persona-collectionneur", "persona-forme"];

const sum = (rows, key) => (rows || []).reduce((total, row) => total + (Number(row[key]) || 0), 0);
const nameOf = (ctx, type, slug) => ctx.names.get(`${type}:${slug}`);
const clicks = (events, test) => events ? (events.clicks || []).filter(row => test(row.name)).reduce((total, row) => total + row.n, 0) : null;
const notReady = () => [card("Statistiques", empty("Ces statistiques seront disponibles dès que la mise à jour de la base de données aura été appliquée (fonction admin_page_report)."))];
const peak = (rows, key, text) => { const top = (rows || []).reduce((best, row) => (row.views > (best?.views ?? -1) ? row : best), null); return top && top.views ? text(top[key]) : null; };
const label = page => PAGE_LABELS[page] || page;

// Courbe d'une page : pages vues et visiteurs jour par jour.
function curve(ctx, rep, title) {
  const perDay = dayMap(rep.daily, "d", row => ({ views: row.views, visits: row.visits }));
  return lineChart(ctx, title, timeline(ctx, perDay, ["views", "visits"]), [{ key: "views", label: "Pages vues" }, { key: "visits", label: "Visiteurs" }]);
}

// Les deux chiffres de base d'une page : ses pages vues et ses visiteurs.
const pageFigures = (ctx, id, name, extra = []) => {
  const rep = ctx.report[id], before = ctx.previousReport?.[id];
  return kpis(ctx, [{ label: `Pages vues de ${name}`, value: rep.views, before: before?.views }, { label: `Visiteurs de ${name}`, value: rep.visits, before: before?.visits }, ...extra]);
};

// Contenus les plus consultés d'un type (fiches, pièces, articles…).
function contents(ctx, id, type, title, first, { extra = [], fill = () => ({}), limit = 20 } = {}) {
  const rows = (ctx.report[id].entities || []).filter(row => row.type === type).map(row => {
    const info = nameOf(ctx, type, row.slug);
    return { label: info?.name || row.slug, tag: info?.detail, href: info?.href, views: row.views, visits: row.visits, ...fill(row) };
  });
  return card(title, rankTable([{ label: "Vues", key: "views", bar: true }, { label: "Visiteurs", key: "visits" }, ...extra], rows, { first, limit, emptyText: "Rien de consulté sur cette période." }));
}

// ───── Général : le trafic du site ─────
function general(ctx) {
  const rep = ctx.report.all, before = ctx.previousReport?.all;
  const byHour = new Map((rep.hours || []).map(row => [row.h, row.views]));
  const byDay = new Map((rep.weekdays || []).map(row => [row.dow, row.views]));
  const hourPeak = peak(rep.hours, "h", hour => `Heure de pointe : ${hour} h – ${hour + 1} h`);
  const dayPeak = peak(rep.weekdays, "dow", dow => `Jour le plus actif : ${WEEKDAYS[dow - 1].toLowerCase()}`);
  const sources = (rep.sources || []).map(row => ({ label: row.source, visits: row.visits }));
  const devices = (rep.devices || []).map(row => ({ label: DEVICE_LABELS[row.device] || row.device, visits: row.visits }));
  return [
    kpis(ctx, [
      { label: "Visiteurs", value: rep.visits, before: before?.visits },
      { label: "Pages vues", value: rep.views, before: before?.views },
      { label: "Pages vues par visiteur", value: Number(rep.avg_views) || 0, before: before ? Number(before.avg_views) || 0 : null, decimals: 1 },
      { label: "Durée moyenne d’une visite", text: duration(rep.avg_seconds == null ? null : Number(rep.avg_seconds)), note: "estimée, visites de 2 pages ou plus" }
    ]),
    curve(ctx, rep, "Pages vues et visiteurs"),
    grid(
      columnChart("Pages vues selon l’heure (heure de Paris)", Array.from({ length: 24 }, (_, hour) => ({ label: String(hour), value: byHour.get(hour) || 0, long: `${hour} h – ${hour + 1} h` })), { every: 3, caption: hourPeak }),
      columnChart("Pages vues selon le jour de la semaine", WEEKDAYS.map((name, index) => ({ label: name.slice(0, 3), value: byDay.get(index + 1) || 0, long: name })), { caption: dayPeak })
    ),
    grid(
      card("D’où viennent les visiteurs", rankTable([{ label: "Visiteurs", key: "visits", bar: true }], sources, { first: "Provenance", limit: 12, emptyText: "Aucune visite sur cette période." })),
      card("Appareils", rankTable([{ label: "Visiteurs", key: "visits", bar: true }], devices, { first: "Appareil", emptyText: "Aucune visite sur cette période." }))
    ),
    card("Pages les plus vues", rankTable([{ label: "Pages vues", key: "views", bar: true }, { label: "Visiteurs", key: "visits" }], (rep.pages || []).map(row => ({ label: label(row.page), views: row.views, visits: row.visits })), { first: "Page", limit: 10, emptyText: "Aucune page vue sur cette période." })),
    card("Ce qui a été le plus vu dans chaque page", rankTable([{ label: "Page", key: "page", text: true }, { label: "Vues ou parties", key: "views", bar: true }], mostViewed(ctx), { first: "Le plus vu", limit: 20, emptyText: "Rien de consulté sur cette période." }), note("Pour les jeux, le nombre est celui des parties jouées."))
  ];
}

// Le contenu le plus consulté de chaque page : pièce, spécimen, article, document, fiche, terme, jeu.
function mostViewed(ctx) {
  const rows = [];
  const topEntity = (group, type, page, kind) => {
    const row = (ctx.report[group].entities || []).filter(item => item.type === type)[0];
    if (!row) return;
    const info = nameOf(ctx, type, row.slug);
    rows.push({ label: info?.name || row.slug, tag: kind, href: info?.href, page, views: row.views });
  };
  topEntity("boutique", "piece", "Boutique", "Pièce la plus consultée");
  const games = [...(ctx.events?.games || [])].filter(row => !row.name.startsWith("persona-")).sort((a, b) => b.ends - a.ends)[0];
  if (games && games.ends) rows.push({ label: GAME_LABELS[games.name] || games.name, tag: "Jeu le plus joué", page: "Jeux & quiz", views: games.ends });
  const quiz = [...(ctx.events?.games || [])].filter(row => row.name.startsWith("persona-")).sort((a, b) => b.ends - a.ends)[0];
  if (quiz && quiz.ends) rows.push({ label: GAME_LABELS[quiz.name] || quiz.name, tag: "Quiz le plus passé", page: "Jeux & quiz", views: quiz.ends });
  topEntity("collection", "specimen", "Ma collection", "Spécimen le plus consulté");
  topEntity("articles", "article", "Articles", "Article le plus consulté");
  topEntity("archives", "archive", "Archives & documentation", "Document le plus consulté");
  topEntity("apprendre", "mineral", "Apprendre & fiches", "Fiche minéral la plus consultée");
  topEntity("apprendre", "mine", "Apprendre & fiches", "Gisement le plus consulté");
  topEntity("apprendre", "locality", "Apprendre & fiches", "Commune la plus consultée");
  topEntity("apprendre", "departement", "Apprendre & fiches", "Département le plus consulté");
  const term = (ctx.sections?.terms || [])[0];
  if (term) { const info = nameOf(ctx, "term", term.slug); rows.push({ label: info?.name || term.slug, tag: "Terme du glossaire le plus consulté", href: info?.href, page: "Apprendre & fiches", views: term.views }); }
  const other = (ctx.report.autres.pages || []).filter(row => row.page !== "introuvable")[0];
  if (other) rows.push({ label: label(other.page), tag: "Page la plus vue", page: "Autres pages", views: other.views });
  return rows;
}

// ───── Boutique ─────
function boutique(ctx) {
  const contacts = new Map((ctx.events?.clicks || []).filter(row => row.name === "contact-piece").map(row => [row.detail, row.n]));
  return [
    pageFigures(ctx, "boutique", "la boutique", [{ label: "Clics « Me contacter » sur une pièce", value: clicks(ctx.events, name => name === "contact-piece"), before: clicks(ctx.previous.events, name => name === "contact-piece") }]),
    curve(ctx, ctx.report.boutique, "Pages vues de la boutique par jour"),
    contents(ctx, "boutique", "piece", "Pièces les plus consultées", "Pièce", { extra: [{ label: "Me contacter", key: "contacts" }], fill: row => ({ contacts: contacts.get(row.slug) || 0 }) })
  ];
}

// ───── Jeux & quiz ─────
function jeux(ctx) {
  const { events, accounts, sections, previous } = ctx;
  if (!events) return notReady();
  const games = events.games || [];
  const rows = games.map(row => ({ label: GAME_LABELS[row.name] || row.name, ends: row.ends, starts: row.starts, players: row.players, avg: row.avg != null && !row.name.startsWith("persona-") ? Number(row.avg).toLocaleString("fr-FR") : "—" }));
  const plays = timeline(ctx, dayMap(events.daily, "d", row => ({ ends: row.ends })), ["ends"]);
  const shareTotals = new Map(); (events.shares || []).forEach(row => shareTotals.set(shareLabel(row.name), (shareTotals.get(shareLabel(row.name)) || 0) + row.n));
  const shares = [...shareTotals].map(([name, n]) => ({ label: name, n })).sort((a, b) => b.n - a.n);
  const results = PERSONAS.map(name => {
    const list = (events.results || []).filter(row => row.name === name);
    return list.length ? card(`Résultats : ${GAME_LABELS[name]}`, rankTable([{ label: "Fois", key: "n", bar: true }], list.map(row => ({ label: ctx.resultNames.get(`${name}:${row.detail}`) || row.detail, n: row.n })), { first: "Résultat", limit: 12 })) : null;
  }).filter(Boolean);
  const accountRows = accounts ? [{ label: "Avec identifiant", n: accounts.identifiant }, { label: "Avec Google", n: accounts.google }, { label: "Actifs sur 7 jours", n: accounts.active_7 }, { label: "Actifs sur 30 jours", n: accounts.active_30 }, { label: "Avec une progression enregistrée", n: accounts.with_progress }] : [];
  const out = [
    kpis(ctx, [
      { label: "Parties jouées", value: sum(games, "ends"), before: previous.events ? sum(previous.events.games, "ends") : null },
      { label: "Joueurs", value: sections ? sections.players : null, before: previous.sections ? previous.sections.players : null },
      { label: "Comptes créés", value: accounts ? accounts.new_in_period : null, before: previous.accounts ? previous.accounts.new_in_period : null, note: accounts ? `${number(accounts.total)} au total` : "" },
      { label: "Images partagées", value: sum(events.shares, "n"), before: previous.events ? sum(previous.events.shares, "n") : null }
    ]),
    lineChart(ctx, "Parties jouées par jour", plays, [{ key: "ends", label: "Parties jouées" }]),
    card("Parties par jeu", rankTable([{ label: "Parties jouées", key: "ends", bar: true }, { label: "Commencées", key: "starts" }, { label: "Joueurs", key: "players" }, { label: "Score moyen", key: "avg", text: true }], rows, { first: "Jeu", limit: 14, emptyText: "Aucune partie enregistrée sur cette période." }), note("Une partie est « jouée » quand elle est terminée.")),
    card("Images partagées par jeu", rankTable([{ label: "Partages", key: "n", bar: true }], shares, { first: "Image", limit: 20, emptyText: "Aucun partage sur cette période." }))
  ];
  for (let index = 0; index < results.length; index += 2) out.push(results.length - index > 1 ? grid(results[index], results[index + 1]) : results[index]);
  if (accountRows.length) out.push(card("Comptes joueurs", rankTable([{ label: "Nombre", key: "n" }], accountRows, { first: "Comptes", limit: 10 })));
  return out;
}

// ───── Ma collection ─────
function collection(ctx) {
  return [pageFigures(ctx, "collection", "Ma collection"), curve(ctx, ctx.report.collection, "Pages vues de Ma collection par jour"), contents(ctx, "collection", "specimen", "Spécimens les plus consultés", "Spécimen")];
}

// ───── Articles ─────
function articles(ctx) {
  const reads = new Map((ctx.events?.reads || []).map(row => [row.slug, row.n]));
  return [
    pageFigures(ctx, "articles", "les articles", [{ label: "Articles lus jusqu’au bout", value: ctx.events ? sum(ctx.events.reads, "n") : null, before: ctx.previous.events ? sum(ctx.previous.events.reads, "n") : null }]),
    curve(ctx, ctx.report.articles, "Pages vues des articles par jour"),
    contents(ctx, "articles", "article", "Articles les plus consultés", "Article", { extra: [{ label: "Lus jusqu’au bout", key: "finished" }], fill: row => ({ finished: reads.get(row.slug) || 0 }) }),
    note("« Lu jusqu’au bout » : au moins 15 secondes sur l’article et 90 % de la page parcourue.")
  ];
}

// ───── Archives & documentation ─────
function archives(ctx) {
  return [pageFigures(ctx, "archives", "les archives et la documentation"), curve(ctx, ctx.report.archives, "Pages vues des archives et de la documentation par jour"), contents(ctx, "archives", "archive", "Documents les plus consultés", "Document")];
}

// ───── Carte ─────
function carte(ctx) { return [pageFigures(ctx, "carte", "la carte"), curve(ctx, ctx.report.carte, "Pages vues de la carte par jour")]; }

// ───── Apprendre & fiches ─────
function apprendre(ctx) {
  const terms = (ctx.sections?.terms || []).map(row => { const info = nameOf(ctx, "term", row.slug); return { label: info?.name || row.slug, href: info?.href, views: row.views, visits: row.visits }; });
  return [
    pageFigures(ctx, "apprendre", "Apprendre et les fiches", [{ label: "Termes du glossaire consultés", value: ctx.sections ? ctx.sections.terms_total : null, before: ctx.previous.sections ? ctx.previous.sections.terms_total : null }]),
    curve(ctx, ctx.report.apprendre, "Pages vues d’Apprendre, des fiches et du glossaire par jour"),
    contents(ctx, "apprendre", "mineral", "Fiches minéraux les plus consultées", "Minéral"),
    grid(contents(ctx, "apprendre", "mine", "Gisements les plus consultés", "Gisement"), contents(ctx, "apprendre", "locality", "Communes les plus consultées", "Commune")),
    contents(ctx, "apprendre", "departement", "Départements les plus consultés", "Département"),
    card("Termes du glossaire les plus consultés", rankTable([{ label: "Vues", key: "views", bar: true }, { label: "Visiteurs", key: "visits" }], terms, { first: "Terme", limit: 20, emptyText: "Aucun terme consulté sur cette période." }))
  ];
}

// ───── Identification ─────
function identification(ctx) {
  return [pageFigures(ctx, "identification", "l’identification"), curve(ctx, ctx.report.identification, "Pages vues de l’identification par jour"), note("L’usage de l’outil d’identification n’est pas encore mesuré, seulement sa fréquentation.")];
}

// ───── Autres pages ─────
function autres(ctx) {
  const rep = ctx.report.autres, events = ctx.events;
  const pages = (rep.pages || []).filter(row => row.page !== "introuvable").map(row => ({ label: label(row.page), views: row.views, visits: row.visits }));
  const searches = (rep.searches || []).map(row => ({ label: `« ${row.query} »`, n: row.n }));
  const empties = (ctx.more?.empty_searches || []).map(row => ({ label: `« ${row.query} »`, n: row.n }));
  const broken = (rep.broken || []).map(row => ({ label: row.path, n: row.n }));
  const clickLabel = row => {
    const from = label(row.detail);
    if (row.name === "contact") return `Lien vers Contact depuis : ${from}`;
    if (row.name === "page-reseaux") return `Lien vers Mes réseaux depuis : ${from}`;
    return `Clic vers ${row.name.slice(7)} depuis : ${from}`;
  };
  const clickRows = (events?.clicks || []).filter(row => row.name !== "contact-piece").map(row => ({ label: clickLabel(row), n: row.n }));
  return [
    card("Les autres pages", rankTable([{ label: "Pages vues", key: "views", bar: true }, { label: "Visiteurs", key: "visits" }], pages, { first: "Page", limit: 12, emptyText: "Aucune page vue sur cette période." })),
    grid(
      card("Recherches tapées sur le site", rankTable([{ label: "Fois", key: "n", bar: true }], searches, { first: "Recherche", limit: 15, emptyText: "Aucune recherche sur cette période." })),
      card("Recherches sans résultat", rankTable([{ label: "Fois", key: "n", bar: true }], empties, { first: "Recherche", limit: 15, emptyText: "Aucune recherche sans résultat." }), note("Ce que les visiteurs cherchent et que le site ne contient pas encore."))
    ),
    card("Clics vers les réseaux sociaux et la page Contact", rankTable([{ label: "Clics", key: "n", bar: true }], clickRows, { first: "Clic", limit: 20, emptyText: "Aucun clic enregistré sur cette période." })),
    card("Liens cassés à corriger", rankTable([{ label: "Fois", key: "n", bar: true }], broken, { first: "Adresse", limit: 15, emptyText: "Aucun lien cassé sur cette période." }), note("Adresses demandées qui n’existent pas : à corriger ou à rediriger."))
  ];
}

export function renderPage(id, ctx) {
  if (!ctx.report) return notReady();
  const pages = { general, boutique, jeux, collection, articles, archives, carte, apprendre, identification, autres };
  return (pages[id] || general)(ctx);
}
