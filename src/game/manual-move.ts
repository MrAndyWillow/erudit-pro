import type { Board, Direction, PlacedLetter, Pos } from './types';
import { getTile, inBounds, perpendicular, step } from './board';
import { BOARD_SIZE, CENTER } from './constants';

export interface ManualMoveResult {
  ok: true;
  cells: PlacedLetter[];
  isFirstMove: boolean;
}

export interface ManualMoveError {
  ok: false;
  error: string;
}

/**
 * Validates a word typed in by hand (mine or the opponent's) against the board:
 * checks it fits without colliding with mismatched letters, doesn't run into an
 * occupied cell just before/after it (which would mean it should have been
 * longer or started elsewhere), and satisfies the touch/first-move rules —
 * including the case of extending an existing word by adding letters to empty
 * cells before or after it (e.g. board has "СЛОН", typing "ЗАСЛОН" starting two
 * cells earlier reuses "СЛОН" as already-placed and adds "ЗА" as new tiles).
 */
export function validateManualWord(board: Board, dir: Direction, start: Pos, word: string): ManualMoveResult | ManualMoveError {
  const cells: PlacedLetter[] = [];
  let cursor = start;

  for (const letter of word) {
    if (!inBounds(cursor, BOARD_SIZE)) {
      return { ok: false, error: 'Слово выходит за пределы доски.' };
    }
    const existing = getTile(board, cursor);
    if (existing) {
      if (existing.letter !== letter) {
        return {
          ok: false,
          error: `В клетке (${cursor.row}, ${cursor.col}) уже стоит буква «${existing.letter}», а не «${letter}».`,
        };
      }
      cells.push({ row: cursor.row, col: cursor.col, letter, isBlank: existing.isBlank, isNew: false });
    } else {
      cells.push({ row: cursor.row, col: cursor.col, letter, isBlank: false, isNew: true });
    }
    cursor = step(cursor, dir, 1);
  }

  const before = step(start, dir, -1);
  if (inBounds(before, BOARD_SIZE) && getTile(board, before)) {
    return { ok: false, error: 'Перед словом уже стоит буква — начните раньше или включите её в слово.' };
  }
  if (inBounds(cursor, BOARD_SIZE) && getTile(board, cursor)) {
    return { ok: false, error: 'После слова уже стоит буква — удлините слово или сдвиньте начало.' };
  }

  const isFirstMove = board.size === 0;
  const crossDir = perpendicular(dir);
  const touchesBoard =
    cells.some((c) => !c.isNew) ||
    cells.some((c) => {
      if (!c.isNew) return false;
      const before2 = step(c, crossDir, -1);
      const after2 = step(c, crossDir, 1);
      return (inBounds(before2, BOARD_SIZE) && !!getTile(board, before2)) || (inBounds(after2, BOARD_SIZE) && !!getTile(board, after2));
    });
  const includesCenter = cells.some((c) => c.row === CENTER.row && c.col === CENTER.col);

  if (isFirstMove && !includesCenter) {
    return { ok: false, error: 'Первый ход обязан проходить через центральную клетку.' };
  }
  if (!isFirstMove && !touchesBoard) {
    return { ok: false, error: 'Слово должно касаться уже выставленных букв.' };
  }
  if (!cells.some((c) => c.isNew)) {
    return { ok: false, error: 'В этом ходе нет ни одной новой буквы.' };
  }

  return { ok: true, cells, isFirstMove };
}
