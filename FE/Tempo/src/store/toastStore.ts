/**
 * Toast Notification Store (Zustand)
 * Supports regular toasts + persistent download progress toasts
 */
import { create } from 'zustand';

export type ToastType = 'info' | 'success' | 'vip' | 'error' | 'warning';

export interface DownloadToast {
  songId: string;
  title: string;        // short title (max 22 chars)
  progress: number;     // 0..1
  currentIndex?: number;
  totalCount?: number;
  remainingInQueue?: number;
}

interface ToastState {
  message: string | null;
  type: ToastType;
  visible: boolean;

  // Download progress toast (separate, stays visible while downloading)
  downloadToast: DownloadToast | null;

  showToast: (message: string, type?: ToastType) => void;
  hideToast: () => void;

  showDownloadToast: (
    songId: string,
    title: string,
    progress: number,
    queueInfo?: { currentIndex?: number; totalCount?: number; remainingInQueue?: number }
  ) => void;
  hideDownloadToast: (songId?: string) => void;
}

let timeoutId: any = null;
let downloadTimeoutId: any = null;

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

  showDownloadToast: (
    songId: string,
    title: string,
    progress: number,
    queueInfo?: { currentIndex?: number; totalCount?: number; remainingInQueue?: number }
  ) => {
    const shortTitle = title.length > 22 ? title.substring(0, 22) + '…' : title;
    const clampedProgress = Math.min(Math.max(progress, 0), 1);
    set({
      downloadToast: {
        songId,
        title: shortTitle,
        progress: clampedProgress,
        currentIndex: queueInfo?.currentIndex,
        totalCount: queueInfo?.totalCount,
        remainingInQueue: queueInfo?.remainingInQueue,
      },
    });

    // Khi đạt 100%, tự động ẩn thanh download sau 1.2 giây
    if (clampedProgress >= 1) {
      if (downloadTimeoutId) clearTimeout(downloadTimeoutId);
      downloadTimeoutId = setTimeout(() => {
        const curr = get().downloadToast;
        if (curr?.songId === songId) {
          set({ downloadToast: null });
        }
      }, 1200);
    }
  },

  hideDownloadToast: (songId?: string) => {
    if (downloadTimeoutId) clearTimeout(downloadTimeoutId);
    const current = get().downloadToast;
    if (!songId || current?.songId === songId) {
      set({ downloadToast: null });
    }
  },
}));
