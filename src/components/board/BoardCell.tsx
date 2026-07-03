import { Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LETTER_VALUES } from '@/game/constants';
import type { BoardTile, PremiumType } from '@/game/types';
import type { GhostTile } from '@/store/useGameStore';

const PREMIUM_META: Record<PremiumType, { label: string; className: string }> = {
  W3: { label: 'x3\nслово', className: 'bg-board-w3/85 text-white' },
  W2: { label: 'x2\nслово', className: 'bg-board-w2/85 text-white' },
  L3: { label: 'x3\nбуква', className: 'bg-board-l3/85 text-white' },
  L2: { label: 'x2\nбуква', className: 'bg-board-l2/85 text-white' },
};

interface BoardCellProps {
  tile?: BoardTile;
  ghost?: GhostTile | null;
  premium?: PremiumType;
  isCenter: boolean;
  isStart: boolean;
  onClick: () => void;
}

export function BoardCell({ tile, ghost, premium, isCenter, isStart, onClick }: BoardCellProps) {
  const active = tile ?? ghost;
  const isGhostOnly = !tile && !!ghost;

  let content: React.ReactNode = null;
  let variantClass = 'bg-muted/40 hover:bg-muted/70';

  if (active) {
    const value = active.isBlank ? 0 : (LETTER_VALUES[active.letter] ?? 0);
    const isOpp = active.player === 'opp';
    variantClass = cn(
      'font-display animate-tile-pop text-[13px] font-bold shadow-sm',
      isOpp ? 'bg-tile-opp text-tile-opp-foreground' : 'bg-tile text-tile-foreground',
      isGhostOnly && 'ring-primary opacity-60 ring-2',
    );
    content = (
      <>
        <span>{active.isBlank ? active.letter.toLowerCase() : active.letter}</span>
        {!active.isBlank && (
          <span className="font-mono absolute right-0.5 bottom-0.5 text-[7px] opacity-70">{value}</span>
        )}
      </>
    );
  } else if (isCenter) {
    variantClass = 'bg-primary/20 text-primary';
    content = <Target size={12} />;
  } else if (premium) {
    const meta = PREMIUM_META[premium];
    variantClass = cn(meta.className, 'font-display font-semibold');
    content = <span className="text-center text-[7px] leading-[8px] whitespace-pre-line">{meta.label}</span>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex aspect-square min-h-[26px] items-center justify-center rounded-[4px] text-[8px] leading-none select-none',
        variantClass,
        isStart && 'ring-primary ring-offset-background z-10 ring-2 ring-offset-1',
      )}
    >
      {content}
    </button>
  );
}
