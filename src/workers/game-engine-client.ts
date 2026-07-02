import type { EngineRequest, EngineResponse } from './game-engine.worker';
import type { MoveSuggestions } from '../engine/move-generator';
import type { Board } from '../game/types';
import type { LayoutKey } from '../game/board-layouts';

type DistributiveOmit<T, K extends keyof never> = T extends unknown ? Omit<T, K> : never;

let worker: Worker | null = null;
let nextRequestId = 1;
const pending = new Map<number, { resolve: (response: EngineResponse) => void; reject: (error: Error) => void }>();

function ensureWorker(): Worker {
  if (worker) return worker;

  worker = new Worker(new URL('./game-engine.worker.ts', import.meta.url), { type: 'module' });

  worker.onmessage = (event: MessageEvent<EngineResponse>) => {
    const response = event.data;
    const entry = pending.get(response.id);
    if (!entry) return;
    pending.delete(response.id);
    if (response.type === 'error') entry.reject(new Error(response.message));
    else entry.resolve(response);
  };

  worker.onerror = (event: ErrorEvent) => {
    const error = new Error(event.message || 'Ошибка воркера игрового движка.');
    for (const [id, entry] of pending) {
      entry.reject(error);
      pending.delete(id);
    }
  };

  return worker;
}

function send(request: DistributiveOmit<EngineRequest, 'id'>): Promise<EngineResponse> {
  const id = nextRequestId++;
  const instance = ensureWorker();
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    instance.postMessage({ ...request, id } as EngineRequest);
  });
}

/** Loads the dictionary and builds its trie inside the worker; resolves with the word count once ready. */
export async function loadDictionaryInWorker(url?: string): Promise<number> {
  const response = await send({ type: 'load', url });
  if (response.type !== 'ready') throw new Error('Неожиданный ответ при загрузке словаря.');
  return response.dictSize;
}

export interface RequestSuggestionsOptions {
  limit?: number;
  allowExtraJokers?: number;
}

/** Requests move suggestions from the worker using the dictionary/trie it already has cached. */
export async function requestSuggestions(
  board: Board,
  rack: string[],
  layoutKey: LayoutKey,
  options: RequestSuggestionsOptions = {},
): Promise<MoveSuggestions> {
  const response = await send({
    type: 'generate',
    board,
    rack,
    layoutKey,
    limit: options.limit,
    allowExtraJokers: options.allowExtraJokers,
  });
  if (response.type !== 'suggestions') throw new Error('Неожиданный ответ при поиске ходов.');
  return response.suggestions;
}
