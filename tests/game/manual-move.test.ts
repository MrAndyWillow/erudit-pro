import { describe, expect, it } from 'vitest';
import { validateManualWord } from '@/game/manual-move';
import { createEmptyBoard } from '@/game/board';
import { CENTER } from '@/game/constants';

describe('validateManualWord', () => {
  it('requires the first move on an empty board to pass through the center cell', () => {
    const board = createEmptyBoard();
    const offCenter = validateManualWord(board, 'H', { row: 1, col: 1 }, 'КОТ');
    expect(offCenter.ok).toBe(false);

    const throughCenter = validateManualWord(board, 'H', { row: CENTER.row, col: CENTER.col - 1 }, 'КОТ');
    expect(throughCenter.ok).toBe(true);
  });

  it('extends an existing word by prepending new letters into empty cells (СЛОН -> ЗАСЛОН)', () => {
    const board = createEmptyBoard();
    // "СЛОН" already on the board horizontally at row 8, columns 5-8.
    const existing = ['С', 'Л', 'О', 'Н'];
    existing.forEach((letter, i) => {
      board.set(`8:${5 + i}`, { letter, isBlank: false, player: 'me', moveIndex: 0 });
    });

    const result = validateManualWord(board, 'H', { row: 8, col: 3 }, 'ЗАСЛОН');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.cells.filter((c) => c.isNew).map((c) => c.letter)).toEqual(['З', 'А']);
      expect(result.cells.filter((c) => !c.isNew).map((c) => c.letter)).toEqual(['С', 'Л', 'О', 'Н']);
    }
  });

  it('rejects a word that collides with a different letter already on the board', () => {
    const board = createEmptyBoard();
    board.set('8:5', { letter: 'С', isBlank: false, player: 'me', moveIndex: 0 });
    const result = validateManualWord(board, 'H', { row: 8, col: 5 }, 'ТОН');
    expect(result.ok).toBe(false);
  });

  it('rejects a word with an occupied cell immediately before its start', () => {
    const board = createEmptyBoard();
    board.set('8:4', { letter: 'А', isBlank: false, player: 'me', moveIndex: 0 });
    const result = validateManualWord(board, 'H', { row: 8, col: 5 }, 'СЛОН');
    expect(result.ok).toBe(false);
  });

  it('rejects a subsequent move that does not touch any existing tile', () => {
    const board = createEmptyBoard();
    board.set(`${CENTER.row}:${CENTER.col}`, { letter: 'А', isBlank: false, player: 'me', moveIndex: 0 });
    const result = validateManualWord(board, 'H', { row: 1, col: 1 }, 'КОТ');
    expect(result.ok).toBe(false);
  });
});
