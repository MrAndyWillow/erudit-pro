import { describe, expect, it } from 'vitest';
import { scoreCells, scoreMove } from '@/game/scoring';
import type { BoardLayout, PlacedLetter } from '@/game/types';
import { createEmptyBoard } from '@/game/board';

function layoutWith(premiums: Record<string, 'W2' | 'W3' | 'L2' | 'L3'>): BoardLayout {
  return { name: 'test', premiumAt: new Map(Object.entries(premiums)) };
}

describe('scoreCells — word multiplier stacking', () => {
  it('sums two x3-word cells into an effective x6, not x9', () => {
    // ТУР laid across two W3 cells (positions 1,1 and 3,1); letters worth 2+3+1=6 base.
    const layout = layoutWith({ '1:1': 'W3', '3:1': 'W3' });
    const cells: PlacedLetter[] = [
      { row: 1, col: 1, letter: 'Т', isBlank: false, isNew: true }, // 2 pts
      { row: 2, col: 1, letter: 'У', isBlank: false, isNew: true }, // 3 pts
      { row: 3, col: 1, letter: 'Р', isBlank: false, isNew: true }, // 2 pts
    ];
    // base sum = 2+3+2 = 7, factor = 3+3 = 6 (additive, not 3*3=9)
    expect(scoreCells(cells, layout)).toBe(7 * 6);
  });

  it('applies a single x2-word and x3-word as an additive x5, not x6', () => {
    const layout = layoutWith({ '1:1': 'W2', '2:1': 'W3' });
    const cells: PlacedLetter[] = [
      { row: 1, col: 1, letter: 'А', isBlank: false, isNew: true }, // 1 pt
      { row: 2, col: 1, letter: 'Б', isBlank: false, isNew: true }, // 3 pts
    ];
    expect(scoreCells(cells, layout)).toBe(4 * 5);
  });

  it('applies letter multipliers only to newly placed tiles', () => {
    const layout = layoutWith({ '1:1': 'L3' });
    const cells: PlacedLetter[] = [
      { row: 1, col: 1, letter: 'Б', isBlank: false, isNew: false }, // already on board — no bonus
      { row: 2, col: 1, letter: 'А', isBlank: false, isNew: true },
    ];
    expect(scoreCells(cells, layout)).toBe(3 + 1);
  });

  it('gives a blank/joker tile zero base points regardless of assigned letter', () => {
    const layout = layoutWith({ '1:1': 'L3' });
    const cells: PlacedLetter[] = [{ row: 1, col: 1, letter: 'Э', isBlank: true, isNew: true }]; // Э is normally 10pt
    expect(scoreCells(cells, layout)).toBe(0);
  });
});

describe('scoreMove — bingo and cross words', () => {
  it('awards the +15 bingo bonus for exactly 7 new tiles', () => {
    const layout = layoutWith({});
    const board = createEmptyBoard();
    const sevenLetters = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж'];
    const cells: PlacedLetter[] = sevenLetters.map((letter, i) => ({
      row: 1,
      col: i + 1,
      letter,
      isBlank: false,
      isNew: true,
    }));
    const result = scoreMove(board, cells, 'H', layout);
    expect(result.bingo).toBe(true);
    expect(result.total).toBe(result.mainWordScore + result.crossWordsScore + 15);
  });

  it('does not award bingo for 6 new tiles', () => {
    const layout = layoutWith({});
    const board = createEmptyBoard();
    const cells: PlacedLetter[] = ['А', 'Б', 'В', 'Г', 'Д', 'Е'].map((letter, i) => ({
      row: 1,
      col: i + 1,
      letter,
      isBlank: false,
      isNew: true,
    }));
    expect(scoreMove(board, cells, 'H', layout).bingo).toBe(false);
  });

  it('adds the score of a cross word formed by a newly placed tile', () => {
    const layout = layoutWith({});
    const board = createEmptyBoard();
    // Existing tile Ы sitting immediately to the right of where our new vertical word will land.
    board.set('5:6', { letter: 'Ы', isBlank: false, player: 'opp', moveIndex: 0 });
    // New vertical word "АТ" at column 5, rows 4-5.
    const cells: PlacedLetter[] = [
      { row: 4, col: 5, letter: 'А', isBlank: false, isNew: true },
      { row: 5, col: 5, letter: 'Т', isBlank: false, isNew: true },
    ];
    const result = scoreMove(board, cells, 'V', layout);
    // (5,5)+Т joins the existing Ы at (5,6) into a horizontal cross word "ТЫ".
    expect(result.crossWords).toEqual([{ word: 'ТЫ', score: 2 + 5 }]);
    expect(result.mainWordScore).toBe(1 + 2); // А=1, Т=2
    expect(result.total).toBe(3 + 7);
  });
});
