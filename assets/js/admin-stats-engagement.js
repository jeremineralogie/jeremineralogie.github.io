// Statistiques d'engagement de l'admin : calculs sans affichage (langue, région estimée par le fuseau horaire, réponses aux jeux, fiches ouvertes après une erreur, joueurs qui reviennent).
// Testés dans tests/admin-engagement.test.mjs.
export const percent = (part, total) => total ? Math.round((part / total) * 100) : 0;

const LANGUAGES = { fr: "Français", en: "Anglais", es: "Espagnol", de: "Allemand", it: "Italien", pt: "Portugais", nl: "Néerlandais", ar: "Arabe", ru: "Russe", zh: "Chinois", ja: "Japonais", ko: "Coréen", pl: "Polonais", tr: "Turc", sv: "Suédois", da: "Danois", no: "Norvégien", nb: "Norvégien", fi: "Finnois", cs: "Tchèque", el: "Grec", he: "Hébreu", hi: "Hindi", uk: "Ukrainien", ro: "Roumain", hu: "Hongrois", br: "Breton", ca: "Catalan", oc: "Occitan" };
export const languageName = code => LANGUAGES[String(code || "").toLowerCase().slice(0, 2)] || (code ? String(code).toUpperCase() : "Inconnue");

// Le fuseau horaire du navigateur donne une idée du pays, jamais le pays exact : un voyageur ou un téléphone réglé ailleurs fausse l'estimation.
const ZONES = {
  "Europe/Paris": "France", "Europe/Brussels": "Belgique", "Europe/Zurich": "Suisse", "Europe/Luxembourg": "Luxembourg", "Europe/Monaco": "Monaco", "Europe/Madrid": "Espagne", "Europe/Rome": "Italie",
  "Europe/Berlin": "Allemagne", "Europe/London": "Royaume-Uni", "Europe/Dublin": "Irlande", "Europe/Lisbon": "Portugal", "Europe/Amsterdam": "Pays-Bas", "Europe/Vienna": "Autriche", "Europe/Prague": "Tchéquie",
  "Europe/Warsaw": "Pologne", "Europe/Stockholm": "Suède", "Europe/Oslo": "Norvège", "Europe/Copenhagen": "Danemark", "Europe/Helsinki": "Finlande", "Europe/Athens": "Grèce", "Europe/Bucharest": "Roumanie",
  "Europe/Budapest": "Hongrie", "Europe/Moscow": "Russie", "Europe/Kiev": "Ukraine", "Europe/Kyiv": "Ukraine", "Europe/Istanbul": "Turquie", "Asia/Istanbul": "Turquie",
  "Africa/Casablanca": "Maroc", "Africa/Algiers": "Algérie", "Africa/Tunis": "Tunisie", "Africa/Dakar": "Sénégal", "Africa/Abidjan": "Côte d’Ivoire", "Africa/Douala": "Cameroun", "Africa/Kinshasa": "RD Congo", "Africa/Cairo": "Égypte", "Africa/Johannesburg": "Afrique du Sud",
  "America/Martinique": "Antilles et Guyane (France)", "America/Guadeloupe": "Antilles et Guyane (France)", "America/Cayenne": "Antilles et Guyane (France)", "Indian/Reunion": "La Réunion et Mayotte (France)", "Indian/Mayotte": "La Réunion et Mayotte (France)",
  "Pacific/Noumea": "Nouvelle-Calédonie et Polynésie (France)", "Pacific/Tahiti": "Nouvelle-Calédonie et Polynésie (France)",
  "America/Toronto": "Canada", "America/Montreal": "Canada", "America/Vancouver": "Canada", "America/Edmonton": "Canada", "America/Winnipeg": "Canada", "America/Halifax": "Canada", "America/Regina": "Canada", "America/St_Johns": "Canada",
  "America/Sao_Paulo": "Brésil", "America/Mexico_City": "Mexique", "America/Bogota": "Colombie", "America/Lima": "Pérou", "America/Santiago": "Chili", "America/Argentina/Buenos_Aires": "Argentine",
  "Asia/Tokyo": "Japon", "Asia/Shanghai": "Chine", "Asia/Hong_Kong": "Hong Kong", "Asia/Singapore": "Singapour", "Asia/Kolkata": "Inde", "Asia/Calcutta": "Inde", "Asia/Dubai": "Émirats arabes unis", "Asia/Jerusalem": "Israël", "Asia/Seoul": "Corée du Sud", "Asia/Bangkok": "Thaïlande", "Asia/Beirut": "Liban"
};
const US = /^America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Anchorage|Detroit|Indiana|Kentucky|Boise|Juneau)|^US\/|^Pacific\/Honolulu/;
const REGIONS = { Europe: "Europe (autre pays)", Africa: "Afrique (autre pays)", America: "Amérique (autre pays)", Asia: "Asie (autre pays)", Australia: "Australie", Pacific: "Océanie", Indian: "Océan Indien", Atlantic: "Atlantique" };
export function countryOfTimezone(zone) {
  if (!zone) return "Inconnu";
  if (ZONES[zone]) return ZONES[zone];
  if (US.test(zone)) return "États-Unis";
  if (/^Australia\//.test(zone)) return "Australie";
  const area = zone.split("/")[0];
  return REGIONS[area] || "Inconnu";
}
export function groupByCountry(rows) {
  const totals = new Map();
  (rows || []).forEach(row => { const country = countryOfTimezone(row.tz); totals.set(country, (totals.get(country) || 0) + (Number(row.n) || 0)); });
  return [...totals].map(([label, n]) => ({ label, n })).sort((a, b) => b.n - a.n);
}

// Réponses aux jeux : { game, key, n, ok } → classements.
export const successRate = row => row.n ? row.ok / row.n : 0;
export function mostMissed(rows, games, { min = 2 } = {}) {
  return (rows || []).filter(row => games.includes(row.game) && row.n >= min && row.n - row.ok > 0)
    .map(row => ({ ...row, missed: row.n - row.ok, rate: percent(row.ok, row.n) }))
    .sort((a, b) => b.missed - a.missed || a.rate - b.rate || b.n - a.n);
}
export function bestKnown(rows, games, { min = 3 } = {}) {
  return (rows || []).filter(row => games.includes(row.game) && row.n >= min)
    .map(row => ({ ...row, rate: percent(row.ok, row.n) }))
    .sort((a, b) => b.rate - a.rate || b.n - a.n);
}
export function hardestQuestions(rows, games, { min = 3 } = {}) {
  return (rows || []).filter(row => games.includes(row.game) && row.n >= min)
    .map(row => ({ ...row, rate: percent(row.ok, row.n) }))
    .sort((a, b) => a.rate - b.rate || b.n - a.n);
}

// Adresse ouverte après une erreur → fiche concernée (minéral, gisement, commune, terme du glossaire).
export function parseFicheTarget(path) {
  if (!path) return null;
  let url; try { url = new URL(path, "https://jeremineralogie.fr"); } catch { return null; }
  const type = url.searchParams.get("type"), id = url.searchParams.get("id");
  if (/fiche(\.html)?$/.test(url.pathname) && type && id) return { type, slug: id };
  const mineral = url.pathname.match(/^\/mineraux\/([^/]+)/); if (mineral) return { type: "mineral", slug: decodeURIComponent(mineral[1]) };
  const term = url.pathname.match(/^\/glossaire\/([^/]+)/); if (term) return { type: "term", slug: decodeURIComponent(term[1]) };
  return null;
}

// Joueurs qui reviennent : parts, en pourcentage des joueurs mesurés.
export function replayFigures(replay) {
  const players = Number(replay?.players) || 0;
  return { players, nextDay: Number(replay?.next_day) || 0, nextDayPct: percent(replay?.next_day, players), multi: Number(replay?.multi_day) || 0, multiPct: percent(replay?.multi_day, players), single: Number(replay?.single_day) || 0 };
}

// Ventes de la boutique : chiffre d'affaires, nombre de ventes, panier moyen, ventes par mois.
export function salesFigures(sales, from, to) {
  const key = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const first = key(from), last = key(to);
  const inRange = (sales || []).filter(sale => { const day = String(sale.sold_on).slice(0, 10); return day >= first && day <= last; });
  const total = inRange.reduce((sum, sale) => sum + (Number(sale.price_cents) || 0), 0);
  const months = new Map();
  inRange.forEach(sale => { const key = String(sale.sold_on).slice(0, 7); const row = months.get(key) || { month: key, count: 0, total: 0 }; row.count += 1; row.total += Number(sale.price_cents) || 0; months.set(key, row); });
  return { count: inRange.length, total, average: inRange.length ? Math.round(total / inRange.length) : 0, months: [...months.values()].sort((a, b) => b.month.localeCompare(a.month)), rows: inRange };
}
export const euros = cents => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: cents % 100 ? 2 : 0 }).format((Number(cents) || 0) / 100);
