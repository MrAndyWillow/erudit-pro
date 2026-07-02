import { Layers } from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import { BOARD_LAYOUTS } from '@/game/board-layouts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function AppHeader() {
  const dictSize = useGameStore((s) => s.dictSize);
  const layoutKey = useGameStore((s) => s.layoutKey);
  const setLayoutKey = useGameStore((s) => s.setLayoutKey);
  const activePlayer = useGameStore((s) => s.activePlayer);

  const layout = BOARD_LAYOUTS[layoutKey];

  return (
    <header className="border-border bg-popover/90 sticky top-0 z-20 flex items-center gap-3 border-b px-4 py-3 backdrop-blur-md">
      <div className="min-w-0">
        <h1 className="font-display truncate text-lg leading-tight font-semibold tracking-wide text-balance">
          Эрудит Помощник Pro
        </h1>
        <p className="text-muted-foreground font-mono text-[11px] leading-tight">
          {dictSize.toLocaleString('ru-RU')} слов · {layout.name}
        </p>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Badge variant={activePlayer === 'me' ? 'default' : 'secondary'} className="hidden sm:inline-flex">
          ход: {activePlayer === 'me' ? 'мой' : 'соперника'}
        </Badge>
        <Button
          variant="outline"
          size="icon"
          title="Переключить раскладку доски"
          onClick={() => setLayoutKey(layoutKey === 'classic' ? 'alt' : 'classic')}
        >
          <Layers size={17} />
        </Button>
      </div>
    </header>
  );
}
