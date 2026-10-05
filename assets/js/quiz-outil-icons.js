// Icônes des huit outils (64 × 64) : trait violet, remplissage doux et touche dorée, dans les couleurs du site.
const MAIN = "#c4a6f5", GOLD = "#f0d9a8";
const svg = (body, main, gold, size = "") => `<svg xmlns="http://www.w3.org/2000/svg" ${size}viewBox="0 0 64 64" fill="none" stroke="${main}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body(main, gold)}</svg>`;
// « soft » : forme du trait remplie à peine ; « gold » : touche dorée pleine.
const soft = (main, path) => `<path d="${path}" fill="${main}" fill-opacity=".16"/>`;
const gem = (gold, cx, cy, r) => `<path d="M${cx} ${cy - r}l${r * 0.8} ${r * 0.7}-${r * 0.8} ${r * 1.1}-${r * 0.8}-${r * 1.1}z" fill="${gold}" fill-opacity=".9" stroke="${gold}" stroke-width="1.6"/>`;
const BODIES = {
  // Marteau de géologue : face carrée d'un côté, pointe de l'autre, manche droit.
  marteau: (m, g) => `<g transform="translate(32 32) scale(.84) translate(-32 -32)"><g transform="rotate(-38 32 34)">${soft(m, "M30 24h5v34a2.5 2.5 0 0 1-5 0z")}${soft(m, "M10 8h22l6 4h4l16 7-16 7h-4l-6 4H10z")}<path d="M32 12v18M38 12v18"/><path d="M42 19h14" stroke="${g}"/></g></g>`,
  // Burin : tête frappée, fût, taille en pointe, éclats.
  burin: (m, g) => `<g transform="rotate(24 32 32)">${soft(m, "M25 6h14a2 2 0 0 1 2 2v4H23V8a2 2 0 0 1 2-2z")}${soft(m, "M27 12h10v30l-5 16-5-16z")}<path d="M27 22h10M27 30h10"/></g><path d="M11 46l-5-3M14 53l-4 3M22 56l-1 5" stroke="${g}"/>`,
  // Loupe sur un cristal.
  loupe: (m, g) => `<circle cx="27" cy="27" r="19" fill="${m}" fill-opacity=".1"/><path d="M41 41l17 17" stroke-width="5"/><path d="M41 41l17 17" stroke="${g}" stroke-width="1.6"/>${gem(g, 27, 28, 9)}<path d="M15 20a14 14 0 0 1 9-8" stroke="${g}"/>`,
  // Lampe UV et faisceau sur un cristal.
  lampe: (m, g) => `<g transform="translate(30 34) scale(.82) translate(-32 -32)"><path d="M26 24L56 8v34z" fill="${g}" fill-opacity=".14" stroke="none"/><g transform="rotate(-62 20 40)">${soft(m, "M4 33h22l6-6v26l-6-6H4z")}${soft(m, "M32 27h6v26h-6z")}<path d="M10 33v14"/></g>${gem(g, 50, 42, 8)}<path d="M52 10l3-5M58 22l5-2M46 4l1-4" stroke="${g}"/></g>`,
  // Tamis : cuvette à mailles, cailloux qui passent, pépite restée dedans.
  tamis: (m, g) => `<ellipse cx="32" cy="20" rx="26" ry="9" fill="${m}" fill-opacity=".1"/>${soft(m, "M6 20q2 22 26 24 24-2 26-24")}<path d="M16 25v13M24 27v15M32 28v16M40 27v15M48 25v13"/><ellipse cx="32" cy="20" rx="26" ry="9"/><circle cx="23" cy="20" r="3" fill="${g}" stroke="${g}"/><circle cx="14" cy="54" r="2" fill="${m}"/><circle cx="26" cy="58" r="2" fill="${m}"/><circle cx="40" cy="55" r="2.5" fill="${m}"/><circle cx="50" cy="59" r="2" fill="${m}"/>`,
  // Carnet de terrain : élastique, marque-page, crayon.
  carnet: (m, g) => `${soft(m, "M12 6h34a4 4 0 0 1 4 4v44a4 4 0 0 1-4 4H12z")}<path d="M12 6v52"/><path d="M38 6v18l4-3 4 3V6" stroke="${g}" fill="${g}" fill-opacity=".5"/><path d="M20 20h12M20 28h18M20 36h14M20 44h9"/><g transform="rotate(35 50 46)"><path d="M47 28h6v22l-3 6-3-6z" fill="${g}" fill-opacity=".9" stroke="${g}"/><path d="M47 33h6" stroke="${m}"/></g>`,
  // Sac à dos de prospecteur, avec le manche d'un marteau qui dépasse.
  sac: (m, g) => `<path d="M46 6l12 12" stroke="${g}" stroke-width="3.4"/><path d="M52 12l-18 18" stroke="${g}"/><path d="M22 20a10 10 0 0 1 20 0"/>${soft(m, "M14 28a8 8 0 0 1 8-8h20a8 8 0 0 1 8 8v24a7 7 0 0 1-7 7H21a7 7 0 0 1-7-7z")}<path d="M14 36h36"/>${soft(m, "M22 42h20v13H22z")}<path d="M32 42v6" stroke="${g}"/><circle cx="32" cy="50" r="2" fill="${g}" stroke="${g}"/>`,
  // Boussole : cadran, graduations, aiguille bicolore.
  boussole: (m, g) => `<circle cx="32" cy="32" r="26" fill="${m}" fill-opacity=".12"/><circle cx="32" cy="32" r="21"/><path d="M32 6v5M32 53v5M6 32h5M53 32h5" stroke-width="3"/><path d="M32 32L24 32 32 11l8 21z" fill="${g}" fill-opacity=".9" stroke="${g}"/><path d="M32 32l8 0-8 21-8-21z" fill="${m}" fill-opacity=".3"/><circle cx="32" cy="32" r="2.4" fill="#120a1d"/>`
};
export const OUTIL_ICON_KEYS = Object.keys(BODIES);
export const outilIcon = key => svg(BODIES[key], MAIN, GOLD);
// Version autonome (dimensions fixes) pour l'image de partage.
export const outilIconUrl = key => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg(BODIES[key], MAIN, GOLD, 'width="256" height="256" '))}`;
