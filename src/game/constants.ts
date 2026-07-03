import type { Pos } from './types';

export const BOARD_SIZE = 15;
export const RACK_SIZE = 7;
export const BINGO_BONUS = 15;
export const JOKER_LETTER = '*';
export const JOKER_COUNT_INITIAL = 4;
export const CENTER: Pos = { row: 8, col: 8 };

// Column labels for display only (matches the Cyrillic header row used on the
// physical board); internal logic works purely in numeric row/col.
export const COLUMN_LABELS = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З', 'И', 'К', 'Л', 'М', 'Н', 'О', 'П'];

export const LETTER_VALUES: Record<string, number> = {
  А: 1, И: 1, Н: 1, О: 1,
  В: 2, Г: 2, Е: 2, К: 2, Л: 2, М: 2, П: 2, Р: 2, С: 2, Т: 2,
  Б: 3, Д: 3, У: 3, Я: 3,
  Ж: 5, З: 5, Й: 5, Х: 5, Ч: 5, Ы: 5, Ь: 5,
  Ф: 8, Ц: 8, Ш: 8, Щ: 8, Ю: 8,
  Э: 10,
  Ъ: 15,
};

export const BAG_INITIAL: Record<string, number> = {
  А: 10, Б: 3, В: 5, Г: 3, Д: 5, Е: 9, Ж: 1, З: 2, И: 9, Й: 2, К: 6, Л: 5, М: 4, Н: 8, О: 10,
  П: 5, Р: 6, С: 6, Т: 6, У: 3, Ф: 1, Х: 1, Ц: 1, Ч: 2, Ш: 1, Щ: 1, Ъ: 1, Ы: 1, Ь: 2, Э: 1, Ю: 1, Я: 2,
};

export const ALPHABET = Object.keys(LETTER_VALUES);

// True Russian alphabetical order (е/ё merged) — for keyboard layouts and any
// other UI that lists letters; ALPHABET above follows LETTER_VALUES' point-value
// grouping instead, which reads oddly as a keyboard.
export const ALPHABET_ORDERED = [
  'А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З', 'И', 'Й', 'К', 'Л', 'М', 'Н', 'О', 'П',
  'Р', 'С', 'Т', 'У', 'Ф', 'Х', 'Ц', 'Ч', 'Ш', 'Щ', 'Ъ', 'Ы', 'Ь', 'Э', 'Ю', 'Я',
];

export const TOTAL_TILES_INITIAL =
  Object.values(BAG_INITIAL).reduce((sum, count) => sum + count, 0) + JOKER_COUNT_INITIAL;
