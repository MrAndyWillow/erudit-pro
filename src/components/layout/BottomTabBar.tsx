import { useGameStore } from '@/store/useGameStore';
import { cn } from '@/lib/utils';
import { TABS } from './tabs';

/**
 * Bottom tab navigation, not a desktop sidebar — this app is used mostly on
 * iPad/Android tablets, where a large, thumb-reachable bottom bar beats a
 * sidebar that assumes mouse + wide viewport.
 */
export function BottomTabBar() {
  const activeTab = useGameStore((s) => s.activeTab);
  const setActiveTab = useGameStore((s) => s.setActiveTab);

  return (
    <nav
      className="border-border bg-popover/95 fixed inset-x-0 bottom-0 z-20 border-t backdrop-blur-md"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex max-w-6xl gap-1 px-2 py-1.5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-medium transition-colors',
                isActive ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon size={19} strokeWidth={isActive ? 2.4 : 1.8} />
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
