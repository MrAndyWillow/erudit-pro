import { fetchDictionaryText, parseDictionaryText, type LoadedDictionary } from '../dictionary/loader';
import { buildTrie, type TrieNode } from '../dictionary/trie';
import { generateCandidates, type MoveSuggestions } from '../engine/move-generator';
import { computeHardStartLetters } from '../game/corner-strategy';
import { ALPHABET } from '../game/constants';
import { BOARD_LAYOUTS, type LayoutKey } from '../game/board-layouts';
import type { Board } from '../game/types';

export type EngineRequest =
  | { id: number; type: 'load'; url?: string }
  | {
      id: number;
      type: 'generate';
      board: Board;
      rack: string[];
      layoutKey: LayoutKey;
      limit?: number;
      allowExtraJokers?: number;
    };

export type EngineResponse =
  | { id: number; type: 'ready'; dictSize: number }
  | { id: number; type: 'error'; message: string }
  | { id: number; type: 'suggestions'; suggestions: MoveSuggestions };

// Cast away the ambient DOM/WebWorker lib mismatch rather than juggling two
// tsconfigs for one file — `self` here is always a DedicatedWorkerGlobalScope
// at runtime regardless of which lib the type checker has loaded.
const ctx = self as unknown as {
  postMessage: (message: EngineResponse) => void;
  onmessage: ((event: MessageEvent<EngineRequest>) => void) | null;
};

let dict: LoadedDictionary | null = null;
let trie: TrieNode | null = null;
let hardStartLetters: Set<string> | null = null;

ctx.onmessage = async (event: MessageEvent<EngineRequest>) => {
  const request = event.data;
  try {
    if (request.type === 'load') {
      const text = await fetchDictionaryText(request.url);
      dict = parseDictionaryText(text);
      trie = buildTrie(dict.words);
      hardStartLetters = computeHardStartLetters(ALPHABET, dict.startLetterCount);
      ctx.postMessage({ id: request.id, type: 'ready', dictSize: dict.words.length });
      return;
    }

    if (request.type === 'generate') {
      if (!dict || !trie || !hardStartLetters) {
        throw new Error('Словарь ещё не загружен.');
      }
      const layout = BOARD_LAYOUTS[request.layoutKey];
      const suggestions = generateCandidates(request.board, request.rack, trie, layout, hardStartLetters, dict, {
        limit: request.limit,
        allowExtraJokers: request.allowExtraJokers,
      });
      ctx.postMessage({ id: request.id, type: 'suggestions', suggestions });
    }
  } catch (err) {
    ctx.postMessage({ id: request.id, type: 'error', message: err instanceof Error ? err.message : String(err) });
  }
};
