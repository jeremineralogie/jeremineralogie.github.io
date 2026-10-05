// Logique du « pendu minéralogique » (sans affichage) : normalisation des lettres, choix des mots, coups.
import { fold } from "./answer-match.js";
import { maskDefinition } from "./quiz-glossaire.js";

export const MAX_ERRORS = 6;
export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
// Lettres du terme sans accents : « Système cristallin » → « SYSTEMECRISTALLIN ». Espaces, tirets et apostrophes restent affichés tels quels.
export const lettersOf = term => fold(term).replace(/[^a-z]/g, "").toUpperCase();
export const isLetter = character => /[a-z]/.test(fold(character));
export const normalize = character => fold(character).toUpperCase();

// Mots jouables : un terme publié, une définition assez longue, entre 4 et 18 lettres.
export function prepare(terms) {
  return (terms || []).filter(item => item.term && item.definition && item.definition.length >= 35)
    .map(item => ({ ...item, letters: lettersOf(item.term), ...maskDefinition(item.definition, item.term) }))
    .filter(item => item.letters.length >= 4 && item.letters.length <= 18 && item.text.split(/\s+/).length >= 6);
}
// Longueur maximale selon la manche : mots courts d'abord.
export const maxLength = round => round < 3 ? 7 : round < 6 ? 10 : 18;
export function pickWord(pool, round, used = new Set(), random = Math.random) {
  const free = pool.filter(item => !used.has(item.slug));
  const fits = free.filter(item => item.letters.length <= maxLength(round));
  const list = fits.length ? fits : free;
  return list.length ? list[Math.floor(random() * list.length)] : null;
}

// Coups : état { word, guessed:Set, errors }. guess() renvoie "hit", "miss" ou "known".
export const newGame = word => ({ word, guessed: new Set(), errors: 0 });
export function guess(game, letter) {
  const key = normalize(letter);
  if (game.guessed.has(key)) return "known";
  game.guessed.add(key);
  if (game.word.letters.includes(key)) return "hit";
  game.errors += 1; return "miss";
}
export const isWon = game => [...game.word.letters].every(letter => game.guessed.has(letter));
export const isLost = game => game.errors >= MAX_ERRORS;
// Indice : dévoile une lettre non trouvée, au prix d'une erreur (impossible s'il ne reste qu'une erreur permise).
export function hint(game, random = Math.random) {
  if (game.errors >= MAX_ERRORS - 1) return null;
  const hidden = [...new Set(game.word.letters)].filter(letter => !game.guessed.has(letter));
  if (hidden.length < 2) return null;
  const letter = hidden[Math.floor(random() * hidden.length)];
  game.guessed.add(letter); game.errors += 1; return letter;
}
