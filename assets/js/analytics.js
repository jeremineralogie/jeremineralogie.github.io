// Mesure d'audience maison (tableau de bord Statistiques de l'admin).
// Aucun cookie, aucune adresse IP : un identifiant de visite aléatoire, gardé 30 minutes dans l'onglet (sessionStorage).
// Les passages de l'administrateur connecté et les robots ne sont pas comptés.
(() => {
  try {
    const config = window.JEREMINERALOGIE_SUPABASE;
    if (!config?.url || !config.publishableKey || navigator.webdriver) return;
    if (/bot|crawl|spider|slurp|preview|lighthouse|headless|facebookexternalhit/i.test(navigator.userAgent)) return;
    try { if (Object.keys(localStorage).some(key => /^sb-.+-auth-token$/.test(key))) return; } catch { /* stockage indisponible */ }

    const now = Date.now();
    const uuid = () => crypto.randomUUID ? crypto.randomUUID() : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
    let visit = null;
    try { visit = JSON.parse(sessionStorage.getItem("jm-visit") || "null"); } catch { visit = null; }
    const isEntry = !visit || now - visit.last > 30 * 60 * 1000;
    if (isEntry) visit = { id: uuid() };
    visit.last = now;
    try { sessionStorage.setItem("jm-visit", JSON.stringify(visit)); } catch { /* visite comptée sans suite */ }

    const params = new URLSearchParams(window.JM_PARAMS ?? location.search);
    const page = window.JM_PAGE || (location.pathname.split("/").pop() || "index.html").replace(/\.html$/, "") || "index";
    const ENTITY = {
      specimen: ["specimen", "id"], piece: ["piece", "ref"], article: ["article", "slug"],
      document: ["archive", "slug"], departement: ["departement", "dep"]
    };
    let entityType = null, entitySlug = null;
    if (page === "fiche" && ["mineral", "mine", "locality"].includes(params.get("type"))) { entityType = params.get("type"); entitySlug = params.get("id"); }
    else if (ENTITY[page]) { entityType = ENTITY[page][0]; entitySlug = params.get(ENTITY[page][1]); }

    let source = null, referrerHost = null;
    if (isEntry) {
      try { referrerHost = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, "") : null; } catch { referrerHost = null; }
      if (referrerHost === location.hostname.replace(/^www\./, "")) referrerHost = null;
      const SOURCES = [
        [/(^|\.)google\./, "Google"], [/(^|\.)bing\.com$/, "Bing"], [/duckduckgo\.com$/, "DuckDuckGo"], [/qwant\.com$/, "Qwant"],
        [/ecosia\.org$/, "Ecosia"], [/yahoo\./, "Yahoo"], [/(^|\.)(facebook\.com|fb\.com|fb\.me)$/, "Facebook"],
        [/instagram\.com$/, "Instagram"], [/tiktok\.com$/, "TikTok"], [/(youtube\.com|youtu\.be)$/, "YouTube"],
        [/pinterest\./, "Pinterest"], [/(^|\.)(t\.co|twitter\.com|x\.com)$/, "X (Twitter)"], [/(^|\.)(mindat\.org)$/, "Mindat"]
      ];
      const utm = params.get("utm_source");
      source = utm ? utm.slice(0, 60) : referrerHost ? (SOURCES.find(([pattern]) => pattern.test(referrerHost))?.[1] || referrerHost) : "Accès direct";
    }

    const ua = navigator.userAgent;
    const tablet = /iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua)) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    const device = tablet ? "tablette" : /Mobi|iPhone|iPod|Android/i.test(ua) ? "mobile" : "ordinateur";
    const clip = (value, max) => value ? String(value).slice(0, max) : null;

    fetch(`${config.url}/rest/v1/page_views`, {
      method: "POST", keepalive: true,
      headers: { apikey: config.publishableKey, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({
        visit_id: visit.id, page: clip(page, 60), path: clip(location.pathname + location.search, 300) || "",
        entity_type: entitySlug ? entityType : null, entity_slug: clip(entitySlug, 200),
        search_query: page === "recherche" ? clip(params.get("q")?.trim(), 200) : null,
        referrer_host: clip(referrerHost, 200), source, device, is_entry: isEntry
      })
    }).catch(() => {});
  } catch { /* la mesure d'audience ne doit jamais gêner la page */ }
})();
