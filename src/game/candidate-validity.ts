import type { Board, PlacedLetter, Pos } from './types';
import { getTile, inBounds } from './board';
import { BOARD_SIZE, CENTER } from './constants';

/**
 * Re-checks a previously generated candidate against the CURRENT board state.
 * Suggestions are computed against a snapshot of the board; if the opponent
 * (or the player) plays another move before a suggestion is applied, some
 * cells it depends on may no longer be empty (or may no longer hold the fixed
 * letters it expected) — this guards against showing/applying a stale one.
 */
export function isCandidateStillValid(board: Board, cells: PlacedLetter[]): boolean {
  for (const cell of cells) {
    const tile = getTile(board, cell);
    if (cell.isNew) {
      if (tile) return false;
    } else if (!tile || tile.letter !== cell.letter || tile.isBlank !== cell.isBlank) {
      return false;
    }
  }

  if (board.size === 0) {
    return cells.some((c) => c.row === CENTER.row && c.col === CENTER.col);
  }

  if (cells.some((c) => !c.isNew)) return true;

  for (const cell of cells) {
    if (!cell.isNew) continue;
    const neighbors: Pos[] = [
      { row: cell.row - 1, col: cell.col },
      { row: cell.row + 1, col: cell.col },
      { row: cell.row, col: cell.col - 1 },
      { row: cell.row, col: cell.col + 1 },
    ];
    for (const neighbor of neighbors) {
      if (inBounds(neighbor, BOARD_SIZE) && getTile(board, neighbor)) return true;
    }
  }
  return false;
}
