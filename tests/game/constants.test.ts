import { describe, expect, it } from 'vitest';
import { ALPHABET, ALPHABET_ORDERED, LETTER_VALUES } from '@/game/constants';

describe('ALPHABET_ORDERED', () => {
  it('contains exactly the same 32 letters as ALPHABET, just sorted differently', () => {
    expect(ALPHABET_ORDERED).toHaveLength(32);
    expect(new Set(ALPHABET_ORDERED)).toEqual(new Set(ALPHABET));
  });

  it('gives every letter a known point value', () => {
    for (const letter of ALPHABET_ORDERED) {
      expect(LETTER_VALUES[letter]).toBeGreaterThan(0);
    }
  });
});
