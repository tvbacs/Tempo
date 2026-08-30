/**
 * Toast Notification Store (Zustand)
 * Strictly follows STANDARDS.md - Accent #FF5800, NO EMOJIS
 */
import { create } from 'zustand';

export type ToastType = 'info' | 'success' | 'vip' | 'error' | 'warning';

interface ToastState {
  message: string | null;
  type: ToastType;
  visible: boolean;
  showToast: (message: string, type?: ToastType) => void;
  hideToast: () => void;
}

let timeoutId: any = null;

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  type: 'info',
  visible: false,

  showToast: (message: string, type: ToastType = 'info') => {
    if (timeoutId) clearTimeout(timeoutId);

    set({ message, type, visible: true });

    timeoutId = setTimeout(() => {
      set({ visible: false });
    }, 3200);
  },

  hideToast: () => {
    if (timeoutId) clearTimeout(timeoutId);
    set({ visible: false });
  },
}));
