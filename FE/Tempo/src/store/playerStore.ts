/**
 * Global Player State Machine (Zustand + AsyncStorage Persistence)
 * Lưu trữ chế độ trộn bài (isShuffle), lặp bài (repeatMode), phiên phát gần nhất vào AsyncStorage.
 * Hỗ trợ Smart Random Shuffle (phát ngẫu nhiên không trùng lặp đến hết danh sách).
 * Strictly follows STANDARDS.md
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UnifiedSong } from '../types/music';
import { audioEngine } from '../services/audioPlayer';
import { useLibraryStore } from './libraryStore';

export type RepeatMode = 'off' | 'all' | 'one';

export interface PlaybackContext {
  type: 'liked' | 'downloaded' | 'playlist' | 'album' | 'chart' | 'artist' | 'search' | 'extracted' | 'single' | 'custom';
  title: string;
  id?: string;
}

const PLAYER_SETTINGS_STORAGE_KEY = '@tempo_player_settings';
const PLAYER_LAST_SESSION_STORAGE_KEY = '@tempo_player_last_session';

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
  shuffleHistory: string[]; // Danh sách ID các bài đã phát trong phiên shuffle
  shuffledQueue: UnifiedSong[]; // Hàng chờ trộn bài đồng bộ
  shuffledIndex: number; // Vị trí hiện tại trong hàng chờ trộn bài

  // Actions
  init: () => Promise<void>;
  playSong: (song: UnifiedSong, newQueue?: UnifiedSong[], context?: PlaybackContext) => Promise<void>;
  setPlaybackContext: (context: PlaybackContext | null) => void;
  togglePlayPause: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  playNext: () => Promise<void>;
  playPrev: () => Promise<void>;
  seekTo: (positionMs: number) => Promise<void>;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  openFullPlayer: () => void;
  closeFullPlayer: () => void;
  setQueue: (queue: UnifiedSong[]) => void;
  addToQueue: (song: UnifiedSong) => void;
  getNextTrack: () => { song: UnifiedSong; label: string } | null;
}

const saveSettings = async (isShuffle: boolean, repeatMode: RepeatMode) => {
  try {
    await AsyncStorage.setItem(
      PLAYER_SETTINGS_STORAGE_KEY,
      JSON.stringify({ isShuffle, repeatMode })
    );
  } catch (e) {
    console.warn('[PlayerStore] Failed to save settings:', e);
  }
};

const saveLastSession = async (
  currentSong: UnifiedSong | null,
  queue: UnifiedSong[],
  currentIndex: number,
  playbackContext: PlaybackContext | null,
  positionMs: number = 0
) => {
  try {
    if (!currentSong) return;
    await AsyncStorage.setItem(
      PLAYER_LAST_SESSION_STORAGE_KEY,
      JSON.stringify({
        currentSong,
        queue: queue.slice(0, 50), // Lưu tối đa 50 bài gần nhất
        currentIndex,
        playbackContext,
        positionMs,
      })
    );
  } catch (e) {
    console.warn('[PlayerStore] Failed to save last session:', e);
  }
};

const shuffleArray = <T>(array: T[]): T[] => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export const usePlayerStore = create<PlayerState>((set, get) => {
  // Listen to engine playback updates
  audioEngine.setStatusCallback((status) => {
    if (status.isLoaded) {
      // Ưu tiên duration chuẩn xác từ metadata
      const engineDurationMs = status.durationMillis || 0;
      const song = get().currentSong;
      const metaDurationMs = song?.duration ? song.duration * 1000 : 0;

      // Ưu tiên metaDurationMs để tránh AVPlayer ước lượng bitrate sai (bị x2 thời lượng), chỉ dùng engine nếu không có meta hoặc lệch dưới 6s
      let accurateDurationMs = metaDurationMs;
      if (!accurateDurationMs || accurateDurationMs <= 0) {
        accurateDurationMs = engineDurationMs;
      } else if (engineDurationMs > 1000 && Math.abs(engineDurationMs - metaDurationMs) < 6000) {
        accurateDurationMs = engineDurationMs;
      }

      // Clamp position — không bao giờ để position > duration
      const rawPosition = status.positionMillis || 0;
      const accuratePositionMs = accurateDurationMs > 0
        ? Math.min(rawPosition, accurateDurationMs)
        : rawPosition;

      set({
        isPlaying: status.isPlaying,
        positionMs: accuratePositionMs,
        durationMs: accurateDurationMs,
        isLoading: status.isBuffering,
      });
    }
  });

  // Track finished listener
  audioEngine.setTrackEndedCallback(() => {
    const { repeatMode, playNext, seekTo } = get();

    // 1. Kiểm tra hẹn giờ đi ngủ "Dừng khi hết bài hát"
    try {
      const { useSleepTimerStore } = require('./sleepTimerStore');
      const sleepTimer = useSleepTimerStore.getState();
      if (sleepTimer.isTimerActive && sleepTimer.activeOption === 'end_of_track') {
        sleepTimer.onTrackEnded();
        return;
      }
    } catch (e) {
      console.warn('[PlayerStore] SleepTimer callback error:', e);
    }

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
    shuffleHistory: [],
    shuffledQueue: [],
    shuffledIndex: -1,

    init: async () => {
      try {
        // Khôi phục cài đặt player (isShuffle, repeatMode)
        const settingsRaw = await AsyncStorage.getItem(PLAYER_SETTINGS_STORAGE_KEY);
        if (settingsRaw) {
          const settings = JSON.parse(settingsRaw);
          if (settings.isShuffle !== undefined) set({ isShuffle: !!settings.isShuffle });
          if (settings.repeatMode) set({ repeatMode: settings.repeatMode });
        }

        // Khôi phục phiên phát nhạc gần nhất (MiniPlayer sẵn sàng)
        const sessionRaw = await AsyncStorage.getItem(PLAYER_LAST_SESSION_STORAGE_KEY);
        if (sessionRaw) {
          const session = JSON.parse(sessionRaw);
          if (session.currentSong && !get().currentSong) {
            set({
              currentSong: session.currentSong,
              queue: session.queue || [session.currentSong],
              currentIndex: session.currentIndex ?? 0,
              playbackContext: session.playbackContext || null,
              positionMs: session.positionMs || 0,
              durationMs: session.currentSong.duration ? session.currentSong.duration * 1000 : 0,
              shuffleHistory: [session.currentSong.id],
              shuffledQueue: session.queue || [session.currentSong],
              shuffledIndex: session.currentIndex ?? 0,
            });
          }
        }
      } catch (err) {
        console.warn('[PlayerStore] Init error:', err);
      }
    },

    setPlaybackContext: (context) => set({ playbackContext: context }),

    playSong: async (song, newQueue, context) => {
      const { useConnectStore } = require('./connectStore');
      const connect = useConnectStore.getState();
      const isRemote = connect.activeDevice?.deviceId && connect.activeDevice.deviceId !== 'mobile-app';

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

      // Xử lý shuffledQueue
      const isShuffle = get().isShuffle;
      let shuffledQueue = get().shuffledQueue;
      let shuffledIndex = get().shuffledIndex;

      if (newQueue || shuffledQueue.length !== queue.length || !shuffledQueue.some(s => s.id === song.id)) {
        if (isShuffle) {
          const others = queue.filter(s => s.id !== song.id);
          shuffledQueue = [song, ...shuffleArray(others)];
          shuffledIndex = 0;
        } else {
          shuffledQueue = queue;
          shuffledIndex = currentIndex;
        }
      } else {
        const foundIdx = shuffledQueue.findIndex(s => s.id === song.id);
        if (foundIdx !== -1) {
          shuffledIndex = foundIdx;
        } else {
          shuffledIndex = currentIndex;
        }
      }

      // Xử lý context
      let currentContext = context !== undefined ? context : get().playbackContext;
      if (!currentContext) {
        currentContext = {
          type: 'single',
          title: song.album?.title || song.title,
        };
      }

      // Cập nhật shuffleHistory: nếu bắt đầu phiên phát từ context mới, reset về [song.id]
      let updatedHistory: string[];
      if (context !== undefined) {
        updatedHistory = [song.id];
      } else {
        const prevHistory = get().shuffleHistory;
        updatedHistory = prevHistory.includes(song.id)
          ? prevHistory
          : [...prevHistory, song.id];
      }

      // 1. Nếu đang chọn nghe trên Máy Tính (Web Player): Gửi lệnh phát bài sang Web PC (nếu PC còn sống)
      if (isRemote) {
        const isStillRemote = await connect.ensureActiveDeviceOrFallback();
        if (isStillRemote) {
          connect.sendRemoteCommand('play_track', {
            song,
            queue,
            positionMs: 0,
          });

          set({
            currentSong: song,
            queue,
            currentIndex,
            shuffledQueue,
            shuffledIndex,
            playbackContext: currentContext,
            shuffleHistory: updatedHistory,
            isLoading: false,
            isPlaying: true,
            positionMs: 0,
            durationMs: song.duration ? song.duration * 1000 : 0,
          });

          saveLastSession(song, queue, currentIndex, currentContext);
          useLibraryStore.getState().recordHistory(song);
          return;
        }
        // Nếu PC đã offline và tự động fallback về điện thoại -> Chạy tiếp luồng nạp audio điện thoại bên dưới
      }

      // 2. Nếu đang phát tại Điện Thoại Này: Dừng máy tính và phát tại điện thoại
      connect.sendRemoteCommand('pause');

      set({
        currentSong: song,
        queue,
        currentIndex,
        shuffledQueue,
        shuffledIndex,
        playbackContext: currentContext,
        shuffleHistory: updatedHistory,
        isLoading: true,
        isPlaying: false,
        positionMs: 0,
        durationMs: song.duration ? song.duration * 1000 : 0,
      });

      saveLastSession(song, queue, currentIndex, currentContext);
      useLibraryStore.getState().recordHistory(song);

      const success = await audioEngine.loadAndPlay(song);
      set({ isLoading: false, isPlaying: success });
      if (!success && queue.length > 1) {
        // Tự động chuyển bài kế tiếp nếu bài này không khả dụng
        setTimeout(() => {
          get().playNext();
        }, 500);
      }
    },

    togglePlayPause: async () => {
      const { isPlaying, currentSong, playSong, queue } = get();
      const { useConnectStore } = require('./connectStore');
      const connect = useConnectStore.getState();
      const isRemote = connect.activeDevice?.deviceId && connect.activeDevice.deviceId !== 'mobile-app';

      // 1. Nếu đang kết nối điều khiển thiết bị khác (như Web PC) -> Gửi lệnh Remote
      if (isRemote) {
        connect.sendRemoteCommand('toggle_play_pause');
        set({ isPlaying: !isPlaying });
        return;
      }

      if (!currentSong) {
        if (queue.length > 0) {
          await playSong(queue[0]);
        }
        return;
      }

      // 2. Nếu phát tại điện thoại: kiểm tra xem bài trong native audio player có khớp với currentSong không
      const currentLoadedId = audioEngine.getCurrentSongId();
      const targetSongId = currentSong.id || (currentSong as any).encodeId;

      if (!currentLoadedId || currentLoadedId !== targetSongId) {
        // Bài hiện tại chưa được nạp vào audio engine -> Nạp và tự động tua đến vị trí trước đó nếu có
        const savedPos = get().positionMs;
        await playSong(currentSong, queue);
        if (savedPos > 1000) {
          await get().seekTo(savedPos);
        }
        return;
      }

      if (isPlaying) {
        await audioEngine.pause();
        const { currentSong: cur, queue: q, currentIndex: cIdx, playbackContext: pCtx, positionMs: pMs } = get();
        set({ isPlaying: false });
        saveLastSession(cur, q, cIdx, pCtx, pMs);
      } else {
        await audioEngine.play();
        set({ isPlaying: true });
      }
    },

    pause: async () => {
      const { useConnectStore } = require('./connectStore');
      const connect = useConnectStore.getState();
      const isRemote = connect.activeDevice?.deviceId && connect.activeDevice.deviceId !== 'mobile-app';

      if (isRemote) {
        connect.sendRemoteCommand('pause');
      }

      await audioEngine.pause();
      const { currentSong, queue, currentIndex, playbackContext, positionMs } = get();
      set({ isPlaying: false });
      saveLastSession(currentSong, queue, currentIndex, playbackContext, positionMs);
    },

    resume: async () => {
      const { currentSong, queue, playSong, seekTo } = get();
      const { useConnectStore } = require('./connectStore');
      const connect = useConnectStore.getState();
      const isRemote = connect.activeDevice?.deviceId && connect.activeDevice.deviceId !== 'mobile-app';

      if (isRemote) {
        connect.sendRemoteCommand('play');
        set({ isPlaying: true });
        return;
      }

      if (!currentSong) {
        if (queue.length > 0) {
          await playSong(queue[0]);
        }
        return;
      }

      const currentLoadedId = audioEngine.getCurrentSongId();
      const targetSongId = currentSong.id || (currentSong as any).encodeId;
      if (!currentLoadedId || currentLoadedId !== targetSongId) {
        const savedPos = get().positionMs;
        await playSong(currentSong, queue);
        if (savedPos > 1000) {
          await seekTo(savedPos);
        }
        return;
      }

      await audioEngine.play();
      set({ isPlaying: true });
    },

    playNext: async () => {
      const { queue, currentIndex, isShuffle, repeatMode, shuffledQueue, shuffledIndex, playSong, seekTo } = get();
      const { useConnectStore } = require('./connectStore');
      const connect = useConnectStore.getState();
      const isRemote = connect.activeDevice?.deviceId && connect.activeDevice.deviceId !== 'mobile-app';

      if (isRemote) {
        connect.sendRemoteCommand('next');
        return;
      }

      if (queue.length === 0) return;

      if (queue.length === 1) {
        try {
          const { useToastStore } = require('./toastStore');
          useToastStore.getState().showToast(
            'Danh sách chỉ có 1 bài hát. Hãy thêm vào Thư viện hoặc Playlist để chuyển bài!',
            'info'
          );
        } catch (e) {}

        if (repeatMode === 'off') {
          await seekTo(0);
          await audioEngine.pause();
          set({ isPlaying: false });
        } else {
          await seekTo(0);
          await audioEngine.play();
        }
        return;
      }

      // 1. Chế độ Trộn Bài (Shuffle = TRUE): Phát chính xác bài tiếp theo trong shuffledQueue
      if (isShuffle) {
        const activeShuffled = shuffledQueue.length > 0 ? shuffledQueue : queue;
        const nextIdx = shuffledIndex + 1;

        if (nextIdx < activeShuffled.length) {
          const nextSong = activeShuffled[nextIdx];
          set({ shuffledIndex: nextIdx });
          await playSong(nextSong, queue);
          return;
        } else {
          // Đã nghe hết toàn bộ danh sách shuffle
          if (repeatMode === 'all') {
            const currentSongId = get().currentSong?.id;
            const others = queue.filter((s) => s.id !== currentSongId);
            const newShuffled = [get().currentSong!, ...shuffleArray(others)].filter(Boolean) as UnifiedSong[];
            const nextSong = newShuffled[1] || queue[0];
            set({
              shuffledQueue: newShuffled,
              shuffledIndex: 1,
            });
            await playSong(nextSong, queue);
            return;
          } else {
            // repeatMode === 'off': dừng phát khi hết danh sách
            await seekTo(0);
            await audioEngine.pause();
            set({ isPlaying: false });
            return;
          }
        }
      }

      // 2. Chế độ Phát Tuần Tự (Shuffle = FALSE): Theo đúng thứ tự 1, 2, 3...
      const nextIndex = currentIndex + 1;

      if (nextIndex < queue.length) {
        const nextSong = queue[nextIndex];
        await playSong(nextSong, queue);
      } else {
        // Đã đến cuối danh sách
        if (repeatMode === 'all') {
          // Lặp lại từ bài đầu tiên
          await playSong(queue[0], queue);
        } else {
          // repeatMode === 'off': Dừng phát
          await seekTo(0);
          await audioEngine.pause();
          set({ isPlaying: false });
        }
      }
    },

    playPrev: async () => {
      const { queue, currentIndex, isShuffle, shuffledQueue, shuffledIndex, positionMs, playSong, seekTo } = get();
      const { useConnectStore } = require('./connectStore');
      const connect = useConnectStore.getState();
      const isRemote = connect.activeDevice?.deviceId && connect.activeDevice.deviceId !== 'mobile-app';

      if (isRemote) {
        connect.sendRemoteCommand('prev');
        return;
      }

      if (queue.length === 0) return;

      if (queue.length === 1) {
        try {
          const { useToastStore } = require('./toastStore');
          useToastStore.getState().showToast(
            'Danh sách chỉ có 1 bài hát. Hãy thêm vào Thư viện hoặc Playlist để chuyển bài!',
            'info'
          );
        } catch (e) {}
        await seekTo(0);
        return;
      }

      // Nếu đang phát quá 3 giây -> tua lại đầu bài hiện tại
      if (positionMs > 3000) {
        await seekTo(0);
        return;
      }

      // Nếu đang ở chế độ shuffle
      if (isShuffle) {
        const activeShuffled = shuffledQueue.length > 0 ? shuffledQueue : queue;
        const prevIdx = shuffledIndex - 1;
        if (prevIdx >= 0 && prevIdx < activeShuffled.length) {
          const prevSong = activeShuffled[prevIdx];
          set({ shuffledIndex: prevIdx });
          await playSong(prevSong, queue);
          return;
        }
      }

      // Mặc định tuần tự: lùi lại 1 bài
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

        // Người dùng Free: Khóa chế độ phát ngẫu nhiên (ép bật shuffle)
        if (!isVip) {
          set({ isShuffle: true });
          saveSettings(true, get().repeatMode);
          useToastStore.getState().showToast(
            'Nâng cấp VIP để mở khóa tính năng tắt trộn bài & nghe theo thứ tự!',
            'info'
          );
          return;
        }
      } catch (e) {}

      // Người dùng VIP: Mở khóa bật/tắt tự do
      const newShuffle = !get().isShuffle;
      const { currentSong, queue } = get();
      let shuffledQueue = queue;
      let shuffledIndex = get().currentIndex;

      if (newShuffle && currentSong) {
        const others = queue.filter((s) => s.id !== currentSong.id);
        shuffledQueue = [currentSong, ...shuffleArray(others)];
        shuffledIndex = 0;
      }

      set({
        isShuffle: newShuffle,
        shuffledQueue,
        shuffledIndex,
        shuffleHistory: currentSong ? [currentSong.id] : [],
      });
      saveSettings(newShuffle, get().repeatMode);

      const { useConnectStore } = require('./connectStore');
      const connect = useConnectStore.getState();
      if (connect.activeDevice?.deviceId && connect.activeDevice.deviceId !== 'mobile-app') {
        connect.sendRemoteCommand('set_shuffle', { isShuffle: newShuffle });
      }

      try {
        const { useToastStore } = require('./toastStore');
        if (get().queue.length <= 1) {
          useToastStore.getState().showToast(
            'Đang phát 1 bài. Thêm bài hát vào Thư viện hoặc Playlist để dùng tính năng Trộn bài!',
            'info'
          );
        } else {
          useToastStore.getState().showToast(
            newShuffle ? 'Đã bật phát ngẫu nhiên' : 'Đã tắt phát ngẫu nhiên',
            'info'
          );
        }
      } catch (e) {}
    },

    getNextTrack: () => {
      const { currentSong, queue, isShuffle, repeatMode, shuffledQueue, shuffledIndex, currentIndex } = get();
      if (!currentSong || queue.length === 0) return null;

      if (repeatMode === 'one') {
        return {
          song: currentSong,
          label: 'BÀI TIẾP THEO (LẶP LẠI BÀI NÀY)',
        };
      }

      if (isShuffle) {
        const activeShuffled = shuffledQueue.length > 0 ? shuffledQueue : queue;
        const nextIdx = shuffledIndex + 1;
        if (nextIdx < activeShuffled.length) {
          return {
            song: activeShuffled[nextIdx],
            label: 'BÀI TIẾP THEO (TRỘN NGẪU NHIÊN)',
          };
        }
        if (repeatMode === 'all' && activeShuffled.length > 0) {
          return {
            song: activeShuffled[0],
            label: 'BÀI TIẾP THEO (LẶP LẠI DANH SÁCH)',
          };
        }
        return null;
      }

      // Tuần tự
      const nextIdx = currentIndex + 1;
      if (nextIdx < queue.length) {
        return {
          song: queue[nextIdx],
          label: 'BÀI TIẾP THEO',
        };
      }
      if (repeatMode === 'all') {
        return {
          song: queue[0],
          label: 'BÀI TIẾP THEO (LẶP LẠI TỪ ĐẦU)',
        };
      }
      return null;
    },

    cycleRepeat: () => {
      const modes: RepeatMode[] = ['off', 'all', 'one'];
      const currentIdx = modes.indexOf(get().repeatMode);
      const nextMode = modes[(currentIdx + 1) % modes.length];

      set({ repeatMode: nextMode });
      saveSettings(get().isShuffle, nextMode);

      const { useConnectStore } = require('./connectStore');
      const connect = useConnectStore.getState();
      if (connect.activeDevice?.deviceId && connect.activeDevice.deviceId !== 'mobile-app') {
        connect.sendRemoteCommand('set_repeat', { repeatMode: nextMode });
      }

      try {
        const { useToastStore } = require('./toastStore');
        if (get().queue.length <= 1) {
          if (nextMode === 'one') {
            useToastStore.getState().showToast('Lặp lại 1 bài hát này', 'info');
          } else if (nextMode === 'all') {
            useToastStore.getState().showToast(
              'Danh sách chỉ có 1 bài. Thêm vào Playlist để lặp lại nhiều bài!',
              'info'
            );
          } else {
            useToastStore.getState().showToast('Tắt lặp lại', 'info');
          }
        } else {
          useToastStore.getState().showToast(
            nextMode === 'one'
              ? 'Lặp lại 1 bài'
              : nextMode === 'all'
              ? 'Lặp lại danh sách'
              : 'Tắt lặp lại',
            'info'
          );
        }
      } catch (e) {}
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
