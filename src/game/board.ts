import type { Board, BoardTile, Direction, Pos } from './types';

export function posKey(p: Pos): string {
  return `${p.row}:${p.col}`;
}

export function inBounds(p: Pos, size: number): boolean {
  return p.row >= 1 && p.row <= size && p.col >= 1 && p.col <= size;
}

export function createEmptyBoard(): Board {
  return new Map();
}

export function getTile(board: Board, p: Pos): BoardTile | undefined {
  return board.get(posKey(p));
}

export function step(p: Pos, dir: Direction, amount = 1): Pos {
  return dir === 'H' ? { row: p.row, col: p.col + amount } : { row: p.row + amount, col: p.col };
}

export function perpendicular(dir: Direction): Direction {
  return dir === 'H' ? 'V' : 'H';
}

export interface CrossWordCell {
  pos: Pos;
  letter: string;
  isBlank: boolean;
  isNew: boolean;
}

export interface CrossWord {
  word: string;
  cells: CrossWordCell[];
}

/**
 * Finds the perpendicular word formed by placing `newLetter` at `pos`, if any.
 * Returns null when `pos` is isolated on the cross axis (no neighboring tiles),
 * meaning no cross word is created by this placement.
 */
export function collectCrossWord(
  board: Board,
  pos: Pos,
  newLetter: string,
  newIsBlank: boolean,
  mainDir: Direction,
  boardSize: number,
): CrossWord | null {
  const crossDir = perpendicular(mainDir);

  let runStart = pos;
  for (let prev = step(runStart, crossDir, -1); inBounds(prev, boardSize) && getTile(board, prev); prev = step(prev, crossDir, -1)) {
    runStart = prev;
  }

  const cells: CrossWordCell[] = [];
  let cur: Pos = runStart;
  while (inBounds(cur, boardSize)) {
    const isTargetCell = cur.row === pos.row && cur.col === pos.col;
    if (isTargetCell) {
      cells.push({ pos: cur, letter: newLetter, isBlank: newIsBlank, isNew: true });
    } else {
      const tile = getTile(board, cur);
      if (!tile) break;
      cells.push({ pos: cur, letter: tile.letter, isBlank: tile.isBlank, isNew: false });
    }
    const next = step(cur, crossDir, 1);
    const nextIsTarget = next.row === pos.row && next.col === pos.col;
    if (!inBounds(next, boardSize)) break;
    if (!nextIsTarget && !getTile(board, next)) break;
    cur = next;
  }

  if (cells.length < 2) return null;
  return { word: cells.map((c) => c.letter).join(''), cells };
}
