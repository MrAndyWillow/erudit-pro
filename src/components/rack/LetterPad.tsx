import { Delete } from 'lucide-react';
import { ALPHABET_ORDERED, JOKER_LETTER, LETTER_VALUES } from '@/game/constants';
import { cn } from '@/lib/utils';

interface LetterPadProps {
  onLetterTap: (letter: string) => void;
  onBackspace: () => void;
  className?: string;
}

/**
 * A dedicated on-screen Cyrillic keyboard for entering the rack and typed
 * words. iPad's system keyboard is usually set to English, and switching
 * layouts for every letter is exactly the friction real tile-game apps avoid
 * by shipping their own letter grid — this does the same, with each key
 * showing its point value like a real tile.
 */
export function LetterPad({ onLetterTap, onBackspace, className }: LetterPadProps) {
  return (
    <div className={cn('grid grid-cols-8 gap-1.5 sm:grid-cols-11', className)}>
      {ALPHABET_ORDERED.map((letter) => (
        <button
          key={letter}
          type="button"
          onClick={() => onLetterTap(letter)}
          className="bg-tile text-tile-foreground relative flex aspect-square min-h-11 items-center justify-center rounded-lg font-display text-base font-bold shadow-sm transition-transform active:scale-90"
        >
          {letter}
          <span className="font-mono absolute right-1 bottom-0.5 text-[9px] opacity-70">{LETTER_VALUES[letter]}</span>
        </button>
      ))}
      <button
        type="button"
        onClick={() => onLetterTap(JOKER_LETTER)}
        className="bg-primary/20 text-primary flex aspect-square min-h-11 items-center justify-center rounded-lg font-display text-lg font-bold shadow-sm transition-transform active:scale-90"
        title="Джокер"
      >
        ★
      </button>
      <button
        type="button"
        onClick={onBackspace}
        className="bg-secondary text-secondary-foreground flex aspect-square min-h-11 items-center justify-center rounded-lg shadow-sm transition-transform active:scale-90"
        title="Стереть"
      >
        <Delete size={18} />
      </button>
    </div>
  );
}
