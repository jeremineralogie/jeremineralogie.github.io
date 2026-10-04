// Compte joueur : identifiant + mot de passe (adresse fictive en coulisses) ou Google ; la progression des jeux est enregistrée sur le serveur.
import { getSupabase } from "./supabase-client.js";
import { getProgress, mergeProgress, replaceProgress } from "./game-progress.js";

const DOMAIN = "joueurs.jeremineralogie.fr";
export const USERNAME_RULE = /^[a-z0-9][a-z0-9_-]{2,19}$/;
const normalizeName = name => String(name || "").trim().toLowerCase();
export const emailOf = name => `${normalizeName(name)}@${DOMAIN}`;
const normalizeCode = code => String(code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

// Code de secours lisible : MINE-XXXX-XXXX-XXXX (sans caractères ambigus : 0/O, 1/I).
export function newRecoveryCode() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const part = from => [...bytes.slice(from, from + 4)].map(byte => letters[byte % letters.length]).join("");
  return `MINE-${part(0)}-${part(4)}-${part(8)}`;
}

let client = null, session = null, pushTimer = null, syncing = false;
const listeners = new Set();
export const onAccountChange = fn => { listeners.add(fn); return () => listeners.delete(fn); };
const emit = () => listeners.forEach(fn => { try { fn(currentUser()); } catch (error) { console.error(error); } });

export function currentUser() {
  const user = session?.user; if (!user) return null;
  const meta = user.user_metadata || {};
  const email = user.email || "";
  const name = meta.username || (email.endsWith(`@${DOMAIN}`) ? email.split("@")[0] : "") || String(meta.full_name || meta.name || "").split(" ")[0] || "Joueur";
  return { id: user.id, name, google: user.app_metadata?.provider === "google" || (user.identities || []).some(item => item.provider === "google") };
}

async function pull() {
  const { data, error } = await client.from("player_progress").select("data").eq("user_id", session.user.id).maybeSingle();
  if (error) throw error;
  return data?.data || null;
}
async function push(state) {
  const { error } = await client.from("player_progress").upsert({ user_id: session.user.id, data: state, updated_at: new Date().toISOString() });
  if (error) throw error;
}
// À la connexion : on fusionne ce qui est sur l'appareil et ce qui est sur le compte, puis on enregistre le résultat des deux côtés.
export async function syncNow() {
  if (!client || !session || syncing) return;
  syncing = true;
  try {
    const remote = await pull(); const local = getProgress();
    const merged = remote ? mergeProgress(local, remote) : local;
    if (JSON.stringify(merged) !== JSON.stringify(local)) replaceProgress(merged);
    if (!remote || JSON.stringify(merged) !== JSON.stringify(remote)) await push(merged);
  } catch (error) { console.error("Synchronisation de la progression :", error); }
  finally { syncing = false; }
}
function scheduleSync() {
  if (!session) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(async () => { try { await push(getProgress()); } catch (error) { console.error("Enregistrement de la progression :", error); } }, 1500);
}

export async function initAccount() {
  client = getSupabase(); if (!client) return false;
  const { data } = await client.auth.getSession(); session = data.session || null;
  client.auth.onAuthStateChange((event, next) => {
    const was = session?.user?.id; session = next || null;
    if (session && session.user.id !== was) setTimeout(() => { void syncNow(); }, 0);
    emit();
  });
  document.addEventListener("jm-progress", event => { if (!event.detail?.remote) scheduleSync(); });
  if (session) void syncNow();
  emit();
  return true;
}

const errorText = error => {
  const message = String(error?.message || error || "");
  if (/already registered|already been registered|User already/i.test(message)) return "Cet identifiant est déjà pris.";
  if (/Invalid login credentials/i.test(message)) return "Identifiant ou mot de passe incorrect.";
  if (/provider is not enabled|Unsupported provider/i.test(message)) return "La connexion Google n’est pas encore disponible.";
  if (/rate limit|too many/i.test(message)) return "Trop d’essais : réessayez dans quelques minutes.";
  if (/signups? not allowed|Signups not allowed/i.test(message)) return "Les inscriptions sont fermées pour le moment.";
  if (/trop d'essais/i.test(message)) return "Trop d’essais : réessayez dans 30 minutes.";
  return "Une erreur est survenue. Réessayez dans un instant.";
};

function checkName(name) {
  const clean = normalizeName(name);
  if (!USERNAME_RULE.test(clean)) throw new Error("L’identifiant doit faire 3 à 20 caractères : lettres sans accent, chiffres, tiret ou tiret bas.");
  return clean;
}
// Création : renvoie le code de secours (à montrer une seule fois).
export async function createAccount(name, password, confirm) {
  const clean = checkName(name);
  if (String(password).length < 8) throw new Error("Le mot de passe doit faire au moins 8 caractères.");
  if (password !== confirm) throw new Error("Les deux mots de passe ne sont pas identiques.");
  const { data, error } = await client.auth.signUp({ email: emailOf(clean), password, options: { data: { username: clean } } });
  if (error) throw new Error(errorText(error));
  if (!data.session) throw new Error("Cet identifiant existe peut-être déjà. Essayez de vous connecter.");
  session = data.session;
  const code = newRecoveryCode();
  const { error: rpcError } = await client.rpc("set_recovery_code", { p_code: normalizeCode(code) });
  if (rpcError) { console.error(rpcError); throw new Error("Compte créé, mais le code de secours n’a pas pu être enregistré. Réessayez plus tard depuis la pastille."); }
  await syncNow(); emit();
  return code;
}
export async function signIn(name, password) {
  const clean = checkName(name);
  const { error } = await client.auth.signInWithPassword({ email: emailOf(clean), password });
  if (error) throw new Error(errorText(error));
}
export async function signInGoogle() {
  const { error } = await client.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${location.origin}${location.pathname}${location.search}` } });
  if (error) throw new Error(errorText(error));
}
export async function signOut() { await client.auth.signOut(); session = null; emit(); }
export async function resetWithCode(name, code, newPassword) {
  const clean = checkName(name);
  if (String(newPassword).length < 8) throw new Error("Le nouveau mot de passe doit faire au moins 8 caractères.");
  const { data, error } = await client.rpc("reset_password_with_code", { p_username: clean, p_code: normalizeCode(code), p_new_password: newPassword });
  if (error) throw new Error(errorText(error));
  if (!data) throw new Error("Identifiant ou code de secours incorrect.");
  await signIn(clean, newPassword);
}
// Nouveau code de secours (l'ancien devient inutilisable).
export async function regenerateRecoveryCode() {
  const code = newRecoveryCode();
  const { error } = await client.rpc("set_recovery_code", { p_code: normalizeCode(code) });
  if (error) throw new Error("Impossible de créer un nouveau code pour le moment.");
  return code;
}
export const isGoogleAccount = () => Boolean(currentUser()?.google);
