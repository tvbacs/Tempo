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

  // Actions
  init: () => Promise<void>;
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
  playbackContext: PlaybackContext | null
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
      })
    );
  } catch (e) {
    console.warn('[PlayerStore] Failed to save last session:', e);
  }
};

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
    shuffleHistory: [],

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
              durationMs: session.currentSong.duration ? session.currentSong.duration * 1000 : 0,
              shuffleHistory: [session.currentSong.id],
            });
          }
        }
      } catch (err) {
        console.warn('[PlayerStore] Init error:', err);
      }
    },

    setPlaybackContext: (context) => set({ playbackContext: context }),

    playSong: async (song, newQueue, context) => {
      // Đặt lại quyền phát trên Điện thoại này nếu trước đó đang xem/kết nối PC
      const { useConnectStore } = require('./connectStore');
      const connect = useConnectStore.getState();
      if (connect.activeDevice.deviceId !== 'mobile-app') {
        useConnectStore.setState({
          activeDevice: {
            deviceId: 'mobile-app',
            deviceName: 'Điện thoại này',
            type: 'mobile',
            isOnline: true,
          },
        });
        connect.sendRemoteCommand('pause');
      }

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

      // Cập nhật shuffleHistory: thêm bài hiện tại vào danh sách đã nghe
      const prevHistory = get().shuffleHistory;
      const updatedHistory = prevHistory.includes(song.id)
        ? prevHistory
        : [...prevHistory, song.id];

      set({
        currentSong: song,
        queue,
        currentIndex,
        playbackContext: currentContext,
        shuffleHistory: updatedHistory,
        isLoading: true,
        isPlaying: false,
        positionMs: 0,
        durationMs: song.duration ? song.duration * 1000 : 0,
      });

      // Lưu phiên phát nhạc gần nhất vào AsyncStorage
      saveLastSession(song, queue, currentIndex, currentContext);

      // Ghi nhận lịch sử nghe nhạc tự động từ mọi nơi (Home, Search, Artist, Playlist, SeeAll)
      useLibraryStore.getState().recordHistory(song);

      const success = await audioEngine.loadAndPlay(song);
      set({ isLoading: false, isPlaying: success });
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
      const targetSongId = currentSong.id || currentSong.encodeId;

      if (!currentLoadedId || currentLoadedId !== targetSongId) {
        // Bài hiện tại chưa được nạp vào audio engine -> Nạp và phát bài mới ngay lập tức
        await playSong(currentSong, queue);
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
      const { queue, currentIndex, isShuffle, repeatMode, shuffleHistory, playSong, seekTo } = get();
      const { useConnectStore } = require('./connectStore');
      const connect = useConnectStore.getState();
      const isRemote = connect.activeDevice?.deviceId && connect.activeDevice.deviceId !== 'mobile-app';

      if (isRemote) {
        connect.sendRemoteCommand('next');
        return;
      }

      if (queue.length === 0) return;

      if (queue.length === 1) {
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

      // 1. Chế độ Trộn Bài (Shuffle = TRUE): Smart Random không lặp lại bài đã nghe
      if (isShuffle) {
        // Lấy danh sách các bài chưa phát trong hàng chờ
        const unplayed = queue.filter((s) => !shuffleHistory.includes(s.id));

        if (unplayed.length > 0) {
          // Chọn ngẫu nhiên 1 bài trong số các bài CHƯA phát
          const randIdx = Math.floor(Math.random() * unplayed.length);
          const nextSong = unplayed[randIdx];
          await playSong(nextSong, queue);
          return;
        } else {
          // Đã nghe hết toàn bộ danh sách ở chế độ shuffle
          if (repeatMode === 'all') {
            // Lặp lại toàn bộ: reset pool đã nghe (giữ lại bài vừa xong) và chọn bài ngẫu nhiên tiếp theo
            const currentSongId = get().currentSong?.id;
            const freshCandidates = queue.filter((s) => s.id !== currentSongId);
            const randIdx = Math.floor(Math.random() * freshCandidates.length);
            const nextSong = freshCandidates[randIdx] || queue[0];
            set({ shuffleHistory: [nextSong.id] });
            await playSong(nextSong, queue);
            return;
          } else {
            // repeatMode === 'off': dừng phát khi hết playlist
            set({ shuffleHistory: [] });
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
      const { queue, currentIndex, isShuffle, shuffleHistory, positionMs, playSong, seekTo } = get();
      const { useConnectStore } = require('./connectStore');
      const connect = useConnectStore.getState();
      const isRemote = connect.activeDevice?.deviceId && connect.activeDevice.deviceId !== 'mobile-app';

      if (isRemote) {
        connect.sendRemoteCommand('prev');
        return;
      }

      if (queue.length === 0) return;

      // Nếu đang phát quá 3 giây -> tua lại đầu bài hiện tại
      if (positionMs > 3000) {
        await seekTo(0);
        return;
      }

      // Nếu đang ở chế độ shuffle và có lịch sử shuffle
      if (isShuffle && shuffleHistory.length > 1) {
        const updatedHistory = [...shuffleHistory];
        updatedHistory.pop(); // Bỏ bài hiện tại
        const prevSongId = updatedHistory[updatedHistory.length - 1];
        const prevSong = queue.find((s) => s.id === prevSongId);

        if (prevSong) {
          set({ shuffleHistory: updatedHistory });
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
      set({
        isShuffle: newShuffle,
        shuffleHistory: get().currentSong ? [get().currentSong!.id] : [],
      });
      saveSettings(newShuffle, get().repeatMode);

      const { useConnectStore } = require('./connectStore');
      const connect = useConnectStore.getState();
      if (connect.activeDevice?.deviceId && connect.activeDevice.deviceId !== 'mobile-app') {
        connect.sendRemoteCommand('set_shuffle', { isShuffle: newShuffle });
      }

      try {
        const { useToastStore } = require('./toastStore');
        useToastStore.getState().showToast(
          newShuffle ? 'Đã bật phát ngẫu nhiên' : 'Đã tắt phát ngẫu nhiên',
          'info'
        );
      } catch (e) {}
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
        useToastStore.getState().showToast(
          nextMode === 'one'
            ? 'Lặp lại 1 bài'
            : nextMode === 'all'
            ? 'Lặp lại danh sách'
            : 'Tắt lặp lại',
          'info'
        );
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
