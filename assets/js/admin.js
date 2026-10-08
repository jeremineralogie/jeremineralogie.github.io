import { getSupabase } from "./supabase-client.js";
import { autoEnhanceSelects } from "./combobox.js";
import { backfillLocalities } from "./geo-communes.js";

const status = document.querySelector("#admin-status");
const loginPanel = document.querySelector("#login-panel");
const cmsPanel = document.querySelector("#cms-panel");
const mainNav = document.querySelector("#admin-main-nav");
const contentManager = document.querySelector("#content-manager");
const appearancePanel = document.querySelector("#appearance-panel");
const messagesPanel = document.querySelector("#messages-panel");
const statsPanel = document.querySelector("#stats-panel");
const photosPanel = document.querySelector("#photos-panel");
const homePanel = document.querySelector("#home-panel");
const client = getSupabase();
let homeModule = null;
let statsModule = null;
let optimizeModule = null;
let messagesModule = null;
let contentModule = null;
let activeMain = "accueil";

// Place automatiquement sur la carte les communes encore sans coordonnées.
let locating = false;
async function locateCommunes() {
  if (locating || !client) return;
  locating = true;
  try {
    const { located, ambiguous, notFound } = await backfillLocalities(client);
    const notes = [];
    if (located.length) notes.push(`Placées sur la carte : ${located.join(", ")}.`);
    if (ambiguous.length) notes.push(`Plusieurs communes portent le nom ${ambiguous.map(name => `« ${name} »`).join(", ")} : choisissez la bonne dans Paramètres → Référentiels → Communes (bouton « Localiser »).`);
    if (notFound.length) notes.push(`Commune introuvable pour ${notFound.map(name => `« ${name} »`).join(", ")} : vérifiez l’orthographe ou localisez-la dans Référentiels → Communes.`);
    if (notes.length) message(notes.join(" "), ambiguous.length + notFound.length > 0);
  } catch (error) {
    console.error("Localisation automatique des communes :", error);
  } finally { locating = false; }
}

let statusTimer = null;
function message(text, isError = false) {
  status.textContent = text;
  status.classList.toggle("admin-error", isError);
  status.hidden = false;
  clearTimeout(statusTimer);
  if (!isError && !text.endsWith("…")) statusTimer = setTimeout(() => { status.hidden = true; }, 3500);
}

function describeError(error) {
  if (!error) return "Erreur inconnue.";
  return [error.message, error.code && `Code : ${error.code}`, error.details, error.hint && `Indication : ${error.hint}`]
    .filter(Boolean).join(" — ");
}

if (!client) {
  message("Configuration Supabase absente : renseignez l’URL et la clé publique dans assets/js/supabase-config.js.", true);
} else {
  document.querySelector("#login-form").addEventListener("submit", async event => {
    event.preventDefault();
    message("Connexion en cours…");
    const { error } = await client.auth.signInWithPassword({
      email: document.querySelector("#login-email").value,
      password: document.querySelector("#login-password").value
    });
    if (error) message(error.message, true);
    else {
      const { data } = await client.auth.getSession();
      await showSession(data.session);
    }
  });
  document.querySelector("#logout").addEventListener("click", async () => {
    await client.auth.signOut();
    await showSession(null);
  });
  mainNav.addEventListener("click", event => {
    const button = event.target.closest("[data-main]");
    if (button) void showMainSection(button.dataset.main);
  });
  const settingsToggle = document.querySelector("#settings-toggle");
  const settingsMenu = document.querySelector("#settings-menu");
  const setMenu = open => { settingsMenu.hidden = !open; settingsToggle.setAttribute("aria-expanded", String(open)); };
  settingsToggle.addEventListener("click", event => { event.stopPropagation(); setMenu(settingsMenu.hidden); });
  settingsMenu.addEventListener("click", event => {
    const button = event.target.closest("[data-main]");
    if (!button) return;
    setMenu(false);
    void showMainSection(button.dataset.main);
  });
  document.addEventListener("click", event => { if (!settingsMenu.hidden && !event.target.closest("#admin-settings")) setMenu(false); });
  document.addEventListener("keydown", event => { if (event.key === "Escape" && !settingsMenu.hidden) { setMenu(false); settingsToggle.focus(); } });
  // Toutes les listes déroulantes de l'admin : on peut aussi y écrire.
  autoEnhanceSelects(document.body);
  void client.auth.getSession().then(({ data }) => showSession(data.session));
}

async function showSession(session) {
  loginPanel.hidden = true;
  cmsPanel.hidden = true;
  document.querySelector("#admin-settings").hidden = true;
  document.querySelector("#settings-menu").hidden = true;
  if (!session) {
    loginPanel.hidden = false;
    activeMain = "accueil";
    message("Connectez-vous avec le compte administrateur.");
    return;
  }
  const { data, error } = await client.rpc("is_admin");
  if (error || data !== true) {
    await client.auth.signOut();
    loginPanel.hidden = false;
    message("Ce compte n’a pas le rôle administrateur.", true);
    return;
  }
  cmsPanel.hidden = false;
  document.querySelector("#admin-settings").hidden = false;
  status.hidden = true;
  await showMainSection(activeMain);
  void locateCommunes();
  void import("./admin-messages.js").then(module => { messagesModule = module; return module.refreshBadge(client); }).catch(error => console.error("Compteur de messages indisponible :", error));
  if (!contentModule) {
    try {
      const module = await import("./admin-content.js");
      await module.initContentAdmin(client);
      contentModule = module;
    } catch (error) {
      console.error("Impossible de charger les sections du CMS :", error);
      message(`Les sections de l’administration n’ont pas pu être chargées : ${describeError(error)}`, true);
    }
  }
  if (contentModule) await showMainSection(activeMain);
}

// Navigation principale : Ma collection / Boutique / Articles / Archives, et menu ⚙ (tableau de bord, messages, statistiques, référentiels, apparence).
async function showMainSection(id) {
  activeMain = id;
  mainNav.querySelectorAll("[data-main]").forEach(button => {
    const active = button.dataset.main === id;
    button.classList.toggle("is-active", active);
    if (active) button.setAttribute("aria-current", "page"); else button.removeAttribute("aria-current");
  });
  document.querySelectorAll("#settings-menu [data-main]").forEach(button => button.classList.toggle("is-active", button.dataset.main === id));
  document.querySelector("#settings-toggle").classList.toggle("is-active", ["accueil", "messages", "stats", "photos", "referentiels", "appearance"].includes(id));
  const isAppearance = id === "appearance";
  const isMessages = id === "messages";
  const isStats = id === "stats";
  const isHome = id === "accueil";
  const isPhotos = id === "photos";
  contentManager.hidden = isAppearance || isMessages || isStats || isHome || isPhotos;
  photosPanel.hidden = !isPhotos;
  statsPanel.hidden = !isStats;
  homePanel.hidden = !isHome;
  if (isHome) {
    try {
      homeModule ??= await import("./admin-home.js");
      await homeModule.openHome(client, {
        openSpecimen: specimenId => openRecord("collection", "list", specimenId),
        openRecord: (group, view, recordId) => openRecord(group, view, recordId),
        openMain: mainId => showMainSection(mainId)
      });
    } catch (error) {
      console.error("Impossible de charger le tableau de bord :", error);
      message(`Le tableau de bord n’a pas pu être chargé : ${describeError(error)}`, true);
    }
    return;
  }
  appearancePanel.hidden = !isAppearance;
  messagesPanel.hidden = !isMessages;
  if (isAppearance) return;
  if (isPhotos) {
    try {
      optimizeModule ??= await import("./admin-optimize.js");
      await optimizeModule.openOptimize(client);
    } catch (error) {
      console.error("Impossible de charger l'outil Photos :", error);
      message(`L’outil Photos n’a pas pu être chargé : ${describeError(error)}`, true);
    }
    return;
  }
  if (isStats) {
    try {
      statsModule ??= await import("./admin-stats.js");
      await statsModule.openStats(client);
    } catch (error) {
      console.error("Impossible de charger les statistiques :", error);
      message(`Les statistiques n’ont pas pu être chargées : ${describeError(error)}`, true);
    }
    return;
  }
  if (isMessages) {
    try {
      messagesModule ??= await import("./admin-messages.js");
      await messagesModule.openMessages(client);
    } catch (error) {
      console.error("Impossible de charger les messages :", error);
      message(`Les messages n’ont pas pu être chargés : ${describeError(error)}`, true);
    }
    return;
  }
  if (!contentModule) {
    message("Chargement de la section…");
    return;
  }
  await contentModule.openGroup(id);
}

// Ouverture directe d'une fiche depuis le tableau de bord.
async function openRecord(group, view, recordId) {
  if (!contentModule) { message("Chargement des sections en cours, réessayez dans un instant.", true); return; }
  await showMainSection(group);
  await contentModule.openRecord(group, view, recordId);
}
