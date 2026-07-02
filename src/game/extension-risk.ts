import type { Board, Direction, PlacedLetter, Pos } from './types';
import { getTile, inBounds, step } from './board';
import { BOARD_SIZE } from './constants';
import type { LoadedDictionary } from '../dictionary/loader';

function emptyRunLength(board: Board, from: Pos, dir: Direction, sign: 1 | -1, cap: number): number {
  let count = 0;
  let cur = from;
  while (count < cap) {
    const next = step(cur, dir, sign);
    if (!inBounds(next, BOARD_SIZE) || getTile(board, next)) break;
    count++;
    cur = next;
  }
  return count;
}

export interface ExtensionRisk {
  risky: boolean;
  extensions: string[];
}

/**
 * Checks whether the opponent could prepend and/or append letters to this word
 * (using only empty board cells) to spell a longer dictionary word next turn —
 * e.g. our "СЛОН" becoming their "ЗАСЛОН" or "ЗАСЛОНКА". Bounded by how many
 * empty cells actually exist before/after the word and by a max-extra-letters cap.
 */
export function checkExtensionRisk(
  board: Board,
  mainCells: PlacedLetter[],
  dir: Direction,
  dict: LoadedDictionary,
  maxExtra = 7,
): ExtensionRisk {
  const word = mainCells.map((c) => c.letter).join('');
  const first = mainCells[0];
  const last = mainCells[mainCells.length - 1];
  const roomBefore = emptyRunLength(board, first, dir, -1, maxExtra);
  const roomAfter = emptyRunLength(board, last, dir, 1, maxExtra);
  if (roomBefore === 0 && roomAfter === 0) return { risky: false, extensions: [] };

  const found: string[] = [];
  const seen = new Set<string>();

  for (let extra = 1; extra <= Math.min(maxExtra, roomBefore + roomAfter); extra++) {
    const candidates = dict.byLength.get(word.length + extra);
    if (!candidates) continue;

    for (let prefixLen = 0; prefixLen <= Math.min(extra, roomBefore); prefixLen++) {
      const suffixLen = extra - prefixLen;
      if (suffixLen > roomAfter) continue;

      for (const candidate of candidates) {
        if (seen.has(candidate)) continue;
        if (candidate.slice(prefixLen, prefixLen + word.length) === word) {
          seen.add(candidate);
          found.push(candidate);
        }
      }
    }
  }

  return { risky: found.length > 0, extensions: found.slice(0, 6) };
}
