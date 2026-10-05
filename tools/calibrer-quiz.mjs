// Calibre un quiz de personnalité à un axe par résultat (« outil », « collectionneur »…) : centrage (mu, sd) puis biais d'équilibrage,
// pour que chaque résultat sorte à peu près aussi souvent quand on répond au hasard. Écrit les valeurs dans assets/js/quiz-<nom>-data.js.
// Usage : node tools/calibrer-quiz.mjs outil   (ou : collectionneur)
import { readFileSync, writeFileSync } from "node:fs";
import { personaResult } from "../assets/js/quiz-persona.js";
globalThis.document ??= {};

const name = process.argv[2];
if (!name) { console.error("Usage : node tools/calibrer-quiz.mjs <nom du quiz>"); process.exit(1); }
const file = new URL(`../assets/js/quiz-${name}-data.js`, import.meta.url);
const module = await import(file);
const { axes, questions, profiles } = module[`QUIZ_${name.toUpperCase()}`];
let seed = 987654321; const random = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
const draw = () => Array.from({ length: questions.length }, () => Math.floor(random() * 4));

// mu et sd par axe, sur des réponses au hasard.
const N = 40000, sums = axes.map(() => []);
for (let run = 0; run < N; run += 1) { const answers = draw(); axes.forEach((_, axis) => sums[axis].push(answers.reduce((total, choice, index) => total + questions[index].answers[choice].v[axis], 0))); }
const mu = sums.map(list => list.reduce((a, b) => a + b, 0) / N);
const sd = sums.map((list, axis) => Math.sqrt(list.reduce((a, b) => a + (b - mu[axis]) ** 2, 0) / N));
const data = { axes, questions, mu, sd, results: profiles.map(item => ({ ...item, bias: 0 })) };

// Biais : on corrige chaque outil selon l'écart entre sa fréquence et la fréquence idéale.
const batch = Array.from({ length: 30000 }, draw);
for (let step = 0; step < 600; step += 1) {
  const rate = 0.5 / (1 + step / 200);
  const counts = new Map();
  batch.forEach(answers => { const slug = personaResult(data, answers).slug; counts.set(slug, (counts.get(slug) || 0) + 1); });
  data.results.forEach(item => { item.bias -= ((counts.get(item.slug) || 0) / batch.length - 1 / profiles.length) * rate; });
}
const counts = new Map(); batch.forEach(answers => { const slug = personaResult(data, answers).slug; counts.set(slug, (counts.get(slug) || 0) + 1); });
console.log([...counts].map(([slug, count]) => `${slug} ${(count / batch.length * 100).toFixed(1)} %`).join(" · "));

let source = readFileSync(file, "utf8");
const round = value => Number(value.toFixed(4));
source = source.replace(/ mu: \[[^\]]*\],/, ` mu: [${mu.map(round).join(", ")}],`).replace(/ sd: \[[^\]]*\],/, ` sd: [${sd.map(round).join(", ")}],`);
let index = 0; source = source.replace(/bias: [-\d.]+/g, () => `bias: ${round(data.results[index++].bias)}`);
writeFileSync(file, source);
