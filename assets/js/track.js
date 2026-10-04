// Événements d'usage pour le tableau de bord Statistiques (voir analytics.js) : sans effet pour l'administrateur connecté et les robots.
export const track = (kind, name, detail, value) => { try { window.jmTrack?.(kind, name, detail, value); } catch { /* mesure facultative */ } };
