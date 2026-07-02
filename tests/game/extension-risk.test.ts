import { describe, expect, it } from 'vitest';
import { checkExtensionRisk } from '@/game/extension-risk';
import { createEmptyBoard } from '@/game/board';
import { parseDictionaryText } from '@/dictionary/loader';
import type { PlacedLetter } from '@/game/types';

const dict = parseDictionaryText(['слон', 'заслон', 'заслонка', 'кот', 'слониха'].join('\n'));

function wordCells(word: string, row: number, startCol: number): PlacedLetter[] {
  return [...word].map((letter, i) => ({ row, col: startCol + i, letter, isBlank: false, isNew: true }));
}

describe('checkExtensionRisk', () => {
  it('flags a word that the opponent could prefix into a longer dictionary word (СЛОН -> ЗАСЛОН)', () => {
    const board = createEmptyBoard();
    // "СЛОН" at row 8, columns 5-8, with empty room to the left and right.
    const cells = wordCells('СЛОН', 8, 5);
    const risk = checkExtensionRisk(board, cells, 'H', dict);
    expect(risk.risky).toBe(true);
    expect(risk.extensions).toContain('ЗАСЛОН');
  });

  it('finds a suffix extension too (СЛОН -> ЗАСЛОНКА via prefix+suffix combined)', () => {
    const board = createEmptyBoard();
    const cells = wordCells('СЛОН', 8, 5);
    const risk = checkExtensionRisk(board, cells, 'H', dict);
    expect(risk.extensions).toContain('ЗАСЛОНКА');
  });

  it('reports no risk when there is no empty room on either side', () => {
    const board = createEmptyBoard();
    const cells = wordCells('СЛОН', 8, 5);
    // Wall off both ends with occupied cells.
    board.set('8:4', { letter: 'Х', isBlank: false, player: 'opp', moveIndex: 0 });
    board.set('8:9', { letter: 'Х', isBlank: false, player: 'opp', moveIndex: 0 });
    const risk = checkExtensionRisk(board, cells, 'H', dict);
    expect(risk.risky).toBe(false);
    expect(risk.extensions).toEqual([]);
  });

  it('only proposes extensions that fit within the actual empty room available', () => {
    const board = createEmptyBoard();
    const cells = wordCells('СЛОН', 8, 5);
    // Block one cell to the left, leaving zero room before the word (only room after remains).
    board.set('8:4', { letter: 'Х', isBlank: false, player: 'opp', moveIndex: 0 });
    const risk = checkExtensionRisk(board, cells, 'H', dict);
    expect(risk.extensions).not.toContain('ЗАСЛОН');
  });
});
