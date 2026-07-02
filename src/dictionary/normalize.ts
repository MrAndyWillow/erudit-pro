/** Folds ё/Ё to е/Е — the game and this app always treat them as the same letter. */
export function foldYo(text: string): string {
  return text.replace(/Ё/g, 'Е').replace(/ё/g, 'е');
}

export function normalizeWord(raw: string): string {
  return foldYo(raw.trim().toUpperCase());
}

const CYRILLIC_WORD_PATTERN = /^[А-Я]+$/;

export function isPlausibleDictionaryWord(word: string): boolean {
  return word.length >= 2 && word.length <= 15 && CYRILLIC_WORD_PATTERN.test(word);
}
