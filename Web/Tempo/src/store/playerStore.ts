import { create } from 'zustand';
import { UnifiedSong, LyricSentence } from '../types/music';
import { apiClient } from '../api/client';
import { useLibraryStore } from './libraryStore';
import { useConnectStore } from './connectStore';

// Persist helpers
const STORAGE_KEY = 'tempo_player_state';
function savePlayerState(song: UnifiedSong | null, queue: UnifiedSong[], currentIndex: number) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ song, queue, currentIndex }));
  } catch (_) {}
}
function loadPlayerState(): { song: UnifiedSong | null; queue: UnifiedSong[]; currentIndex: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return { song: null, queue: [], currentIndex: -1 };
}
const _saved = loadPlayerState();

export type RepeatMode = 'off' | 'all' | 'one';

const SETTINGS_KEY = 'tempo_player_settings';
interface PlayerSettings {
  volume: number;
  isShuffle: boolean;
  repeatMode: RepeatMode;
}
function savePlayerSettings(settings: Partial<PlayerSettings>) {
  try {
    const current = loadPlayerSettings();
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...current, ...settings }));
  } catch (_) {}
}
function loadPlayerSettings(): PlayerSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return { volume: 0.8, isShuffle: false, repeatMode: 'off' };
}
const _savedSettings = loadPlayerSettings();

function generateShuffledQueue(current: UnifiedSong | null, originalQueue: UnifiedSong[]): UnifiedSong[] {
  if (originalQueue.length <= 1) return [...originalQueue];
  const others = originalQueue.filter(
    (s) => (s.encodeId || s.id) !== (current?.encodeId || current?.id)
  );
  for (let i = others.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [others[i], others[j]] = [others[j], others[i]];
  }
  return current ? [current, ...others] : others;
}

interface PlayerState {
  currentSong: UnifiedSong | null;
  isPlaying: boolean;
  isLoading: boolean;
  loadingSongId: string | null;
  isAutoplayBlocked: boolean;
  queue: UnifiedSong[];
  shuffledQueue: UnifiedSong[];
  currentIndex: number;
  positionSec: number;
  durationSec: number;
  volume: number; // 0..1
  isShuffle: boolean;
  isRepeat: boolean;
  repeatMode: RepeatMode;
  lyrics: LyricSentence[];
  isLyricsOpen: boolean;

  audioElement: HTMLAudioElement | null;

  initAudio: () => void;
  playSong: (song: UnifiedSong, newQueue?: UnifiedSong[], startPosSec?: number) => Promise<void>;
  togglePlayPause: () => void;
  playNext: (delayMs?: any) => void;
  playPrev: () => void;
  seekTo: (sec: number) => void;
  setVolume: (vol: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setShuffle: (val: boolean) => void;
  setRepeat: (val: boolean | RepeatMode) => void;
  setRepeatMode: (mode: RepeatMode) => void;
  toggleLyrics: () => void;
  setLyricsOpen: (open: boolean) => void;
}

let autoNextTimeoutId: any = null;

const clearAutoNextTimeout = () => {
  if (autoNextTimeoutId) {
    clearTimeout(autoNextTimeoutId);
    autoNextTimeoutId = null;
  }
};

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentSong: _saved.song,
  isPlaying: false,
  isLoading: false,
  loadingSongId: null,
  isAutoplayBlocked: false,
  queue: _saved.queue,
  shuffledQueue: _savedSettings.isShuffle ? generateShuffledQueue(_saved.song, _saved.queue) : [],
  currentIndex: _saved.currentIndex,
  positionSec: 0,
  durationSec: _saved.song?.duration || 0,
  volume: _savedSettings.volume ?? 0.8,
  isShuffle: _savedSettings.isShuffle ?? false,
  isRepeat: (_savedSettings.repeatMode ?? 'off') !== 'off',
  repeatMode: _savedSettings.repeatMode ?? 'off',
  lyrics: [],
  isLyricsOpen: false,
  audioElement: null,

  initAudio: () => {
    if (get().audioElement) return;
    const audio = new Audio();
    audio.preload = 'auto';
    audio.volume = get().volume;

    // Nếu có bài hát đã lưu từ phiên trước, nạp lyrics sẵn sàng
    const savedSong = get().currentSong;
    if (savedSong) {
      apiClient.getLyrics(savedSong.encodeId || savedSong.id).then(lyrics => set({ lyrics }));
    }

    audio.addEventListener('timeupdate', () => {
      const current = audio.currentTime;
      const song = get().currentSong;
      const metaDurationSec = song?.duration || 0;
      const audioDuration = audio.duration;
      let validDuration = metaDurationSec;
      if (!validDuration || validDuration <= 0) {
        validDuration = (audioDuration && !isNaN(audioDuration) && isFinite(audioDuration)) ? audioDuration : 0;
      } else if (audioDuration && !isNaN(audioDuration) && isFinite(audioDuration) && Math.abs(audioDuration - metaDurationSec) < 6) {
        validDuration = audioDuration;
      }
      set({ positionSec: current, durationSec: validDuration });
    });

    audio.addEventListener('play', () => {
      set({ isPlaying: true });
      useConnectStore.getState().broadcastState();
    });

    audio.addEventListener('pause', () => {
      set({ isPlaying: false, isLoading: false, loadingSongId: null });
      useConnectStore.getState().broadcastState();
    });

    audio.addEventListener('waiting', () => {
      if (audio.src && !audio.paused) {
        set({ isLoading: true });
      }
    });

    audio.addEventListener('playing', () => {
      set({ isPlaying: true, isLoading: false, loadingSongId: null });
      useConnectStore.getState().broadcastState();
    });

    audio.addEventListener('canplay', () => {
      set({ isLoading: false, loadingSongId: null });
    });

    audio.addEventListener('seeking', () => {
      if (audio.src && !audio.paused) {
        set({ isLoading: true });
      }
    });

    audio.addEventListener('seeked', () => {
      set({ isLoading: false });
    });

    audio.addEventListener('error', () => {
      set({ isLoading: false, loadingSongId: null, isPlaying: false });
      const { queue, currentSong } = get();
      if (queue.length > 1 && currentSong) {
        clearAutoNextTimeout();
        autoNextTimeoutId = setTimeout(() => {
          autoNextTimeoutId = null;
          if (!get().isPlaying) {
            get().playNext();
          }
        }, 750);
      }
    });

    audio.addEventListener('ended', () => {
      const { repeatMode, currentSong, queue } = get();
      if (repeatMode === 'one' && currentSong) {
        audio.pause();
        audio.currentTime = 0;
        set({ isLoading: true, isPlaying: false, positionSec: 0 });
        useConnectStore.getState().broadcastState();
        clearAutoNextTimeout();
        autoNextTimeoutId = setTimeout(() => {
          autoNextTimeoutId = null;
          get().playSong(currentSong, queue);
        }, 750);
      } else {
        get().playNext(750);
      }
    });

    set({ audioElement: audio });

    // Tích hợp phím tắt bàn phím Space / ArrowLeft / ArrowRight / Mute
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', (e: KeyboardEvent) => {
        const target = e.target as HTMLElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
          return;
        }

        if (e.code === 'Space') {
          e.preventDefault();
          get().togglePlayPause();
        } else if (e.code === 'ArrowRight') {
          e.preventDefault();
          const { positionSec, durationSec } = get();
          get().seekTo(Math.min(durationSec, positionSec + 5));
        } else if (e.code === 'ArrowLeft') {
          e.preventDefault();
          const { positionSec } = get();
          get().seekTo(Math.max(0, positionSec - 5));
        } else if (e.code === 'KeyM') {
          e.preventDefault();
          const currentVol = get().volume;
          get().setVolume(currentVol > 0 ? 0 : 0.8);
        }
      });
    }
  },

  playSong: async (song, newQueue, startPosSec = 0) => {
    clearAutoNextTimeout();
    if (!get().audioElement) {
      get().initAudio();
    }

    const audio = get().audioElement;
    if (audio) {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch (_) {}
    }

    let queue = newQueue || get().queue;
    if (!queue.some(s => (s.encodeId || s.id) === (song.encodeId || song.id))) {
      queue = [song, ...queue];
    }
    const currentIndex = queue.findIndex(s => (s.encodeId || s.id) === (song.encodeId || song.id));
    const shuffledQueue = get().isShuffle ? generateShuffledQueue(song, queue) : [];

    savePlayerState(song, queue, currentIndex);

    // 1. Đặt Web PC làm active device
    useConnectStore.setState({ activeDeviceId: 'web-player-pc', activeDeviceName: 'Web Player (PC)' });

    set({
      currentSong: song,
      queue,
      shuffledQueue,
      currentIndex,
      isLoading: true,
      isPlaying: false,
      loadingSongId: song.encodeId || song.id,
      positionSec: startPosSec,
      durationSec: song.duration || 0,
    });

    useLibraryStore.getState().recordHistory(song);

    // Update Browser MediaSession (Lock Screen / Media Keys)
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: song.title || 'Tempo Track',
          artist: song.artistsNames || 'Tempo Artist',
          album: song.album?.title || 'Tempo Web Player',
          artwork: [
            {
              src: song.thumbnail || song.thumbnailM || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
              sizes: '512x512',
              type: 'image/jpeg',
            },
          ],
        });

        navigator.mediaSession.setActionHandler('play', () => get().togglePlayPause());
        navigator.mediaSession.setActionHandler('pause', () => get().togglePlayPause());
        navigator.mediaSession.setActionHandler('nexttrack', () => get().playNext());
        navigator.mediaSession.setActionHandler('previoustrack', () => get().playPrev());
        navigator.mediaSession.setActionHandler('seekto', (details) => {
          if (details.seekTime !== undefined) get().seekTo(details.seekTime);
        });
      } catch (_) {}
    }

    // Fetch lyrics
    apiClient.getLyrics(song.encodeId || song.id).then(lyrics => set({ lyrics }));

    // Get stream URL
    let streamUrl = song.audioUrl;
    if (!streamUrl || streamUrl.startsWith('file://')) {
      streamUrl = await apiClient.getSongStream(song.encodeId || song.id, song.title, song.artistsNames) || undefined;
    }

    const currentAudio = get().audioElement;
    if (currentAudio && streamUrl) {
      currentAudio.src = streamUrl;
      currentAudio.currentTime = startPosSec;
      currentAudio.play().then(() => {
        set({ isPlaying: true, isLoading: false, loadingSongId: null, isAutoplayBlocked: false });
        useConnectStore.getState().broadcastState();
      }).catch((err) => {
        console.warn('[Web Player] Autoplay prevented:', err.message);
        // Trình duyệt chặn do chưa có tương tác chuột trên trang web
        set({ isPlaying: false, isLoading: false, loadingSongId: null, isAutoplayBlocked: true });
        useConnectStore.getState().broadcastState();
      });
    } else {
      set({ isLoading: false, loadingSongId: null });
      useConnectStore.getState().broadcastState();
      if (queue.length > 1) {
        clearAutoNextTimeout();
        autoNextTimeoutId = setTimeout(() => {
          autoNextTimeoutId = null;
          const current = get().currentSong;
          const currentId = current?.encodeId || current?.id;
          const targetId = song.encodeId || song.id;
          if (currentId === targetId && !get().isPlaying) {
            get().playNext();
          }
        }, 750);
      }
    }
  },

  togglePlayPause: () => {
    clearAutoNextTimeout();
    if (!get().audioElement) {
      get().initAudio();
    }
    const audio = get().audioElement;
    const { currentSong, queue, positionSec } = get();

    // 1. Nếu chưa có bài hát nào được chọn thì không làm gì
    if (!currentSong) return;

    // 2. Nếu audio chưa được gán src (ví dụ bài hát được khôi phục từ localStorage khi mới vào web)
    if (!audio || !audio.src) {
      get().playSong(currentSong, queue.length > 0 ? queue : [currentSong], positionSec);
      return;
    }

    const connect = useConnectStore.getState();
    const isRemote = connect.activeDeviceId !== 'web-player-pc';

    if (isRemote) {
      connect.sendCommand('toggle_play_pause');
      set({ isPlaying: !get().isPlaying });
      return;
    }

    if (audio.paused) {
      audio.play().then(() => {
        set({ isPlaying: true, isAutoplayBlocked: false });
        useConnectStore.getState().broadcastState();
      }).catch(() => {
        // Nếu link stream cũ bị hết hạn, tự động fetch link mới và phát tiếp
        get().playSong(currentSong, queue, audio.currentTime || positionSec);
      });
    } else {
      audio.pause();
      set({ isPlaying: false });
      useConnectStore.getState().broadcastState();
    }
  },

  playNext: (delayMs?: any) => {
    const delay = typeof delayMs === 'number' ? delayMs : 0;
    clearAutoNextTimeout();
    const connect = useConnectStore.getState();
    const isRemote = connect.activeDeviceId !== 'web-player-pc';

    if (isRemote) {
      connect.sendCommand('next');
      return;
    }

    const { queue, currentIndex, isShuffle, shuffledQueue, repeatMode } = get();
    if (queue.length === 0) return;

    if (repeatMode === 'one') {
      const audio = get().audioElement;
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
        useConnectStore.getState().broadcastState();
      }
      return;
    }

    let nextSong: any = null;
    let newShuffledQueue = shuffledQueue;

    if (isShuffle) {
      const activeQueue = shuffledQueue.length > 0 ? shuffledQueue : queue;
      const currentShuffledIdx = activeQueue.findIndex(
        (s) => (s.encodeId || s.id) === (get().currentSong?.encodeId || get().currentSong?.id)
      );
      if (currentShuffledIdx >= 0 && currentShuffledIdx + 1 < activeQueue.length) {
        nextSong = activeQueue[currentShuffledIdx + 1];
      } else if (repeatMode === 'all') {
        newShuffledQueue = generateShuffledQueue(null, queue);
        set({ shuffledQueue: newShuffledQueue });
        nextSong = newShuffledQueue[0];
      } else {
        const audio = get().audioElement;
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
        set({ isPlaying: false, positionSec: 0 });
        useConnectStore.getState().broadcastState();
        return;
      }
    } else {
      if (currentIndex + 1 < queue.length) {
        nextSong = queue[currentIndex + 1];
      } else if (repeatMode === 'all') {
        nextSong = queue[0];
      } else {
        const audio = get().audioElement;
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
        set({ isPlaying: false, positionSec: 0 });
        useConnectStore.getState().broadcastState();
        return;
      }
    }

    if (!nextSong) return;

    const audio = get().audioElement;
    if (audio) {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch (_) {}
    }

    // Reset ngay lập tức toàn bộ data sang bài mới, hiển thị loading, position 0
    set({
      currentSong: nextSong,
      isLoading: true,
      isPlaying: false,
      positionSec: 0,
      durationSec: nextSong.duration || 0,
    });
    useConnectStore.getState().broadcastState();

    if (delay > 0) {
      clearAutoNextTimeout();
      autoNextTimeoutId = setTimeout(() => {
        autoNextTimeoutId = null;
        get().playSong(nextSong, queue);
      }, delay);
    } else {
      get().playSong(nextSong, queue);
    }
  },

  playPrev: () => {
    clearAutoNextTimeout();
    const connect = useConnectStore.getState();
    const isRemote = connect.activeDeviceId !== 'web-player-pc';

    if (isRemote) {
      connect.sendCommand('prev');
      return;
    }

    const { queue, currentIndex, audioElement } = get();
    if (audioElement && audioElement.currentTime > 3) {
      audioElement.currentTime = 0;
      return;
    }
    if (queue.length === 0) return;
    if (currentIndex > 0) {
      get().playSong(queue[currentIndex - 1], queue);
    } else {
      get().playSong(queue[queue.length - 1], queue);
    }
  },

  seekTo: (sec) => {
    clearAutoNextTimeout();
    const connect = useConnectStore.getState();
    const isRemote = connect.activeDeviceId !== 'web-player-pc';

    if (isRemote) {
      connect.sendCommand('seek', { positionMs: Math.floor(sec * 1000) });
      set({ positionSec: sec });
      return;
    }

    const audio = get().audioElement;
    if (audio) {
      audio.currentTime = sec;
      set({ positionSec: sec });
      useConnectStore.getState().broadcastState();
    }
  },

  setVolume: (vol) => {
    const audio = get().audioElement;
    if (audio) audio.volume = vol;
    set({ volume: vol });
    savePlayerSettings({ volume: vol });
  },

  toggleShuffle: () => {
    const nextVal = !get().isShuffle;
    const { currentSong, queue } = get();
    const shuffledQueue = nextVal ? generateShuffledQueue(currentSong, queue) : [];
    set({ isShuffle: nextVal, shuffledQueue });
    savePlayerSettings({ isShuffle: nextVal });
    const connect = useConnectStore.getState();
    if (connect.activeDeviceId !== 'web-player-pc') {
      connect.sendCommand('set_shuffle', { isShuffle: nextVal });
    }
    useConnectStore.getState().broadcastState();
  },

  toggleRepeat: () => {
    const current = get().repeatMode;
    let nextMode: RepeatMode = 'off';
    if (current === 'off') nextMode = 'all';
    else if (current === 'all') nextMode = 'one';
    else if (current === 'one') nextMode = 'off';

    set({ repeatMode: nextMode, isRepeat: nextMode !== 'off' });
    savePlayerSettings({ repeatMode: nextMode });
    const connect = useConnectStore.getState();
    if (connect.activeDeviceId !== 'web-player-pc') {
      connect.sendCommand('set_repeat', { repeatMode: nextMode, isRepeat: nextMode !== 'off' });
    }
    useConnectStore.getState().broadcastState();
  },

  setShuffle: (val) => {
    set({ isShuffle: val });
    savePlayerSettings({ isShuffle: val });
  },
  setRepeatMode: (mode: RepeatMode) => {
    set({ repeatMode: mode, isRepeat: mode !== 'off' });
    savePlayerSettings({ repeatMode: mode });
  },
  setRepeat: (val: boolean | RepeatMode) => {
    const mode = typeof val === 'string' ? val : (val ? 'all' : 'off');
    set({ repeatMode: mode, isRepeat: mode !== 'off' });
    savePlayerSettings({ repeatMode: mode });
  },
  toggleLyrics: () => set({ isLyricsOpen: !get().isLyricsOpen }),
  setLyricsOpen: (open) => set({ isLyricsOpen: open }),
}));
