import { create } from 'zustand';
import { UnifiedSong, LyricSentence } from '../types/music';
import { apiClient } from '../api/client';
import { useLibraryStore } from './libraryStore';

interface PlayerState {
  currentSong: UnifiedSong | null;
  isPlaying: boolean;
  isLoading: boolean;
  queue: UnifiedSong[];
  currentIndex: number;
  positionSec: number;
  durationSec: number;
  volume: number; // 0..1
  isShuffle: boolean;
  isRepeat: boolean;
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
  toggleLyrics: () => void;
  setLyricsOpen: (open: boolean) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentSong: null,
  isPlaying: false,
  isLoading: false,
  queue: [],
  currentIndex: -1,
  positionSec: 0,
  durationSec: 0,
  volume: 0.8,
  isShuffle: false,
  isRepeat: false,
  lyrics: [],
  isLyricsOpen: false,
  audioElement: null,

  initAudio: () => {
    if (get().audioElement) return;
    const audio = new Audio();
    audio.preload = 'auto';
    audio.volume = get().volume;

    audio.addEventListener('timeupdate', () => {
      set({ positionSec: audio.currentTime, durationSec: audio.duration || 0 });
    });

    audio.addEventListener('play', () => set({ isPlaying: true }));
    audio.addEventListener('pause', () => set({ isPlaying: false }));
    audio.addEventListener('ended', () => get().playNext());

    set({ audioElement: audio });
  },

  playSong: async (song, newQueue, startPosSec = 0) => {
    let queue = newQueue || get().queue;
    if (!queue.some(s => (s.encodeId || s.id) === (song.encodeId || song.id))) {
      queue = [song, ...queue];
    }
    const currentIndex = queue.findIndex(s => (s.encodeId || s.id) === (song.encodeId || song.id));

    set({
      currentSong: song,
      queue,
      currentIndex,
      isLoading: true,
      positionSec: startPosSec,
      durationSec: song.duration || 0,
    });

    useLibraryStore.getState().recordHistory(song);

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
        set({ isPlaying: true, isLoading: false });
      }).catch(() => {
        set({ isPlaying: false, isLoading: false });
      });
    } else {
      set({ isLoading: false });
    }
  },

  togglePlayPause: () => {
    const audio = get().audioElement;
    if (!audio || !audio.src) return;
    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
  },

  playNext: () => {
    const { queue, currentIndex, isShuffle, isRepeat } = get();
    if (queue.length === 0) return;

    if (isShuffle) {
      const rand = Math.floor(Math.random() * queue.length);
      get().playSong(queue[rand]);
      return;
    }

    if (currentIndex + 1 < queue.length) {
      get().playSong(queue[currentIndex + 1]);
    } else if (isRepeat) {
      get().playSong(queue[0]);
    }
  },

  playPrev: () => {
    const { queue, currentIndex, audioElement } = get();
    if (audioElement && audioElement.currentTime > 3) {
      audioElement.currentTime = 0;
      return;
    }
    if (queue.length === 0) return;
    if (currentIndex > 0) {
      get().playSong(queue[currentIndex - 1]);
    }
  },

  seekTo: (sec) => {
    const audio = get().audioElement;
    if (audio) {
      audio.currentTime = sec;
      set({ positionSec: sec });
    }
  },

  setVolume: (vol) => {
    const audio = get().audioElement;
    if (audio) audio.volume = vol;
    set({ volume: vol });
  },

  toggleShuffle: () => set({ isShuffle: !get().isShuffle }),
  toggleRepeat: () => set({ isRepeat: !get().isRepeat }),
  toggleLyrics: () => set({ isLyricsOpen: !get().isLyricsOpen }),
  setLyricsOpen: (open) => set({ isLyricsOpen: open }),
}));
