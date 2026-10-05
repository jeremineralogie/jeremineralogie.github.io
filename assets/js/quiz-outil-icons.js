// Icônes au trait des huit outils (64 × 64), dans les couleurs du site.
const wrap = (body, color = "currentColor") => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const BODIES = {
  marteau: `<g transform="rotate(-45 32 32)"><rect x="29" y="22" width="6" height="38" rx="2"/><rect x="14" y="8" width="36" height="14" rx="3"/><path d="M50 15h4"/></g>`,
  burin: `<g transform="rotate(30 32 32)"><rect x="24" y="36" width="16" height="24" rx="5"/><path d="M26 36l4-28h4l4 28z"/><path d="M22 36h20"/></g>`,
  loupe: `<circle cx="26" cy="26" r="17"/><path d="M38 38l18 18"/><path d="M16 22a11 11 0 0 1 8-8"/>`,
  lampe: `<path d="M22 14h20l4 14H18z"/><path d="M22 28h20v26a4 4 0 0 1-4 4H26a4 4 0 0 1-4-4z"/><path d="M32 4v6M12 8l5 5M52 8l-5 5"/><path d="M28 38h8"/>`,
  tamis: `<circle cx="32" cy="32" r="23"/><path d="M32 9v46M9 32h46M16 16l32 32M48 16L16 48"/><circle cx="32" cy="32" r="12"/>`,
  carnet: `<rect x="14" y="6" width="38" height="52" rx="4"/><path d="M24 6v52M32 20h14M32 29h14M32 38h9"/>`,
  sac: `<path d="M22 20a10 10 0 0 1 20 0"/><path d="M14 26a6 6 0 0 1 6-6h24a6 6 0 0 1 6 6v26a6 6 0 0 1-6 6H20a6 6 0 0 1-6-6z"/><path d="M22 42h20v12H22zM14 34h36"/>`,
  boussole: `<circle cx="32" cy="32" r="25"/><path d="M32 12l7 20-7 20-7-20z"/><path d="M32 32m-2 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0"/>`
};
export const OUTIL_ICON_KEYS = Object.keys(BODIES);
export const outilIcon = key => wrap(BODIES[key]);
// Version autonome (couleur fixe) pour l'image de partage.
export const outilIconUrl = key => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(wrap(BODIES[key], "#c4a6f5").replace("<svg ", '<svg width="256" height="256" '))}`;
