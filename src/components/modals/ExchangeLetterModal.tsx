import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { selectBagState } from '@/store/selectors';
import { parseRackInput } from '@/game/rack-utils';
import { JOKER_LETTER } from '@/game/constants';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LetterPad } from '@/components/rack/LetterPad';

interface ExchangeLetterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Implements the game's letter-exchange mechanic: one rack tile is swapped for
 * a random one drawn from the bag, and the old tile returns to the bag. This
 * app can't draw the random tile itself (that happens in the physical/other
 * game) — the player just tells it what they drew, exactly like recording a move.
 */
export function ExchangeLetterModal({ open, onOpenChange }: ExchangeLetterModalProps) {
  const rackInput = useGameStore((s) => s.rackInput);
  const board = useGameStore((s) => s.board);
  const oppHandCount = useGameStore((s) => s.oppHandCount);
  const exchangeLetter = useGameStore((s) => s.exchangeLetter);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [drawnLetter, setDrawnLetter] = useState('');

  useEffect(() => {
    if (open) {
      setSelectedIndex(null);
      setDrawnLetter('');
    }
  }, [open]);

  const rackLetters = parseRackInput(rackInput);
  const bagState = selectBagState(board, rackInput, oppHandCount);
  const poolLeft = drawnLetter === JOKER_LETTER ? bagState.unknownJokers : bagState.unknownPerLetter[drawnLetter];

  const canConfirm = selectedIndex !== null && drawnLetter.length === 1;

  const handleConfirm = () => {
    if (!canConfirm || selectedIndex === null) return;
    exchangeLetter(selectedIndex, drawnLetter);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Обмен фишки</DialogTitle>
          <DialogDescription>
            Выберите фишку, которую меняете в мешке, затем укажите, какую фишку вы вытянули взамен.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">Какую фишку меняете</p>
            <div className="flex flex-wrap gap-1.5">
              {rackLetters.map((letter, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  className={cn(
                    'bg-tile text-tile-foreground font-display flex h-10 w-10 items-center justify-center rounded-lg text-base font-bold',
                    selectedIndex === index && 'ring-destructive ring-2',
                  )}
                >
                  {letter === JOKER_LETTER ? '★' : letter}
                </button>
              ))}
            </div>
          </div>

          {selectedIndex !== null && (
            <div>
              <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                Какую фишку вы вытянули
              </p>
              <LetterPad
                onLetterTap={setDrawnLetter}
                onBackspace={() => setDrawnLetter('')}
                className="grid-cols-8 sm:grid-cols-8"
              />
              {drawnLetter && (
                <p className="text-muted-foreground mt-2 text-[11px]">
                  В неизвестном пуле сейчас: <span className="font-mono">{poolLeft}</span>
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button disabled={!canConfirm} onClick={handleConfirm}>
            Подтвердить обмен
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
