import type { Pos } from './types';
import { JOKER_LETTER, RACK_SIZE } from './constants';

export function parseRackInput(raw: string): string[] {
  const cleaned = raw.toUpperCase().replace(/Ё/g, 'Е');
  const letters: string[] = [];
  for (const ch of cleaned) {
    if (ch === JOKER_LETTER || /[А-Я]/.test(ch)) letters.push(ch);
  }
  return letters.slice(0, RACK_SIZE);
}

export interface TileSlot extends Pos {
  letter: string;
}

export interface TileAssignment {
  /** keyed by "row:col" */
  isBlankAt: Map<string, boolean>;
  jokersUsed: number;
  feasible: boolean;
}

/**
 * Given a set of board slots that must receive specific letters, decides which
 * slots are filled by real rack tiles and which need a joker — spends real
 * tiles first, and among several slots wanting the same letter, prefers giving
 * the real tile to whichever cell scores the most (so a joker, worth 0 points,
 * doesn't end up wasted on a premium square a real tile could have used).
 */
export function assignRackToSlots(
  slots: TileSlot[],
  rackCounts: Record<string, number>,
  jokersAvailable: number,
  cellWeight: (slot: TileSlot) => number,
): TileAssignment {
  const byLetter = new Map<string, TileSlot[]>();
  for (const slot of slots) {
    const list = byLetter.get(slot.letter) ?? [];
    list.push(slot);
    byLetter.set(slot.letter, list);
  }

  const remainingRack = { ...rackCounts };
  let jokersLeft = jokersAvailable;
  const isBlankAt = new Map<string, boolean>();

  for (const [letter, list] of byLetter) {
    const sorted = [...list].sort((a, b) => cellWeight(b) - cellWeight(a));
    const haveReal = remainingRack[letter] ?? 0;
    sorted.forEach((slot, index) => {
      const key = `${slot.row}:${slot.col}`;
      if (index < haveReal) {
        isBlankAt.set(key, false);
      } else {
        isBlankAt.set(key, true);
        jokersLeft--;
      }
    });
    remainingRack[letter] = Math.max(0, haveReal - sorted.length);
  }

  return { isBlankAt, jokersUsed: jokersAvailable - jokersLeft, feasible: jokersLeft >= 0 };
}

export function countRackDeficit(required: Record<string, number>, rackCounts: Record<string, number>): number {
  let deficit = 0;
  for (const letter of Object.keys(required)) {
    const have = rackCounts[letter] ?? 0;
    if (required[letter] > have) deficit += required[letter] - have;
  }
  return deficit;
}
