import { getSupabase } from "./supabase-client.js";
import { mountGames } from "./games.js";
import { mountQuizzes } from "./quiz-hub.js";

// Page « Jeux & quiz » : jeux du jour et badges (onglet « Jeux »), quiz (onglet « Quiz »).
const status = document.querySelector("#learn-status");
const tabs = [...document.querySelectorAll(".learn-tabs [data-tab]")];
const panels = { jeux: document.querySelector("#panel-jeux"), quiz: document.querySelector("#panel-quiz") };
let minerals = [];
let client = null;
let gamesMounted = false;
let quizMounted = false;

function showTab(name) {
  const tab = panels[name] ? name : "jeux";
  tabs.forEach(item => { const active = item.dataset.tab === tab; item.classList.toggle("active", active); if (active) item.setAttribute("aria-current", "page"); else item.removeAttribute("aria-current"); });
  Object.entries(panels).forEach(([key, panel]) => { panel.hidden = key !== tab; });
  if (tab === "jeux") mountGamesOnce();
  if (tab === "quiz" && !quizMounted) { quizMounted = true; mountQuizzes(panels.quiz.querySelector("[data-quizzes]"), { client: getSupabase() }); }
}
function mountGamesOnce() {
  if (gamesMounted || !client || !minerals.length) return;
  gamesMounted = true;
  void mountGames(panels.jeux.querySelector("[data-games]"), { client, minerals, collapsible: true });
}
window.addEventListener("hashchange", () => showTab(location.hash.slice(1)));
tabs.forEach(tab => tab.addEventListener("click", event => { event.preventDefault(); showTab(tab.dataset.tab); history.replaceState(null, "", `${location.pathname}#${tab.dataset.tab}`); }));

async function load() {
  client = getSupabase();
  if (!client) { status.textContent = "Contenu momentanément indisponible."; return; }
  const { data, error } = await client.from("minerals").select("id,name,slug,photo_credit,rarity,mineral_group,is_group,formula,chemical_class,crystal_system,hardness,hardness_max,density,density_max,streak,luster,transparency,colors,description,media:mineral_media(bucket_id,storage_path,position)").eq("publication_status", "published").order("slug");
  if (error) throw error;
  minerals = data || [];
  mountGamesOnce();
  status.hidden = true;
}

showTab(location.hash.slice(1));
try { await load(); }
catch (error) { console.error("Chargement des jeux :", error); status.textContent = "Impossible de charger les jeux pour le moment. Réessayez dans quelques instants."; }
