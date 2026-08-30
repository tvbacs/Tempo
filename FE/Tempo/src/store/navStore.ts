/**
 * navStore - Realtime Navigation State Store
 * Tracks current active route and determines whether the bottom tab bar is visible.
 */
import { create } from 'zustand';

const TAB_SCREEN_NAMES = ['Home', 'Search', 'Library', 'Downloads', 'Upgrade', 'MainTabs'];

interface NavState {
  currentRoute: string;
  hasTabBar: boolean;
  setCurrentRoute: (routeName: string) => void;
}

export const useNavStore = create<NavState>((set) => ({
  currentRoute: 'MainTabs',
  hasTabBar: true,
  setCurrentRoute: (routeName: string) => {
    const hasTabBar = TAB_SCREEN_NAMES.includes(routeName);
    set({ currentRoute: routeName, hasTabBar });
  },
}));
