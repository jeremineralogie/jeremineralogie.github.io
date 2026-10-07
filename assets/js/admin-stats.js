// Statistiques de l'admin (Paramètres → Statistiques) : sélecteur de période, six pages (Visite, Boutique, Collection, Articles & archives, Jeux, Outils & glossaire).
// Données : agrégats SQL admin_page_stats, admin_more_stats, admin_event_stats, admin_account_stats, admin_section_stats (période choisie et période précédente).
import { PERIODS, ranges, compareText, hasPrevious } from "./admin-stats-logic.js";
import { PAGE_TABS, renderPage } from "./admin-stats-pages.js";
import { loadResultNames, resultNames } from "./admin-stats-results.js";
const $ = selector => document.querySelector(selector);
const element = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text != null) node.textContent = text; return node; };
const remember = (key, value) => { try { sessionStorage.setItem(`jm-stats-${key}`, String(value)); } catch { /* stockage indisponible */ } };
const recall = key => { try { return sessionStorage.getItem(`jm-stats-${key}`); } catch { return null; } };

let client = null;
let bound = false;
let days = PERIODS.some(period => period.days === Number(recall("days"))) ? Number(recall("days")) : 7;
let tab = PAGE_TABS.some(([id]) => id === recall("tab")) ? recall("tab") : "visite";
let view = null;          // tout ce qui est affiché : données, période précédente, noms lisibles
let names = new Map();
let requestId = 0;

export async function openStats(supabase) {
  client = supabase;
  document.documentElement.style.setProperty("--st-top", `${document.querySelector(".admin-topbar")?.offsetHeight || 50}px`);
  if (!bound) {
    bound = true;
    let resizeTimer = null;
    window.addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { if (view && !$("#stats-panel").hidden) render(); }, 200); });
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
  document.querySelectorAll("#stats-periods .st-seg-btn").forEach(button => { const active = Number(button.dataset.days) === days; button.classList.toggle("is-active", active); button.setAttribute("aria-pressed", String(active)); if (active) button.scrollIntoView?.({ inline: "nearest", block: "nearest" }); });
}

async function load() {
  const mine = ++requestId;
  const status = $("#stats-status"), body = $("#stats-body");
  status.textContent = "Chargement des statistiques…"; status.hidden = false;
  const { from, to, previousFrom, previousTo } = ranges(days);
  const compare = hasPrevious(previousFrom, to);
  $("#stats-range").textContent = `${rangeText(from, to)} · ${compare ? `comparé ${compareText(days)}` : "comparaison indisponible (les données sont conservées 13 mois)"}`;
  const iso = date => date.toISOString();
  const span = (a, b) => ({ p_from: iso(a), p_to: iso(b) });
  const none = { data: null, error: { message: "période précédente non conservée" } };
  const ask = (name, args, wanted) => wanted ? client.rpc(name, args) : none;
  const [current, previous] = await Promise.all([client.rpc("admin_page_stats", { ...span(from, to), p_bucket: "day" }), ask("admin_page_stats", { ...span(previousFrom, previousTo), p_bucket: "day" }, compare)]);
  if (mine !== requestId) return;
  if (current.error) { status.textContent = `Impossible de charger les statistiques : ${current.error.message}`; body.hidden = true; return; }
  // Détails : si une fonction SQL n'est pas encore créée, la page affiche ce qui est disponible.
  const [more, events, accounts, sections, eventsBefore, accountsBefore, sectionsBefore] = await Promise.all([
    client.rpc("admin_more_stats", span(from, to)), client.rpc("admin_event_stats", span(from, to)), client.rpc("admin_account_stats", span(from, to)), client.rpc("admin_section_stats", span(from, to)),
    ask("admin_event_stats", span(previousFrom, previousTo), compare), ask("admin_account_stats", span(previousFrom, previousTo), compare), ask("admin_section_stats", span(previousFrom, previousTo), compare)
  ]);
  if (mine !== requestId) return;
  const ok = result => result.error ? null : result.data;
  [["admin_more_stats", more], ["admin_event_stats", events], ["admin_account_stats", accounts], ["admin_section_stats", sections]].forEach(([name, result]) => { if (result.error) console.warn(`Statistiques : ${name} indisponible :`, result.error.message); });
  const wanted = [...(current.data.entities || [])];
  (ok(more)?.entries || []).forEach(row => { if (row.type && row.slug) wanted.push({ type: row.type, slug: row.slug }); });
  (ok(events)?.reads || []).forEach(row => wanted.push({ type: "article", slug: row.slug }));
  (ok(events)?.clicks || []).forEach(row => { if (row.name === "contact-piece" && row.detail) wanted.push({ type: "piece", slug: row.detail }); });
  (ok(sections)?.terms || []).forEach(row => wanted.push({ type: "term", slug: row.slug }));
  [names] = await Promise.all([resolveNames(wanted), loadResultNames()]);
  if (mine !== requestId) return;
  view = {
    days, from, to, data: current.data, more: ok(more), events: ok(events), accounts: ok(accounts), sections: ok(sections),
    previous: { data: ok(previous), events: ok(eventsBefore), accounts: ok(accountsBefore), sections: ok(sectionsBefore) }
  };
  status.textContent = current.data.totals.views ? "" : "Aucune visite enregistrée sur cette période pour le moment.";
  status.hidden = !status.textContent;
  render();
}

function rangeText(from, to) {
  const day = date => date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", ...(days > 180 ? { year: "numeric" } : {}) });
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
    term: slugs => client.from("glossary_terms").select("slug,term").in("slug", slugs)
      .then(({ data }) => (data || []).forEach(row => map.set(`term:${row.slug}`, { name: row.term, href: `../glossaire/${encodeURIComponent(row.slug)}/` }))),
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
  const nav = $("#stats-tabs");
  nav.replaceChildren(...PAGE_TABS.map(([id, label]) => {
    const button = element("button", `st-tab${id === tab ? " is-active" : ""}`, label); button.type = "button"; button.setAttribute("role", "tab"); button.setAttribute("aria-selected", String(id === tab));
    button.addEventListener("click", () => { tab = id; remember("tab", id); render(); window.scrollTo?.({ top: Math.max(0, nav.getBoundingClientRect().top + window.scrollY - 12), behavior: "smooth" }); });
    return button;
  }));
  body.replaceChildren(...renderPage(tab, { ...view, names, resultNames }));
}
