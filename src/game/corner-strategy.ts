import type { BoardLayout, PlacedLetter } from './types';
import { posKey } from './board';

/** Letters that (almost) never start a Russian word, regardless of what the dictionary says. */
const HARD_START_SEED = new Set(['Ь', 'Ъ', 'Ы', 'Й']);

/** A letter counts as a "hard start" if fewer than this many short (<8-letter) words in the loaded dictionary begin with it. */
const RARE_STARTER_THRESHOLD = 15;

export interface StartLetterFrequency {
  get(letter: string): number | undefined;
}

export function computeHardStartLetters(alphabet: string[], startFrequency: StartLetterFrequency | null): Set<string> {
  const hard = new Set(HARD_START_SEED);
  if (!startFrequency) return hard;
  for (const letter of alphabet) {
    const count = startFrequency.get(letter) ?? 0;
    if (count < RARE_STARTER_THRESHOLD) hard.add(letter);
  }
  return hard;
}

export interface CornerAssessment {
  delta: number;
  messages: string[];
}

const CORNER_BONUS = 12;
const CORNER_PENALTY = 9;

/**
 * Scores how well a candidate move defends the board's x3-word cells: landing a
 * letter that's hard to start a word with on such a cell denies the opponent a
 * cheap extension into that premium square from the perpendicular line; landing
 * an easy starter there is a strategic liability, flagged as a penalty.
 */
export function assessCornerPlacement(cells: PlacedLetter[], layout: BoardLayout, hardStartLetters: Set<string>): CornerAssessment {
  let delta = 0;
  const messages: string[] = [];

  for (const cell of cells) {
    if (!cell.isNew) continue;
    if (layout.premiumAt.get(posKey(cell)) !== 'W3') continue;

    if (hardStartLetters.has(cell.letter)) {
      delta += CORNER_BONUS;
      messages.push(`«${cell.letter}» на клетке x3-слово — сопернику почти нечем продолжить слово отсюда`);
    } else {
      delta -= CORNER_PENALTY;
      messages.push(`«${cell.letter}» на клетке x3-слово — лёгкая буква для старта, соперник может дописать слово сюда`);
    }
  }

  return { delta, messages };
}
