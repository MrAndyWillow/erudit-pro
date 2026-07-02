import type { Board } from './types';
import { ALPHABET, BAG_INITIAL, JOKER_COUNT_INITIAL, JOKER_LETTER } from './constants';

export interface RackTally {
  counts: Record<string, number>;
  jokers: number;
}

export function tallyRack(rack: string[]): RackTally {
  const counts: Record<string, number> = {};
  let jokers = 0;
  for (const letter of rack) {
    if (letter === JOKER_LETTER) jokers++;
    else counts[letter] = (counts[letter] ?? 0) + 1;
  }
  return { counts, jokers };
}

export interface BagState {
  /** Letters whose location (still in the bag vs. in the opponent's hand) is unknown. */
  unknownPerLetter: Record<string, number>;
  unknownJokers: number;
  unknownTotal: number;
  opponentHandCount: number;
  /** Best estimate of what's left in the physical bag, given the opponent's hand size. */
  bagOnlyEstimate: number;
}

/**
 * Tracks the "known" pool (tiles on the board + my rack + tiles I've exchanged away)
 * against the initial bag composition, to estimate what remains unseen. The
 * unseen pool covers both the bag and the opponent's hand, since a tile the
 * opponent plays (including any joker they used) only becomes "known" once it
 * lands on the board.
 */
export function computeBagState(
  board: Board,
  myRack: string[],
  exchangedAwayLetters: string[],
  opponentHandCount: number,
): BagState {
  const onBoard: Record<string, number> = {};
  let jokersOnBoard = 0;
  for (const tile of board.values()) {
    if (tile.isBlank) jokersOnBoard++;
    else onBoard[tile.letter] = (onBoard[tile.letter] ?? 0) + 1;
  }

  const inRack = tallyRack(myRack);
  const exchanged = tallyRack(exchangedAwayLetters);

  const unknownPerLetter: Record<string, number> = {};
  for (const letter of ALPHABET) {
    const used = (onBoard[letter] ?? 0) + (inRack.counts[letter] ?? 0) + (exchanged.counts[letter] ?? 0);
    unknownPerLetter[letter] = Math.max(0, (BAG_INITIAL[letter] ?? 0) - used);
  }
  const unknownJokers = Math.max(0, JOKER_COUNT_INITIAL - jokersOnBoard - inRack.jokers - exchanged.jokers);

  const unknownTotal = Object.values(unknownPerLetter).reduce((sum, count) => sum + count, 0) + unknownJokers;
  const bagOnlyEstimate = Math.max(0, unknownTotal - opponentHandCount);

  return { unknownPerLetter, unknownJokers, unknownTotal, opponentHandCount, bagOnlyEstimate };
}
