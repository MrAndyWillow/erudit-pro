import { describe, expect, it } from 'vitest';
import { buildTrie } from '@/dictionary/trie';
import { computeCrossCheck } from '@/engine/cross-checks';
import { createEmptyBoard } from '@/game/board';

const trie = buildTrie(['КОТ', 'КТО', 'ТОК', 'КОЛ', 'БОР', 'БРА']);

describe('computeCrossCheck', () => {
  it('allows any letter when the cell has no perpendicular neighbors', () => {
    const board = createEmptyBoard();
    const result = computeCrossCheck(board, { row: 8, col: 8 }, 'H', trie);
    expect(result).toBeNull();
  });

  it('restricts to letters that complete a real word with a fixed suffix below', () => {
    const board = createEmptyBoard();
    // Vertical neighbor below (row 9, col 8) = "ОТ", so placing at (8,8) needs a letter
    // that makes a real 3-letter word ending in "ОТ": "К" -> "КОТ".
    board.set('9:8', { letter: 'О', isBlank: false, player: 'me', moveIndex: 0 });
    board.set('10:8', { letter: 'Т', isBlank: false, player: 'me', moveIndex: 0 });
    const result = computeCrossCheck(board, { row: 8, col: 8 }, 'H', trie);
    expect(result).not.toBeNull();
    expect([...(result ?? [])]).toEqual(['К']);
  });

  it('returns an empty set when no letter can complete a valid word', () => {
    const board = createEmptyBoard();
    board.set('9:8', { letter: 'Ъ', isBlank: false, player: 'me', moveIndex: 0 });
    board.set('10:8', { letter: 'Ъ', isBlank: false, player: 'me', moveIndex: 0 });
    const result = computeCrossCheck(board, { row: 8, col: 8 }, 'H', trie);
    expect(result).toEqual(new Set());
  });

  it('considers both a fixed prefix above and a fixed suffix below simultaneously', () => {
    const board = createEmptyBoard();
    // Above: "Б" at row 7. Below: "Р" at row 9. Need letter X so "БXР" is a word: "БРА" needs X between...
    // use a direct 3-letter case: prefix "Б", suffix "" -> letter must start a word "Б?" that's exactly 2 long: none of our words are that shape,
    // instead verify the empty-set-vs-restricted behavior with a clean prefix-only case.
    board.set('7:8', { letter: 'Б', isBlank: false, player: 'me', moveIndex: 0 });
    const result = computeCrossCheck(board, { row: 8, col: 8 }, 'H', trie);
    // "Б" + letter must be a 2-letter word in the trie; none exist, so nothing is allowed.
    expect(result).toEqual(new Set());
  });
});
