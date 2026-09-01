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

interface PlayerState {
  currentSong: UnifiedSong | null;
  isPlaying: boolean;
  isLoading: boolean;
  isAutoplayBlocked: boolean;
  queue: UnifiedSong[];
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
  playNext: () => void;
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

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentSong: _saved.song,
  isPlaying: false,
  isLoading: false,
  isAutoplayBlocked: false,
  queue: _saved.queue,
  currentIndex: _saved.currentIndex,
  positionSec: 0,
  durationSec: _saved.song?.duration || 0,
  volume: 0.8,
  isShuffle: false,
  isRepeat: false,
  repeatMode: 'off',
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
      set({ isPlaying: false });
      useConnectStore.getState().broadcastState();
    });

    audio.addEventListener('ended', () => {
      const { repeatMode, currentSong } = get();
      if (repeatMode === 'one' && currentSong) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
        useConnectStore.getState().broadcastState();
      } else {
        get().playNext();
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
    if (!get().audioElement) {
      get().initAudio();
    }

    let queue = newQueue || get().queue;
    if (!queue.some(s => (s.encodeId || s.id) === (song.encodeId || song.id))) {
      queue = [song, ...queue];
    }
    const currentIndex = queue.findIndex(s => (s.encodeId || s.id) === (song.encodeId || song.id));

    savePlayerState(song, queue, currentIndex);

    // 1. Đặt Web PC làm active device
    useConnectStore.setState({ activeDeviceId: 'web-player-pc', activeDeviceName: 'Web Player (PC)' });

    set({
      currentSong: song,
      queue,
      currentIndex,
      isLoading: true,
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

    const audio = get().audioElement;
    if (audio && streamUrl) {
      audio.src = streamUrl;
      audio.currentTime = startPosSec;
      audio.play().then(() => {
        set({ isPlaying: true, isLoading: false, isAutoplayBlocked: false });
        useConnectStore.getState().broadcastState();
      }).catch((err) => {
        console.warn('[Web Player] Autoplay prevented:', err.message);
        // Trình duyệt chặn do chưa có tương tác chuột trên trang web
        set({ isPlaying: false, isLoading: false, isAutoplayBlocked: true });
        useConnectStore.getState().broadcastState();
      });
    } else {
      set({ isLoading: false });
      useConnectStore.getState().broadcastState();
    }
  },

  togglePlayPause: () => {
    const audio = get().audioElement;
    const connect = useConnectStore.getState();
    const isRemote = connect.activeDeviceId !== 'web-player-pc';

    if (isRemote) {
      connect.sendCommand('toggle_play_pause');
      set({ isPlaying: !get().isPlaying });
      return;
    }

    if (!audio || !audio.src) return;
    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
  },

  playNext: () => {
    const connect = useConnectStore.getState();
    const isRemote = connect.activeDeviceId !== 'web-player-pc';

    if (isRemote) {
      connect.sendCommand('next');
      return;
    }

    const { queue, currentIndex, isShuffle, repeatMode } = get();
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

    if (isShuffle && queue.length > 1) {
      let rand = Math.floor(Math.random() * queue.length);
      if (rand === currentIndex) {
        rand = (rand + 1) % queue.length;
      }
      get().playSong(queue[rand], queue);
      return;
    }

    if (currentIndex + 1 < queue.length) {
      get().playSong(queue[currentIndex + 1], queue);
    } else if (repeatMode === 'all') {
      get().playSong(queue[0], queue);
    } else {
      const audio = get().audioElement;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      set({ isPlaying: false, positionSec: 0 });
      useConnectStore.getState().broadcastState();
    }
  },

  playPrev: () => {
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
  },

  toggleShuffle: () => {
    const nextVal = !get().isShuffle;
    set({ isShuffle: nextVal });
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
    const connect = useConnectStore.getState();
    if (connect.activeDeviceId !== 'web-player-pc') {
      connect.sendCommand('set_repeat', { repeatMode: nextMode, isRepeat: nextMode !== 'off' });
    }
    useConnectStore.getState().broadcastState();
  },

  setShuffle: (val) => set({ isShuffle: val }),
  setRepeatMode: (mode: RepeatMode) => set({ repeatMode: mode, isRepeat: mode !== 'off' }),
  setRepeat: (val: boolean | RepeatMode) => {
    if (typeof val === 'string') {
      set({ repeatMode: val, isRepeat: val !== 'off' });
    } else {
      set({ repeatMode: val ? 'all' : 'off', isRepeat: val });
    }
  },
  toggleLyrics: () => set({ isLyricsOpen: !get().isLyricsOpen }),
  setLyricsOpen: (open) => set({ isLyricsOpen: open }),
}));
