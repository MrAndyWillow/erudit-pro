import type { Board, BoardLayout, Direction, MoveMultiplierStats, PlacedLetter } from './types';
import { BOARD_SIZE, LETTER_VALUES } from './constants';
import { collectCrossWord, posKey } from './board';
import { analyzePlacedCells } from './scoring';

/**
 * Computes the tournament-statistics breakdown for a single move. A letter
 * multiplier on a newly placed tile applies independently to every word that
 * tile is part of this turn (the main word and, if any, the cross word it
 * forms) — so the points credited here include both, even though it's the
 * same physical cell. Word multipliers, by contrast, can only ever combine on
 * the main word: a cross word has exactly one new tile, so it can cross at
 * most one word-multiplier cell and can never trigger the "double" achievement
 * on its own.
 */
export function computeMoveMultiplierStats(
  board: Board,
  mainCells: PlacedLetter[],
  dir: Direction,
  layout: BoardLayout,
): MoveMultiplierStats {
  let letterX2Count = 0;
  let letterX2Points = 0;
  let letterX3Count = 0;
  let letterX3Points = 0;

  for (const cell of mainCells) {
    if (!cell.isNew) continue;
    const premium = layout.premiumAt.get(posKey(cell));
    if (premium !== 'L2' && premium !== 'L3') continue;

    const base = cell.isBlank ? 0 : (LETTER_VALUES[cell.letter] ?? 0);
    const mult = premium === 'L2' ? 2 : 3;
    let extra = base * (mult - 1);

    const cross = collectCrossWord(board, cell, cell.letter, cell.isBlank, dir, BOARD_SIZE);
    if (cross) extra += base * (mult - 1);

    if (premium === 'L2') {
      letterX2Count++;
      letterX2Points += extra;
    } else {
      letterX3Count++;
      letterX3Points += extra;
    }
  }

  const mainAnalysis = analyzePlacedCells(mainCells, layout);
  const doubleWordMultHit = mainAnalysis.wordX2Count + mainAnalysis.wordX3Count >= 2;
  const effectiveWordFactor = mainAnalysis.wordMultiplierSum === 0 ? 1 : mainAnalysis.wordMultiplierSum;

  return {
    letterX2Count,
    letterX2Points,
    letterX3Count,
    letterX3Points,
    wordX2Count: mainAnalysis.wordX2Count,
    wordX3Count: mainAnalysis.wordX3Count,
    doubleWordMultHit,
    effectiveWordFactor,
  };
}
