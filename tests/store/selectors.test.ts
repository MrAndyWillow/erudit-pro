import { describe, expect, it } from 'vitest';
import { selectPlayerMultiplierTotals, selectPlayerTotal } from '@/store/selectors';
import type { MoveRecord } from '@/game/types';

function makeMove(overrides: Partial<MoveRecord>): MoveRecord {
  return {
    index: 0,
    player: 'me',
    word: 'ТЕСТ',
    dir: 'H',
    start: { row: 8, col: 8 },
    cells: [],
    score: { mainWordScore: 10, crossWords: [], crossWordsScore: 0, bingo: false, total: 10 },
    multiplierStats: {
      letterX2Count: 0,
      letterX2Points: 0,
      letterX3Count: 0,
      letterX3Points: 0,
      wordX2Count: 0,
      wordX3Count: 0,
      doubleWordMultHit: false,
      effectiveWordFactor: 1,
    },
    rackBeforeMove: '',
    prevOpponentHandCount: 7,
    ...overrides,
  };
}

describe('selectPlayerTotal', () => {
  it('sums only the given player\'s move scores', () => {
    const history = [
      makeMove({ player: 'me', score: { mainWordScore: 10, crossWords: [], crossWordsScore: 0, bingo: false, total: 10 } }),
      makeMove({ player: 'opp', score: { mainWordScore: 20, crossWords: [], crossWordsScore: 0, bingo: false, total: 20 } }),
      makeMove({ player: 'me', score: { mainWordScore: 5, crossWords: [], crossWordsScore: 0, bingo: false, total: 5 } }),
    ];
    expect(selectPlayerTotal(history, 'me')).toBe(15);
    expect(selectPlayerTotal(history, 'opp')).toBe(20);
  });
});

describe('selectPlayerMultiplierTotals', () => {
  it('aggregates multiplier counts/points across a player\'s moves', () => {
    const history = [
      makeMove({
        player: 'me',
        multiplierStats: {
          letterX2Count: 1,
          letterX2Points: 3,
          letterX3Count: 0,
          letterX3Points: 0,
          wordX2Count: 1,
          wordX3Count: 0,
          doubleWordMultHit: false,
          effectiveWordFactor: 2,
        },
      }),
      makeMove({
        player: 'me',
        index: 1,
        word: 'ЗАСЛОН',
        multiplierStats: {
          letterX2Count: 0,
          letterX2Points: 0,
          letterX3Count: 1,
          letterX3Points: 4,
          wordX2Count: 1,
          wordX3Count: 1,
          doubleWordMultHit: true,
          effectiveWordFactor: 5,
        },
      }),
      makeMove({ player: 'opp', index: 2 }),
    ];

    const totals = selectPlayerMultiplierTotals(history, 'me');
    expect(totals.letterX2Count).toBe(1);
    expect(totals.letterX2Points).toBe(3);
    expect(totals.letterX3Count).toBe(1);
    expect(totals.letterX3Points).toBe(4);
    expect(totals.wordX2Count).toBe(2);
    expect(totals.wordX3Count).toBe(1);
    expect(totals.achievements).toEqual([{ moveIndex: 1, word: 'ЗАСЛОН', effectiveWordFactor: 5 }]);
  });

  it('returns an empty summary for a player with no moves', () => {
    const totals = selectPlayerMultiplierTotals([], 'me');
    expect(totals.achievements).toEqual([]);
    expect(totals.letterX2Count).toBe(0);
  });
});
