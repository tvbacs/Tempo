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

let timerInterval: any = null;

export const useSleepTimerStore = create<SleepTimerState>((set, get) => ({
  activeOption: null,
  targetTimestamp: null,
  remainingSeconds: null,
  isTimerActive: false,
  isModalVisible: false,

  init: async () => {
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
          // Đã hết hạn trong lúc tắt app -> dọn dẹp và dừng nhạc nếu cần
          await AsyncStorage.removeItem(SLEEP_TIMER_STORAGE_KEY);
          set({
            activeOption: null,
            targetTimestamp: null,
            remainingSeconds: null,
            isTimerActive: false,
          });
          audioEngine.pause();
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
            const current = get().remainingSeconds;
            if (current === null || current <= 1) {
              clearInterval(timerInterval);
              timerInterval = null;
              AsyncStorage.removeItem(SLEEP_TIMER_STORAGE_KEY).catch(() => {});
              set({
                activeOption: null,
                targetTimestamp: null,
                remainingSeconds: null,
                isTimerActive: false,
              });
              audioEngine.pause();
              useToastStore.getState().showToast('Đã tắt nhạc theo hẹn giờ ngủ', 'info');
            } else {
              set({ remainingSeconds: current - 1 });
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
      useToastStore.getState().showToast('Đã tắt hẹn giờ', 'info');
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

    useToastStore.getState().showToast(`Đã hẹn giờ tắt nhạc sau ${option} phút`, 'info');

    timerInterval = setInterval(() => {
      const current = get().remainingSeconds;
      if (current === null || current <= 1) {
        clearInterval(timerInterval);
        timerInterval = null;
        AsyncStorage.removeItem(SLEEP_TIMER_STORAGE_KEY).catch(() => {});
        set({
          activeOption: null,
          targetTimestamp: null,
          remainingSeconds: null,
          isTimerActive: false,
        });

        // Tạm dừng phát nhạc
        audioEngine.pause();
        useToastStore.getState().showToast('Đã tắt nhạc theo hẹn giờ ngủ', 'info');
      } else {
        set({ remainingSeconds: current - 1 });
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
    useToastStore.getState().showToast('Đã hủy hẹn giờ tắt nhạc', 'info');
  },

  openModal: () => {
    set({ isModalVisible: true });
  },

  closeModal: () => {
    set({ isModalVisible: false });
  },

  onTrackEnded: () => {
    if (get().activeOption === 'end_of_track') {
      get().cancelTimer();
      audioEngine.pause();
      useToastStore.getState().showToast('Đã dừng phát theo hẹn giờ khi hết bài', 'info');
    }
  },
}));
