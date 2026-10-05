// « Plus dur ou moins dur ? » : deux minéraux, il faut toucher le plus dur (échelle de Mohs). Série sans faute : on enchaîne jusqu'à la première erreur.
// Difficulté croissante : écart de dureté de plus en plus serré, minéraux de plus en plus variés (les plus courants d'abord).
import { publicMediaUrl } from "./content-repository.js";
import { ficheUrl } from "./entity-links.js";
import { makePair, durete, prepare } from "./plus-dur-logic.js";
import { commonsPhoto, creditLine, loadMineralPhotos } from "./mineral-photos.js";
import { recordSeriesPlay, getProgress } from "./game-progress.js";
import { dateFr, sharePanel } from "./share.js";
import { track } from "./track.js";

const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text != null) node.textContent = text; return node; };
const firstPhoto = media => (media || []).filter(item => item.bucket_id === "site-media-public" && item.storage_path).sort((a, b) => a.position - b.position)[0];

function photoOf(mineral, client, credits) {
  const own = firstPhoto(mineral.media);
  if (own) return { src: publicMediaUrl(client, own), credit: mineral.photo_credit ? el("p", "photo-credit", mineral.photo_credit) : null };
  const commons = commonsPhoto(credits, mineral.slug);
  return commons ? { src: commons.src, credit: creditLine(commons) } : null;
}

export function mountPlusDur(container, { client }) {
  container.replaceChildren();
  const box = el("div", "mq pd");
  container.append(box);
  let pool = null, credits = {};

  const load = async () => {
    if (pool) return pool;
    credits = await loadMineralPhotos();
    const { data, error } = await client.from("minerals").select("name,slug,rarity,is_group,hardness,hardness_max,photo_credit,media:mineral_media(bucket_id,storage_path,position)").eq("publication_status", "published");
    if (error) throw error;
    pool = prepare(data).filter(item => photoOf(item, client, credits));
    return pool;
  };

  const intro = () => {
    const best = getProgress().quizzes?.["plus-dur"]?.best;
    box.replaceChildren(
      el("p", "mq-lead", "Deux minéraux, un seul est le plus dur. Enchaîne les bonnes réponses : la série s’arrête à la première erreur, et les écarts se resserrent à chaque manche."),
      ...(best ? [el("p", "mq-count", `Ton record : ${best.score} d’affilée`)] : []),
      Object.assign(el("button", "pick-choice mq-start", "Commencer la série"), { type: "button", onclick: () => void start() }));
  };

  const start = async () => {
    box.replaceChildren(el("p", "mq-lead", "Chargement…"));
    try { await load(); } catch (error) { console.error("Plus dur ou moins dur :", error); }
    if (!pool || pool.length < 10) { box.replaceChildren(el("p", "mq-lead", "Le jeu n’est pas disponible pour le moment.")); return; }
    track("start", "plus-dur");
    play(0, new Set());
  };

  const card = (item, onPick) => {
    const photo = photoOf(item, client, credits);
    const button = el("button", "pd-card"); button.type = "button";
    const image = el("img", "pd-photo"); image.src = photo.src; image.alt = item.name; image.loading = "eager";
    button.append(image, el("span", "pd-name", item.name));
    button.addEventListener("click", onPick);
    return { button, photo };
  };

  const play = (round, used) => {
    const pair = makePair(pool, round, used);
    if (!pair) { finish(round, true); return; }
    used.add(pair.hard.slug); used.add(pair.soft.slug);
    const sides = Math.random() < 0.5 ? [pair.hard, pair.soft] : [pair.soft, pair.hard];
    box.replaceChildren(el("p", "mq-count", round ? `Série en cours : ${round} d’affilée` : "Première manche"), el("h3", "mq-question", "Lequel est le plus dur ?"));
    const row = el("div", "pd-row"); const feedback = el("div", "mq-feedback"); feedback.setAttribute("aria-live", "polite");
    const creditsBox = el("div", "pd-credits");
    const cards = sides.map(item => {
      const { button, photo } = card(item, () => answer(item, button));
      if (photo.credit) creditsBox.append(photo.credit);
      return { item, button };
    });
    const answer = (chosen, chosenButton) => {
      const right = chosen === pair.hard;
      cards.forEach(({ item, button }) => {
        button.disabled = true;
        const label = el("span", "pd-value", `${durete(item)} sur l’échelle de Mohs`); button.append(label);
        if (item === pair.hard) button.classList.add("is-good"); else if (button === chosenButton) button.classList.add("is-bad");
      });
      feedback.className = `mq-feedback ${right ? "is-right" : "is-wrong"}`;
      const verdict = el("p", "mq-verdict", right ? "Bonne réponse ! " : "Raté… "); verdict.append(el("strong", "", `${pair.hard.name} (${durete(pair.hard)}) raye ${pair.soft.name} (${durete(pair.soft)}).`));
      const links = el("p", "mq-links");
      [pair.hard, pair.soft].forEach((row, position) => { if (position) links.append(" · "); const link = el("a", "link", `Fiche ${row.name}`); link.href = ficheUrl("mineral", row.slug); links.append(link); });
      const next = el("button", "pick-choice mq-start", right ? "Manche suivante" : "Voir ma série"); next.type = "button";
      next.addEventListener("click", () => right ? play(round + 1, used) : finish(round, false));
      feedback.append(verdict, links, next);
    };
    cards.forEach(({ button }) => row.append(button));
    box.append(row, feedback, creditsBox);
  };

  const finish = (score, exhausted) => {
    track("end", "plus-dur", null, score);
    const previous = getProgress().quizzes?.["plus-dur"]?.best?.score || 0;
    recordSeriesPlay("plus-dur", score);
    const record = score > previous;
    const message = exhausted ? "Tu as épuisé tous les minéraux !" : score >= 15 ? "Un vrai minéralogiste !" : score >= 10 ? "Excellent !" : score >= 5 ? "Bien joué !" : "La prochaine série sera la bonne !";
    box.replaceChildren(el("p", "mq-kicker", "Ta série"), el("h3", "mq-name", `${score} d’affilée`), el("p", "mq-tagline", record && score > 0 ? `${message} Nouveau record !` : message),
      sharePanel({ spec: { title: "Plus dur ou moins dur ?", logo: "/assets/decor/logo-plus-dur.webp", logoWidth: 900, date: dateFr(new Date().toISOString().slice(0, 10)), big: String(score), bigSub: score > 1 ? "bonnes réponses d’affilée" : "bonne réponse d’affilée", note: record && score > 0 ? "Nouveau record !" : "", photos: [], footer: "Et toi, jusqu’où iras-tu ?" },
        text: `J’ai enchaîné ${score} bonne${score > 1 ? "s" : ""} réponse${score > 1 ? "s" : ""} à « Plus dur ou moins dur ? » ! Et toi ?`, fileName: "plus-dur-ou-moins-dur.png", remember: "plus-dur" }),
      Object.assign(el("button", "pick-choice mq-start", "Rejouer"), { type: "button", onclick: () => void start() }));
  };

  intro();
}
