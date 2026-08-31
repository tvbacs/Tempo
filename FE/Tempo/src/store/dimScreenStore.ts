/**
 * dimScreenStore - Zustand store điều khiển overlay tối màn hình
 */
import { create } from 'zustand';

interface DimScreenState {
  isVisible: boolean;
  show: () => void;
  hide: () => void;
}

export const useDimScreenStore = create<DimScreenState>((set) => ({
  isVisible: false,
  show: () => set({ isVisible: true }),
  hide: () => set({ isVisible: false }),
}));
