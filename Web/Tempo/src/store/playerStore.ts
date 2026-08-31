import { create } from 'zustand';
import { UnifiedSong, LyricSentence } from '../types/music';
import { apiClient } from '../api/client';
import { useLibraryStore } from './libraryStore';
import { useConnectStore } from './connectStore';

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
  setShuffle: (val: boolean) => void;
  setRepeat: (val: boolean) => void;
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
      get().playNext();
    });

    set({ audioElement: audio });
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
        useConnectStore.getState().broadcastState();
      }).catch((err) => {
        console.warn('[Web Player] Autoplay prevented or failed:', err.message);
        set({ isPlaying: false, isLoading: false });
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
      get().playSong(queue[currentIndex - 1]);
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
  },
  toggleRepeat: () => {
    const nextVal = !get().isRepeat;
    set({ isRepeat: nextVal });
    const connect = useConnectStore.getState();
    if (connect.activeDeviceId !== 'web-player-pc') {
      connect.sendCommand('set_repeat', { repeatMode: nextVal ? 'all' : 'off' });
    }
  },
  setShuffle: (val) => set({ isShuffle: val }),
  setRepeat: (val) => set({ isRepeat: val }),
  toggleLyrics: () => set({ isLyricsOpen: !get().isLyricsOpen }),
  setLyricsOpen: (open) => set({ isLyricsOpen: open }),
}));
