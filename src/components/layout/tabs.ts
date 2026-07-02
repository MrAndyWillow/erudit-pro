import { BarChart3, History, Package, Settings, Sparkles, Target, type LucideIcon } from 'lucide-react';

export interface TabDef {
  id: string;
  label: string;
  icon: LucideIcon;
}

export const TABS: TabDef[] = [
  { id: 'move', label: 'Ход', icon: Target },
  { id: 'suggest', label: 'Подсказки', icon: Sparkles },
  { id: 'bag', label: 'Мешок', icon: Package },
  { id: 'history', label: 'История', icon: History },
  { id: 'stats', label: 'Статистика', icon: BarChart3 },
  { id: 'settings', label: 'Настройки', icon: Settings },
];
