/**
 * Global Sleep Timer State Machine (Zustand + AsyncStorage)
 * Lưu trữ hẹn giờ vào AsyncStorage, tự động khôi phục và tiếp tục đếm ngược khi reload app.
 * Strictly follows STANDARDS.md
 */
import { create } from 'zustand';
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

const triggerSleepPause = async () => {
  try {
    const { usePlayerStore } = require('./playerStore');
    const ps = usePlayerStore.getState();
    const currentSong = ps.currentSong;
    const durationMs = ps.durationMs;

    // 1. CHỈ pause native audio engine an toàn, không can thiệp remote cross-device
    try {
      await audioEngine.pause();
    } catch (e) {
      console.warn('[SleepTimer] Direct audioEngine.pause warning:', e);
    }

    // 2. Đồng bộ Zustand state
    try {
      usePlayerStore.setState({
        isPlaying: false,
        isLoading: false,
      });
    } catch (_) {}

    // 3. Đọc positionMs sau khi đã dừng native player
    const positionMs = usePlayerStore.getState().positionMs || 0;

    // 4. Lưu lại thời điểm chính xác vào lịch sử nghe
    if (currentSong) {
      try {
        const { useLibraryStore } = require('./libraryStore');
        useLibraryStore.getState().recordHistory(currentSong, positionMs, durationMs);
      } catch (_) {}
    }
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

let timerInterval: any = null;
let isTriggeringPause = false;

const safeTriggerSleepPause = () => {
  if (isTriggeringPause) return;
  isTriggeringPause = true;
  triggerSleepPause().finally(() => {
    isTriggeringPause = false;
  });
};

export const useSleepTimerStore = create<SleepTimerState>((set, get) => ({
  activeOption: null,
  targetTimestamp: null,
  remainingSeconds: null,
  isTimerActive: false,
  isModalVisible: false,

  init: async () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
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
          // Đã hết hạn từ phiên trước -> dọn dẹp storage an toàn, không can thiệp phiên phát nhạc mới
          await AsyncStorage.removeItem(SLEEP_TIMER_STORAGE_KEY);
          set({
            activeOption: null,
            targetTimestamp: null,
            remainingSeconds: null,
            isTimerActive: false,
          });
        } else {
          // Còn thời gian -> khôi phục đếm ngược
          const remainingSec = Math.round(diffMs / 1000);
          set({
            activeOption: saved.activeOption,
            targetTimestamp: saved.targetTimestamp,
            remainingSeconds: remainingSec,
            isTimerActive: true,
          });

          if (timerInterval) clearInterval(timerInterval);
          timerInterval = setInterval(() => {
            const target = get().targetTimestamp;
            if (!target) return;
            const diffMs = target - Date.now();
            if (diffMs <= 0) {
              clearInterval(timerInterval);
              timerInterval = null;
              AsyncStorage.removeItem(SLEEP_TIMER_STORAGE_KEY).catch(() => {});
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
        }
      }
    } catch (err) {
      console.warn('[SleepTimer] Init error:', err);
    }
  },

  setTimer: async (option: SleepTimerOption) => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    if (!option) {
      await AsyncStorage.removeItem(SLEEP_TIMER_STORAGE_KEY);
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

    timerInterval = setInterval(() => {
      const target = get().targetTimestamp;
      if (!target) return;
      const diffMs = target - Date.now();
      if (diffMs <= 0) {
        clearInterval(timerInterval);
        timerInterval = null;
        AsyncStorage.removeItem(SLEEP_TIMER_STORAGE_KEY).catch(() => {});
        set({
          activeOption: null,
          targetTimestamp: null,
          remainingSeconds: null,
          isTimerActive: false,
        });

        triggerSleepPause();
      } else {
        set({ remainingSeconds: Math.ceil(diffMs / 1000) });
      }
    }, 1000);
  },

  cancelTimer: async () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    await AsyncStorage.removeItem(SLEEP_TIMER_STORAGE_KEY);
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
