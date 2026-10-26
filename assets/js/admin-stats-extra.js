// Statistiques d'engagement de l'admin : temps passé, défilement, langue, région estimée, navigation, plein écran, réponses aux jeux, fiches ouvertes après une erreur,
// joueurs qui reviennent, séries et badges des comptes, liens des articles, ventes de la boutique.
// Données : admin_engagement_stats (période choisie), admin_progress_stats (comptes), table shop_sales. Chaque carte sait s'afficher tant que la mise à jour de la base n'est pas appliquée.
import { kpis, card, grid, note, empty, rankTable, duration, number, element } from "./admin-stats-ui.js";
import { BADGES } from "./badges.js";
import { bestKnown, euros, groupByCountry, hardestQuestions, languageName, mostMissed, parseFicheTarget, percent, replayFigures, salesFigures } from "./admin-stats-engagement.js";

const NOT_READY = "Cette mesure sera disponible dès que la mise à jour de la base de données aura été appliquée.";
const NO_DATA = "Pas encore de mesure : elle a démarré avec la mise en ligne de cette version du site.";
const missing = title => card(title, empty(NOT_READY));
const GAME_NAMES = { mineral: "Trouve le minéral", quiz: "Le quiz du jour", "plus-dur": "Plus dur ou moins dur ?", glossaire: "Le glossaire en défi", pendu: "Le pendu minéralogique", "vrai-faux": "Vrai ou faux minéralogique", "classe-les": "Classe-les !", geo: "Devine le gisement", jeu: "Un jeu" };
const gameName = game => GAME_NAMES[game] || game;

// ───── Général ─────
export function timeAndScroll(ctx, { label }) {
  const title = "Temps passé et défilement, page par page";
  const e = ctx.engagement; if (!e) return missing(title);
  const scroll = new Map((e.scroll_pages || []).map(row => [row.page, row]));
  const rows = (e.time_pages || []).map(row => {
    const s = scroll.get(row.page);
    return { label: label(row.page), n: row.n, time: duration(Number(row.avg)), median: duration(Number(row.median)), half: s ? `${percent(s.p50, s.n)} %` : "—", full: s ? `${percent(s.p90, s.n)} %` : "—" };
  });
  return card(title,
    rankTable([{ label: "Mesures", key: "n", bar: true }, { label: "Temps moyen", key: "time", text: true }, { label: "Temps médian", key: "median", text: true }, { label: "Ont atteint 50 % de la page", key: "half", text: true }, { label: "Ont atteint 90 %", key: "full", text: true }], rows, { first: "Page", limit: 20, emptyText: NO_DATA }),
    note("Temps pendant lequel la page est ouverte et visible à l’écran. Le défilement est la part de la page descendue (100 % pour une page courte)."));
}

export function audienceOrigin(ctx) {
  const e = ctx.engagement; if (!e) return missing("Langue et région estimée");
  const langs = (e.langs || []).map(row => ({ label: languageName(row.lang), n: row.n }));
  const regions = groupByCountry(e.timezones);
  return grid(
    card("Langue du navigateur", rankTable([{ label: "Visites", key: "n", bar: true }], langs, { first: "Langue", limit: 10, emptyText: NO_DATA })),
    card("Région estimée", rankTable([{ label: "Visites", key: "n", bar: true }], regions, { first: "Région", limit: 12, emptyText: NO_DATA }),
      note("Estimation d’après le fuseau horaire du navigateur. Le site ne garde ni adresse IP ni position : le pays exact n’est pas connu, et un téléphone réglé sur un autre fuseau fausse l’estimation."))
  );
}

export function navigationClicks(ctx) {
  const e = ctx.engagement; if (!e) return missing("Clics de navigation");
  const prefix = { menu: "Menu", "fiche-nav": "Dans une fiche", "fil-ariane": "Fil d’Ariane" };
  const rows = (e.menu || []).map(row => ({ label: `${prefix[row.name] || row.name} : ${row.detail}`, n: row.n }));
  return card("Clics dans le menu et les boutons de navigation", rankTable([{ label: "Clics", key: "n", bar: true }], rows, { first: "Bouton", limit: 20, emptyText: NO_DATA }));
}

// ───── Boutique ─────
export function fullscreenPhotos(ctx, { nameOf }) {
  const e = ctx.engagement; if (!e) return missing("Photos regardées en plein écran");
  const rows = (e.fullscreen || []).filter(row => row.detail.startsWith("piece:")).map(row => {
    const slug = row.detail.slice(6), info = nameOf(ctx, "piece", slug);
    return { label: info?.name || slug, tag: info?.detail, href: info?.href, n: row.n };
  });
  return card("Photos regardées en plein écran", rankTable([{ label: "Ouvertures", key: "n", bar: true }], rows, { first: "Pièce", limit: 15, emptyText: NO_DATA }), note("Une ouverture = une photo agrandie sur une fiche de la boutique."));
}

// Ventes : chiffre d'affaires et nombre de ventes, avec enregistrement des ventes (table réservée à l'administrateur).
export function salesCard(ctx) {
  const box = card("Chiffre d’affaires et ventes"); const body = element("div"); box.append(body);
  void drawSales(ctx, body);
  return box;
}
async function drawSales(ctx, body) {
  body.replaceChildren(empty("Chargement des ventes…"));
  const client = ctx.client; if (!client) { body.replaceChildren(empty(NOT_READY)); return; }
  const [salesResult, itemsResult] = await Promise.all([
    client.from("shop_sales").select("id,shop_item_id,reference,label,price_cents,sold_on").order("sold_on", { ascending: false }).limit(1000),
    client.from("shop_items").select("id,reference,title,mineral_name,price_cents").eq("sale_status", "sold").limit(500)
  ]);
  if (salesResult.error) { body.replaceChildren(empty("Les ventes seront disponibles dès que la mise à jour de la base de données aura été appliquée (table shop_sales).")); return; }
  const sales = salesResult.data || [], sold = itemsResult.data || [];
  const figures = salesFigures(sales, ctx.from, ctx.to);
  const recorded = new Set(sales.map(sale => sale.shop_item_id).filter(Boolean));
  const pending = sold.filter(item => !recorded.has(item.id));
  const rows = figures.rows.map(sale => ({ label: sale.label || sale.reference || "Vente", tag: new Date(`${sale.sold_on}T12:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }), price: euros(sale.price_cents), id: sale.id }));
  const table = rankTable([{ label: "Prix", key: "price", text: true }], rows, { first: "Vente", limit: 50, emptyText: "Aucune vente enregistrée sur cette période." });
  // Bouton de suppression sur chaque ligne du tableau.
  table.querySelectorAll?.("tbody tr").forEach((tr, index) => {
    const remove = element("button", "link", "Supprimer"); remove.type = "button";
    remove.addEventListener("click", async () => { remove.disabled = true; const { error } = await client.from("shop_sales").delete().eq("id", rows[index].id); if (error) { remove.disabled = false; alert(`Suppression impossible : ${error.message}`); return; } void drawSales(ctx, body); });
    const cell = element("td"); cell.append(remove); tr.append(cell);
  });
  const monthRows = figures.months.map(month => ({ label: new Date(`${month.month}-15T12:00:00`).toLocaleDateString("fr-FR", { month: "long", year: "numeric" }), count: month.count, total: euros(month.total) }));
  const form = element("form", "st-form");
  const select = element("select"); select.id = "sale-item"; select.setAttribute("aria-label", "Pièce vendue");
  select.append(new Option("Pièce vendue…", ""));
  pending.forEach(item => select.append(new Option(`${item.reference} · ${item.mineral_name || item.title}`, item.id)));
  select.append(new Option("Autre vente (hors boutique)", "other"));
  const label = element("input"); label.type = "text"; label.placeholder = "Nom de la vente"; label.hidden = true; label.maxLength = 120; label.setAttribute("aria-label", "Nom de la vente");
  const price = element("input"); price.type = "number"; price.min = "0"; price.step = "0.01"; price.placeholder = "Prix de vente (€)"; price.required = true; price.inputMode = "decimal"; price.setAttribute("aria-label", "Prix de vente en euros");
  const day = element("input"); day.type = "date"; day.required = true; day.valueAsDate = new Date(); day.setAttribute("aria-label", "Date de vente");
  const save = element("button", "btn", "Enregistrer la vente"); save.type = "submit";
  const status = element("p", "stats-note"); status.setAttribute("role", "status");
  select.addEventListener("change", () => { label.hidden = select.value !== "other"; const item = sold.find(entry => entry.id === select.value); if (item && item.price_cents && !price.value) price.value = String(item.price_cents / 100); });
  form.append(select, label, price, day, save, status);
  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (!select.value) { status.textContent = "Choisissez la pièce vendue."; return; }
    const cents = Math.round(Number(price.value) * 100); if (!Number.isFinite(cents) || cents < 0) { status.textContent = "Prix invalide."; return; }
    const item = sold.find(entry => entry.id === select.value);
    const row = item ? { shop_item_id: item.id, reference: item.reference, label: `${item.mineral_name || item.title}`, price_cents: cents, sold_on: day.value } : { label: label.value.trim() || "Vente", price_cents: cents, sold_on: day.value };
    save.disabled = true; status.textContent = "Enregistrement…";
    const { error } = await client.from("shop_sales").insert(row);
    if (error) { save.disabled = false; status.textContent = `Enregistrement impossible : ${error.message}`; return; }
    void drawSales(ctx, body);
  });
  body.replaceChildren(...[
    kpis(ctx, [{ label: "Chiffre d’affaires", text: euros(figures.total) }, { label: "Ventes", value: figures.count }, { label: "Panier moyen", text: figures.count ? euros(figures.average) : "—" }]),
    table,
    monthRows.length > 1 ? rankTable([{ label: "Ventes", key: "count" }, { label: "Chiffre d’affaires", key: "total", text: true }], monthRows, { first: "Mois", limit: 12 }) : null,
    pending.length ? note(`${pending.length} pièce${pending.length > 1 ? "s" : ""} marquée${pending.length > 1 ? "s" : ""} « vendue${pending.length > 1 ? "s" : ""} » sans prix de vente enregistré : choisissez-la dans la liste ci-dessous.`) : null,
    form
  ].filter(Boolean));
}

// ───── Ma collection ─────
export function specimenTime(ctx, { nameOf }) {
  const e = ctx.engagement; if (!e) return missing("Temps passé sur une fiche");
  const all = (e.time_pages || []).find(row => row.page === "specimen");
  const rows = (e.time_entities || []).filter(row => row.page === "specimen").map(row => { const info = nameOf(ctx, "specimen", row.slug); return { label: info?.name || row.slug, tag: info?.detail, href: info?.href, n: row.n, time: duration(Number(row.avg)) }; });
  return card("Temps passé sur une fiche",
    kpis(ctx, [{ label: "Temps moyen sur une fiche", text: all ? duration(Number(all.avg)) : "—" }, { label: "Fiches mesurées", value: all ? all.n : 0 }]),
    rankTable([{ label: "Mesures", key: "n", bar: true }, { label: "Temps moyen", key: "time", text: true }], rows, { first: "Spécimen", limit: 15, emptyText: NO_DATA }));
}

// ───── Articles ─────
export function articleReading(ctx, { nameOf }) {
  const e = ctx.engagement; if (!e) return missing("Lecture des articles");
  const scroll = new Map((e.scroll_entities || []).filter(row => row.page === "article").map(row => [row.slug, row]));
  const rows = (e.time_entities || []).filter(row => row.page === "article").map(row => {
    const info = nameOf(ctx, "article", row.slug), s = scroll.get(row.slug);
    return { label: info?.name || row.slug, href: info?.href, n: row.n, time: duration(Number(row.avg)), deep: s ? `${percent(s.p90, s.n)} %` : "—", avg: s ? `${s.avg} %` : "—" };
  });
  return card("Temps de lecture et défilement, article par article",
    rankTable([{ label: "Mesures", key: "n", bar: true }, { label: "Temps de lecture moyen", key: "time", text: true }, { label: "Défilement moyen", key: "avg", text: true }, { label: "Ont atteint 90 %", key: "deep", text: true }], rows, { first: "Article", limit: 20, emptyText: NO_DATA }),
    note("Temps pendant lequel l’article est ouvert et visible. « Lu jusqu’au bout » (plus haut) combine au moins 15 secondes et 90 % de la page."));
}
export function articleLinks(ctx, { nameOf }) {
  const e = ctx.engagement; if (!e) return missing("Liens cliqués dans les articles");
  const target = path => { const t = parseFicheTarget(path); const info = t && nameOf(ctx, t.type, t.slug); return info ? info.name : path; };
  const rows = (e.article_links || []).map(row => ({ label: `${nameOf(ctx, "article", row.slug)?.name || row.slug} → ${target(row.target)}`, n: row.n }));
  return card("Liens cliqués dans les articles", rankTable([{ label: "Clics", key: "n", bar: true }], rows, { first: "Lien", limit: 20, emptyText: NO_DATA }));
}

// ───── Jeux & quiz ─────
export function replayCard(ctx) {
  const e = ctx.engagement; if (!e) return missing("Joueurs qui reviennent");
  const r = replayFigures(e.replay);
  return card("Joueurs qui reviennent",
    kpis(ctx, [{ label: "Joueurs mesurés", value: r.players }, { label: "Reviennent le lendemain", text: r.players ? `${r.nextDayPct} %` : "—", note: `${number(r.nextDay)} joueur${r.nextDay > 1 ? "s" : ""}` }, { label: "Jouent sur 2 jours ou plus", text: r.players ? `${r.multiPct} %` : "—", note: `${number(r.multi)} joueur${r.multi > 1 ? "s" : ""}` }]),
    note("Un joueur est reconnu par un numéro aléatoire gardé sur son appareil, uniquement pour les jeux. Il ne contient aucune information personnelle et il est effacé si le visiteur vide les données de son navigateur."));
}
export function answerCards(ctx, { nameOf }) {
  const e = ctx.engagement; if (!e) return [missing("Réponses aux jeux")];
  const rows = e.answers || [];
  const mineralName = slug => nameOf(ctx, "mineral", slug)?.name || slug;
  const missed = mostMissed(rows, ["mineral", "quiz"]).map(row => ({ label: mineralName(row.key), tag: gameName(row.game), href: nameOf(ctx, "mineral", row.key)?.href, missed: row.missed, rate: `${row.rate} %`, n: row.n }));
  const known = bestKnown(rows, ["mineral", "quiz"]).map(row => ({ label: mineralName(row.key), tag: gameName(row.game), href: nameOf(ctx, "mineral", row.key)?.href, rate: `${row.rate} %`, n: row.n }));
  const text = row => row.game === "glossaire" || row.game === "pendu" ? (nameOf(ctx, "term", row.key)?.name || row.key) : row.game === "plus-dur" ? mineralName(row.key) : row.key;
  const hard = hardestQuestions(rows, ["glossaire", "vrai-faux", "pendu", "plus-dur"]).map(row => ({ label: text(row), tag: gameName(row.game), rate: `${row.rate} %`, n: row.n }));
  return [
    grid(
      card("Minéraux les plus ratés", rankTable([{ label: "Ratés", key: "missed", bar: true }, { label: "Réponses", key: "n" }, { label: "Réussite", key: "rate", text: true }], missed, { first: "Minéral", limit: 15, emptyText: NO_DATA })),
      card("Minéraux les mieux reconnus", rankTable([{ label: "Réponses", key: "n", bar: true }, { label: "Réussite", key: "rate", text: true }], known, { first: "Minéral", limit: 15, emptyText: "Il faut au moins 3 réponses par minéral." }))
    ),
    card("Questions les plus difficiles", rankTable([{ label: "Réponses", key: "n", bar: true }, { label: "Réussite", key: "rate", text: true }], hard, { first: "Question", limit: 20, emptyText: "Il faut au moins 3 réponses par question." }),
      note("Minéraux : « Trouve le minéral » et le quiz du jour. Questions : le glossaire en défi, le vrai ou faux, le pendu et « Plus dur ou moins dur ? »."))
  ];
}
export function afterErrorCard(ctx, { nameOf }) {
  const e = ctx.engagement; if (!e) return missing("Fiches ouvertes après une erreur");
  const rows = (e.after_error || []).map(row => {
    const t = parseFicheTarget(row.target), info = t && nameOf(ctx, t.type, t.slug);
    return { label: info?.name || row.target, tag: gameName(row.game), href: info?.href, n: row.n };
  });
  return card("Fiches ouvertes après une erreur",
    kpis(ctx, [{ label: "Fiches ouvertes après une erreur", value: e.after_error_total || 0 }, { label: "Erreurs dans les jeux", value: e.errors_total || 0 }, { label: "Part des erreurs suivies d’une fiche", text: e.errors_total ? `${percent(e.after_error_total, e.errors_total)} %` : "—" }]),
    rankTable([{ label: "Ouvertures", key: "n", bar: true }], rows, { first: "Fiche", limit: 15, emptyText: NO_DATA }));
}
export function seriesAndBadges(ctx) {
  const p = ctx.progress; if (!p) return [missing("Séries et badges des comptes")];
  const badgeName = new Map(BADGES.map(item => [item.id, `${item.icon || ""} ${item.name}`.trim()]));
  const badges = (p.badges || []).map(row => ({ label: badgeName.get(row.id) || row.id, n: row.n }));
  const buckets = (p.streak_buckets || []).map(row => ({ label: row.label, n: row.n }));
  return [
    card("Séries des comptes joueurs",
      kpis(ctx, [{ label: "Plus longue série", text: `${p.best_streak || 0} jour${p.best_streak > 1 ? "s" : ""}` }, { label: "Série moyenne (la meilleure de chaque compte)", text: `${Number(p.avg_best || 0).toLocaleString("fr-FR")} jours` }, { label: "Séries en cours", value: p.running }, { label: "Comptes avec une progression", value: p.accounts }]),
      rankTable([{ label: "Comptes", key: "n", bar: true }], buckets, { first: "Meilleure série", limit: 10, emptyText: "Aucun compte n’a encore joué." }),
      note("Une série = des jours consécutifs avec au moins une partie des jeux du jour. Seuls les comptes joueurs sont comptés (les autres jeux restent sur l’appareil du visiteur).")),
    card("Badges obtenus", rankTable([{ label: "Comptes", key: "n", bar: true }], badges, { first: "Badge", limit: 25, emptyText: "Aucun badge obtenu pour le moment." }), note(`Moyenne : ${Number(p.avg_badges || 0).toLocaleString("fr-FR")} badge par compte.`))
  ];
}
