export type Direction = 'H' | 'V';
export type Player = 'me' | 'opp';
export type PremiumType = 'W2' | 'W3' | 'L2' | 'L3';

export interface Pos {
  row: number; // 1-15
  col: number; // 1-15
}

export interface BoardTile {
  letter: string;
  isBlank: boolean;
  player: Player;
  moveIndex: number;
}

export type Board = Map<string, BoardTile>;

export interface BoardLayout {
  name: string;
  premiumAt: Map<string, PremiumType>;
}

export interface PlacedLetter extends Pos {
  letter: string;
  isBlank: boolean;
  isNew: boolean;
}

export interface ScoreBreakdown {
  mainWordScore: number;
  crossWords: { word: string; score: number }[];
  crossWordsScore: number;
  bingo: boolean;
  total: number;
}

export interface MoveMultiplierStats {
  letterX2Count: number;
  letterX2Points: number;
  letterX3Count: number;
  letterX3Points: number;
  wordX2Count: number;
  wordX3Count: number;
  doubleWordMultHit: boolean;
  effectiveWordFactor: number;
}

export interface MoveRecord {
  index: number;
  player: Player;
  word: string;
  dir: Direction;
  start: Pos;
  cells: PlacedLetter[];
  score: ScoreBreakdown;
  multiplierStats: MoveMultiplierStats;
  exchangedTiles: string[];
  prevOpponentHandCount: number;
}
