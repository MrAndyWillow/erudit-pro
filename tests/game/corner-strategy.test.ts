import { describe, expect, it } from 'vitest';
import { assessCornerPlacement, computeHardStartLetters } from '@/game/corner-strategy';
import type { BoardLayout, PlacedLetter } from '@/game/types';

const layout: BoardLayout = {
  name: 'test',
  premiumAt: new Map([
    ['1:1', 'W3'],
    ['1:2', 'L3'],
    ['1:3', 'W2'],
  ]),
};

describe('computeHardStartLetters', () => {
  it('always includes the seeded hard-to-start letters', () => {
    const hard = computeHardStartLetters(['Ь', 'А'], null);
    expect(hard.has('Ь')).toBe(true);
  });

  it('adds letters with few short dictionary words starting with them', () => {
    const freq = new Map([
      ['А', 500],
      ['Щ', 2],
    ]);
    const hard = computeHardStartLetters(['А', 'Щ'], freq);
    expect(hard.has('А')).toBe(false);
    expect(hard.has('Щ')).toBe(true);
  });
});

describe('assessCornerPlacement', () => {
  const hardStartLetters = new Set(['Ь']);

  it('rewards a hard-start letter landing on an x3-word cell', () => {
    const cells: PlacedLetter[] = [{ row: 1, col: 1, letter: 'Ь', isBlank: false, isNew: true }];
    const result = assessCornerPlacement(cells, layout, hardStartLetters);
    expect(result.delta).toBeGreaterThan(0);
  });

  it('penalizes an easy-start letter landing on an x3-word cell', () => {
    const cells: PlacedLetter[] = [{ row: 1, col: 1, letter: 'А', isBlank: false, isNew: true }];
    const result = assessCornerPlacement(cells, layout, hardStartLetters);
    expect(result.delta).toBeLessThan(0);
  });

  it('ignores non-x3-word premium cells entirely, even for easy-start letters', () => {
    const cells: PlacedLetter[] = [
      { row: 1, col: 2, letter: 'А', isBlank: false, isNew: true }, // L3
      { row: 1, col: 3, letter: 'А', isBlank: false, isNew: true }, // W2
    ];
    const result = assessCornerPlacement(cells, layout, hardStartLetters);
    expect(result.delta).toBe(0);
    expect(result.messages).toHaveLength(0);
  });

  it('ignores tiles that were already on the board (not newly placed)', () => {
    const cells: PlacedLetter[] = [{ row: 1, col: 1, letter: 'А', isBlank: false, isNew: false }];
    const result = assessCornerPlacement(cells, layout, hardStartLetters);
    expect(result.delta).toBe(0);
  });
});
