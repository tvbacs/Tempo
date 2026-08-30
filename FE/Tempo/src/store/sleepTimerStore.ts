/**
 * Global Sleep Timer State Machine (Zustand)
 * Đồng bộ hẹn giờ tắt nhạc trên toàn bộ ứng dụng
 * Strictly follows STANDARDS.md
 */
import { create } from 'zustand';
import { audioEngine } from '../services/audioPlayer';
import { useToastStore } from './toastStore';

export type SleepTimerOption = 5 | 10 | 15 | 30 | 45 | 60 | 'end_of_track' | null;

interface SleepTimerState {
  activeOption: SleepTimerOption;
  remainingSeconds: number | null;
  isTimerActive: boolean;
  isModalVisible: boolean;

  // Actions
  setTimer: (option: SleepTimerOption) => void;
  cancelTimer: () => void;
  openModal: () => void;
  closeModal: () => void;
  onTrackEnded: () => void;
}

let timerInterval: any = null;

export const useSleepTimerStore = create<SleepTimerState>((set, get) => ({
  activeOption: null,
  remainingSeconds: null,
  isTimerActive: false,
  isModalVisible: false,

  setTimer: (option: SleepTimerOption) => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    if (!option) {
      set({ activeOption: null, remainingSeconds: null, isTimerActive: false });
      useToastStore.getState().showToast('Đã tắt hẹn giờ', 'info');
      return;
    }

    if (option === 'end_of_track') {
      set({
        activeOption: 'end_of_track',
        remainingSeconds: null,
        isTimerActive: true,
      });
      useToastStore.getState().showToast('Sẽ dừng phát khi kết thúc bài hát này', 'info');
      return;
    }

    const totalSeconds = option * 60;
    set({
      activeOption: option,
      remainingSeconds: totalSeconds,
      isTimerActive: true,
    });

    useToastStore.getState().showToast(`Đã hẹn giờ tắt nhạc sau ${option} phút`, 'info');

    timerInterval = setInterval(() => {
      const current = get().remainingSeconds;
      if (current === null || current <= 1) {
        clearInterval(timerInterval);
        timerInterval = null;
        set({
          activeOption: null,
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

  cancelTimer: () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    set({
      activeOption: null,
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
