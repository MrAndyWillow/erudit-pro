import type { Board, MoveRecord, Player } from '../game/types';
import { computeBagState, type BagState } from '../game/bag';
import { parseRackInput } from '../game/rack-utils';

export function selectBagState(board: Board, rackInput: string, oppHandCount: number): BagState {
  return computeBagState(board, parseRackInput(rackInput), [], oppHandCount);
}

export function selectPlayerTotal(history: MoveRecord[], player: Player): number {
  return history.filter((move) => move.player === player).reduce((sum, move) => sum + move.score.total, 0);
}

export interface MultiplierAchievement {
  moveIndex: number;
  word: string;
  effectiveWordFactor: number;
}

export interface PlayerMultiplierTotals {
  letterX2Count: number;
  letterX2Points: number;
  letterX3Count: number;
  letterX3Points: number;
  wordX2Count: number;
  wordX3Count: number;
  achievements: MultiplierAchievement[];
}

function emptyMultiplierTotals(): PlayerMultiplierTotals {
  return {
    letterX2Count: 0,
    letterX2Points: 0,
    letterX3Count: 0,
    letterX3Points: 0,
    wordX2Count: 0,
    wordX3Count: 0,
    achievements: [],
  };
}

export function selectPlayerMultiplierTotals(history: MoveRecord[], player: Player): PlayerMultiplierTotals {
  const totals = emptyMultiplierTotals();
  for (const move of history) {
    if (move.player !== player) continue;
    const stats = move.multiplierStats;
    totals.letterX2Count += stats.letterX2Count;
    totals.letterX2Points += stats.letterX2Points;
    totals.letterX3Count += stats.letterX3Count;
    totals.letterX3Points += stats.letterX3Points;
    totals.wordX2Count += stats.wordX2Count;
    totals.wordX3Count += stats.wordX3Count;
    if (stats.doubleWordMultHit) {
      totals.achievements.push({ moveIndex: move.index, word: move.word, effectiveWordFactor: stats.effectiveWordFactor });
    }
  }
  return totals;
}
