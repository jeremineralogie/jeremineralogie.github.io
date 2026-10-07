// Quiz « Le glossaire en défi » : une définition du glossaire, quatre termes proposés, dix questions par partie.
// Le terme cherché est masqué s'il apparaît dans la définition ; après chaque réponse, un lien mène à la page du terme (maillage).
import { cleanUrl } from "./clean-urls.js";
import { ficheUrl } from "./entity-links.js";
import { sharePanel, dateFr } from "./share.js";
import { track } from "./track.js";
import { recordQuizPlay } from "./game-progress.js";

const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text != null) node.textContent = text; return node; };
const shuffle = list => { const copy = [...list]; for (let i = copy.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; } return copy; };
const fold = value => String(value ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const DOMAINS = { mineralogie: "Minéralogie", geologie: "Géologie", cristallographie: "Cristallographie" };

// Racines à masquer : chaque mot du terme (4 lettres et plus), sans ses deux dernières lettres (pluriel, féminin, dérivés).
const stemsOf = term => { const words = fold(term).split(/[^a-z0-9]+/).filter(Boolean); const long = words.filter(word => word.length >= 4); return (long.length ? long : words).map(word => word.slice(0, Math.max(4, word.length - 2))); };
// Mots entiers du terme (6 lettres et plus) : un mot qui les contient (« anisotropes » pour « isotrope ») est aussi masqué.
const wholeWordsOf = term => fold(term).split(/[^a-z0-9]+/).filter(word => word.length >= 6);
export function maskDefinition(definition, term) {
  const stems = stemsOf(term), wholes = wholeWordsOf(term);
  let masked = false;
  const text = String(definition).replace(/[\p{L}\p{N}]+/gu, word => { const folded = fold(word); if (stems.some(stem => folded.startsWith(stem)) || wholes.some(whole => folded.includes(whole))) { masked = true; return "_____"; } return word; });
  return { text, masked };
}
const similar = (a, b) => stemsOf(a).some(stem => fold(b).includes(stem)) || stemsOf(b).some(stem => fold(a).includes(stem));

export function buildQuestions(terms, count = 10) {
  const usable = terms.filter(item => item.definition && item.definition.length >= 35 && item.term).map(item => ({ ...item, ...maskDefinition(item.definition, item.term) }))
    .filter(item => item.text.split(/\s+/).length >= 6 && (item.text.match(/_____/g) || []).length <= 2);
  const out = [];
  for (const item of shuffle(usable)) {
    if (out.length === count) break;
    // Jamais de proposition qui ressemble au terme cherché ou qui est citée dans la définition (réponse évidente ou ambiguë).
    const fits = other => other.slug !== item.slug && !similar(item.term, other.term) && !fold(item.definition).includes(fold(other.term));
    const sameDomain = terms.filter(other => other.domain === item.domain && fits(other));
    const others = terms.filter(fits);
    const wrong = shuffle(sameDomain.length >= 3 ? sameDomain : others).slice(0, 3);
    if (wrong.length < 3) continue;
    out.push({ item, choices: shuffle([item, ...wrong]) });
  }
  return out;
}

export function mountGlossaire(container, { client }) {
  container.replaceChildren();
  const box = el("div", "mq"); container.append(box);
  let terms = null;

  const load = async () => {
    if (terms) return terms;
    const { data, error } = await client.from("glossary_terms").select("term,slug,domain,definition,related_minerals").eq("publication_status", "published");
    if (error) throw error;
    terms = data || []; return terms;
  };
  const start = async () => {
    box.replaceChildren(el("p", "mq-lead", "Chargement…"));
    let questions = [];
    try { questions = buildQuestions(await load()); } catch (error) { console.error("Glossaire en défi :", error); }
    if (questions.length < 10) { box.replaceChildren(el("p", "mq-lead", "Le quiz n’est pas disponible pour le moment.")); return; }
    track("start", "glossaire");
    play(questions, 0, 0);
  };
  const intro = () => box.replaceChildren(el("p", "mq-lead", "On te donne une définition du glossaire : retrouve le terme parmi quatre propositions. Dix questions, des termes différents à chaque partie."),
    Object.assign(el("button", "pick-choice mq-start", "Commencer"), { type: "button", onclick: () => void start() }));

  const play = (questions, index, score) => {
    box.replaceChildren();
    const { item, choices } = questions[index];
    const bar = el("div", "mq-bar"); const fill = el("span"); fill.style.width = `${(index / questions.length) * 100}%`; bar.append(fill);
    box.append(el("p", "mq-count", `Définition ${index + 1} sur ${questions.length} · ${DOMAINS[item.domain] || "Glossaire"}`), bar, el("p", "mq-definition", item.text));
    const list = el("div", "mq-answers");
    const feedback = el("div", "mq-feedback"); feedback.setAttribute("aria-live", "polite");
    choices.forEach(choice => {
      const button = el("button", "pick-choice mq-answer", choice.term); button.type = "button";
      button.addEventListener("click", () => {
        const right = choice.slug === item.slug;
        list.querySelectorAll("button").forEach(other => { other.disabled = true; if (other.textContent === item.term) other.classList.add("is-good"); });
        if (!right) button.classList.add("is-bad");
        const verdict = el("p", "mq-verdict", right ? "Bonne réponse ! " : "Raté… "); verdict.append(el("strong", "", item.term));
        feedback.className = `mq-feedback ${right ? "is-right" : "is-wrong"}`;
        feedback.append(verdict, el("p", "mq-explain", item.definition));
        const links = el("p", "mq-links");
        // Petite fenêtre de définition (avec un bouton vers le glossaire) plutôt qu'un renvoi direct.
        const termLink = el("a", "gloss", `En savoir plus sur « ${item.term} »`); termLink.href = cleanUrl("term", item.slug) || `apprendre.html?terme=${encodeURIComponent(item.slug)}#glossaire`; termLink.dataset.slug = item.slug; termLink.setAttribute("aria-haspopup", "dialog");
        links.append(termLink); void import("./glossary-links.js").then(module => module.enablePopovers()).catch(error => console.error("Fenêtre du glossaire :", error));
        (item.related_minerals || []).slice(0, 3).forEach(name => { links.append(" · "); const link = el("a", "link", `Fiche ${name}`); link.href = ficheUrl("mineral", name); link.dataset.fiche = ""; links.append(link); });
        const next = el("button", "pick-choice mq-start", index + 1 < questions.length ? "Définition suivante" : "Voir mon score"); next.type = "button";
        next.addEventListener("click", () => index + 1 < questions.length ? play(questions, index + 1, score + (right ? 1 : 0)) : finish(score + (right ? 1 : 0), questions.length));
        feedback.append(links, next);
      });
      list.append(button);
    });
    box.append(list, feedback);
  };

  const finish = (score, total) => {
    track("end", "glossaire", null, score);
    recordQuizPlay("glossaire", score, total);
    const message = score === total ? "Sans faute !" : score >= 8 ? "Excellent !" : score >= 6 ? "Bien joué !" : score >= 4 ? "Pas mal, tu progresses !" : "Le glossaire t’attend !";
    box.replaceChildren(el("p", "mq-kicker", "Ton score"), el("h3", "mq-name", `${score} / ${total}`), el("p", "mq-tagline", message),
      sharePanel({ spec: { title: "Le glossaire en défi", logo: "/assets/decor/logo-glossaire.webp", logoWidth: 820, date: dateFr(new Date().toISOString().slice(0, 10)), big: `${score} / ${total}`, bigSub: message, photos: [], footer: "Et toi, combien feras-tu ?" },
        text: `J’ai fait ${score}/${total} au glossaire en défi ! Et toi ?`, fileName: "glossaire-en-defi.png", remember: "glossaire" }),
      Object.assign(el("button", "pick-choice mq-start", "Rejouer"), { type: "button", onclick: () => void start() }));
  };

  intro();
}
