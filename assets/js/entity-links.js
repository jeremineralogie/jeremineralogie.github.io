// Liens automatiques vers les fiches (minéral, gisement, commune) dans les textes des articles.
import { cleanUrl, departmentUrl } from "./clean-urls.js";

// Pièces liées : nom public (minéral et commune, jamais le titre interne) et adresse de la page de la pièce.
const pieceName = row => [row.mineral_name, row.locality_name].filter(Boolean).join(" — ") || "Pièce";
const specimenLink = row => ({ name: pieceName(row), href: cleanUrl("specimen", row.slug) });
const shopLink = row => ({ name: pieceName(row), href: cleanUrl("piece", row.reference || row.slug) });
const SPECIMEN_COLUMNS = "entity:specimens(slug,mineral_name,locality_name)", SHOP_COLUMNS = "entity:shop_items(reference,slug,mineral_name,locality_name)";
export const ficheUrl = (type, slug) => cleanUrl(type, slug) || `fiche.html?type=${encodeURIComponent(type)}&id=${encodeURIComponent(slug)}`;

const isWordChar = character => Boolean(character) && /[\p{L}\p{N}]/u.test(character);

// Texte « replié » (sans accents, minuscules, tirets = espaces) + correspondance vers les indices d'origine.
function fold(text) {
  let normalized = ""; const map = [];
  for (let index = 0; index < text.length; index += 1) {
    const piece = text[index].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[’`]/g, "'").replace(/-/g, " ");
    for (const character of piece) { normalized += character; map.push(index); }
  }
  return { normalized, map };
}

// entities : [{ name, href }]. Retourne linkify(text, used) -> [{ text, href? }].
// Un même nom n'est relié qu'une fois par article (paramètre `used`) ; le nom le plus long l'emporte.
export function buildLinker(entities) {
  const list = (entities || []).filter(entity => entity?.name && entity.name.trim().length >= 3)
    .map(entity => ({ ...entity, key: fold(entity.name.trim()).normalized })).sort((a, b) => b.key.length - a.key.length);
  return function linkify(text, used = new Set()) {
    const source = String(text ?? "");
    const { normalized, map } = fold(source);
    const hits = [];
    for (const entity of list) {
      if (used.has(entity.key)) continue;
      let from = 0;
      while (from <= normalized.length) {
        const start = normalized.indexOf(entity.key, from);
        if (start < 0) break;
        const end = start + entity.key.length;
        const free = !hits.some(hit => start < hit.end && end > hit.start);
        if (free && !isWordChar(normalized[start - 1]) && !isWordChar(normalized[end])) { hits.push({ start, end, entity }); used.add(entity.key); break; }
        from = start + 1;
      }
    }
    hits.sort((a, b) => a.start - b.start);
    const parts = []; let cursor = 0;
    for (const hit of hits) {
      const start = map[hit.start]; const end = map[hit.end - 1] + 1;
      if (start < cursor) continue;
      if (start > cursor) parts.push({ text: source.slice(cursor, start) });
      parts.push({ text: source.slice(start, end), href: hit.entity.href }); cursor = end;
    }
    if (cursor < source.length) parts.push({ text: source.slice(cursor) });
    return parts.length ? parts : [{ text: source }];
  };
}

// Liens automatiques vers les fiches dans un texte mis en forme (sans toucher aux liens existants).
export function linkTextNodes(root, linker, used) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: node => node.parentElement?.closest("a") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
  const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node => {
    const parts = linker(node.nodeValue, used);
    if (!parts.some(part => part.href)) return;
    const fragment = document.createDocumentFragment(); appendLinked(fragment, parts); node.replaceWith(fragment);
  });
}

// Fiches liées à un document d'archive dans l'administration : [{ name, href }].
export async function loadArchiveLinks(client, archiveId) {
  const joins = [["archive_minerals", "minerals", "mineral"], ["archive_mines", "mines", "mine"], ["archive_localities", "localities", "locality"]];
  const out = [];
  await Promise.all(joins.map(async ([table, entityTable, type]) => {
    const { data, error } = await client.from(table).select(`entity:${entityTable}(name,slug)`).eq("archive_id", archiveId);
    if (error) { console.error(`Liens ${table} :`, error); return; }
    (data || []).forEach(row => { if (row.entity) out.push({ name: row.entity.name, href: ficheUrl(type, row.entity.slug) }); });
  }));
  const { data, error } = await client.from("archive_departments").select("entity:departments(name,code)").eq("archive_id", archiveId);
  if (error) console.error("Liens archive_departments :", error);
  (data || []).forEach(row => { if (row.entity) out.push({ name: row.entity.name, href: departmentUrl(row.entity.code) }); });
  // Articles et pièces (collection, boutique) liés dans l'administration.
  const more = [["archive_articles", "entity:articles(title,slug)", row => ({ name: row.entity.title, href: cleanUrl("article", row.entity.slug) })],
    ["archive_specimens", SPECIMEN_COLUMNS, row => specimenLink(row.entity)], ["archive_shop_items", SHOP_COLUMNS, row => shopLink(row.entity)]];
  await Promise.all(more.map(async ([table, select, toLink]) => {
    const result = await client.from(table).select(select).eq("archive_id", archiveId);
    if (result.error) { console.error(`Liens ${table} :`, result.error); return; }
    (result.data || []).forEach(row => { if (row.entity) out.push(toLink(row)); });
  }));
  return out;
}

export function appendLinked(element, parts) {
  parts.forEach(part => {
    if (!part.href) { element.append(document.createTextNode(part.text)); return; }
    const link = document.createElement("a"); link.className = "link"; link.dataset.fiche = ""; link.href = part.href; link.textContent = part.text; element.append(link);
  });
}

// Minéraux, gisements et communes publiés (le RLS ne renvoie que les fiches publiées).
export async function loadLinkEntities(client) {
  const kinds = [["mineral", "minerals"], ["mine", "mines"], ["locality", "localities"]];
  const results = await Promise.all(kinds.map(async ([type, table]) => {
    const { data, error } = await client.from(table).select("name,slug");
    if (error) throw error;
    return (data || []).map(row => ({ name: row.name, href: ficheUrl(type, row.slug) }));
  }));
  return results.flat();
}

// Liens choisis explicitement dans l'administration : Map(article_id -> [{ name, href }]).
export async function loadArticleLinks(client) {
  const joins = [["article_minerals", "minerals", "mineral"], ["article_mines", "mines", "mine"], ["article_localities", "localities", "locality"]];
  const map = new Map();
  const extra = [
    ["article_departments", "entity:departments(name,code)", row => ({ name: row.entity.name, href: departmentUrl(row.entity.code) })],
    ["article_regions", "entity:regions(name)", row => ({ name: row.entity.name, href: null })],
    ["archive_articles", "entity:archive_documents(title,slug)", row => ({ name: row.entity.title, href: cleanUrl("archive", row.entity.slug) })],
    ["article_specimens", SPECIMEN_COLUMNS, row => specimenLink(row.entity)],
    ["article_shop_items", SHOP_COLUMNS, row => shopLink(row.entity)]
  ];
  await Promise.all(extra.map(async ([table, select, toLink]) => {
    const { data, error } = await client.from(table).select(`article_id,${select}`);
    if (error) { console.error(`Liens ${table} :`, error); return; }
    (data || []).forEach(row => {
      if (!row.entity) return;
      if (!map.has(row.article_id)) map.set(row.article_id, []);
      map.get(row.article_id).push(toLink(row));
    });
  }));
  await Promise.all(joins.map(async ([table, entityTable, type]) => {
    const { data, error } = await client.from(table).select(`article_id,entity:${entityTable}(name,slug)`);
    if (error) throw error;
    (data || []).forEach(row => {
      if (!row.entity) return;
      if (!map.has(row.article_id)) map.set(row.article_id, []);
      map.get(row.article_id).push({ name: row.entity.name, href: ficheUrl(type, row.entity.slug) });
    });
  }));
  return map;
}
