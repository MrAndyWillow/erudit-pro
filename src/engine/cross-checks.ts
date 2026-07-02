import type { Board, Direction, Pos } from '../game/types';
import { getTile, inBounds, perpendicular, step } from '../game/board';
import { ALPHABET, BOARD_SIZE } from '../game/constants';
import { walkTrie, type TrieNode } from '../dictionary/trie';

/** null = no perpendicular neighbor, any letter is fine here; a Set restricts to those letters (possibly empty). */
export type CrossCheckResult = Set<string> | null;

function cellKey(p: Pos): string {
  return `${p.row}:${p.col}`;
}

/**
 * For a single empty cell, determines which letters could legally go there:
 * whichever ones complete a real dictionary word with whatever fixed letters
 * already sit on the perpendicular line (or any letter, if that cell has no
 * perpendicular neighbors at all).
 */
export function computeCrossCheck(board: Board, pos: Pos, mainDir: Direction, trie: TrieNode): CrossCheckResult {
  const crossDir = perpendicular(mainDir);

  const prefixLetters: string[] = [];
  for (let cur = step(pos, crossDir, -1); inBounds(cur, BOARD_SIZE); cur = step(cur, crossDir, -1)) {
    const tile = getTile(board, cur);
    if (!tile) break;
    prefixLetters.unshift(tile.letter);
  }

  const suffixLetters: string[] = [];
  for (let cur = step(pos, crossDir, 1); inBounds(cur, BOARD_SIZE); cur = step(cur, crossDir, 1)) {
    const tile = getTile(board, cur);
    if (!tile) break;
    suffixLetters.push(tile.letter);
  }

  if (prefixLetters.length === 0 && suffixLetters.length === 0) return null;

  const prefixNode = walkTrie(trie, prefixLetters.join(''));
  if (!prefixNode) return new Set();

  const suffix = suffixLetters.join('');
  const allowed = new Set<string>();
  for (const letter of ALPHABET) {
    const afterLetter = prefixNode.children.get(letter);
    if (!afterLetter) continue;
    const finalNode = walkTrie(afterLetter, suffix);
    if (finalNode && finalNode.isWord) allowed.add(letter);
  }
  return allowed;
}

export function computeCrossChecksForBoard(board: Board, mainDir: Direction, trie: TrieNode): Map<string, CrossCheckResult> {
  const map = new Map<string, CrossCheckResult>();
  for (let row = 1; row <= BOARD_SIZE; row++) {
    for (let col = 1; col <= BOARD_SIZE; col++) {
      const pos = { row, col };
      if (getTile(board, pos)) continue;
      map.set(cellKey(pos), computeCrossCheck(board, pos, mainDir, trie));
    }
  }
  return map;
}
