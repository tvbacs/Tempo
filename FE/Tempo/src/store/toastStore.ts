/**
 * Toast Notification Store (Zustand)
 * Supports regular toasts + persistent download progress toasts
 */
import { create } from 'zustand';

export type ToastType = 'info' | 'success' | 'vip' | 'error' | 'warning';

interface DownloadToast {
  songId: string;
  title: string;        // short title (max 22 chars)
  progress: number;     // 0..1
}

interface ToastState {
  message: string | null;
  type: ToastType;
  visible: boolean;

  // Download progress toast (separate, stays visible while downloading)
  downloadToast: DownloadToast | null;

  showToast: (message: string, type?: ToastType) => void;
  hideToast: () => void;

  showDownloadToast: (songId: string, title: string, progress: number) => void;
  hideDownloadToast: (songId: string) => void;
}

let timeoutId: any = null;

export const useToastStore = create<ToastState>((set, get) => ({
  message: null,
  type: 'info',
  visible: false,
  downloadToast: null,

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

  showDownloadToast: (songId: string, title: string, progress: number) => {
    const shortTitle = title.length > 22 ? title.substring(0, 22) + '…' : title;
    set({ downloadToast: { songId, title: shortTitle, progress } });
  },

  hideDownloadToast: (songId: string) => {
    const current = get().downloadToast;
    if (current?.songId === songId) {
      set({ downloadToast: null });
    }
  },
}));
