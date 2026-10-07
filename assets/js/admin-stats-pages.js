// Statistiques de l'admin : les six pages (Visite, Boutique, Collection, Articles & archives, Jeux, Outils & glossaire).
// Règle : un chiffre n'apparaît que dans une seule page. Chaque page = chiffres clés, une courbe, des tableaux.
import { kpis, card, grid, note, empty, rankTable, lineChart, timeline, dayMap, number } from "./admin-stats-ui.js";
import { hourlyPoints } from "./admin-stats-logic.js";

export const PAGE_TABS = [["visite", "Visite"], ["boutique", "Boutique"], ["collection", "Collection"], ["lire", "Articles & archives"], ["jeux", "Jeux"], ["outils", "Outils & glossaire"]];

const PAGE_LABELS = {
  index: "Accueil", boutique: "Boutique", piece: "Fiches boutique", collection: "Ma collection", specimen: "Fiches collection",
  articles: "Articles (liste)", article: "Articles (lecture)", archives: "Archives & documentation", document: "Documents d’archive",
  carte: "Carte", recherche: "Recherche", fiche: "Fiches minéral, gisement, commune", departement: "Départements",
  apprendre: "Apprendre & identifier", jeux: "Jeux & quiz", favoris: "Mes favoris", introuvable: "Page introuvable", contact: "Contact", identification: "Identification", reseaux: "Mes réseaux", legal: "Informations légales"
};
const DEVICE_LABELS = { mobile: "Téléphone", tablette: "Tablette", ordinateur: "Ordinateur" };
const GAME_LABELS = { mineral: "Trouve le minéral", quiz: "Le quiz du jour", geo: "Devine le gisement", "persona-mineral": "Quel minéral es-tu ?", "persona-prospecteur": "Quel prospecteur es-tu ?", "persona-outil": "Quel outil de prospecteur es-tu ?", "persona-collectionneur": "Quel collectionneur es-tu ?", "persona-forme": "Quelle forme cristalline es-tu ?", "vrai-faux": "Vrai ou faux minéralogique", "plus-dur": "Plus dur ou moins dur ?", pendu: "Le pendu minéralogique", "classe-les": "Classe-les !", glossaire: "Le glossaire en défi" };

const sum = (rows, key) => (rows || []).reduce((total, row) => total + (Number(row[key]) || 0), 0);
const viewsOf = (data, page) => (data?.pages || []).find(row => row.page === page)?.views || 0;
// Pages vues de la période précédente (null quand elle n'est plus conservée).
const was = (ctx, page) => ctx.previous.data ? viewsOf(ctx.previous.data, page) : null;
const entities = (ctx, type) => (ctx.data.entities || []).filter(row => row.type === type);
const nameOf = (ctx, type, slug) => ctx.names.get(`${type}:${slug}`);
const clicks = (events, name) => events ? (events.clicks || []).filter(row => row.name === name).reduce((total, row) => total + row.n, 0) : null;
const sectionPoints = (ctx, keys) => timeline(ctx, dayMap(ctx.sections?.daily, "t", (row, current) => ({ [row.s]: (current[row.s] || 0) + row.views })), keys);
const waiting = text => [card("Statistiques", empty(text))];
const notReady = () => waiting("Ces statistiques seront disponibles dès que la mise à jour de la base de données aura été appliquée.");

// ───── Visite ─────
function visite(ctx) {
  const { data, more, accounts, previous } = ctx;
  const before = previous.data?.totals;
  const perDay = dayMap(data.series, "t", row => ({ visits: row.visits, views: row.views }));
  const hourly = ctx.days === 1 ? hourlyPoints(more?.hours, ctx.to).map(point => ({ ...point })) : null;
  const chart = lineChart(ctx, ctx.days === 1 ? "Visiteurs, heure par heure" : "Visiteurs", { ...(hourly ? { points: [], bucket: "day" } : timeline(ctx, perDay, ["visits", "views"])), hourly }, [{ key: "visits", label: "Visiteurs" }]);
  const sources = (data.sources || []).map(row => ({ label: row.source, visits: row.visits }));
  const devices = (data.devices || []).map(row => ({ label: DEVICE_LABELS[row.device] || row.device, visits: row.visits }));
  const pages = (data.pages || []).map(row => ({ label: PAGE_LABELS[row.page] || row.page, views: row.views, visits: row.visits }));
  const entries = (more?.entries || []).map(row => {
    const info = row.type ? nameOf(ctx, row.type, row.slug) : null;
    return { label: info?.name || PAGE_LABELS[row.page] || row.page, href: info?.href, visits: row.visits };
  });
  const out = [
    kpis(ctx, [
      { label: "Visiteurs", value: data.totals.visits, before: before?.visits },
      { label: "Pages vues", value: data.totals.views, before: before?.views },
      { label: "Comptes créés", value: accounts ? accounts.new_in_period : null, before: previous.accounts ? previous.accounts.new_in_period : null, note: accounts ? `${number(accounts.total)} au total` : "" }
    ]), chart,
    grid(
      card("D’où viennent les visiteurs", rankTable([{ label: "Visiteurs", key: "visits", bar: true }], sources, { first: "Source", emptyText: "Aucune visite sur cette période." })),
      card("Appareils", rankTable([{ label: "Visiteurs", key: "visits", bar: true }], devices, { first: "Appareil", emptyText: "Aucune visite sur cette période." }))
    ),
    grid(
      card("Pages les plus vues", rankTable([{ label: "Vues", key: "views", bar: true }], pages, { first: "Page", limit: 8, emptyText: "Aucune page vue." })),
      card("Page d’arrivée", rankTable([{ label: "Visiteurs", key: "visits", bar: true }], entries, { first: "Première page vue", limit: 8, emptyText: "Pas encore de données." }), note("La première page vue par les visiteurs arrivés sur le site."))
    )
  ];
  const broken = (more?.broken || []).map(row => ({ label: row.path, n: row.n }));
  const searches = (more?.empty_searches || []).map(row => ({ label: `« ${row.query} »`, n: row.n }));
  if (broken.length || searches.length) out.push(grid(
    card("Liens cassés à corriger", broken.length ? rankTable([{ label: "Fois", key: "n", bar: true }], broken, { first: "Adresse", limit: 8 }) : empty("Aucun lien cassé.")),
    card("Recherches sans résultat", searches.length ? rankTable([{ label: "Fois", key: "n", bar: true }], searches, { first: "Recherche", limit: 8 }) : empty("Aucune recherche sans résultat."))
  ));
  return out;
}

// ───── Boutique ─────
function boutique(ctx) {
  const { data, events, previous } = ctx;
  const contacts = new Map(((events?.clicks) || []).filter(row => row.name === "contact-piece").map(row => [row.detail, row.n]));
  const rows = entities(ctx, "piece").map(row => {
    const info = nameOf(ctx, "piece", row.slug);
    return { label: info?.name || row.slug, tag: info?.detail, href: info?.href, views: row.views, visits: row.visits, contacts: contacts.get(row.slug) || 0 };
  });
  return [
    kpis(ctx, [
      { label: "Pièces consultées", value: viewsOf(data, "piece"), before: was(ctx, "piece") },
      { label: "Clics « Me contacter »", value: clicks(events, "contact-piece"), before: clicks(previous.events, "contact-piece") },
      { label: "Visites de la boutique", value: viewsOf(data, "boutique"), before: was(ctx, "boutique") }
    ]),
    lineChart(ctx, "Pages vues de la boutique", sectionPoints(ctx, ["boutique"]), [{ key: "boutique", label: "Pages vues" }]),
    card("Pièces les plus consultées", rankTable([{ label: "Vues", key: "views", bar: true }, { label: "Visiteurs", key: "visits" }, { label: "Contacts", key: "contacts" }], rows, { first: "Pièce", limit: 15, emptyText: "Aucune pièce consultée sur cette période." }))
  ];
}

// ───── Collection ─────
function collection(ctx) {
  const { data } = ctx;
  const specimens = entities(ctx, "specimen").map(row => { const info = nameOf(ctx, "specimen", row.slug); return { label: info?.name || row.slug, tag: info?.detail, href: info?.href, views: row.views, visits: row.visits }; });
  const minerals = entities(ctx, "mineral").map(row => { const info = nameOf(ctx, "mineral", row.slug); return { label: info?.name || row.slug, href: info?.href, views: row.views, visits: row.visits }; });
  return [
    kpis(ctx, [
      { label: "Spécimens consultés", value: viewsOf(data, "specimen"), before: was(ctx, "specimen") },
      { label: "Fiches minéraux consultées", value: sum(entities(ctx, "mineral"), "views") },
      { label: "Visites de « Ma collection »", value: viewsOf(data, "collection"), before: was(ctx, "collection") }
    ]),
    lineChart(ctx, "Pages vues de la collection", sectionPoints(ctx, ["collection"]), [{ key: "collection", label: "Pages vues" }]),
    card("Spécimens les plus consultés", rankTable([{ label: "Vues", key: "views", bar: true }, { label: "Visiteurs", key: "visits" }], specimens, { first: "Spécimen", limit: 12, emptyText: "Aucun spécimen consulté sur cette période." })),
    card("Fiches minéraux les plus consultées", rankTable([{ label: "Vues", key: "views", bar: true }, { label: "Visiteurs", key: "visits" }], minerals, { first: "Minéral", limit: 12, emptyText: "Aucune fiche consultée sur cette période." }))
  ];
}

// ───── Articles & archives ─────
function lire(ctx) {
  const { data, events, previous } = ctx;
  const reads = new Map((events?.reads || []).map(row => [row.slug, row.n]));
  const articles = entities(ctx, "article").map(row => { const info = nameOf(ctx, "article", row.slug); return { label: info?.name || row.slug, href: info?.href, views: row.views, finished: reads.get(row.slug) || 0 }; });
  const archives = entities(ctx, "archive").map(row => { const info = nameOf(ctx, "archive", row.slug); return { label: info?.name || row.slug, href: info?.href, views: row.views, visits: row.visits }; });
  return [
    kpis(ctx, [
      { label: "Articles consultés", value: viewsOf(data, "article"), before: was(ctx, "article") },
      { label: "Archives consultées", value: viewsOf(data, "document"), before: was(ctx, "document") },
      { label: "Articles lus jusqu’au bout", value: events ? sum(events.reads, "n") : null, before: previous.events ? sum(previous.events.reads, "n") : null }
    ]),
    lineChart(ctx, "Pages vues des articles et des archives", sectionPoints(ctx, ["articles", "archives"]), [{ key: "articles", label: "Articles" }, { key: "archives", label: "Archives" }]),
    card("Articles les plus consultés", rankTable([{ label: "Vues", key: "views", bar: true }, { label: "Lus jusqu’au bout", key: "finished" }], articles, { first: "Article", limit: 10, emptyText: "Aucun article consulté sur cette période." }), note("« Lu jusqu’au bout » : au moins 15 secondes sur l’article et 90 % de la page parcourue.")),
    card("Archives les plus consultées", rankTable([{ label: "Vues", key: "views", bar: true }, { label: "Visiteurs", key: "visits" }], archives, { first: "Document", limit: 10, emptyText: "Aucune archive consultée sur cette période." }))
  ];
}

// ───── Jeux ─────
function jeux(ctx) {
  const { events, previous, sections } = ctx;
  if (!events) return notReady();
  const games = events.games || [];
  const rows = games.map(row => ({ label: GAME_LABELS[row.name] || row.name, ends: row.ends, starts: row.starts, avg: row.avg != null && !row.name.startsWith("persona-") ? Number(row.avg).toLocaleString("fr-FR") : "—" }));
  const perDay = dayMap(events.daily, "d", row => ({ ends: row.ends }));
  const personas = ["persona-mineral", "persona-prospecteur", "persona-outil", "persona-collectionneur", "persona-forme"].map(name => {
    const list = (events.results || []).filter(row => row.name === name);
    if (!list.length) return null;
    return { label: GAME_LABELS[name], top: ctx.resultNames.get(`${name}:${list[0].detail}`) || list[0].detail, n: sum(list, "n") };
  }).filter(Boolean);
  const out = [
    kpis(ctx, [
      { label: "Parties jouées", value: sum(games, "ends"), before: previous.events ? sum(previous.events.games, "ends") : null },
      { label: "Joueurs", value: sections ? sections.players : null, before: previous.sections ? previous.sections.players : null },
      { label: "Images partagées", value: sum(events.shares, "n"), before: previous.events ? sum(previous.events.shares, "n") : null }
    ]),
    lineChart(ctx, "Parties jouées", timeline(ctx, perDay, ["ends"]), [{ key: "ends", label: "Parties jouées" }]),
    card("Parties par jeu", rankTable([{ label: "Parties jouées", key: "ends", bar: true }, { label: "Commencées", key: "starts" }, { label: "Score moyen", key: "avg", text: true }], rows, { first: "Jeu", limit: 14, emptyText: "Aucune partie enregistrée sur cette période." }), note("Une partie est « jouée » quand elle est terminée."))
  ];
  if (personas.length) out.push(card("Résultats des quiz « Quel … es-tu ? »", rankTable([{ label: "Résultat le plus obtenu", key: "top", text: true }, { label: "Résultats", key: "n" }], personas, { first: "Quiz", emptyText: "" })));
  return out;
}

// ───── Outils & glossaire ─────
function outils(ctx) {
  const { data, sections, previous } = ctx;
  const terms = (sections?.terms || []).map(row => { const info = nameOf(ctx, "term", row.slug); return { label: info?.name || row.slug, href: info?.href, views: row.views, visits: row.visits }; });
  return [
    kpis(ctx, [
      { label: "Apprendre & outils", value: viewsOf(data, "apprendre"), before: was(ctx, "apprendre") },
      { label: "Identification", value: viewsOf(data, "identification"), before: was(ctx, "identification") },
      { label: "Termes du glossaire consultés", value: sections ? sections.terms_total : null, before: previous.sections ? previous.sections.terms_total : null }
    ]),
    lineChart(ctx, "Pages vues des outils, de l’identification et du glossaire", sectionPoints(ctx, ["outils"]), [{ key: "outils", label: "Pages vues" }]),
    card("Termes du glossaire les plus consultés", rankTable([{ label: "Vues", key: "views", bar: true }, { label: "Visiteurs", key: "visits" }], terms, { first: "Terme", limit: 15, emptyText: "Aucun terme consulté sur cette période." })),
    note("Les tests et outils sont mesurés par leur fréquentation (pages vues), pas encore par leur usage.")
  ];
}

export function renderPage(id, ctx) {
  const pages = { visite, boutique, collection, lire, jeux, outils };
  return (pages[id] || visite)(ctx);
}
