import type { Board, BoardLayout, Direction, PlacedLetter, Pos, ScoreBreakdown } from '../game/types';
import { getTile, inBounds, step } from '../game/board';
import { BOARD_SIZE } from '../game/constants';
import { tallyRack } from '../game/bag';
import { scoreMove } from '../game/scoring';
import { assessCornerPlacement } from '../game/corner-strategy';
import { checkExtensionRisk, type ExtensionRisk } from '../game/extension-risk';
import { isCandidateStillValid } from '../game/candidate-validity';
import type { TrieNode } from '../dictionary/trie';
import type { LoadedDictionary } from '../dictionary/loader';
import { computeAnchors } from './anchors';
import { computeCrossChecksForBoard, type CrossCheckResult } from './cross-checks';

export interface GeneratedCandidate {
  word: string;
  dir: Direction;
  start: Pos;
  cells: PlacedLetter[];
  jokersUsed: number;
}

interface GeneratorLimits {
  maxCandidates: number;
  maxVisitedNodes: number;
}

const DEFAULT_LIMITS: GeneratorLimits = { maxCandidates: 4000, maxVisitedNodes: 400000 };

function cellKey(p: Pos): string {
  return `${p.row}:${p.col}`;
}

interface PathCell {
  pos: Pos;
  letter: string;
  isBlank: boolean;
  isNew: boolean;
}

/**
 * Generates every legal placement reachable from the board's anchors using the
 * available rack letters (plus jokers), respecting per-cell cross-checks and
 * pruning through the dictionary trie: a branch dies the instant its current
 * prefix has no continuation in the trie, so cost tracks how many prefixes are
 * actually reachable with this rack, not the dictionary's total size.
 */
export function generateRawCandidates(
  board: Board,
  rackCounts: Record<string, number>,
  jokerCount: number,
  trie: TrieNode,
  limits: Partial<GeneratorLimits> = {},
): GeneratedCandidate[] {
  const { maxCandidates, maxVisitedNodes } = { ...DEFAULT_LIMITS, ...limits };
  const results: GeneratedCandidate[] = [];
  const seenKeys = new Set<string>();
  let visited = 0;

  const emit = (path: PathCell[], dir: Direction, start: Pos) => {
    const word = path.map((c) => c.letter).join('');
    const key = `${dir}|${start.row}:${start.col}|${word}`;
    if (seenKeys.has(key)) return;
    seenKeys.add(key);
    const cells: PlacedLetter[] = path.map((c) => ({
      row: c.pos.row,
      col: c.pos.col,
      letter: c.letter,
      isBlank: c.isBlank,
      isNew: c.isNew,
    }));
    const jokersUsed = cells.filter((c) => c.isNew && c.isBlank).length;
    results.push({ word, dir, start, cells, jokersUsed });
  };

  for (const dir of ['H', 'V'] as Direction[]) {
    const crossChecks = computeCrossChecksForBoard(board, dir, trie);
    const anchors = computeAnchors(board);

    for (const anchor of anchors) {
      if (results.length >= maxCandidates || visited >= maxVisitedNodes) break;

      // Try every possible start position at or before the anchor, out to the board edge.
      // A run of several already-placed letters right at the start is legal (the DFS below
      // absorbs fixed cells for free), so this can't be bounded by "empty cells only" — the
      // `before` check just below is what actually rules out invalid starts cheaply.
      for (let left = 0; left < BOARD_SIZE; left++) {
        if (results.length >= maxCandidates || visited >= maxVisitedNodes) break;

        const start = step(anchor, dir, -left);
        if (!inBounds(start, BOARD_SIZE)) break;
        const before = step(start, dir, -1);
        if (inBounds(before, BOARD_SIZE) && getTile(board, before)) continue;

        const localRack = { ...rackCounts };
        let localJokers = jokerCount;
        const path: PathCell[] = [];

        const walkFrom = (pos: Pos, node: TrieNode): void => {
          if (results.length >= maxCandidates || visited >= maxVisitedNodes) return;
          visited++;
          if (!inBounds(pos, BOARD_SIZE)) return;

          const tryEmit = (afterPos: Pos, nextNode: TrieNode) => {
            if (!nextNode.isWord) return;
            if (!path.some((c) => c.isNew)) return;
            if (!path.some((c) => c.pos.row === anchor.row && c.pos.col === anchor.col)) return;
            if (inBounds(afterPos, BOARD_SIZE) && getTile(board, afterPos)) return;
            emit(path, dir, start);
          };

          const existing = getTile(board, pos);
          if (existing) {
            const child = node.children.get(existing.letter);
            if (!child) return;
            path.push({ pos, letter: existing.letter, isBlank: existing.isBlank, isNew: false });
            const next = step(pos, dir, 1);
            tryEmit(next, child);
            walkFrom(next, child);
            path.pop();
            return;
          }

          const allowed: CrossCheckResult = crossChecks.get(cellKey(pos)) ?? null;
          for (const [letter, child] of node.children) {
            if (allowed !== null && !allowed.has(letter)) continue;

            const haveReal = (localRack[letter] ?? 0) > 0;
            if (haveReal) {
              localRack[letter]--;
              path.push({ pos, letter, isBlank: false, isNew: true });
              const next = step(pos, dir, 1);
              tryEmit(next, child);
              walkFrom(next, child);
              path.pop();
              localRack[letter]++;
            } else if (localJokers > 0) {
              localJokers--;
              path.push({ pos, letter, isBlank: true, isNew: true });
              const next = step(pos, dir, 1);
              tryEmit(next, child);
              walkFrom(next, child);
              path.pop();
              localJokers++;
            }
          }
        };

        walkFrom(start, trie);
      }
    }
  }

  return results;
}

export interface ScoredCandidate {
  word: string;
  dir: Direction;
  start: Pos;
  cells: PlacedLetter[];
  score: ScoreBreakdown;
  cornerDelta: number;
  cornerMessages: string[];
  risk: ExtensionRisk | null;
  jokersUsed: number;
  extraJokersNeeded: number;
  rankValue: number;
}

const RISK_CHECK_TOP_N = 60;

/** Scores and ranks raw candidates; the (relatively expensive) extension-risk check only runs on the top scorers. */
export function scoreAndRankCandidates(
  raw: GeneratedCandidate[],
  board: Board,
  layout: BoardLayout,
  realJokerCount: number,
  hardStartLetters: Set<string>,
  dict: LoadedDictionary,
): ScoredCandidate[] {
  const scored: ScoredCandidate[] = raw.map((candidate) => {
    const score = scoreMove(board, candidate.cells, candidate.dir, layout);
    const corner = assessCornerPlacement(candidate.cells, layout, hardStartLetters);
    const extraJokersNeeded = Math.max(0, candidate.jokersUsed - realJokerCount);
    return {
      word: candidate.word,
      dir: candidate.dir,
      start: candidate.start,
      cells: candidate.cells,
      score,
      cornerDelta: corner.delta,
      cornerMessages: corner.messages,
      risk: null,
      jokersUsed: candidate.jokersUsed,
      extraJokersNeeded,
      rankValue: score.total + corner.delta,
    };
  });

  scored.sort((a, b) => b.rankValue - a.rankValue);

  for (const candidate of scored.slice(0, RISK_CHECK_TOP_N)) {
    const risk = checkExtensionRisk(board, candidate.cells, candidate.dir, dict);
    candidate.risk = risk;
    const riskPenalty = risk.risky ? 6 + 3 * Math.min(risk.extensions.length, 4) : 0;
    candidate.rankValue = candidate.score.total + candidate.cornerDelta - riskPenalty;
  }

  return scored.sort((a, b) => b.rankValue - a.rankValue);
}

export interface MoveSuggestions {
  standard: ScoredCandidate[];
  needsJokers: ScoredCandidate[];
}

export interface GenerateCandidatesOptions {
  limit?: number;
  allowExtraJokers?: number;
}

/**
 * End-to-end suggestion pipeline: generate legal placements for the rack,
 * score/rank them, drop any that a concurrent board change invalidated, then
 * split into what's playable right now vs. what would require buying jokers.
 */
export function generateCandidates(
  board: Board,
  rack: string[],
  trie: TrieNode,
  layout: BoardLayout,
  hardStartLetters: Set<string>,
  dict: LoadedDictionary,
  options: GenerateCandidatesOptions = {},
): MoveSuggestions {
  const limit = options.limit ?? 20;
  const allowExtraJokers = options.allowExtraJokers ?? 0;
  const { counts: rackCounts, jokers: realJokers } = tallyRack(rack);

  const raw = generateRawCandidates(board, rackCounts, realJokers + allowExtraJokers, trie);
  const scored = scoreAndRankCandidates(raw, board, layout, realJokers, hardStartLetters, dict).filter((c) =>
    isCandidateStillValid(board, c.cells),
  );

  const standard = scored.filter((c) => c.extraJokersNeeded === 0).slice(0, limit);
  const needsJokers = allowExtraJokers > 0 ? scored.filter((c) => c.extraJokersNeeded > 0).slice(0, 8) : [];

  return { standard, needsJokers };
}
