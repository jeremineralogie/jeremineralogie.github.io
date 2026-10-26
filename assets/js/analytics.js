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

    const SOURCES = [
      [/(^|\.)google\./, "Google"], [/(^|\.)bing\.com$/, "Bing"], [/duckduckgo\.com$/, "DuckDuckGo"], [/qwant\.com$/, "Qwant"],
      [/ecosia\.org$/, "Ecosia"], [/yahoo\./, "Yahoo"], [/(^|\.)(facebook\.com|fb\.com|fb\.me)$/, "Facebook"],
      [/instagram\.com$/, "Instagram"], [/tiktok\.com$/, "TikTok"], [/(youtube\.com|youtu\.be)$/, "YouTube"],
      [/pinterest\./, "Pinterest"], [/(^|\.)(t\.co|twitter\.com|x\.com)$/, "X (Twitter)"], [/(^|\.)(mindat\.org)$/, "Mindat"]
    ];
    let source = null, referrerHost = null;
    if (isEntry) {
      try { referrerHost = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, "") : null; } catch { referrerHost = null; }
      if (referrerHost === location.hostname.replace(/^www\./, "")) referrerHost = null;
      const utm = params.get("utm_source");
      source = utm ? utm.slice(0, 60) : referrerHost ? (SOURCES.find(([pattern]) => pattern.test(referrerHost))?.[1] || referrerHost) : "Accès direct";
    }

    const ua = navigator.userAgent;
    const tablet = /iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua)) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    const device = tablet ? "tablette" : /Mobi|iPhone|iPod|Android/i.test(ua) ? "mobile" : "ordinateur";
    const clip = (value, max) => value ? String(value).slice(0, max) : null;

    const post = (table, body) => fetch(`${config.url}/rest/v1/${table}`, {
      method: "POST", keepalive: true,
      headers: { apikey: config.publishableKey, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(body)
    }).catch(() => {});

    // Événements d'usage (jeux, quiz, partages, clics utiles, lectures) : window.jmTrack(type, nom, détail, valeur). Même visite anonyme, aucune donnée personnelle.
    // Identifiant de joueur anonyme : un nombre aléatoire gardé sur l'appareil, ajouté seulement aux événements de jeu pour savoir si un joueur revient le lendemain.
    const playerId = () => {
      try {
        let id = localStorage.getItem("jm-pid");
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id || "")) { id = uuid(); localStorage.setItem("jm-pid", id); }
        return id;
      } catch { return null; }
    };
    const GAME_KINDS = ["start", "end", "answer"];
    window.jmTrack = (kind, name = null, detail = null, value = null) => {
      try {
        post("site_events", { visit_id: visit.id, kind, name: clip(name, 60), detail: clip(detail, 200), value: value == null || Number.isNaN(Number(value)) ? null : Number(value),
          ...(GAME_KINDS.includes(kind) ? { player_id: playerId() } : {}) });
      } catch { /* sans suite */ }
    };
    window.jmContext = { page, type: entitySlug ? entityType : null, slug: entitySlug || null };

    // Clics utiles : « Me contacter » (avec la référence de la pièce), page Contact, page Réseaux, liens vers les réseaux sociaux.
    document.addEventListener("click", event => {
      try {
        const link = event.target.closest?.("a[href]"); if (!link) return;
        const url = new URL(link.getAttribute("href"), location.href);
        const text = (link.textContent || "").replace(/\s+/g, " ").trim().slice(0, 60);
        // Navigation : menu du haut, logo, fil d'Ariane, précédent / suivant / retour dans les fiches.
        if (link.closest(".site-header .nav")) window.jmTrack("click", "menu", text);
        else if (link.closest(".site-header .brand")) window.jmTrack("click", "menu", "Logo");
        else if (link.closest(".crumbs")) window.jmTrack("click", "fil-ariane", text);
        else if (link.closest(".fiche-nav, .fiche-back")) window.jmTrack("click", "fiche-nav", text);
        // Liens cliqués dans le texte d'un article (hors « À lire aussi »).
        if (page === "article" && entitySlug && link.closest(".article-full") && !link.closest(".read-more")) {
          window.jmTrack("click", "lien-article", `${entitySlug}|${url.origin === location.origin ? url.pathname + url.search : url.hostname}`);
        }
        // Fiche ouverte juste après une erreur dans un jeu (le lien est dans le message « Raté… »).
        if (link.closest(".is-wrong")) {
          const area = link.closest("[id^='quiz-']");
          const title = link.closest(".home-game")?.querySelector(".game-name")?.textContent || "";
          const game = area ? area.id.slice(5) : ({ "Trouve le minéral": "mineral", "Le quiz du jour": "quiz", "Devine le gisement": "geo" })[title] || "jeu";
          window.jmTrack("click", "fiche-apres-erreur", `${game}|${url.origin === location.origin ? url.pathname + url.search : url.hostname}`);
        }
        if (url.origin === location.origin) {
          if (/^\/contact(\.html)?\/?$/.test(url.pathname)) { const reference = url.searchParams.get("reference"); window.jmTrack("click", reference ? "contact-piece" : "contact", reference || page); }
          else if (/^\/reseaux(\.html)?\/?$/.test(url.pathname)) window.jmTrack("click", "page-reseaux", page);
        } else {
          const network = SOURCES.find(([pattern]) => pattern.test(url.hostname.replace(/^www\./, "")))?.[1];
          if (["Facebook", "Instagram", "TikTok", "YouTube", "Pinterest", "X (Twitter)"].includes(network)) window.jmTrack("click", `reseau-${network}`, page);
        }
      } catch { /* sans suite */ }
    }, true);

    // Article lu jusqu'au bout : au moins 15 secondes sur la page et 90 % de la hauteur parcourue (une seule fois).
    if (page === "article" && entitySlug) {
      let done = false;
      const check = () => {
        if (done || Date.now() - now < 15000) return;
        const height = document.documentElement.scrollHeight;
        if (height > innerHeight * 1.5 && (scrollY + innerHeight) / height >= 0.9) { done = true; window.jmTrack("read", "article", entitySlug); }
      };
      addEventListener("scroll", check, { passive: true });
    }

    // Temps réellement passé (page visible) et profondeur de défilement : une mesure par page vue, envoyée quand la page passe en arrière-plan ou se ferme.
    {
      let visibleMs = 0, shownAt = document.visibilityState === "visible" ? Date.now() : null, deepest = 0, sent = false;
      const depth = () => { const room = document.documentElement.scrollHeight - innerHeight; return room <= 8 ? 100 : Math.max(0, Math.min(100, Math.round((scrollY / room) * 100))); };
      deepest = depth();
      addEventListener("scroll", () => { deepest = Math.max(deepest, depth()); }, { passive: true });
      const flush = () => {
        if (shownAt) { visibleMs += Date.now() - shownAt; shownAt = null; }
        if (sent) return; sent = true;
        const seconds = Math.min(1800, Math.round(visibleMs / 1000));
        if (seconds < 1) return;
        window.jmTrack("engage", page, entitySlug, seconds);
        window.jmTrack("scroll", page, entitySlug, Math.max(deepest, depth()));
      };
      document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flush(); else if (!sent) shownAt = Date.now(); });
      addEventListener("pagehide", flush);
    }
    // Langue du navigateur et fuseau horaire (une fois par visite) : donnent une idée du pays, jamais le pays exact.
    if (isEntry) {
      let zone = null; try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone || null; } catch { zone = null; }
      window.jmTrack("env", navigator.language || null, zone);
    }

    post("page_views", {
        visit_id: visit.id, page: clip(page, 60), path: clip(location.pathname + location.search, 300) || "",
        entity_type: entitySlug ? entityType : null, entity_slug: clip(entitySlug, 200),
        search_query: page === "recherche" ? clip(params.get("q")?.trim(), 200) : null,
        referrer_host: clip(referrerHost, 200), source, device, is_entry: isEntry
    });
  } catch { /* la mesure d'audience ne doit jamais gêner la page */ }
})();
