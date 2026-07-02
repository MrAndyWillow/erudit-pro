import { isPlausibleDictionaryWord, normalizeWord } from './normalize';

export const DICTIONARY_URL = './russian_words_nouns.txt';

/** Words shorter than this don't count toward the corner-strategy "hard start letter" heuristic. */
const SHORT_WORD_MAX_LENGTH = 8;

export interface LoadedDictionary {
  words: string[];
  byLength: Map<number, string[]>;
  /** Count of short (< SHORT_WORD_MAX_LENGTH letters) words starting with each letter. */
  startLetterCount: Map<string, number>;
}

export function parseDictionaryText(text: string): LoadedDictionary {
  const seen = new Set<string>();
  const words: string[] = [];
  const byLength = new Map<number, string[]>();
  const startLetterCount = new Map<string, number>();

  for (const rawLine of text.split(/\r?\n/)) {
    const word = normalizeWord(rawLine);
    if (!isPlausibleDictionaryWord(word)) continue;
    if (seen.has(word)) continue;
    seen.add(word);
    words.push(word);

    const bucket = byLength.get(word.length);
    if (bucket) bucket.push(word);
    else byLength.set(word.length, [word]);

    if (word.length < SHORT_WORD_MAX_LENGTH) {
      const firstLetter = word[0];
      startLetterCount.set(firstLetter, (startLetterCount.get(firstLetter) ?? 0) + 1);
    }
  }

  return { words, byLength, startLetterCount };
}

export async function fetchDictionaryText(url: string = DICTIONARY_URL): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Не удалось загрузить словарь (HTTP ${response.status})`);
  }
  return response.text();
}

export async function loadDictionary(url?: string): Promise<LoadedDictionary> {
  const text = await fetchDictionaryText(url);
  return parseDictionaryText(text);
}
