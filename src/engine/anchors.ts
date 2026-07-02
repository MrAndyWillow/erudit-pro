import type { Board, Pos } from '../game/types';
import { getTile, inBounds } from '../game/board';
import { BOARD_SIZE, CENTER } from '../game/constants';

/**
 * An anchor is an empty cell a legal move could start or pass through: any
 * empty cell adjacent to an already-occupied one, or the center cell on an
 * empty board (the game's mandatory opening square). Every legal word touches
 * at least one anchor, so scanning from anchors instead of every board cell
 * bounds the search to positions that could actually matter.
 */
export function computeAnchors(board: Board): Pos[] {
  if (board.size === 0) return [CENTER];

  const anchors: Pos[] = [];
  const seen = new Set<string>();

  for (const key of board.keys()) {
    const [row, col] = key.split(':').map(Number);
    const neighbors: Pos[] = [
      { row: row - 1, col },
      { row: row + 1, col },
      { row, col: col - 1 },
      { row, col: col + 1 },
    ];
    for (const neighbor of neighbors) {
      if (!inBounds(neighbor, BOARD_SIZE) || getTile(board, neighbor)) continue;
      const neighborKey = `${neighbor.row}:${neighbor.col}`;
      if (seen.has(neighborKey)) continue;
      seen.add(neighborKey);
      anchors.push(neighbor);
    }
  }

  return anchors;
}
