// Chargement à la demande de la bibliothèque de cartes Leaflet (feuille de style + script), une seule fois par page.
const LEAFLET = "https://unpkg.com/leaflet@1.9.4/dist/";
let loading = null;

export function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  loading ||= new Promise((resolve, reject) => {
    const css = document.createElement("link"); css.rel = "stylesheet"; css.href = `${LEAFLET}leaflet.css`; document.head.append(css);
    const script = document.createElement("script"); script.src = `${LEAFLET}leaflet.js`;
    script.onload = () => resolve(window.L);
    script.onerror = () => { loading = null; reject(new Error("La carte n’a pas pu se charger. Vérifiez votre connexion.")); };
    document.head.append(script);
  });
  return loading;
}
