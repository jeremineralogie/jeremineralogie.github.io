// « Mon espace » : ce que le compte joueur conserve (carnet de terrain, favoris, messages et demandes d'identification).
import { getSupabase } from "./supabase-client.js";
import { currentUser, initAccount, onAccountChange } from "./account.js";
import { getFavorites } from "./favorites.js";
import { getProgress } from "./game-progress.js";
import { BADGES } from "./badges.js";

const root = document.getElementById("space");
const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text != null) node.textContent = text; return node; };
const plural = (count, one, many) => `${count} ${count > 1 ? many : one}`;
const KINDS = { identification: "Demande d’identification", contact: "Message", achat: "Question sur une pièce", piece: "Question sur une pièce" };
const STATUS = { nouveau: "Envoyé", lu: "Lu", traite: "Traité", archive: "Archivé" };
const dateFr = iso => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" });

function card(title, ...nodes) { const node = el("section", "space-card"); node.append(el("h3", "space-title", title), ...nodes); return node; }
function link(href, label) { const a = el("a", "link", label); a.href = href; return a; }

async function messagesCard(user) {
  const body = el("div"); body.append(el("p", "space-note", "Chargement…"));
  const node = card("Mes messages et demandes d’identification", body);
  const client = getSupabase();
  try {
    const { data, error } = await client.from("messages").select("id,kind,subject,created_at,status").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);
    if (error) throw error;
    body.replaceChildren();
    if (!data.length) { body.append(el("p", "space-note", "Aucun message envoyé depuis ton compte pour l’instant. Les prochains messages et demandes d’identification que tu enverras connecté apparaîtront ici."), link("identification.html", "Faire une demande d’identification →")); return node; }
    const list = el("ul", "space-list");
    for (const row of data) {
      const item = el("li", "space-item");
      item.append(el("strong", "", row.subject || KINDS[row.kind] || "Message"), el("span", "space-meta", `${KINDS[row.kind] || "Message"} · ${dateFr(row.created_at)} · ${STATUS[row.status] || "Envoyé"}`));
      list.append(item);
    }
    body.append(list);
  } catch (error) { console.error("Mon espace :", error); body.replaceChildren(el("p", "space-note", "Impossible de charger tes messages pour le moment.")); }
  return node;
}

let drawing = 0;
async function draw() {
  const turn = ++drawing; // plusieurs dessins peuvent se croiser (connexion, synchronisation) : seul le dernier est affiché
  const user = currentUser();
  const cards = [];
  if (!user) {
    cards.push(card("Un compte pour quoi faire ?", el("p", "space-note", "Un compte gratuit (sans adresse e-mail) garde pour toi, sur tous tes appareils : ta progression aux jeux et tes badges, tes favoris, et l’historique de tes messages et demandes d’identification."), el("p", "space-note", "Utilise la pastille en haut à droite pour te connecter ou créer ton compte.")));
  } else {
    const favorites = getFavorites(), state = getProgress(), badges = BADGES.filter(badge => state.badges?.[badge.id]).length;
    cards.push(card(`Bonjour ${user.name}`, el("p", "space-note", "Ton compte est connecté : tout ce qui suit est sauvegardé automatiquement.")));
    cards.push(card("Mes favoris", el("p", "space-note", favorites.length ? `${plural(favorites.length, "favori enregistré", "favoris enregistrés")}, retrouvés sur tous tes appareils.` : "Aucun favori pour l’instant."), link("favoris.html", "Voir mes favoris →")));
    cards.push(card("Mon carnet de terrain", el("p", "space-note", `${badges} badge${badges > 1 ? "s" : ""} sur ${BADGES.length} · résultats des jeux gardés 7 jours.`), link("jeux.html#carnet", "Ouvrir mon carnet →")));
    cards.push(await messagesCard(user));
  }
  if (turn === drawing) root.replaceChildren(...cards);
}

if (root) { void initAccount().then(() => { void draw(); onAccountChange(() => void draw()); }); }
