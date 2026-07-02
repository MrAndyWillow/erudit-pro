import { describe, expect, it } from 'vitest';
import { buildTrie } from '@/dictionary/trie';
import { parseDictionaryText, type LoadedDictionary } from '@/dictionary/loader';
import { generateRawCandidates } from '@/engine/move-generator';
import { isCandidateStillValid } from '@/game/candidate-validity';
import { createEmptyBoard, getTile } from '@/game/board';
import { CENTER, BOARD_SIZE } from '@/game/constants';
import type { Board, Direction, Pos } from '@/game/types';

const TEST_WORDS = ['кот', 'ток', 'кол', 'сон', 'нос', 'сок'];
const dict: LoadedDictionary = parseDictionaryText(TEST_WORDS.join('\n'));
const trie = buildTrie(dict.words);
const wordSet = new Set(dict.words);

describe('generateRawCandidates — basic legality', () => {
  it('on an empty board, every candidate passes through the center cell', () => {
    const board = createEmptyBoard();
    const rackCounts = { К: 1, О: 1, Т: 1, С: 1, Н: 1 };
    const candidates = generateRawCandidates(board, rackCounts, 0, trie);
    expect(candidates.length).toBeGreaterThan(0);
    for (const candidate of candidates) {
      const touchesCenter = candidate.cells.some((c) => c.row === CENTER.row && c.col === CENTER.col);
      expect(touchesCenter).toBe(true);
    }
  });

  it('every generated candidate remains valid against the board it was generated from', () => {
    const board = createEmptyBoard();
    board.set(`${CENTER.row}:${CENTER.col}`, { letter: 'К', isBlank: false, player: 'me', moveIndex: 0 });
    const rackCounts = { О: 1, Т: 1, С: 1, Н: 1 };
    const candidates = generateRawCandidates(board, rackCounts, 0, trie);
    expect(candidates.length).toBeGreaterThan(0);
    for (const candidate of candidates) {
      expect(isCandidateStillValid(board, candidate.cells)).toBe(true);
    }
  });

  it('every candidate on a non-empty board touches at least one existing tile', () => {
    const board = createEmptyBoard();
    board.set(`${CENTER.row}:${CENTER.col}`, { letter: 'К', isBlank: false, player: 'me', moveIndex: 0 });
    const rackCounts = { О: 1, Т: 1, С: 1, Н: 1 };
    const candidates = generateRawCandidates(board, rackCounts, 0, trie);
    for (const candidate of candidates) {
      const hasFixedCell = candidate.cells.some((c) => !c.isNew);
      expect(hasFixedCell).toBe(true); // in this scenario every word must pass through the fixed К
    }
  });

  it('any cross word formed by a new tile is a real dictionary word', () => {
    const board = createEmptyBoard();
    // "СОН" placed vertically at column 8, rows 6-8, so horizontal candidates crossing it must respect those letters.
    board.set('6:8', { letter: 'С', isBlank: false, player: 'me', moveIndex: 0 });
    board.set('7:8', { letter: 'О', isBlank: false, player: 'me', moveIndex: 0 });
    board.set('8:8', { letter: 'Н', isBlank: false, player: 'me', moveIndex: 0 });
    const rackCounts = { К: 1, О: 1, Т: 1, С: 1 };
    const candidates = generateRawCandidates(board, rackCounts, 0, trie);

    for (const candidate of candidates) {
      if (candidate.dir !== 'H') continue;
      for (const cell of candidate.cells) {
        if (!cell.isNew) continue;
        const crossWord = deriveCrossWord(board, cell.row, cell.col, cell.letter, 'H');
        if (crossWord && crossWord.length >= 2) {
          expect(wordSet.has(crossWord)).toBe(true);
        }
      }
    }
  });
});

describe('generateRawCandidates — differential test against an independent brute-force oracle', () => {
  it('matches the oracle on a small fixed-dictionary board scenario', () => {
    const board = createEmptyBoard();
    board.set(`${CENTER.row}:${CENTER.col}`, { letter: 'К', isBlank: false, player: 'me', moveIndex: 0 });
    const rackCounts = { О: 1, Т: 1, С: 1, Н: 1 };

    const fromGenerator = generateRawCandidates(board, rackCounts, 0, trie)
      .map((c) => `${c.dir}|${c.start.row}:${c.start.col}|${c.word}`)
      .sort();
    const fromOracle = bruteForceCandidates(board, rackCounts, dict)
      .map((c) => `${c.dir}|${c.start.row}:${c.start.col}|${c.word}`)
      .sort();

    expect(fromGenerator).toEqual(fromOracle);
  });

  it('matches the oracle on an empty board (first-move scenario)', () => {
    const board = createEmptyBoard();
    const rackCounts = { К: 1, О: 1, Т: 1, С: 1, Н: 1 };

    const fromGenerator = generateRawCandidates(board, rackCounts, 0, trie)
      .map((c) => `${c.dir}|${c.start.row}:${c.start.col}|${c.word}`)
      .sort();
    const fromOracle = bruteForceCandidates(board, rackCounts, dict)
      .map((c) => `${c.dir}|${c.start.row}:${c.start.col}|${c.word}`)
      .sort();

    expect(fromGenerator).toEqual(fromOracle);
  });
});

// --- Independent brute-force oracle, deliberately written without reusing any engine/* code ---

function step(pos: Pos, dir: Direction, amount: number): Pos {
  return dir === 'H' ? { row: pos.row, col: pos.col + amount } : { row: pos.row + amount, col: pos.col };
}

function inBounds(pos: Pos): boolean {
  return pos.row >= 1 && pos.row <= BOARD_SIZE && pos.col >= 1 && pos.col <= BOARD_SIZE;
}

function deriveCrossWord(board: Board, row: number, col: number, newLetter: string, mainDir: Direction): string | null {
  const crossDir: Direction = mainDir === 'H' ? 'V' : 'H';
  let start: Pos = { row, col };
  while (true) {
    const prev = step(start, crossDir, -1);
    if (!inBounds(prev) || !getTile(board, prev)) break;
    start = prev;
  }
  const letters: string[] = [];
  let cur: Pos = start;
  while (inBounds(cur)) {
    if (cur.row === row && cur.col === col) {
      letters.push(newLetter);
    } else {
      const tile = getTile(board, cur);
      if (!tile) break;
      letters.push(tile.letter);
    }
    const next = step(cur, crossDir, 1);
    const nextIsTarget = next.row === row && next.col === col;
    if (!inBounds(next)) break;
    if (!nextIsTarget && !getTile(board, next)) break;
    cur = next;
  }
  return letters.length >= 2 ? letters.join('') : null;
}

interface OracleCandidate {
  dir: Direction;
  start: Pos;
  word: string;
}

function bruteForceCandidates(board: Board, rackCounts: Record<string, number>, dictionary: LoadedDictionary): OracleCandidate[] {
  const found: OracleCandidate[] = [];
  const isEmpty = board.size === 0;

  for (const dir of ['H', 'V'] as Direction[]) {
    for (let row = 1; row <= BOARD_SIZE; row++) {
      for (let col = 1; col <= BOARD_SIZE; col++) {
        const start: Pos = { row, col };
        for (let length = 2; length <= 7; length++) {
          const cellsPos: Pos[] = [];
          let ok = true;
          for (let i = 0; i < length; i++) {
            const p = step(start, dir, i);
            if (!inBounds(p)) {
              ok = false;
              break;
            }
            cellsPos.push(p);
          }
          if (!ok) continue;

          const before = step(start, dir, -1);
          if (inBounds(before) && getTile(board, before)) continue;
          const after = step(start, dir, length);
          if (inBounds(after) && getTile(board, after)) continue;

          const candidateWords = dictionary.byLength.get(length);
          if (!candidateWords) continue;

          for (const word of candidateWords) {
            const rackNeeded: Record<string, number> = {};
            let hasNewTile = false;
            let matches = true;
            let touchesExisting = false;

            for (let i = 0; i < length; i++) {
              const pos = cellsPos[i];
              const letter = word[i];
              const tile = getTile(board, pos);
              if (tile) {
                if (tile.letter !== letter) {
                  matches = false;
                  break;
                }
                touchesExisting = true;
              } else {
                hasNewTile = true;
                rackNeeded[letter] = (rackNeeded[letter] ?? 0) + 1;
              }
            }
            if (!matches || !hasNewTile) continue;

            let rackSufficient = true;
            for (const letter of Object.keys(rackNeeded)) {
              if ((rackCounts[letter] ?? 0) < rackNeeded[letter]) {
                rackSufficient = false;
                break;
              }
            }
            if (!rackSufficient) continue;

            const includesCenter = cellsPos.some((p) => p.row === CENTER.row && p.col === CENTER.col);
            if (isEmpty && !includesCenter) continue;

            if (!isEmpty && !touchesExisting) {
              // Must touch perpendicular to at least one new cell.
              const touchesPerpendicular = cellsPos.some((p, i) => {
                const tile = getTile(board, p);
                if (tile) return false;
                const crossWord = deriveCrossWord(board, p.row, p.col, word[i], dir);
                return crossWord !== null;
              });
              if (!touchesPerpendicular) continue;
            }

            // Every cross word formed must be a real dictionary word.
            let crossWordsOk = true;
            for (let i = 0; i < length; i++) {
              const pos = cellsPos[i];
              if (getTile(board, pos)) continue;
              const crossWord = deriveCrossWord(board, pos.row, pos.col, word[i], dir);
              if (crossWord && !dictionary.words.includes(crossWord)) {
                crossWordsOk = false;
                break;
              }
            }
            if (!crossWordsOk) continue;

            found.push({ dir, start, word });
          }
        }
      }
    }
  }

  return found;
}
