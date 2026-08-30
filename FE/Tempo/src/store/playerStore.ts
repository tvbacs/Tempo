/**
 * Global Player State Machine (Zustand)
 * Strictly follows STANDARDS.md
 */
import { create } from 'zustand';
import { UnifiedSong } from '../types/music';
import { audioEngine } from '../services/audioPlayer';
import { useLibraryStore } from './libraryStore';

export type RepeatMode = 'off' | 'all' | 'one';

export interface PlaybackContext {
  type: 'liked' | 'downloaded' | 'playlist' | 'album' | 'chart' | 'artist' | 'search' | 'extracted' | 'single' | 'custom';
  title: string;
  id?: string;
}

interface PlayerState {
  currentSong: UnifiedSong | null;
  isPlaying: boolean;
  isLoading: boolean;
  queue: UnifiedSong[];
  currentIndex: number;
  positionMs: number;
  durationMs: number;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  isFullPlayerVisible: boolean;
  playbackContext: PlaybackContext | null;

  // Actions
  playSong: (song: UnifiedSong, newQueue?: UnifiedSong[], context?: PlaybackContext) => Promise<void>;
  setPlaybackContext: (context: PlaybackContext | null) => void;
  togglePlayPause: () => Promise<void>;
  playNext: () => Promise<void>;
  playPrev: () => Promise<void>;
  seekTo: (positionMs: number) => Promise<void>;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  openFullPlayer: () => void;
  closeFullPlayer: () => void;
  setQueue: (queue: UnifiedSong[]) => void;
  addToQueue: (song: UnifiedSong) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => {
  // Listen to engine playback updates
  audioEngine.setStatusCallback((status) => {
    if (status.isLoaded) {
      // Ưu tiên duration thực từ audio engine — metadata thường lệch vài giây
      const engineDurationMs = status.durationMillis || 0;
      const song = get().currentSong;
      const metaDurationMs = song?.duration ? song.duration * 1000 : 0;

      // Dùng engine duration nếu hợp lệ (> 1s), fallback sang metadata
      const accurateDurationMs = engineDurationMs > 1000 ? engineDurationMs : metaDurationMs;

      // Clamp position — không bao giờ để position > duration
      const rawPosition = status.positionMillis || 0;
      const clampedPosition = accurateDurationMs > 0
        ? Math.min(rawPosition, accurateDurationMs)
        : rawPosition;

      set({
        isPlaying: status.isPlaying,
        positionMs: clampedPosition,
        durationMs: accurateDurationMs,
        isLoading: status.isBuffering,
      });
    }
  });

  // Automatically play next song when current track ends
  audioEngine.setTrackEndedCallback(() => {
    const { repeatMode, playNext, seekTo } = get();
    try {
      const { useSleepTimerStore } = require('./sleepTimerStore');
      if (useSleepTimerStore.getState().activeOption === 'end_of_track') {
        useSleepTimerStore.getState().onTrackEnded();
        return;
      }
    } catch (e) {}

    if (repeatMode === 'one') {
      seekTo(0).then(() => audioEngine.play());
    } else {
      playNext();
    }
  });

  return {
    currentSong: null,
    isPlaying: false,
    isLoading: false,
    queue: [],
    currentIndex: -1,
    positionMs: 0,
    durationMs: 0,
    isShuffle: false,
    repeatMode: 'off',
    isFullPlayerVisible: false,
    playbackContext: null,

    setPlaybackContext: (context) => set({ playbackContext: context }),

    playSong: async (song, newQueue, context) => {
      let queue = get().queue;
      let currentIndex = get().currentIndex;

      if (newQueue && newQueue.length > 0) {
        queue = newQueue;
        currentIndex = queue.findIndex((s) => s.id === song.id);
        if (currentIndex === -1) {
          queue = [song, ...queue];
          currentIndex = 0;
        }
      } else if (!queue.some((s) => s.id === song.id)) {
        queue = [...queue, song];
        currentIndex = queue.length - 1;
      } else {
        currentIndex = queue.findIndex((s) => s.id === song.id);
      }

      // Xử lý context: nếu có truyền context mới thì lưu, nếu không giữ context cũ hoặc fallback single
      let currentContext = context !== undefined ? context : get().playbackContext;
      if (!currentContext) {
        currentContext = {
          type: 'single',
          title: song.album?.title || song.title,
        };
      }

      set({
        currentSong: song,
        queue,
        currentIndex,
        playbackContext: currentContext,
        isLoading: true,
        isPlaying: false,
        positionMs: 0,
        durationMs: song.duration ? song.duration * 1000 : 0,
      });

      // Ghi nhận lịch sử nghe nhạc tự động từ mọi nơi (Home, Search, Artist, Playlist, SeeAll)
      useLibraryStore.getState().recordHistory(song);

      const success = await audioEngine.loadAndPlay(song);
      set({ isLoading: false, isPlaying: success });
    },

    togglePlayPause: async () => {
      const { isPlaying, currentSong, playSong, queue } = get();
      if (!currentSong) {
        if (queue.length > 0) {
          await playSong(queue[0]);
        }
        return;
      }

      if (isPlaying) {
        await audioEngine.pause();
        set({ isPlaying: false });
      } else {
        await audioEngine.play();
        set({ isPlaying: true });
      }
    },

    playNext: async () => {
      const { queue, currentIndex, isShuffle, playSong, seekTo } = get();
      if (queue.length === 0) return;

      if (queue.length === 1) {
        await seekTo(0);
        return;
      }

      let nextIndex = currentIndex + 1;
      if (isShuffle) {
        let rand = Math.floor(Math.random() * queue.length);
        if (rand === currentIndex && queue.length > 1) {
          rand = (rand + 1) % queue.length;
        }
        nextIndex = rand;
      } else if (nextIndex >= queue.length) {
        nextIndex = 0;
      }

      const nextSong = queue[nextIndex];
      if (nextSong) {
        await playSong(nextSong, queue);
      }
    },

    playPrev: async () => {
      const { queue, currentIndex, positionMs, playSong, seekTo } = get();
      if (queue.length === 0) return;

      if (positionMs > 3000) {
        await seekTo(0);
        return;
      }

      let prevIndex = currentIndex - 1;
      if (prevIndex < 0) {
        prevIndex = queue.length - 1;
      }

      const prevSong = queue[prevIndex];
      if (prevSong) {
        await playSong(prevSong, queue);
      }
    },

    seekTo: async (positionMs: number) => {
      set({ positionMs });
      await audioEngine.seekTo(positionMs);
    },

    toggleShuffle: () => {
      try {
        const { useAuthStore } = require('./authStore');
        const { useToastStore } = require('./toastStore');
        const user = useAuthStore.getState().user;
        const isVip = user?.isVip;

        if (!isVip) {
          // Khóa chế độ phát ngẫu nhiên cho người dùng Free
          set({ isShuffle: true });
          useToastStore.getState().showToast(
            'Nâng cấp VIP để mở khóa tính năng tắt trộn bài & nghe theo thứ tự!',
            'vip'
          );
          return;
        }
      } catch (e) {}

      set((state) => ({ isShuffle: !state.isShuffle }));
    },

    cycleRepeat: () => {
      set((state) => {
        const modes: RepeatMode[] = ['off', 'all', 'one'];
        const currentIdx = modes.indexOf(state.repeatMode);
        const nextMode = modes[(currentIdx + 1) % modes.length];
        return { repeatMode: nextMode };
      });
    },

    openFullPlayer: () => {
      set({ isFullPlayerVisible: true });
    },

    closeFullPlayer: () => {
      set({ isFullPlayerVisible: false });
    },

    setQueue: (queue) => {
      set({ queue });
    },

    addToQueue: (song) => {
      set((state) => ({ queue: [...state.queue, song] }));
    },
  };
});
