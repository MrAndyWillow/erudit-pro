export interface TrieNode {
  children: Map<string, TrieNode>;
  isWord: boolean;
}

export function createTrieNode(): TrieNode {
  return { children: new Map(), isWord: false };
}

export function buildTrie(words: Iterable<string>): TrieNode {
  const root = createTrieNode();
  for (const word of words) {
    let node = root;
    for (const ch of word) {
      let next = node.children.get(ch);
      if (!next) {
        next = createTrieNode();
        node.children.set(ch, next);
      }
      node = next;
    }
    node.isWord = true;
  }
  return root;
}

/** Walks the trie letter by letter from `node`; returns null if any letter has no matching branch. */
export function walkTrie(node: TrieNode, letters: string): TrieNode | null {
  let current = node;
  for (const ch of letters) {
    const next = current.children.get(ch);
    if (!next) return null;
    current = next;
  }
  return current;
}

export function trieHasWord(root: TrieNode, word: string): boolean {
  const node = walkTrie(root, word);
  return !!node && node.isWord;
}
