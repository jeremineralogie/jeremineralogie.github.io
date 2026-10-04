// Interface du compte joueur : pastille en haut à droite, encart discret au-dessus des jeux, fenêtre de connexion / création de compte.
import { createAccount, currentUser, initAccount, onAccountChange, regenerateRecoveryCode, resetWithCode, signIn, signInGoogle, signOut } from "./account.js";

const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text != null) node.textContent = text; return node; };
const GOOGLE = `<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z"/><path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>`;
const PERSON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.2 3.6-7 8-7s8 2.8 8 7"/></svg>`;

let modal = null, menu = null;

// ----- Fenêtre -----
function closeModal() { modal?.remove(); modal = null; document.body.classList.remove("acct-open"); }
function openModal(build) {
  closeModal(); closeMenu();
  const back = el("div", "acct-back"); back.setAttribute("role", "dialog"); back.setAttribute("aria-modal", "true");
  const box = el("div", "acct-modal");
  const x = el("button", "acct-x", "×"); x.type = "button"; x.setAttribute("aria-label", "Fermer"); x.addEventListener("click", closeModal);
  box.append(x); back.append(box);
  back.addEventListener("click", event => { if (event.target === back) closeModal(); });
  document.addEventListener("keydown", function esc(event) { if (event.key === "Escape") { closeModal(); document.removeEventListener("keydown", esc); } });
  modal = back; document.body.append(back); document.body.classList.add("acct-open");
  build(box);
}
function field(label, type, name, autocomplete, hint) {
  const wrap = el("div", "acct-f"); const id = `acct-${name}`;
  const l = el("label", "", label); l.htmlFor = id;
  const input = el("input"); input.type = type; input.name = name; input.id = id; input.autocomplete = autocomplete; input.required = true;
  if (name === "username") { input.autocapitalize = "none"; input.spellcheck = false; input.maxLength = 20; }
  wrap.append(l, input); if (hint) wrap.append(el("small", "", hint));
  return { wrap, input };
}
const googleButton = () => {
  const button = el("button", "acct-google"); button.type = "button"; button.innerHTML = `${GOOGLE}<span>Continuer avec Google</span>`;
  button.addEventListener("click", async () => { try { await signInGoogle(); } catch (error) { showError(button.closest(".acct-modal"), error.message); } });
  return button;
};
function showError(box, message) {
  let note = box.querySelector(".acct-error");
  if (!note) { note = el("p", "acct-error"); note.setAttribute("role", "alert"); const form = box.querySelector("form"); if (form) form.prepend(note); else box.append(note); }
  note.textContent = message;
}
function tabs(active, box) {
  const row = el("div", "acct-tabs");
  [["login", "Se connecter"], ["create", "Créer un compte"]].forEach(([key, label]) => {
    const tab = el("button", key === active ? "on" : "", label); tab.type = "button"; tab.addEventListener("click", () => openModal(key === "login" ? viewLogin : viewCreate)); row.append(tab);
  });
  box.append(row);
}
function submitButton(label) { const button = el("button", "btn acct-submit", label); button.type = "submit"; return button; }
async function guarded(button, task, box) {
  const label = button.textContent; button.disabled = true; button.textContent = "Un instant…";
  try { await task(); } catch (error) { showError(box, error.message); } finally { button.disabled = false; button.textContent = label; }
}
const continueLink = () => { const link = el("button", "acct-link", "Continuer sans compte"); link.type = "button"; link.addEventListener("click", closeModal); return link; };

function viewCreate(box) {
  box.append(el("h3", "", "Jeremineralogie")); tabs("create", box); box.append(googleButton(), el("div", "acct-or", "ou"));
  const form = el("form"); form.noValidate = true;
  const user = field("Choisis un identifiant", "text", "username", "username", "3 à 20 caractères : lettres, chiffres, tiret");
  const pass = field("Mot de passe", "password", "password", "new-password", "8 caractères minimum");
  const again = field("Confirme le mot de passe", "password", "confirm", "new-password");
  const warn = el("div", "acct-warn"); warn.innerHTML = "⚠️ Aucune adresse e-mail n’est demandée : si tu perds ton mot de passe, il ne pourra pas être réinitialisé par e-mail. Un <b>code de secours</b> te sera donné.";
  const submit = submitButton("Créer mon compte");
  form.append(user.wrap, pass.wrap, again.wrap, warn, submit, continueLink()); box.append(form);
  form.addEventListener("submit", event => { event.preventDefault(); void guarded(submit, async () => { const code = await createAccount(user.input.value, pass.input.value, again.input.value); openModal(inner => viewCode(inner, code, true)); }, box); });
}
function viewLogin(box) {
  box.append(el("h3", "", "Jeremineralogie")); tabs("login", box); box.append(googleButton(), el("div", "acct-or", "ou"));
  const form = el("form"); form.noValidate = true;
  const user = field("Identifiant", "text", "username", "username"); const pass = field("Mot de passe", "password", "password", "current-password");
  const submit = submitButton("Me connecter");
  const forgot = el("button", "acct-link", "J’ai oublié mon mot de passe"); forgot.type = "button"; forgot.addEventListener("click", () => openModal(viewReset));
  form.append(user.wrap, pass.wrap, submit, forgot, continueLink()); box.append(form);
  form.addEventListener("submit", event => { event.preventDefault(); void guarded(submit, async () => { await signIn(user.input.value, pass.input.value); closeModal(); }, box); });
}
function viewReset(box) {
  box.append(el("h3", "", "Mot de passe oublié"), el("p", "acct-lead", "Entre ton identifiant, ton code de secours et choisis un nouveau mot de passe."));
  const form = el("form"); form.noValidate = true;
  const user = field("Identifiant", "text", "username", "username"); const code = field("Code de secours", "text", "code", "off", "Exemple : MINE-ABCD-EFGH-JKLM"); code.input.autocapitalize = "characters";
  const pass = field("Nouveau mot de passe", "password", "password", "new-password", "8 caractères minimum");
  const submit = submitButton("Changer le mot de passe");
  const back = el("button", "acct-link", "← Retour à la connexion"); back.type = "button"; back.addEventListener("click", () => openModal(viewLogin));
  form.append(user.wrap, code.wrap, pass.wrap, submit, back); box.append(form);
  form.addEventListener("submit", event => { event.preventDefault(); void guarded(submit, async () => { await resetWithCode(user.input.value, code.input.value, pass.input.value); closeModal(); }, box); });
}
function viewCode(box, code, fresh) {
  const user = currentUser();
  if (fresh) box.append(el("span", "acct-ok", "✓ Compte créé"));
  box.append(el("h3", "", fresh ? `Bienvenue, ${user?.name || ""} !` : "Ton nouveau code de secours"));
  box.append(el("p", "acct-lead", "Voici ton code de secours : il te permet de retrouver ton compte si tu oublies ton mot de passe."));
  box.append(el("div", "acct-code", code));
  const row = el("div", "acct-row");
  const copy = el("button", "acct-ghost", "📋 Copier"); copy.type = "button";
  copy.addEventListener("click", async () => { try { await navigator.clipboard.writeText(code); copy.textContent = "✓ Copié"; } catch { copy.textContent = "Sélectionne le code pour le copier"; } });
  row.append(copy); box.append(row);
  box.append(el("p", "acct-small", "Il ne sera plus affiché ensuite. Garde-le dans un endroit sûr (capture d’écran, notes…)."));
  const check = el("label", "acct-chk"); const input = el("input"); input.type = "checkbox"; check.append(input, " Je l’ai noté"); box.append(check);
  const go = el("button", "btn acct-submit", "Continuer"); go.type = "button"; go.disabled = true; go.addEventListener("click", closeModal);
  input.addEventListener("change", () => { go.disabled = !input.checked; }); box.append(go);
}

// ----- Pastille et menu -----
function closeMenu() { menu?.remove(); menu = null; }
function openMenu(anchor) {
  if (menu) { closeMenu(); return; }
  const user = currentUser(); menu = el("div", "acct-menu"); menu.setAttribute("role", "menu");
  const item = (label, action, cls = "") => { const b = el("button", `acct-item ${cls}`, label); b.type = "button"; b.addEventListener("click", () => { closeMenu(); action(); }); return b; };
  if (!user) {
    menu.append(el("div", "acct-who", "Compte joueur"), item("Se connecter", () => openModal(viewLogin), "hl"), item("Créer un compte", () => openModal(viewCreate)), el("div", "acct-sep"), item("Continuer sans compte", () => {}));
  } else {
    const who = el("div", "acct-who", "Connecté"); who.append(el("b", "", user.name));
    menu.append(who, el("div", "acct-synced", "✓ Progression sauvegardée"), el("div", "acct-sep"),
      item("🏅 Mes badges", () => { location.href = "/jeux.html#jeux"; }));
    if (!user.google) menu.append(item("Nouveau code de secours", async () => { try { const code = await regenerateRecoveryCode(); openModal(box => viewCode(box, code, false)); } catch (error) { alert(error.message); } }));
    menu.append(item("Se déconnecter", async () => { await signOut(); }));
  }
  document.body.append(menu);
  setTimeout(() => document.addEventListener("click", function away(event) { if (!menu?.contains(event.target) && !anchor.contains(event.target)) { closeMenu(); document.removeEventListener("click", away); } }), 0);
}
function drawPastille() {
  let pill = document.querySelector(".acct-pill");
  if (!pill) { pill = el("button", "acct-pill"); pill.type = "button"; pill.addEventListener("click", () => openMenu(pill)); document.body.append(pill); }
  const user = currentUser();
  pill.setAttribute("aria-label", user ? `Compte de ${user.name}` : "Compte joueur");
  pill.title = user ? `Connecté : ${user.name}` : "Se connecter pour garder sa progression";
  pill.innerHTML = user ? `${user.name.charAt(0).toUpperCase()}<span class="acct-dot"></span>` : PERSON;
}

// ----- Encart au-dessus des jeux -----
function drawBanners() {
  const user = currentUser();
  document.querySelectorAll("[data-games]").forEach(games => {
    let bar = games.previousElementSibling?.classList.contains("acct-banner") ? games.previousElementSibling : null;
    if (!bar) { bar = el("div", "acct-banner"); games.before(bar); }
    bar.replaceChildren();
    if (user) { bar.append(el("p", "acct-connected", `✓ Connecté : ${user.name} · progression sauvegardée`)); return; }
    const line = el("div", "acct-line");
    const create = el("button", "btn", "Créer un compte"); create.type = "button"; create.addEventListener("click", () => openModal(viewCreate));
    const google = el("button", "acct-gmini"); google.type = "button"; google.innerHTML = `${GOOGLE}<span>Connexion Google</span>`;
    google.addEventListener("click", async () => { try { await signInGoogle(); } catch (error) { openModal(box => { box.append(el("h3", "", "Connexion Google"), el("p", "acct-error", error.message)); }); } });
    line.append(create, google);
    const more = el("details", "acct-more"); more.append(el("summary", "", "Pourquoi un compte ?"));
    const inner = el("div", "acct-inner"); inner.innerHTML = "<b>Garde ta progression partout.</b><ul><li>Tes badges, tes séries et tes scores te suivent sur tous tes appareils.</li><li>Gratuit, <b>sans adresse e-mail</b> : un identifiant et un mot de passe suffisent.</li><li>Tu reçois un code de secours pour retrouver ton compte.</li><li>Tu peux aussi continuer sans compte : ta progression reste alors sur cet appareil.</li></ul>";
    more.append(inner); bar.append(line, more);
  });
}

export async function startAccountUi() {
  if (!await initAccount()) return;
  const refresh = () => { drawPastille(); drawBanners(); if (menu) { closeMenu(); } };
  onAccountChange(refresh); refresh();
  // Les jeux se montent après le chargement : on redessine l'encart quand leurs conteneurs apparaissent.
  new MutationObserver(() => { if ([...document.querySelectorAll("[data-games]")].some(games => !games.previousElementSibling?.classList.contains("acct-banner"))) drawBanners(); }).observe(document.body, { childList: true, subtree: true });
}
