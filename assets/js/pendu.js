// « Le pendu minéralogique » : un terme du glossaire à deviner lettre par lettre, sa définition en indice. 6 cristaux = 6 erreurs permises.
// Série de mots : on enchaîne jusqu'au premier mot raté ; le score est le nombre de mots trouvés.
import { cleanUrl } from "./clean-urls.js";
import { recordSeriesPlay, getProgress } from "./game-progress.js";
import { dateFr, sharePanel } from "./share.js";
import { track } from "./track.js";
import { ALPHABET, MAX_ERRORS, guess, hint, isLetter, isLost, isWon, newGame, normalize, pickWord, prepare } from "./pendu-logic.js";

const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text != null) node.textContent = text; return node; };
const DOMAINS = { mineralogie: "Minéralogie", geologie: "Géologie", cristallographie: "Cristallographie" };

export function mountPendu(container, { client }) {
  container.replaceChildren();
  const box = el("div", "mq pendu");
  container.append(box);
  let pool = null, keyHandler = null;

  const stopKeys = () => { if (keyHandler) { document.removeEventListener("keydown", keyHandler); keyHandler = null; } };
  const load = async () => {
    if (pool) return pool;
    const { data, error } = await client.from("glossary_terms").select("term,slug,definition,domain").eq("publication_status", "published");
    if (error) throw error;
    pool = prepare(data); return pool;
  };

  const intro = () => {
    stopKeys();
    const best = getProgress().quizzes?.pendu?.best;
    box.replaceChildren(
      el("p", "mq-lead", "Un terme du glossaire est caché : sa définition t’aide à le deviner. Tu as 6 cristaux, un de moins à chaque erreur. Enchaîne les mots : la série s’arrête au premier mot raté."),
      ...(best ? [el("p", "mq-count", `Ton record : ${best.score} mot${best.score > 1 ? "s" : ""} d’affilée`)] : []),
      Object.assign(el("button", "pick-choice mq-start", "Commencer la série"), { type: "button", onclick: () => void start() }));
  };

  const start = async () => {
    box.replaceChildren(el("p", "mq-lead", "Chargement…"));
    try { await load(); } catch (error) { console.error("Pendu :", error); }
    if (!pool || pool.length < 10) { box.replaceChildren(el("p", "mq-lead", "Le jeu n’est pas disponible pour le moment.")); return; }
    track("start", "pendu");
    play(0, new Set());
  };

  const play = (round, used) => {
    stopKeys();
    const word = pickWord(pool, round, used);
    if (!word) { finish(round, true); return; }
    used.add(word.slug);
    const game = newGame(word);
    const count = el("p", "mq-count", round ? `Série en cours : ${round} mot${round > 1 ? "s" : ""}` : "Premier mot");
    const gems = el("div", "pendu-gems"); gems.setAttribute("role", "img");
    const clue = el("p", "pendu-clue"); const domain = el("span", "pendu-domain", DOMAINS[word.domain] || "Glossaire");
    clue.append(domain, " ", word.text.replace(/_____/g, "…"));
    const shown = el("p", "pendu-word"); shown.setAttribute("aria-live", "polite");
    const keys = el("div", "pendu-keys");
    const feedback = el("div", "mq-feedback"); feedback.setAttribute("aria-live", "polite");
    const hintButton = el("button", "mq-back", "Un indice (coûte un cristal)"); hintButton.type = "button";
    const buttons = new Map(ALPHABET.map(letter => { const button = el("button", "pendu-key", letter); button.type = "button"; button.addEventListener("click", () => play1(letter)); keys.append(button); return [letter, button]; }));

    const draw = reveal => {
      shown.replaceChildren(...[...word.term].map(character => {
        const letter = isLetter(character) ? normalize(character) : null;
        const known = !letter || game.guessed.has(letter) || reveal;
        return el("span", `pendu-char${letter ? "" : " is-sep"}${letter && reveal && !game.guessed.has(letter) ? " is-missed" : ""}`, known ? character : "");
      }));
      gems.replaceChildren(...Array.from({ length: MAX_ERRORS }, (_, index) => el("span", `pendu-gem${index < MAX_ERRORS - game.errors ? "" : " is-off"}`, "◆")));
      gems.setAttribute("aria-label", `${MAX_ERRORS - game.errors} cristal${MAX_ERRORS - game.errors > 1 ? "ux" : ""} sur ${MAX_ERRORS}`);
      buttons.forEach((button, letter) => { button.disabled = game.guessed.has(letter); button.classList.toggle("is-hit", game.guessed.has(letter) && word.letters.includes(letter)); button.classList.toggle("is-miss", game.guessed.has(letter) && !word.letters.includes(letter)); });
      hintButton.disabled = game.errors >= MAX_ERRORS - 1;
    };
    const end = won => {
      stopKeys(); draw(!won);
      buttons.forEach(button => { button.disabled = true; }); hintButton.hidden = true;
      feedback.className = `mq-feedback ${won ? "is-right" : "is-wrong"}`;
      const verdict = el("p", "mq-verdict", won ? "Bien vu ! " : "Raté… "); verdict.append(el("strong", "", `C’était « ${word.term} ».`));
      const link = el("a", "link", "Voir le terme dans le glossaire"); link.href = cleanUrl("term", word.slug);
      const next = el("button", "pick-choice mq-start", won ? "Mot suivant" : "Voir ma série"); next.type = "button";
      next.addEventListener("click", () => won ? play(round + 1, used) : finish(round, false));
      feedback.append(verdict, el("p", "mq-explain", word.definition), el("p", "mq-links", ""), next);
      feedback.querySelector(".mq-links").append(link);
    };
    const play1 = letter => { if (guess(game, letter) === "known") return; draw(false); if (isWon(game)) end(true); else if (isLost(game)) end(false); };
    hintButton.addEventListener("click", () => { if (hint(game)) { draw(false); if (isWon(game)) end(true); } });
    keyHandler = event => { if (event.ctrlKey || event.metaKey || event.altKey || event.key.length !== 1 || !isLetter(event.key)) return; play1(normalize(event.key)); };
    document.addEventListener("keydown", keyHandler);
    draw(false);
    box.replaceChildren(count, gems, clue, shown, keys, hintButton, feedback);
  };

  const finish = (score, exhausted) => {
    stopKeys(); track("end", "pendu", null, score);
    const previous = getProgress().quizzes?.pendu?.best?.score || 0;
    recordSeriesPlay("pendu", score);
    const record = score > previous;
    const message = exhausted ? "Tu connais tout le glossaire !" : score >= 12 ? "Un vrai dictionnaire ambulant !" : score >= 8 ? "Excellent !" : score >= 4 ? "Bien joué !" : "Le glossaire n’attend que toi !";
    box.replaceChildren(el("p", "mq-kicker", "Ta série"), el("h3", "mq-name", `${score} mot${score > 1 ? "s" : ""} d’affilée`), el("p", "mq-tagline", record && score > 0 ? `${message} Nouveau record !` : message),
      sharePanel({ spec: { title: "Le pendu minéralogique", logo: "/assets/decor/logo-pendu.webp", logoWidth: 900, date: dateFr(new Date().toISOString().slice(0, 10)), big: String(score), bigSub: score > 1 ? "mots trouvés d’affilée" : "mot trouvé d’affilée", note: record && score > 0 ? "Nouveau record !" : "", photos: [], footer: "Et toi, combien de mots trouveras-tu ?" },
        text: `J’ai trouvé ${score} mot${score > 1 ? "s" : ""} d’affilée au pendu minéralogique ! Et toi ?`, fileName: "pendu-mineralogique.png", remember: "pendu" }),
      Object.assign(el("button", "pick-choice mq-start", "Rejouer"), { type: "button", onclick: () => void start() }));
  };

  intro();
}
