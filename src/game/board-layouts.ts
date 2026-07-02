import type { BoardLayout, PremiumType, Pos } from './types';

interface LayoutSpec {
  name: string;
  W3: Pos[];
  W2: Pos[];
  L3: Pos[];
  L2: Pos[];
}

function posKeyStatic(p: Pos): string {
  return `${p.row}:${p.col}`;
}

function buildLayout(spec: LayoutSpec): BoardLayout {
  const premiumAt = new Map<string, PremiumType>();
  const mark = (cells: Pos[], type: PremiumType) => {
    for (const cell of cells) premiumAt.set(posKeyStatic(cell), type);
  };
  mark(spec.W3, 'W3');
  mark(spec.W2, 'W2');
  mark(spec.L3, 'L3');
  mark(spec.L2, 'L2');
  return { name: spec.name, premiumAt };
}

const CLASSIC_SPEC: LayoutSpec = {
  name: 'Основная доска',
  W3: [
    { row: 1, col: 1 }, { row: 1, col: 8 }, { row: 1, col: 15 },
    { row: 8, col: 1 }, { row: 8, col: 15 },
    { row: 15, col: 1 }, { row: 15, col: 8 }, { row: 15, col: 15 },
  ],
  W2: [
    { row: 2, col: 6 }, { row: 2, col: 10 },
    { row: 6, col: 2 }, { row: 6, col: 14 },
    { row: 10, col: 2 }, { row: 10, col: 14 },
    { row: 14, col: 6 }, { row: 14, col: 10 },
  ],
  L3: [
    { row: 2, col: 2 }, { row: 2, col: 14 },
    { row: 3, col: 3 }, { row: 3, col: 13 },
    { row: 4, col: 4 }, { row: 4, col: 12 },
    { row: 5, col: 5 }, { row: 5, col: 11 },
    { row: 11, col: 5 }, { row: 11, col: 11 },
    { row: 12, col: 4 }, { row: 12, col: 12 },
    { row: 13, col: 3 }, { row: 13, col: 13 },
    { row: 14, col: 2 }, { row: 14, col: 14 },
  ],
  L2: [
    { row: 1, col: 4 }, { row: 1, col: 12 },
    { row: 3, col: 7 }, { row: 3, col: 9 },
    { row: 4, col: 1 }, { row: 4, col: 8 }, { row: 4, col: 15 },
    { row: 7, col: 3 }, { row: 7, col: 7 }, { row: 7, col: 9 }, { row: 7, col: 13 },
    { row: 8, col: 4 }, { row: 8, col: 12 },
    { row: 9, col: 3 }, { row: 9, col: 7 }, { row: 9, col: 9 }, { row: 9, col: 13 },
    { row: 12, col: 1 }, { row: 12, col: 8 }, { row: 12, col: 15 },
    { row: 13, col: 7 }, { row: 13, col: 9 },
    { row: 15, col: 4 }, { row: 15, col: 12 },
  ],
};

const ALT_SPEC: LayoutSpec = {
  name: 'Альтернативная доска',
  W3: [
    { row: 1, col: 4 }, { row: 1, col: 12 },
    { row: 4, col: 1 }, { row: 4, col: 15 },
    { row: 12, col: 1 }, { row: 12, col: 15 },
    { row: 15, col: 4 }, { row: 15, col: 12 },
  ],
  L3: [
    { row: 1, col: 7 }, { row: 1, col: 9 },
    { row: 4, col: 4 }, { row: 4, col: 12 },
    { row: 6, col: 6 }, { row: 6, col: 10 },
    { row: 7, col: 1 }, { row: 7, col: 15 },
    { row: 9, col: 1 }, { row: 9, col: 15 },
    { row: 10, col: 6 }, { row: 10, col: 10 },
    { row: 12, col: 4 }, { row: 12, col: 12 },
    { row: 15, col: 7 }, { row: 15, col: 9 },
  ],
  W2: [
    { row: 2, col: 6 }, { row: 2, col: 10 },
    { row: 4, col: 8 },
    { row: 6, col: 2 }, { row: 6, col: 14 },
    { row: 8, col: 4 }, { row: 8, col: 12 },
    { row: 10, col: 2 }, { row: 10, col: 14 },
    { row: 12, col: 8 },
    { row: 14, col: 6 }, { row: 14, col: 10 },
  ],
  L2: [
    { row: 2, col: 3 }, { row: 2, col: 13 },
    { row: 3, col: 2 }, { row: 3, col: 5 }, { row: 3, col: 11 }, { row: 3, col: 14 },
    { row: 5, col: 3 }, { row: 5, col: 7 }, { row: 5, col: 9 }, { row: 5, col: 13 },
    { row: 7, col: 5 }, { row: 7, col: 11 },
    { row: 9, col: 5 }, { row: 9, col: 11 },
    { row: 11, col: 3 }, { row: 11, col: 7 }, { row: 11, col: 9 }, { row: 11, col: 13 },
    { row: 13, col: 2 }, { row: 13, col: 5 }, { row: 13, col: 11 }, { row: 13, col: 14 },
    { row: 14, col: 3 }, { row: 14, col: 13 },
  ],
};

export const BOARD_LAYOUTS = {
  classic: buildLayout(CLASSIC_SPEC),
  alt: buildLayout(ALT_SPEC),
} as const;

export type LayoutKey = keyof typeof BOARD_LAYOUTS;
