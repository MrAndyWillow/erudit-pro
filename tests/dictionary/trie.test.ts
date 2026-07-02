import { describe, expect, it } from 'vitest';
import { buildTrie, trieHasWord, walkTrie } from '@/dictionary/trie';

const WORDS = ['кот', 'кошка', 'кора', 'слон', 'слониха', 'стол'];

describe('trie', () => {
  it('finds every word it was built from', () => {
    const trie = buildTrie(WORDS);
    for (const word of WORDS) {
      expect(trieHasWord(trie, word)).toBe(true);
    }
  });

  it('does not mark a prefix-only path as a word', () => {
    const trie = buildTrie(WORDS);
    expect(trieHasWord(trie, 'кош')).toBe(false); // prefix of "кошка", not itself a word
    expect(trieHasWord(trie, 'сто')).toBe(false); // prefix of "стол"
  });

  it('rejects words never inserted', () => {
    const trie = buildTrie(WORDS);
    expect(trieHasWord(trie, 'жираф')).toBe(false);
  });

  it('walkTrie returns null as soon as a letter has no branch', () => {
    const trie = buildTrie(WORDS);
    expect(walkTrie(trie, 'кот')).not.toBeNull();
    expect(walkTrie(trie, 'коты')).toBeNull();
  });

  it('agrees with a plain Set on a batch of random-ish queries', () => {
    const trie = buildTrie(WORDS);
    const asSet = new Set(WORDS);
    const queries = [...WORDS, 'кошк', 'слоних', 'стола', 'кот', 'к', '', 'слониха'];
    for (const query of queries) {
      expect(trieHasWord(trie, query)).toBe(asSet.has(query));
    }
  });
});
