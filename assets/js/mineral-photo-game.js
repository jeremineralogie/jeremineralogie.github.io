// « Trouve le minéral » (niveau facile) : une photo de minéral, quatre noms au choix.
// 5 manches par jour, les mêmes pour tout le monde (tirage fixé par la date) ; les erreurs ne coûtent rien, on voit tout de suite la bonne réponse.
// Les bonnes réponses sont des minéraux très communs ou communs ; les mauvaises propositions peuvent être rares.
import { publicMediaUrl } from "./content-repository.js";
import { ficheUrl } from "./entity-links.js";
import { parisDay, recordGame, streakOf, todayResult } from "./game-progress.js";
import { EASY_RARITIES, byRarity } from "./rarity.js";
import { fold } from "./answer-match.js";
import { commonsPhoto, creditLine, loadMineralPhotos } from "./mineral-photos.js";
import { dateFr, sharePanel } from "./share.js";

const ROUNDS = 5, CHOICES = 4;
const SAVE_KEY = "jm-trouve-mineral-jour";
const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text != null) node.textContent = text; return node; };
const firstPhoto = media => (media || []).filter(item => item.bucket_id === "site-media-public" && item.storage_path).sort((a, b) => a.position - b.position)[0];
const store = {
  get() { try { return JSON.parse(localStorage.getItem(SAVE_KEY) || "null"); } catch { return null; } },
  set(value) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(value)); } catch { /* partie jouable sans mémoire */ } }
};

function seeded(text) { let hash = 2166136261; for (const character of text) { hash ^= character.charCodeAt(0); hash = Math.imul(hash, 16777619); } return () => { hash = Math.imul(hash ^ (hash >>> 15), 2246822507) ^ Math.imul(hash ^ (hash >>> 13), 3266489909); return ((hash >>>= 0) % 100000) / 100000; }; }
const shuffled = (list, random) => list.map(item => [random(), item]).sort((a, b) => a[0] - b[0]).map(([, item]) => item);

// Photo d'un minéral : celle de l'admin (avec son crédit) en priorité, sinon la photo libre de Wikimedia Commons.
function photoOf(mineral, client, credits) {
  const own = firstPhoto(mineral.media);
  if (own) return { src: publicMediaUrl(client, own), credit: mineral.photo_credit ? el("p", "photo-credit", mineral.photo_credit) : null };
  const commons = commonsPhoto(credits, mineral.slug);
  return commons ? { src: commons.src, credit: creditLine(commons) } : null;
}

// Les trois mauvaises réponses : n'importe quels minéraux, rares compris (seules les bonnes réponses sont limitées aux minéraux courants),
// de préférence d'autres familles chimiques, sans nom proche de la bonne réponse.
function choicesFor(target, all, random) {
  const name = fold(target.name);
  const close = other => { const text = fold(other.name); return text === name || text.includes(name) || name.includes(text) || (target.mineral_group && other.mineral_group === target.mineral_group); };
  const others = all.filter(other => other.id !== target.id && !close(other));
  const different = others.filter(other => !target.chemical_class || other.chemical_class !== target.chemical_class);
  const wrong = [...shuffled(different, random), ...shuffled(others.filter(other => !different.includes(other)), random)].slice(0, CHOICES - 1);
  return shuffled([target, ...wrong], random);
}

// Manches du jour : tirage identique pour tous les visiteurs.
export function dailyRounds(minerals, credits, day = parisDay()) {
  // Niveau facile : seulement des minéraux très communs ou communs (réponses et mauvaises réponses comprises).
  const withPhoto = minerals.filter(item => item.name && !item.is_group && (firstPhoto(item.media) || commonsPhoto(credits, item.slug)));
  const pool = [...byRarity(withPhoto, EASY_RARITIES)].sort((a, b) => String(a.slug).localeCompare(String(b.slug)));
  if (pool.length < CHOICES) return { pool, rounds: [] };
  const random = seeded(`trouve-mineral-${day}`);
  const all = [...minerals].filter(item => item.name).sort((a, b) => String(a.slug).localeCompare(String(b.slug)));
  const rounds = shuffled(pool, random).slice(0, ROUNDS).map(target => ({ target, choices: choicesFor(target, all, random) }));
  return { pool, rounds };
}

export async function renderMineralPhotoGame(panel, { client, minerals }) {
  const body = panel.querySelector("[data-body]");
  const credits = await loadMineralPhotos();
  const today = parisDay();
  const { rounds } = dailyRounds(minerals, credits, today);
  if (!rounds.length) return;
  const keys = rounds.map(round => round.target.slug);
  const saved = store.get();
  const answers = saved?.date === today && saved.keys?.join() === keys.join() ? saved.answers : [];
  const save = () => store.set({ date: today, keys, answers });
  panel.hidden = false;
  // La partie compte dès la dernière réponse (pas seulement au clic sur « Voir le résultat »).
  const record = () => {
    if (todayResult("mineral")) return;
    const found = answers.filter(item => item.correct).length;
    const families = rounds.filter((round, index) => answers[index]?.correct).map(round => round.target.chemical_class).filter(Boolean);
    recordGame("mineral", { score: found, rounds: rounds.length, families: [...new Set(families)] });
  };
  if (answers.length >= rounds.length) { record(); summary(); return; }

  const box = el("div", "pick");
  const head = el("div", "pick-head");
  const step = el("span", "pick-step"), score = el("span", "pick-score");
  head.append(step, score);
  const intro = el("p", "pick-intro", "Quel est ce minéral ? Touchez le bon nom.");
  const figure = el("figure", "pick-figure");
  const image = el("img", "pick-photo"); image.alt = "Minéral à reconnaître";
  const credit = el("div", "pick-credit");
  figure.append(image, credit);
  const grid = el("div", "pick-choices");
  const outcome = el("p", "pick-outcome"); outcome.setAttribute("aria-live", "polite");
  const next = el("button", "btn pick-next", "Manche suivante"); next.type = "button"; next.hidden = true;
  box.append(head, intro, figure, grid, outcome, next);
  body.replaceChildren(box);

  const right = () => answers.filter(answer => answer.correct).length;
  function showRound() {
    const round = rounds[answers.length];
    step.textContent = `Manche ${answers.length + 1} / ${rounds.length}`;
    score.textContent = `${right()} bonne${right() > 1 ? "s" : ""} réponse${right() > 1 ? "s" : ""}`;
    const photo = photoOf(round.target, client, credits);
    image.src = photo.src; credit.replaceChildren(...(photo.credit ? [photo.credit] : []));
    outcome.textContent = ""; outcome.className = "pick-outcome"; next.hidden = true;
    grid.replaceChildren(...round.choices.map(choice => {
      const button = el("button", "pick-choice", choice.name); button.type = "button"; button.dataset.slug = choice.slug;
      button.addEventListener("click", () => answer(choice));
      return button;
    }));
  }
  function answer(choice) {
    const round = rounds[answers.length];
    const correct = choice.id === round.target.id;
    answers.push({ slug: round.target.slug, choice: choice.slug, correct });
    save();
    grid.querySelectorAll(".pick-choice").forEach(button => {
      button.disabled = true;
      if (button.dataset.slug === round.target.slug) button.classList.add("is-right");
      else if (button.dataset.slug === choice.slug) button.classList.add("is-wrong");
    });
    outcome.className = `pick-outcome ${correct ? "is-right" : "is-wrong"}`;
    outcome.replaceChildren(el("strong", "", correct ? "Bravo, bonne réponse !" : "Ce n’est pas ça…"), ` C’était ${round.target.name}.`);
    score.textContent = `${right()} bonne${right() > 1 ? "s" : ""} réponse${right() > 1 ? "s" : ""}`;
    next.hidden = false;
    next.textContent = answers.length >= rounds.length ? "Voir le résultat" : "Manche suivante";
    if (answers.length >= rounds.length) record();
  }
  next.addEventListener("click", () => {
    if (answers.length >= rounds.length) { finish(); return; }
    showRound();
  });
  showRound();

  function finish() {
    record();
    summary();
  }

  function summary() {
    const total = answers.filter(answer => answer.correct).length;
    const squares = answers.map(answer => answer.correct ? "🟩" : "🟥");
    const end = el("div", "pick pick-summary");
    end.append(el("p", "pick-total", `${total} / ${rounds.length} minéraux trouvés`), el("p", "geo-squares", squares.join(" ")));
    const list = el("ol", "geo-list");
    rounds.forEach((round, index) => {
      const result = answers[index]; if (!result) return;
      const photo = photoOf(round.target, client, credits);
      const item = el("li", "geo-item");
      const thumb = el("img", "geo-thumb"); thumb.src = photo.src; thumb.alt = round.target.name; thumb.loading = "lazy";
      const text = el("div", "geo-item-text");
      const link = el("a", "link", round.target.name); link.href = ficheUrl("mineral", round.target.slug);
      text.append(link, el("span", result.correct ? "pick-ok" : "pick-ko", result.correct ? "Trouvé" : "Raté"));
      item.append(thumb, text); list.append(item);
    });
    end.append(list);
    const streak = streakOf("mineral");
    end.append(sharePanel({
      fileName: `trouve-le-mineral-${today}.png`, remember: "mineral",
      text: `💎 Trouve le minéral — ${dateFr(today)}\n${squares.join("")} ${total}/${rounds.length}\nSaurez-vous faire mieux ?`,
      spec: { title: "Trouve le minéral", date: dateFr(today), big: `${total} / ${rounds.length}`, bigSub: "minéraux trouvés", squares,
        photos: rounds.map(round => photoOf(round.target, client, credits).src), streak: streak > 1 ? `🔥 Série de ${streak} jours` : "", footer: "Saurez-vous faire mieux ?" }
    }));
    end.append(el("p", "geo-next-day", "De nouveaux minéraux à reconnaître demain."));
    body.replaceChildren(end);
  }
}
