/**
 * Global Sleep Timer State Machine (Zustand + AsyncStorage)
 * Lưu trữ hẹn giờ vào AsyncStorage, tự động khôi phục và tiếp tục đếm ngược khi reload app.
 * Strictly follows STANDARDS.md
 */
import { create } from 'zustand';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { audioEngine } from '../services/audioPlayer';
import { useToastStore } from './toastStore';

export type SleepTimerOption = 5 | 10 | 15 | 30 | 45 | 60 | 'end_of_track' | null;

const SLEEP_TIMER_STORAGE_KEY = '@tempo_sleep_timer_state';

interface SleepTimerSavedState {
  activeOption: SleepTimerOption;
  targetTimestamp: number | null; // Milliseconds timestamp khi hết hạn
}

interface SleepTimerState {
  activeOption: SleepTimerOption;
  targetTimestamp: number | null;
  remainingSeconds: number | null;
  isTimerActive: boolean;
  isModalVisible: boolean;

  // Actions
  init: () => Promise<void>;
  setTimer: (option: SleepTimerOption) => Promise<void>;
  cancelTimer: () => Promise<void>;
  openModal: () => void;
  closeModal: () => void;
  onTrackEnded: () => void;
}

// Single timeout for exact trigger
let sleepTimeout: ReturnType<typeof setTimeout> | null = null;
// UI-only countdown interval (only runs when app is in foreground)
let uiCountdownInterval: ReturnType<typeof setInterval> | null = null;
let isTriggeringPause = false;
let appStateSubscription: any = null;

const clearAllTimers = () => {
  if (sleepTimeout) {
    clearTimeout(sleepTimeout);
    sleepTimeout = null;
  }
  if (uiCountdownInterval) {
    clearInterval(uiCountdownInterval);
    uiCountdownInterval = null;
  }
};

const triggerSleepPause = async () => {
  clearAllTimers();
  try {
    const { usePlayerStore } = require('./playerStore');
    const playerStore = usePlayerStore.getState();

    // 1. Dùng pausePlayback để vừa dừng audio vừa tự động lưu session an toàn
    try {
      await playerStore.pausePlayback();
    } catch (e) {
      await audioEngine.pause().catch(() => {});
    }

    // 2. Dọn dẹp storage
    await AsyncStorage.removeItem(SLEEP_TIMER_STORAGE_KEY).catch(() => {});
  } catch (error) {
    try {
      await audioEngine.pause();
    } catch (_) {}
  }

  try {
    const { useToastStore } = require('./toastStore');
    useToastStore.getState().showToast('Hẹn giờ tắt nhạc: Chúc bạn ngủ ngon', 'info');
  } catch (_) {}
};

const safeTriggerSleepPause = () => {
  if (isTriggeringPause) return;
  isTriggeringPause = true;
  triggerSleepPause().finally(() => {
    isTriggeringPause = false;
  });
};

/**
 * Khởi động UI countdown interval (chỉ chạy khi AppState === 'active')
 * Giúp màn hình hiển thị đếm ngược mượt mà nhưng KHÔNG đánh thức CPU trong background
 */
const startUiCountdownIfActive = (get: () => SleepTimerState, set: (state: Partial<SleepTimerState>) => void) => {
  if (uiCountdownInterval) {
    clearInterval(uiCountdownInterval);
    uiCountdownInterval = null;
  }

  // Nếu app đang trong background: KHÔNG chạy interval để tránh bị iOS watchdog kill vì excessive wakeups
  if (AppState.currentState !== 'active') return;

  const target = get().targetTimestamp;
  if (!target) return;

  const initialDiff = target - Date.now();
  if (initialDiff <= 0) {
    clearAllTimers();
    set({
      activeOption: null,
      targetTimestamp: null,
      remainingSeconds: null,
      isTimerActive: false,
    });
    safeTriggerSleepPause();
    return;
  }

  set({ remainingSeconds: Math.ceil(initialDiff / 1000) });

  uiCountdownInterval = setInterval(() => {
    // Chỉ cập nhật nếu app vẫn đang active
    if (AppState.currentState !== 'active') {
      if (uiCountdownInterval) {
        clearInterval(uiCountdownInterval);
        uiCountdownInterval = null;
      }
      return;
    }

    const currentTarget = get().targetTimestamp;
    if (!currentTarget) {
      clearAllTimers();
      return;
    }

    const diffMs = currentTarget - Date.now();
    if (diffMs <= 0) {
      clearAllTimers();
      set({
        activeOption: null,
        targetTimestamp: null,
        remainingSeconds: null,
        isTimerActive: false,
      });
      safeTriggerSleepPause();
    } else {
      set({ remainingSeconds: Math.ceil(diffMs / 1000) });
    }
  }, 1000);
};

export const useSleepTimerStore = create<SleepTimerState>((set, get) => ({
  activeOption: null,
  targetTimestamp: null,
  remainingSeconds: null,
  isTimerActive: false,
  isModalVisible: false,

  init: async () => {
    clearAllTimers();

    // Đăng ký lắng nghe AppState một lần duy nhất
    if (!appStateSubscription) {
      appStateSubscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
        const state = get();
        if (!state.isTimerActive || !state.targetTimestamp) return;

        if (nextState === 'active') {
          // Khi quay lại foreground: kiểm tra xem đã hết giờ chưa và bật lại UI countdown
          const diffMs = state.targetTimestamp - Date.now();
          if (diffMs <= 0) {
            clearAllTimers();
            set({
              activeOption: null,
              targetTimestamp: null,
              remainingSeconds: null,
              isTimerActive: false,
            });
            safeTriggerSleepPause();
          } else {
            set({ remainingSeconds: Math.ceil(diffMs / 1000) });
            startUiCountdownIfActive(get, set);
          }
        } else {
          // Khi ra background hoặc khóa màn hình: Tắt UI countdown ngay để triệt tiêu CPU wakeups
          if (uiCountdownInterval) {
            clearInterval(uiCountdownInterval);
            uiCountdownInterval = null;
          }
        }
      });
    }

    try {
      const raw = await AsyncStorage.getItem(SLEEP_TIMER_STORAGE_KEY);
      if (!raw) return;

      const saved: SleepTimerSavedState = JSON.parse(raw);
      if (!saved || !saved.activeOption) return;

      // Trường hợp 1: Tắt khi hết bài hát
      if (saved.activeOption === 'end_of_track') {
        set({
          activeOption: 'end_of_track',
          targetTimestamp: null,
          remainingSeconds: null,
          isTimerActive: true,
        });
        return;
      }

      // Trường hợp 2: Hẹn theo phút (timestamp)
      if (saved.targetTimestamp) {
        const now = Date.now();
        const diffMs = saved.targetTimestamp - now;

        if (diffMs <= 0) {
          // Đã hết hạn từ phiên trước -> dọn dẹp storage an toàn
          await AsyncStorage.removeItem(SLEEP_TIMER_STORAGE_KEY).catch(() => {});
          set({
            activeOption: null,
            targetTimestamp: null,
            remainingSeconds: null,
            isTimerActive: false,
          });
        } else {
          // Còn thời gian -> khôi phục timer
          const remainingSec = Math.round(diffMs / 1000);
          set({
            activeOption: saved.activeOption,
            targetTimestamp: saved.targetTimestamp,
            remainingSeconds: remainingSec,
            isTimerActive: true,
          });

          // 1. Đặt single timeout chạy chính xác thời điểm hết giờ (kể cả trong background)
          sleepTimeout = setTimeout(() => {
            clearAllTimers();
            set({
              activeOption: null,
              targetTimestamp: null,
              remainingSeconds: null,
              isTimerActive: false,
            });
            safeTriggerSleepPause();
          }, diffMs);

          // 2. Chạy UI countdown nếu đang mở app
          startUiCountdownIfActive(get, set);
        }
      }
    } catch (err) {
      console.warn('[SleepTimer] Init error:', err);
    }
  },

  setTimer: async (option: SleepTimerOption) => {
    clearAllTimers();

    if (!option) {
      await AsyncStorage.removeItem(SLEEP_TIMER_STORAGE_KEY).catch(() => {});
      set({ activeOption: null, targetTimestamp: null, remainingSeconds: null, isTimerActive: false });
      useToastStore.getState().showToast('Đã tắt hẹn giờ đi ngủ', 'info');
      return;
    }

    if (option === 'end_of_track') {
      const savedData: SleepTimerSavedState = {
        activeOption: 'end_of_track',
        targetTimestamp: null,
      };
      await AsyncStorage.setItem(SLEEP_TIMER_STORAGE_KEY, JSON.stringify(savedData));

      set({
        activeOption: 'end_of_track',
        targetTimestamp: null,
        remainingSeconds: null,
        isTimerActive: true,
      });
      useToastStore.getState().showToast('Sẽ dừng phát khi kết thúc bài hát này', 'info');
      return;
    }

    const totalSeconds = option * 60;
    const targetTimestamp = Date.now() + totalSeconds * 1000;

    const savedData: SleepTimerSavedState = {
      activeOption: option,
      targetTimestamp,
    };
    await AsyncStorage.setItem(SLEEP_TIMER_STORAGE_KEY, JSON.stringify(savedData));

    set({
      activeOption: option,
      targetTimestamp,
      remainingSeconds: totalSeconds,
      isTimerActive: true,
    });

    useToastStore.getState().showToast(`Hẹn giờ đi ngủ sau ${option} phút`, 'info');

    // 1. Single timeout cho đúng thời điểm hết giờ
    sleepTimeout = setTimeout(() => {
      clearAllTimers();
      set({
        activeOption: null,
        targetTimestamp: null,
        remainingSeconds: null,
        isTimerActive: false,
      });
      safeTriggerSleepPause();
    }, totalSeconds * 1000);

    // 2. Bắt đầu đếm ngược hiển thị UI nếu app đang active
    startUiCountdownIfActive(get, set);
  },

  cancelTimer: async () => {
    clearAllTimers();
    await AsyncStorage.removeItem(SLEEP_TIMER_STORAGE_KEY).catch(() => {});
    set({
      activeOption: null,
      targetTimestamp: null,
      remainingSeconds: null,
      isTimerActive: false,
    });
    useToastStore.getState().showToast('Đã hủy hẹn giờ đi ngủ', 'info');
  },

  openModal: () => {
    set({ isModalVisible: true });
    // Cập nhật lại giây đếm ngược chính xác ngay khi mở modal
    const target = get().targetTimestamp;
    if (target && get().isTimerActive) {
      const diffSec = Math.max(0, Math.ceil((target - Date.now()) / 1000));
      set({ remainingSeconds: diffSec });
      startUiCountdownIfActive(get, set);
    }
  },

  closeModal: () => {
    set({ isModalVisible: false });
  },

  onTrackEnded: () => {
    try {
      if (get().activeOption === 'end_of_track') {
        get().cancelTimer();
        safeTriggerSleepPause();
      }
    } catch (err) {
      console.warn('[SleepTimer] onTrackEnded error:', err);
    }
  },
}));
