import { Fragment } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { BOARD_LAYOUTS } from '@/game/board-layouts';
import { BOARD_SIZE, CENTER, COLUMN_LABELS } from '@/game/constants';
import { posKey } from '@/game/board';
import { BoardCell } from './BoardCell';

/**
 * The board is a plain scrollable grid (`overflow-auto`), not a custom
 * pinch-zoom widget — on tablets, native pinch-to-zoom already works over any
 * scrollable region, so a hand-rolled gesture handler would only add risk for
 * the same result.
 */
export function Board() {
  const board = useGameStore((s) => s.board);
  const layoutKey = useGameStore((s) => s.layoutKey);
  const ghostMap = useGameStore((s) => s.ghostMap);
  const startCell = useGameStore((s) => s.startCell);
  const pickingStart = useGameStore((s) => s.pickingStart);
  const setStartCell = useGameStore((s) => s.setStartCell);
  const setPickingStart = useGameStore((s) => s.setPickingStart);

  const layout = BOARD_LAYOUTS[layoutKey];
  const indices = Array.from({ length: BOARD_SIZE }, (_, i) => i + 1);

  const handleCellClick = (row: number, col: number) => {
    if (!pickingStart) return;
    setStartCell({ row, col });
    setPickingStart(false);
  };

  return (
    <div className="border-border bg-card/60 overflow-auto rounded-2xl border p-2">
      <div
        className="inline-grid gap-[2px]"
        style={{ gridTemplateColumns: `18px repeat(${BOARD_SIZE}, minmax(26px, 1fr))`, minWidth: '540px' }}
      >
        <div />
        {indices.map((col) => (
          <div key={`h${col}`} className="text-muted-foreground font-mono pb-0.5 text-center text-[9px]">
            {COLUMN_LABELS[col - 1]}
          </div>
        ))}
        {indices.map((row) => (
          <Fragment key={`row${row}`}>
            <div className="text-muted-foreground font-mono flex items-center justify-center text-[9px]">{row}</div>
            {indices.map((col) => {
              const key = posKey({ row, col });
              const tile = board.get(key);
              const ghost = ghostMap?.get(key);
              const premium = layout.premiumAt.get(key);
              const isCenter = row === CENTER.row && col === CENTER.col;
              const isStart = startCell?.row === row && startCell?.col === col;
              return (
                <BoardCell
                  key={key}
                  tile={tile}
                  ghost={ghost}
                  premium={premium}
                  isCenter={isCenter && !tile}
                  isStart={isStart}
                  onClick={() => handleCellClick(row, col)}
                />
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
