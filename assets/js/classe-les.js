// « Classe-les ! » : cinq minéraux à remettre dans l'ordre (dureté ou densité, tiré au hasard). Série de manches : on continue tant que le classement est parfait.
import { publicMediaUrl } from "./content-repository.js";
import { ficheUrl } from "./entity-links.js";
import { commonsPhoto, creditLine, loadMineralPhotos } from "./mineral-photos.js";
import { recordSeriesPlay, getProgress } from "./game-progress.js";
import { dateFr, sharePanel } from "./share.js";
import { track } from "./track.js";
import { CRITERIA, check, makeChallenge, titleOf, valueText } from "./classe-les-logic.js";

const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text != null) node.textContent = text; return node; };
const firstPhoto = media => (media || []).filter(item => item.bucket_id === "site-media-public" && item.storage_path).sort((a, b) => a.position - b.position)[0];

function photoOf(mineral, client, credits) {
  const own = firstPhoto(mineral.media);
  if (own) return { src: publicMediaUrl(client, own), credit: mineral.photo_credit ? el("p", "photo-credit", mineral.photo_credit) : null };
  const commons = commonsPhoto(credits, mineral.slug);
  return commons ? { src: commons.src, credit: creditLine(commons) } : null;
}

export function mountClasseLes(container, { client }) {
  container.replaceChildren();
  const box = el("div", "mq cl");
  container.append(box);
  let rows = null, credits = {};

  const load = async () => {
    if (rows) return rows;
    credits = await loadMineralPhotos();
    const { data, error } = await client.from("minerals").select("name,slug,rarity,is_group,hardness,hardness_max,density,density_max,photo_credit,media:mineral_media(bucket_id,storage_path,position)").eq("publication_status", "published");
    if (error) throw error;
    rows = (data || []).filter(row => photoOf(row, client, credits)); return rows;
  };

  const intro = () => {
    const best = getProgress().quizzes?.["classe-les"]?.best;
    box.replaceChildren(
      el("p", "mq-lead", "Cinq minéraux en désordre : remets-les dans le bon ordre, selon leur dureté ou leur densité. Déplace-les avec les flèches ou en les faisant glisser. Une série continue tant que ton classement est parfait."),
      ...(best ? [el("p", "mq-count", `Ton record : ${best.score} classement${best.score > 1 ? "s" : ""} d’affilée`)] : []),
      Object.assign(el("button", "pick-choice mq-start", "Commencer la série"), { type: "button", onclick: () => void start() }));
  };

  const start = async () => {
    box.replaceChildren(el("p", "mq-lead", "Chargement…"));
    try { await load(); } catch (error) { console.error("Classe-les :", error); }
    if (!rows || rows.length < 12) { box.replaceChildren(el("p", "mq-lead", "Le jeu n’est pas disponible pour le moment.")); return; }
    track("start", "classe-les");
    play(0, new Set());
  };

  const play = (round, used) => {
    const challenge = makeChallenge(rows, round, used);
    if (!challenge) { finish(round, true); return; }
    challenge.items.forEach(item => used.add(item.slug));
    let current = [...challenge.shuffled];
    box.replaceChildren(el("p", "mq-count", round ? `Série en cours : ${round} classement${round > 1 ? "s" : ""}` : "Premier classement"), el("h3", "mq-question", titleOf(challenge)));
    const list = el("ol", "cl-list"); const credit = el("div", "pd-credits"); const feedback = el("div", "mq-feedback"); feedback.setAttribute("aria-live", "polite");
    const done = el("button", "pick-choice mq-start", "Valider mon classement"); done.type = "button";
    const cards = new Map();
    let locked = false;

    const draw = () => {
      list.replaceChildren(...current.map((item, index) => {
        const card = cards.get(item);
        card.querySelector(".cl-up").disabled = locked || index === 0; card.querySelector(".cl-down").disabled = locked || index === current.length - 1;
        card.querySelector(".cl-rank").textContent = String(index + 1);
        return card;
      }));
    };
    const move = (item, delta) => { const from = current.indexOf(item), to = from + delta; if (locked || to < 0 || to >= current.length) return; current.splice(from, 1); current.splice(to, 0, item); draw(); cards.get(item).querySelector(delta < 0 ? ".cl-up" : ".cl-down").focus?.(); };

    for (const item of challenge.shuffled) {
      const photo = photoOf(item, client, credits);
      const card = el("li", "cl-card");
      const handle = el("span", "cl-handle", "⠿"); handle.setAttribute("aria-hidden", "true");
      const image = el("img", "cl-photo"); image.src = photo.src; image.alt = ""; image.loading = "eager";
      const name = el("span", "cl-name", item.name); const value = el("span", "cl-value");
      const arrows = el("span", "cl-arrows"); const up = el("button", "cl-up", "▲"); const down = el("button", "cl-down", "▼");
      up.type = down.type = "button"; up.setAttribute("aria-label", `Monter ${item.name}`); down.setAttribute("aria-label", `Descendre ${item.name}`);
      up.addEventListener("click", () => move(item, -1)); down.addEventListener("click", () => move(item, 1));
      arrows.append(up, down);
      card.append(el("span", "cl-rank", ""), handle, image, el("span", "cl-text"), arrows);
      card.querySelector(".cl-text").append(name, value);
      // Glisser-déposer au doigt ou à la souris (par la poignée) : la carte suit le pointeur et prend la place des voisines qu'elle dépasse.
      handle.addEventListener("pointerdown", event => {
        if (locked) return; event.preventDefault(); card.classList.add("is-drag");
        // Les écouteurs sont sur le document : réordonner la liste recrée les cartes, ce qui ferait perdre la capture du pointeur à la poignée.
        const onMove = moved => { const y = moved.clientY; const slots = [...list.children]; const index = slots.indexOf(card); const target = slots.findIndex(slot => { const rect = slot.getBoundingClientRect(); return y >= rect.top && y <= rect.bottom; }); if (target >= 0 && target !== index) { current.splice(index, 1); current.splice(target, 0, item); draw(); } };
        const end = () => { card.classList.remove("is-drag"); document.removeEventListener("pointermove", onMove); document.removeEventListener("pointerup", end); document.removeEventListener("pointercancel", end); };
        document.addEventListener("pointermove", onMove); document.addEventListener("pointerup", end); document.addEventListener("pointercancel", end);
      });
      if (photo.credit) credit.append(photo.credit);
      cards.set(item, card);
    }
    draw();

    done.addEventListener("click", () => {
      locked = true; done.hidden = true;
      const { marks, perfect } = check(challenge, current);
      current.forEach((item, index) => { const card = cards.get(item); card.classList.add(marks[index] ? "is-good" : "is-bad"); card.querySelector(".cl-value").textContent = `${valueText(item)} ${CRITERIA[challenge.key].unit}`; });
      draw();
      feedback.className = `mq-feedback ${perfect ? "is-right" : "is-wrong"}`;
      const verdict = el("p", "mq-verdict", perfect ? "Parfait ! " : "Raté… "); verdict.append(el("strong", "", perfect ? "Tout est à la bonne place." : `Le bon ordre : ${challenge.items.map(item => item.name).join(" → ")}.`));
      const links = el("p", "mq-links"); challenge.items.forEach((item, position) => { if (position) links.append(" · "); const link = el("a", "link", item.name); link.href = ficheUrl("mineral", item.slug); link.dataset.fiche = ""; links.append(link); });
      const next = el("button", "pick-choice mq-start", perfect ? "Classement suivant" : "Voir ma série"); next.type = "button";
      next.addEventListener("click", () => perfect ? play(round + 1, used) : finish(round, false));
      feedback.append(verdict, links, next);
    });
    box.append(list, done, feedback, credit);
  };

  const finish = (score, exhausted) => {
    track("end", "classe-les", null, score);
    const previous = getProgress().quizzes?.["classe-les"]?.best?.score || 0;
    recordSeriesPlay("classe-les", score);
    const record = score > previous;
    const message = exhausted ? "Tu as tout classé !" : score >= 10 ? "Un vrai minéralogiste !" : score >= 6 ? "Excellent !" : score >= 3 ? "Bien joué !" : "Les fiches n’attendent que toi !";
    box.replaceChildren(el("p", "mq-kicker", "Ta série"), el("h3", "mq-name", `${score} classement${score > 1 ? "s" : ""} d’affilée`), el("p", "mq-tagline", record && score > 0 ? `${message} Nouveau record !` : message),
      sharePanel({ spec: { title: "Classe-les !", logo: "/assets/decor/logo-classe-les.webp", logoWidth: 900, date: dateFr(new Date().toISOString().slice(0, 10)), big: String(score), bigSub: score > 1 ? "classements parfaits d’affilée" : "classement parfait d’affilée", note: record && score > 0 ? "Nouveau record !" : "", photos: [], footer: "Et toi, jusqu’où iras-tu ?" },
        text: `J’ai réussi ${score} classement${score > 1 ? "s" : ""} d’affilée à « Classe-les ! » ! Et toi ?`, fileName: "classe-les.png", remember: "classe-les" }),
      Object.assign(el("button", "pick-choice mq-start", "Rejouer"), { type: "button", onclick: () => void start() }));
  };

  intro();
}
