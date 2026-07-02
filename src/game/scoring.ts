import type { Board, BoardLayout, Direction, PlacedLetter, ScoreBreakdown } from './types';
import { BINGO_BONUS, BOARD_SIZE, LETTER_VALUES, RACK_SIZE } from './constants';
import { collectCrossWord, posKey } from './board';

export interface CellAnalysis {
  /** Sum of letter points before any letter multiplier is applied. */
  baseLetterSum: number;
  /** Sum of letter points after letter multipliers (L2/L3) are applied to new tiles. */
  multipliedLetterSum: number;
  /** Additive sum of word-multiplier factors (e.g. two W3 cells => 6, per the game's stacking rule). */
  wordMultiplierSum: number;
  letterX2Count: number;
  letterX2ExtraPoints: number;
  letterX3Count: number;
  letterX3ExtraPoints: number;
  wordX2Count: number;
  wordX3Count: number;
}

function emptyAnalysis(): CellAnalysis {
  return {
    baseLetterSum: 0,
    multipliedLetterSum: 0,
    wordMultiplierSum: 0,
    letterX2Count: 0,
    letterX2ExtraPoints: 0,
    letterX3Count: 0,
    letterX3ExtraPoints: 0,
    wordX2Count: 0,
    wordX3Count: 0,
  };
}

/**
 * Walks a set of cells (a placed word, main or cross) once, computing both the
 * raw scoring inputs and the multiplier-usage counters the statistics panel needs.
 * Premium effects only ever apply to cells marked `isNew` — a tile that was
 * already on the board from an earlier move never re-triggers its cell's bonus.
 */
export function analyzePlacedCells(cells: PlacedLetter[], layout: BoardLayout): CellAnalysis {
  const analysis = emptyAnalysis();
  for (const cell of cells) {
    const base = cell.isBlank ? 0 : (LETTER_VALUES[cell.letter] ?? 0);
    analysis.baseLetterSum += base;
    let cellValue = base;

    if (cell.isNew) {
      const premium = layout.premiumAt.get(posKey(cell));
      if (premium === 'L2') {
        cellValue = base * 2;
        analysis.letterX2Count++;
        analysis.letterX2ExtraPoints += base;
      } else if (premium === 'L3') {
        cellValue = base * 3;
        analysis.letterX3Count++;
        analysis.letterX3ExtraPoints += base * 2;
      } else if (premium === 'W2') {
        analysis.wordMultiplierSum += 2;
        analysis.wordX2Count++;
      } else if (premium === 'W3') {
        analysis.wordMultiplierSum += 3;
        analysis.wordX3Count++;
      }
    }

    analysis.multipliedLetterSum += cellValue;
  }
  return analysis;
}

/**
 * Scores a single word (main or cross). Word multipliers on this word's cells
 * are summed and applied once to the letter total — two x3-word cells on one
 * word yield an effective x6, not x9 (this game's house rule, distinct from
 * classic Scrabble's multiplicative stacking).
 */
export function scoreCells(cells: PlacedLetter[], layout: BoardLayout): number {
  const analysis = analyzePlacedCells(cells, layout);
  const factor = analysis.wordMultiplierSum === 0 ? 1 : analysis.wordMultiplierSum;
  return analysis.multipliedLetterSum * factor;
}

export function scoreMove(board: Board, mainCells: PlacedLetter[], dir: Direction, layout: BoardLayout): ScoreBreakdown {
  const mainWordScore = scoreCells(mainCells, layout);

  const crossWords: { word: string; score: number }[] = [];
  for (const cell of mainCells) {
    if (!cell.isNew) continue;
    const cross = collectCrossWord(board, cell, cell.letter, cell.isBlank, dir, BOARD_SIZE);
    if (!cross) continue;
    const crossCells: PlacedLetter[] = cross.cells.map((c) => ({
      row: c.pos.row,
      col: c.pos.col,
      letter: c.letter,
      isBlank: c.isBlank,
      isNew: c.isNew,
    }));
    crossWords.push({ word: cross.word, score: scoreCells(crossCells, layout) });
  }

  const crossWordsScore = crossWords.reduce((sum, c) => sum + c.score, 0);
  const newTileCount = mainCells.filter((c) => c.isNew).length;
  const bingo = newTileCount === RACK_SIZE;
  const total = mainWordScore + crossWordsScore + (bingo ? BINGO_BONUS : 0);

  return { mainWordScore, crossWords, crossWordsScore, bingo, total };
}
