import { create } from 'zustand';
import type { Board, Direction, MoveRecord, PlacedLetter, Player, Pos } from '../game/types';
import { createEmptyBoard, posKey } from '../game/board';
import { BOARD_LAYOUTS, type LayoutKey } from '../game/board-layouts';
import { scoreMove } from '../game/scoring';
import { computeMoveMultiplierStats } from '../game/multiplier-stats';
import { computeBagState } from '../game/bag';
import { parseRackInput } from '../game/rack-utils';
import { loadDictionaryInWorker } from '../workers/game-engine-client';

export type DictStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface GhostTile {
  letter: string;
  isBlank: boolean;
  player: Player;
}

export type GhostMap = Map<string, GhostTile>;

export interface CommitMoveInput {
  player: Player;
  dir: Direction;
  start: Pos;
  word: string;
  cells: PlacedLetter[];
}

interface GameState {
  layoutKey: LayoutKey;

  dictStatus: DictStatus;
  dictSize: number;
  dictError: string | null;

  board: Board;
  history: MoveRecord[];
  oppHandCount: number;
  rackInput: string;

  activePlayer: Player;
  dir: Direction;
  startCell: Pos | null;
  pickingStart: boolean;
  wordInput: string;

  activeTab: string;
  ghostMap: GhostMap | null;

  loadDictionary: () => Promise<void>;
  setLayoutKey: (key: LayoutKey) => void;
  setRackInput: (text: string) => void;
  setActivePlayer: (player: Player) => void;
  setDir: (dir: Direction) => void;
  setStartCell: (pos: Pos | null) => void;
  setPickingStart: (value: boolean) => void;
  setWordInput: (text: string) => void;
  setActiveTab: (tab: string) => void;
  setGhostMap: (map: GhostMap | null) => void;
  setOppHandCount: (count: number) => void;

  commitMove: (input: CommitMoveInput) => void;
  undo: () => void;
  exchangeLetter: (index: number, newLetter: string) => void;
}

function removeOneOccurrence(letters: string[], target: string): void {
  const index = letters.indexOf(target);
  if (index !== -1) letters.splice(index, 1);
}

export const useGameStore = create<GameState>((set, get) => ({
  layoutKey: 'classic',

  dictStatus: 'idle',
  dictSize: 0,
  dictError: null,

  board: createEmptyBoard(),
  history: [],
  oppHandCount: 7,
  rackInput: '',

  activePlayer: 'opp',
  dir: 'H',
  startCell: null,
  pickingStart: false,
  wordInput: '',

  activeTab: 'move',
  ghostMap: null,

  loadDictionary: async () => {
    if (get().dictStatus === 'loading' || get().dictStatus === 'ready') return;
    set({ dictStatus: 'loading', dictError: null });
    try {
      const dictSize = await loadDictionaryInWorker();
      set({ dictStatus: 'ready', dictSize });
    } catch (err) {
      set({ dictStatus: 'error', dictError: err instanceof Error ? err.message : String(err) });
    }
  },

  setLayoutKey: (layoutKey) => set({ layoutKey }),
  setRackInput: (rackInput) => set({ rackInput }),
  setActivePlayer: (activePlayer) => set({ activePlayer }),
  setDir: (dir) => set({ dir }),
  setStartCell: (startCell) => set({ startCell }),
  setPickingStart: (pickingStart) => set({ pickingStart }),
  setWordInput: (wordInput) => set({ wordInput }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setGhostMap: (ghostMap) => set({ ghostMap }),
  setOppHandCount: (oppHandCount) => set({ oppHandCount }),

  commitMove: (input) => {
    const state = get();
    const layout = BOARD_LAYOUTS[state.layoutKey];
    const score = scoreMove(state.board, input.cells, input.dir, layout);
    const multiplierStats = computeMoveMultiplierStats(state.board, input.cells, input.dir, layout);

    const moveIndex = state.history.length;
    const nextBoard: Board = new Map(state.board);
    for (const cell of input.cells) {
      if (!cell.isNew) continue;
      nextBoard.set(posKey(cell), { letter: cell.letter, isBlank: cell.isBlank, player: input.player, moveIndex });
    }

    const rackBeforeMove = state.rackInput;
    let nextRackInput = state.rackInput;
    let nextOppHandCount = state.oppHandCount;

    if (input.player === 'me') {
      const rackLetters = parseRackInput(state.rackInput);
      for (const cell of input.cells) {
        if (!cell.isNew) continue;
        removeOneOccurrence(rackLetters, cell.isBlank ? '*' : cell.letter);
      }
      nextRackInput = rackLetters.join('');
    } else {
      const tilesPlaced = input.cells.filter((c) => c.isNew).length;
      const bag = computeBagState(state.board, parseRackInput(state.rackInput), [], state.oppHandCount);
      const drawn = Math.min(tilesPlaced, bag.bagOnlyEstimate);
      nextOppHandCount = Math.max(0, state.oppHandCount - tilesPlaced + drawn);
    }

    const record: MoveRecord = {
      index: moveIndex,
      player: input.player,
      word: input.word,
      dir: input.dir,
      start: input.start,
      cells: input.cells,
      score,
      multiplierStats,
      rackBeforeMove,
      prevOpponentHandCount: state.oppHandCount,
    };

    set({
      board: nextBoard,
      history: [...state.history, record],
      rackInput: nextRackInput,
      oppHandCount: nextOppHandCount,
      activePlayer: input.player === 'me' ? 'opp' : 'me',
      wordInput: '',
      startCell: null,
      ghostMap: null,
    });
  },

  undo: () => {
    const state = get();
    if (state.history.length === 0) return;
    const last = state.history[state.history.length - 1];

    const nextBoard: Board = new Map(state.board);
    for (const cell of last.cells) {
      if (cell.isNew) nextBoard.delete(posKey(cell));
    }

    set({
      board: nextBoard,
      history: state.history.slice(0, -1),
      oppHandCount: last.prevOpponentHandCount,
      rackInput: last.player === 'me' ? last.rackBeforeMove : state.rackInput,
      activePlayer: last.player,
    });
  },

  exchangeLetter: (index, newLetter) => {
    const rackLetters = parseRackInput(get().rackInput);
    if (index < 0 || index >= rackLetters.length) return;
    rackLetters[index] = newLetter;
    set({ rackInput: rackLetters.join('') });
  },
}));
