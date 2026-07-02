import { describe, expect, it } from 'vitest';
import { computeBagState } from '@/game/bag';
import { createEmptyBoard } from '@/game/board';
import { BAG_INITIAL, JOKER_COUNT_INITIAL } from '@/game/constants';

describe('computeBagState', () => {
  it('starts with the full initial bag when nothing has been played', () => {
    const state = computeBagState(createEmptyBoard(), [], [], 0);
    expect(state.unknownPerLetter['А']).toBe(BAG_INITIAL['А']);
    expect(state.unknownJokers).toBe(JOKER_COUNT_INITIAL);
    expect(state.bagOnlyEstimate).toBe(state.unknownTotal);
  });

  it('subtracts board tiles, rack tiles, and exchanged tiles from the unknown pool', () => {
    const board = createEmptyBoard();
    board.set('8:8', { letter: 'А', isBlank: false, player: 'me', moveIndex: 0 });
    board.set('8:9', { letter: 'А', isBlank: false, player: 'opp', moveIndex: 0 });
    const myRack = ['А', 'Б'];
    const exchangedAway = ['А'];

    const state = computeBagState(board, myRack, exchangedAway, 7);
    // 10 total А tiles - 2 on board - 1 in rack - 1 exchanged = 6 unaccounted for.
    expect(state.unknownPerLetter['А']).toBe(BAG_INITIAL['А'] - 4);
    expect(state.unknownPerLetter['Б']).toBe(BAG_INITIAL['Б'] - 1);
  });

  it('tracks jokers separately from lettered tiles', () => {
    const board = createEmptyBoard();
    board.set('8:8', { letter: 'Х', isBlank: true, player: 'me', moveIndex: 0 });
    const state = computeBagState(board, ['*'], [], 6);
    expect(state.unknownJokers).toBe(JOKER_COUNT_INITIAL - 2);
  });

  it('never lets bagOnlyEstimate go negative when the opponent hand count exceeds the unknown pool', () => {
    const state = computeBagState(createEmptyBoard(), [], [], 9999);
    expect(state.bagOnlyEstimate).toBe(0);
  });

  it('never lets a per-letter unknown count go negative even if more copies are "used" than exist', () => {
    // Contrived: rack claims 99 А tiles, far more than the bag ever had.
    const rack = Array(99).fill('А');
    const state = computeBagState(createEmptyBoard(), rack, [], 0);
    expect(state.unknownPerLetter['А']).toBe(0);
  });
});
