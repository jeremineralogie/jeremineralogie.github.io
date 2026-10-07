// Quiz « Vrai ou faux minéralogique » : 10 affirmations tirées au hasard à chaque partie, à partir des fiches des minéraux communs et très communs.
// Équité : toujours 5 vraies et 5 fausses, deux affirmations de chaque sorte (une vraie, une fausse), jamais le même minéral deux fois.
import { ficheUrl } from "./entity-links.js";
import { sharePanel, dateFr } from "./share.js";
import { track } from "./track.js";
import { recordQuizPlay } from "./game-progress.js";

const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text != null) node.textContent = text; return node; };
const pick = list => list[Math.floor(Math.random() * list.length)];
const shuffle = list => { const copy = [...list]; for (let i = copy.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; } return copy; };
const fr = value => Number(value).toLocaleString("fr-FR", { maximumFractionDigits: 2 });
const range = (min, max) => max != null && Number(max) !== Number(min) ? `${fr(min)} à ${fr(max)}` : fr(min);
const q = row => `« ${row.name} »`;

const SYSTEMS = ["Trigonal", "Monoclinique", "Cubique", "Orthorhombique", "Hexagonal", "Triclinique", "Quadratique", "Amorphe"];
const CLOSE_SYSTEMS = { Trigonal: "Hexagonal", Hexagonal: "Trigonal" }; // classement parfois confondu : jamais proposé comme fausse réponse
const FAMILIES = [
  { key: "Carbonates", label: "des carbonates" }, { key: "Sulfures", label: "des sulfures" }, { key: "Oxydes", label: "des oxydes et hydroxydes" },
  { key: "Sulfates", label: "des sulfates" }, { key: "Phosphates", label: "des phosphates" }, { key: "Éléments natifs", label: "des éléments natifs" }, { key: "Silicates", label: "des silicates" }
];
const familyOf = row => FAMILIES.find(item => row.chemical_class.startsWith(item.key));

function prepare(rows) {
  return rows.filter(row => !row.is_group && row.hardness != null && row.density != null && SYSTEMS.includes(row.crystal_system) && row.chemical_class)
    .filter(row => !(row.chemical_class.startsWith("Oxydes") && Number(row.density) < 3))   // silice et variétés (quartz, opale…) : classement oxyde ou silicate selon les livres, donc exclus
    .map(row => ({ ...row, lo: Number(row.hardness), hi: Number(row.hardness_max ?? row.hardness), dlo: Number(row.density), dhi: Number(row.density_max ?? row.density), weight: row.rarity === "tres_commun" ? 2 : 1 }));
}
const signature = row => `${row.lo}|${row.hi}|${row.dlo}|${row.dhi}|${row.crystal_system}|${row.chemical_class}`;
// « used » garde les minéraux déjà posés et leur signature : pas deux fois la même fiche, ni deux variétés aux propriétés identiques.
const draw = (pool, used, test = () => true) => {
  const free = pool.filter(row => !used.has(row.slug) && !used.has(signature(row)) && test(row));
  const bag = free.flatMap(row => Array(row.weight).fill(row));
  return bag.length ? pick(bag) : null;
};

// Chaque fabrique renvoie { text, answer, explain, rows } ou null (essai suivant).
const makers = {
  durete(pool, used, answer) {
    const soft = draw(pool, used); if (!soft) return null;
    const hard = draw(pool, new Set([...used, soft.slug, signature(soft)]), row => row.lo >= soft.hi + 1.5); if (!hard) return null;
    const [a, b] = answer ? [soft, hard] : [hard, soft];
    return { text: `${q(a)} se raye plus facilement que ${q(b)}.`, answer, rows: [soft, hard],
      explain: `${soft.name} a une dureté de ${range(soft.lo, soft.hi)} sur l’échelle de Mohs, ${hard.name} de ${range(hard.lo, hard.hi)} : c’est ${hard.name} qui raye ${soft.name}.` };
  },
  densite(pool, used, answer) {
    const light = draw(pool, used); if (!light) return null;
    const dense = draw(pool, new Set([...used, light.slug, signature(light)]), row => row.dlo >= light.dhi * 1.4 && row.dlo - light.dhi >= 1); if (!dense) return null;
    const [a, b] = answer ? [dense, light] : [light, dense];
    return { text: `${q(a)} est plus dense que ${q(b)}.`, answer, rows: [light, dense],
      explain: `${dense.name} a une densité de ${range(dense.dlo, dense.dhi)}, contre ${range(light.dlo, light.dhi)} pour ${light.name} : c’est ${dense.name} le plus dense.` };
  },
  couteau(pool, used, answer) {
    const soft = Math.random() < 0.5;
    // Vrai : un minéral tendre se raye à la lame, ou un minéral dur raye le verre. Faux : l'inverse.
    const wantSoft = answer ? soft : !soft;
    const row = draw(pool, used, item => wantSoft ? item.hi <= 4.5 : item.lo >= 6.5); if (!row) return null;
    const text = soft ? `${q(row)} se raye avec une lame de couteau.` : `${q(row)} raye le verre.`;
    return { text, answer, rows: [row],
      explain: `${row.name} a une dureté de ${range(row.lo, row.hi)} sur l’échelle de Mohs. Une lame d’acier et le verre se situent autour de 5,5 : ${wantSoft ? `${row.name} est plus tendre : une lame le raye` : `${row.name} est plus dur, il raye le verre`}.` };
  },
  systeme(pool, used, answer) {
    const row = draw(pool, used); if (!row) return null;
    const system = answer ? row.crystal_system : pick(SYSTEMS.filter(item => item !== row.crystal_system && item !== CLOSE_SYSTEMS[row.crystal_system]));
    const text = system === "Amorphe" ? `${q(row)} est amorphe (sans structure cristalline).` : `${q(row)} cristallise dans le système ${system.toLowerCase()}.`;
    return { text, answer, rows: [row],
      explain: row.crystal_system === "Amorphe" ? `${row.name} est amorphe : la matière n’y est pas organisée en cristaux.` : `${row.name} cristallise dans le système ${row.crystal_system.toLowerCase()}.` };
  },
  famille(pool, used, answer) {
    const row = draw(pool, used, item => familyOf(item)); if (!row) return null;
    const real = familyOf(row);
    const family = answer ? real : pick(FAMILIES.filter(item => item !== real));
    return { text: `${q(row)} fait partie ${family.label}.`, answer, rows: [row],
      explain: `${row.name} fait partie de la famille « ${row.chemical_class} ».` };
  }
};

// 10 affirmations : 5 sortes × (une vraie + une fausse), dans le désordre.
export function buildStatements(rows) {
  const pool = prepare(rows);
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const used = new Set(); const out = [];
    for (const kind of Object.keys(makers)) for (const answer of [true, false]) {
      let made = null;
      for (let tries = 0; tries < 25 && !made; tries += 1) made = makers[kind](pool, used, answer);
      if (!made) break;
      made.rows.forEach(row => { used.add(row.slug); used.add(signature(row)); }); out.push(made);
    }
    if (out.length === 10) return shuffle(out);
  }
  return [];
}

export function mountVraiFaux(container, { client }) {
  container.replaceChildren();
  const box = el("div", "mq"); container.append(box);
  let rows = null;

  const load = async () => {
    if (rows) return rows;
    const { data, error } = await client.from("minerals").select("name,slug,rarity,is_group,hardness,hardness_max,density,density_max,crystal_system,chemical_class")
      .eq("publication_status", "published").in("rarity", ["commun", "tres_commun"]);
    if (error) throw error;
    rows = data || []; return rows;
  };

  const start = async () => {
    box.replaceChildren(el("p", "mq-lead", "Chargement…"));
    let statements = [];
    try { statements = buildStatements(await load()); } catch (error) { console.error("Vrai ou faux :", error); }
    if (!statements.length) { box.replaceChildren(el("p", "mq-lead", "Le quiz n’est pas disponible pour le moment.")); return; }
    track("start", "vrai-faux");
    play(statements, 0, 0);
  };

  const intro = () => {
    box.replaceChildren(el("p", "mq-lead", "Dix affirmations sur les minéraux courants : vrai ou faux ? Une explication te attend après chaque réponse, et les affirmations changent à chaque partie."),
      Object.assign(el("button", "pick-choice mq-start", "Commencer"), { type: "button", onclick: () => void start() }));
  };

  const play = (statements, index, score) => {
    box.replaceChildren();
    const item = statements[index];
    const bar = el("div", "mq-bar"); const fill = el("span"); fill.style.width = `${(index / statements.length) * 100}%`; bar.append(fill);
    box.append(el("p", "mq-count", `Affirmation ${index + 1} sur ${statements.length}`), bar, el("h3", "mq-question", item.text));
    const choices = el("div", "mq-answers mq-yesno");
    const feedback = el("div", "mq-feedback"); feedback.setAttribute("aria-live", "polite");
    const answer = value => {
      const right = value === item.answer;
      choices.querySelectorAll("button").forEach(button => { button.disabled = true; if ((button.textContent === "Vrai") === item.answer) button.classList.add("is-good"); });
      if (!right) choices.querySelectorAll("button").forEach(button => { if ((button.textContent === "Vrai") === value) button.classList.add("is-bad"); });
      feedback.className = `mq-feedback ${right ? "is-right" : "is-wrong"}`;
      const verdict = el("p", "mq-verdict", right ? "Bonne réponse ! " : "Raté… "); verdict.append(el("strong", "", item.answer ? "C’est vrai." : "C’est faux."));
      feedback.append(verdict, el("p", "mq-explain", item.explain));
      const links = el("p", "mq-links");
      item.rows.forEach((row, position) => { if (position) links.append(" · "); const link = el("a", "link", `Fiche ${row.name}`); link.href = ficheUrl("mineral", row.slug); link.dataset.fiche = ""; links.append(link); });
      const next = el("button", "pick-choice mq-start", index + 1 < statements.length ? "Affirmation suivante" : "Voir mon score"); next.type = "button";
      next.addEventListener("click", () => index + 1 < statements.length ? play(statements, index + 1, score + (right ? 1 : 0)) : finish(score + (right ? 1 : 0), statements.length));
      feedback.append(links, next);
    };
    [["Vrai", true], ["Faux", false]].forEach(([label, value]) => { const button = el("button", "pick-choice mq-answer", label); button.type = "button"; button.addEventListener("click", () => answer(value)); choices.append(button); });
    box.append(choices, feedback);
  };

  const finish = (score, total) => {
    track("end", "vrai-faux", null, score);
    recordQuizPlay("vrai-faux", score, total);
    const message = score === total ? "Sans faute !" : score >= 8 ? "Excellent !" : score >= 6 ? "Bien joué !" : score >= 4 ? "Pas mal, tu progresses !" : "Les fiches n’attendent que toi !";
    box.replaceChildren(el("p", "mq-kicker", "Ton score"), el("h3", "mq-name", `${score} / ${total}`), el("p", "mq-tagline", message),
      sharePanel({ spec: { title: "Vrai ou faux minéralogique", logo: "/assets/decor/logo-vrai-faux.webp", logoWidth: 900, date: dateFr(new Date().toISOString().slice(0, 10)), big: `${score} / ${total}`, bigSub: message, photos: [], footer: "Et toi, combien feras-tu ?" },
        text: `J’ai fait ${score}/${total} au vrai ou faux minéralogique ! Et toi ?`, fileName: "vrai-faux-mineralogique.png", remember: "vrai-faux" }),
      Object.assign(el("button", "pick-choice mq-start", "Rejouer"), { type: "button", onclick: () => void start() }));
  };

  intro();
}
