// Pages « par thème » : minéraux regroupés par couleur, dureté, famille chimique et système cristallin.
// Même logique que l'aide à l'identification (couleurs, dureté), fonctions pures partagées avec le générateur de pages (tools/seo/build.mjs).
import { slugOf } from "./clean-urls.js";

export const fold = value => String(value ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[’`]/g, "'");
export const COLORS = [
  ["incolore", /incolore|limpide/], ["blanc", /blanc|argent/], ["gris", /gris|plomb|acier/], ["noir", /noir/],
  ["rouge", /rouge|vermillon|carmin|ecarlate/], ["rose", /rose|framboise/], ["orange", /orang/], ["jaune", /jaune|or\b|miel|dore|laiton|citron/],
  ["vert", /vert|olive|emeraude|pistache/], ["bleu", /bleu|azur|indigo|turquoise/], ["violet", /violet|pourpre|lilas|lavande|mauve/], ["brun", /brun|bronze|cuivre|ocre/]
];
export const colorKeys = mineral => { const text = fold((mineral.colors || []).join(" ")); return COLORS.filter(([, pattern]) => pattern.test(text)).map(([key]) => key); };

export const MIN_THEME = 5;                       // en dessous, la page serait trop mince : elle n'est pas publiée
export const KINDS = { couleur: "Couleur", durete: "Dureté", famille: "Famille chimique", systeme: "Système cristallin" };
const SYSTEMS = ["Cubique", "Quadratique", "Hexagonal", "Trigonal", "Orthorhombique", "Monoclinique", "Triclinique", "Amorphe"];
const COLOR_PLURAL = { incolore: "incolores", blanc: "blancs", gris: "gris", noir: "noirs", rouge: "rouges", rose: "roses", orange: "orange", jaune: "jaunes", vert: "verts", bleu: "bleus", violet: "violets", brun: "bruns" };
const lowerFirst = text => text.charAt(0).toLocaleLowerCase("fr") + text.slice(1);
const clean = value => String(value ?? "").replace(/\s+/g, " ").trim();

// Un minéral appartient à la dureté n si son intervalle de dureté touche [n − 0,5 ; n + 0,5].
export function hardnessKeys(mineral) {
  if (mineral.hardness == null) return [];
  const low = Number(mineral.hardness), high = Number(mineral.hardness_max ?? mineral.hardness);
  return Array.from({ length: 10 }, (_, index) => index + 1).filter(n => low <= n + 0.5 && high >= n - 0.5).map(String);
}
export function familyKeys(mineral) {
  const name = clean(mineral.chemical_class); if (!name) return [];
  return [slugOf(name), ...(/^Silicates \(/.test(name) ? ["silicates"] : [])];
}
export const systemKey = mineral => SYSTEMS.includes(clean(mineral.crystal_system)) ? slugOf(mineral.crystal_system) : null;

export const themePath = (kind, key) => `/themes/${kind}/${key}/`;

// { couleur: Map(clé → { key, label, minerals[] }), … } ; les thèmes de moins de MIN_THEME fiches sont écartés.
export function buildThemes(minerals) {
  const out = { couleur: new Map(), durete: new Map(), famille: new Map(), systeme: new Map() };
  const put = (kind, key, label, mineral) => { if (!key) return; if (!out[kind].has(key)) out[kind].set(key, { key, kind, label, minerals: [] }); out[kind].get(key).minerals.push(mineral); };
  minerals.forEach(mineral => {
    colorKeys(mineral).forEach(key => put("couleur", key, `Minéraux ${COLOR_PLURAL[key]}`, mineral));
    hardnessKeys(mineral).forEach(key => put("durete", key, `Minéraux de dureté ${key} (échelle de Mohs)`, mineral));
    familyKeys(mineral).forEach(key => put("famille", key, key === "silicates" ? "Minéraux de la famille des silicates" : `Minéraux de la famille des ${lowerFirst(clean(mineral.chemical_class))}`, mineral));
    const system = systemKey(mineral);
    put("systeme", system, system === "amorphe" ? "Minéraux amorphes" : `Minéraux du système ${lowerFirst(clean(mineral.crystal_system))}`, mineral);
  });
  Object.values(out).forEach(map => { [...map.keys()].forEach(key => { if (map.get(key).minerals.length < MIN_THEME) map.delete(key); }); });
  const order = { couleur: COLORS.map(([key]) => key), durete: Array.from({ length: 10 }, (_, i) => String(i + 1)), systeme: SYSTEMS.map(slugOf) };
  Object.entries(order).forEach(([kind, keys]) => { out[kind] = new Map([...out[kind]].sort((a, b) => keys.indexOf(a[0]) - keys.indexOf(b[0]))); });
  out.famille = new Map([...out.famille].sort((a, b) => b[1].minerals.length - a[1].minerals.length));
  return out;
}

// Ceux qu'on a le plus de chances de connaître : les plus courants d'abord (rareté non affichée), puis l'ordre alphabétique.
const RANK = { tres_commun: 0, commun: 1, rare: 2, tres_rare: 3 };
export const commonFirst = list => [...list].sort((a, b) => (RANK[a.rarity] ?? 2) - (RANK[b.rarity] ?? 2) || a.name.localeCompare(b.name, "fr"));

// Liens « parcourir par thème » d'une fiche minéral, limités aux thèmes qui existent (available = { couleur: [clés], … }).
export function themeLinksOf(mineral, available) {
  const has = (kind, key) => (available[kind] || []).includes(key);
  const links = [];
  const name = clean(mineral.chemical_class);
  familyKeys(mineral).forEach(key => { if (has("famille", key)) links.push({ title: `Famille chimique : ${key === "silicates" ? "silicates" : lowerFirst(name)}`, href: themePath("famille", key) }); });
  const system = systemKey(mineral); if (system && has("systeme", system)) links.push({ title: `Système cristallin : ${lowerFirst(clean(mineral.crystal_system))}`, href: themePath("systeme", system) });
  colorKeys(mineral).forEach(key => { if (has("couleur", key)) links.push({ title: `Couleur : ${key}`, href: themePath("couleur", key) }); });
  const keys = hardnessKeys(mineral); const wanted = [...new Set([String(Math.round(Number(mineral.hardness))), String(Math.round(Number(mineral.hardness_max ?? mineral.hardness)))])].filter(key => keys.includes(key));
  wanted.forEach(key => { if (has("durete", key)) links.push({ title: `Dureté : ${key} (Mohs)`, href: themePath("durete", key) }); });
  return links;
}

// ----- Textes d'introduction -----
const MOHS = { 1: ["du talc", "il se raye très facilement à l’ongle"], 2: ["du gypse", "il se raye à l’ongle (l’ongle vaut environ 2,5)"], 3: ["de la calcite", "elle se raye avec un objet en cuivre (environ 3 à 3,5)"], 4: ["de la fluorite", "un clou la raye facilement (environ 4,5)"],
  5: ["de l’apatite", "le verre ou une lame la raye (environ 5,5)"], 6: ["de l’orthose", "elle raye le verre, mais une lime en acier la raye (environ 6,5)"], 7: ["du quartz", "il raye l’acier et le verre, comme la porcelaine"], 8: ["de la topaze", "elle raye le quartz"], 9: ["du corindon", "c’est la dureté du rubis et du saphir"], 10: ["du diamant", "il raye tous les minéraux"] };
const FAMILIES = {
  "oxydes-et-hydroxydes": "Les oxydes sont des métaux combinés à l’oxygène, les hydroxydes des métaux combinés au groupement OH. On y trouve des minéraux très variés, des minerais de fer aux cristaux transparents.",
  "phosphates-arseniates-et-vanadates": "Ces minéraux sont construits autour des groupements phosphate, arséniate ou vanadate. Beaucoup se forment dans les zones d’altération des gisements.",
  "sulfures-et-sulfosels": "Ici, le soufre est combiné à un ou plusieurs métaux. Ce sont souvent des minéraux lourds, à l’éclat métallique, et les minerais de nombreux métaux.",
  "sulfates-chromates-molybdates-et-tungstates": "Ces minéraux sont construits autour des groupements sulfate, chromate, molybdate ou tungstate.",
  "silicates": "Les silicates associent silicium et oxygène. C’est la plus grande famille de minéraux, et celle qui forme l’essentiel de l’écorce terrestre. On les classe selon la façon dont leurs briques de silicium et d’oxygène sont assemblées.",
  "silicates-nesosilicates": "Dans les nésosilicates, les briques de silicium et d’oxygène sont isolées les unes des autres.",
  "silicates-sorosilicates": "Dans les sorosilicates, les briques de silicium et d’oxygène sont assemblées par deux.",
  "silicates-cyclosilicates": "Dans les cyclosilicates, les briques de silicium et d’oxygène forment des anneaux.",
  "silicates-inosilicates": "Dans les inosilicates, les briques de silicium et d’oxygène forment des chaînes.",
  "silicates-phyllosilicates": "Dans les phyllosilicates, les briques de silicium et d’oxygène forment des feuillets, ce qui donne des minéraux qui se clivent en lamelles, comme les micas.",
  "silicates-tectosilicates": "Dans les tectosilicates, les briques de silicium et d’oxygène forment une charpente en trois dimensions. Les feldspaths et le quartz en font partie.",
  "carbonates": "Ces minéraux contiennent le groupement carbonate (CO₃). Beaucoup font effervescence avec une goutte d’acide dilué, ce qui aide à les reconnaître.",
  "halogenures": "Ici, le chlore, le fluor, le brome ou l’iode sont combinés à un métal. La fluorite et la halite (le sel) en font partie.",
  "elements-natifs": "Ce sont des éléments chimiques trouvés à l’état pur dans la nature : l’or, l’argent, le cuivre, le soufre, le diamant…",
  "borates": "Ces minéraux associent le bore et l’oxygène."
};
const SYSTEM_TEXT = {
  cubique: "Trois axes de même longueur, perpendiculaires entre eux : on pense aux cubes et aux octaèdres.",
  quadratique: "Deux axes de même longueur et un troisième différent, tous perpendiculaires : les cristaux sont souvent des prismes à section carrée.",
  hexagonal: "Trois axes de même longueur dans un même plan, à 120° les uns des autres, et un axe perpendiculaire : on pense aux prismes à six pans.",
  trigonal: "Un système proche de l’hexagonal, avec une symétrie d’ordre 3 : on pense aux rhomboèdres et aux prismes à trois pans.",
  orthorhombique: "Trois axes de longueurs différentes, tous perpendiculaires entre eux.",
  monoclinique: "Trois axes de longueurs différentes, dont deux sont perpendiculaires et le troisième oblique.",
  triclinique: "Trois axes de longueurs différentes, tous obliques : c’est le système le moins symétrique.",
  amorphe: "Ces minéraux n’ont pas de structure cristalline ordonnée : ils ne forment pas de cristaux, comme l’opale ou l’obsidienne."
};

export function themeIntro(kind, entry) {
  const count = entry.minerals.length;
  const criterion = { couleur: `où la couleur « ${entry.key} » est citée`, durete: `dont la dureté correspond à ${entry.key} sur l’échelle de Mohs`, famille: "de cette famille chimique", systeme: "de ce système cristallin" }[kind];
  const first = `Cette page rassemble les ${count} fiches minéraux du site ${criterion}.`;
  const common = commonFirst(entry.minerals).slice(0, 5).map(item => item.name);
  const examples = common.length ? `Parmi les plus courants : ${common.join(", ")}.` : "";
  let specific = "";
  if (kind === "couleur") specific = "La couleur est un indice, jamais une preuve : un même minéral peut avoir plusieurs couleurs, et des minéraux différents se ressemblent. Pour trancher, regarde aussi le trait, la dureté et l’éclat.";
  if (kind === "durete") { const [reference, marker] = MOHS[Number(entry.key)] || []; specific = reference ? `Sur l’échelle de Mohs, la dureté ${entry.key} est celle ${reference} : ${marker}. Un minéral raye tous ceux qui sont moins durs que lui.` : ""; }
  if (kind === "famille") specific = FAMILIES[entry.key] || "";
  if (kind === "systeme") specific = SYSTEM_TEXT[entry.key] || "";
  return [first, examples, specific].filter(Boolean);
}
