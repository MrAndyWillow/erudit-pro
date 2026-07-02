import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomTabBar } from '@/components/layout/BottomTabBar';
import { TABS } from '@/components/layout/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

function DictionaryLoadingScreen() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6">
      <p className="font-display animate-pulse text-xl tracking-wide text-balance">Эрудит Помощник Pro</p>
      <p className="text-muted-foreground text-sm">Загружаю словарь…</p>
      <Skeleton className="h-2 w-48" />
    </div>
  );
}

function DictionaryErrorScreen({ message }: { message: string }) {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Card className="max-w-md space-y-3 p-6 text-center">
        <AlertTriangle className="text-destructive mx-auto" size={30} />
        <h2 className="font-display text-lg">Словарь не загружен</h2>
        <p className="text-muted-foreground text-sm">{message}</p>
        <p className="text-muted-foreground text-xs">
          Убедитесь, что файл <code className="text-primary">russian_words_nouns.txt</code> лежит рядом с приложением
          и оно открыто через http(s), а не напрямую из файловой системы.
        </p>
      </Card>
    </div>
  );
}

function App() {
  const dictStatus = useGameStore((s) => s.dictStatus);
  const dictError = useGameStore((s) => s.dictError);
  const loadDictionary = useGameStore((s) => s.loadDictionary);
  const activeTab = useGameStore((s) => s.activeTab);

  useEffect(() => {
    loadDictionary();
  }, [loadDictionary]);

  if (dictStatus === 'error') {
    return <DictionaryErrorScreen message={dictError ?? 'Неизвестная ошибка.'} />;
  }
  if (dictStatus !== 'ready') {
    return <DictionaryLoadingScreen />;
  }

  const activeTabLabel = TABS.find((t) => t.id === activeTab)?.label ?? activeTab;

  return (
    <div className="app-atmosphere relative min-h-svh pb-24">
      <AppHeader />
      <main className="relative z-10 mx-auto max-w-6xl p-3 sm:p-5">
        {/* Real panels (board, move entry, suggestions, bag, history, stats) land in later phases. */}
        <Card className="text-muted-foreground p-8 text-center text-sm">Вкладка «{activeTabLabel}» — в разработке</Card>
      </main>
      <BottomTabBar />
    </div>
  );
}

export default App;
