// Page en cours pour le carnet de terrain : « Explorer 10 pages » et « Consulter 50 fiches minéraux ». Rien n'est envoyé : la progression reste sur l'appareil (et sur le compte du joueur s'il en a un).
import { recordPageView, recordFavoritePieces } from "./game-progress.js";
import { getFavorites } from "./favorites.js";

export function recordCurrentPage() {
  try {
    const page = window.JM_PAGE || (location.pathname.split("/").pop() || "index.html").replace(/\.html$/, "") || "index";
    if (page === "introuvable") return;
    const params = new URLSearchParams(window.JM_PARAMS ?? location.search);
    const entity = params.get("id") || params.get("ref") || params.get("slug") || params.get("dep");
    const key = entity ? `${page}:${params.get("type") || ""}:${entity}` : location.pathname.replace(/index\.html$/, "");
    recordFavoritePieces(getFavorites().filter(item => item.type === "piece").length);
    recordPageView(key, page === "fiche" && params.get("type") === "mineral" ? entity : null);
  } catch { /* le carnet ne doit jamais gêner la page */ }
}
