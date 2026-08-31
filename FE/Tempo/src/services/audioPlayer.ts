/**
 * Audio Engine Service wrapping expo-audio (Expo SDK 54+)
 * Configures background playback, native lock screen controls, and VIP stream fallback
 */
import {
  createAudioPlayer,
  setAudioModeAsync,
  AudioPlayer,
  AudioStatus,
} from 'expo-audio';
import { UnifiedSong } from '../types/music';
import { apiClient, API_BASE_URL } from '../api/client';
import { useToastStore } from '../store/toastStore';

export interface PlaybackStatusCompat {
  isLoaded: boolean;
  isPlaying: boolean;
  durationMillis: number;
  positionMillis: number;
  isBuffering: boolean;
  didJustFinish: boolean;
}

class AudioEngine {
  private player: AudioPlayer | null = null;
  private onStatusUpdateCallback: ((status: PlaybackStatusCompat) => void) | null = null;
  private onTrackEndedCallback: (() => void) | null = null;
  private isInitialized = false;
  private currentSongId: string | null = null;
  // Mutex: mỗi lần loadAndPlay tăng lên 1 — request cũ tự huỷ nếu bị thay thế
  private currentLoadId = 0;

  getCurrentSongId(): string | null {
    return this.currentSongId;
  }

  async init() {
    if (this.isInitialized) return;
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionMode: 'doNotMix',
        allowsRecording: false,
        shouldRouteThroughEarpiece: false,
      });
      this.isInitialized = true;
    } catch (e) {
      console.warn('Failed to configure expo-audio mode:', e);
    }
  }

  setStatusCallback(cb: (status: PlaybackStatusCompat) => void) {
    this.onStatusUpdateCallback = cb;
  }

  setTrackEndedCallback(cb: () => void) {
    this.onTrackEndedCallback = cb;
  }

  async loadAndPlay(song: UnifiedSong): Promise<boolean> {
    await this.init();

    // Tăng loadId — bất kỳ request cũ nào đang chạy sẽ tự biết mình đã bị supersede
    const myLoadId = ++this.currentLoadId;

    try {
      // Dừng & giải phóng player cũ ngay lập tức trước khi load bài mới
      if (this.player) {
        const oldPlayer = this.player;
        this.player = null;
        try { oldPlayer.pause(); } catch (_) {}
        try { oldPlayer.clearLockScreenControls(); } catch (_) {}
        try { oldPlayer.remove(); } catch (_) {}
      }

      // Nếu trong lúc unload có request mới hơn đến thì dừng luôn
      if (myLoadId !== this.currentLoadId) {
        console.log(`[AudioEngine] Load #${myLoadId} superseded, aborting.`);
        return false;
      }

      // 1. Resolve audio stream URL
      // Ưu tiên 1: Kiểm tra bài đã tải xuống trên máy (local file)
      let streamUrl = song.localUri;
      if (!streamUrl || !streamUrl.startsWith('file://')) {
        try {
          const { useDownloadStore } = require('../store/downloadStore');
          const downloadedSongs = useDownloadStore.getState().downloadedSongs;
          const downloadedVersion = downloadedSongs.find((s: any) => s.id === song.id);
          if (downloadedVersion?.localUri?.startsWith('file://')) {
            streamUrl = downloadedVersion.localUri;
            console.log('[AudioEngine] Using downloaded local file for:', song.title);
          }
        } catch (e) {}
      }

      // Ưu tiên 2: Sử dụng trực tiếp audioUrl nếu bài hát đã có sẵn link stream (nhạc trích xuất TikTok, YouTube, SoundCloud)
      if (!streamUrl && song.audioUrl && (song.audioUrl.startsWith('http://') || song.audioUrl.startsWith('https://'))) {
        streamUrl = song.audioUrl;
        console.log('[AudioEngine] Using direct audioUrl for extracted stream track:', song.title);
      }

      // Ưu tiên 3: Nếu vẫn chưa có streamUrl (bài Zing MP3 thông thường), gọi API backend để resolve
      if (!streamUrl) {
        try {
          const streamData = await apiClient.getSongStream(song.id, song.title, song.artistsNames);
          streamUrl = streamData.audioUrl;

          if (streamData.isFallback) {
            useToastStore.getState().showToast(
              streamData.message || 'Đang phát qua luồng âm thanh quốc tế (Mở khóa VIP)',
              'info'
            );
          }
        } catch (apiErr: any) {
          if (song.isVip || apiErr.message?.includes('VIP')) {
            useToastStore.getState().showToast('Bài hát này chỉ dành cho tài khoản VIP Zing MP3', 'vip');
          } else {
            useToastStore.getState().showToast('Không thể phát bài hát này', 'error');
          }
          return false;
        }
      }

      if (!streamUrl) {
        useToastStore.getState().showToast('Bài hát này chỉ dành cho tài khoản VIP Zing MP3', 'vip');
        return false;
      }

      // Kiểm tra lại — có thể API call mất thời gian và bị supersede
      if (myLoadId !== this.currentLoadId) {
        console.log(`[AudioEngine] Load #${myLoadId} superseded after stream resolve, aborting.`);
        return false;
      }

      // 2. Tạo AudioPlayer instance với expo-audio
      let newPlayer: AudioPlayer | null = null;
      try {
        newPlayer = createAudioPlayer(streamUrl, {
          updateInterval: 300,
          keepAudioSessionActive: true,
        });
      } catch (directError: any) {
        console.warn('[AudioEngine] Direct player creation failed, trying stream-proxy:', directError?.message);
        const proxyUrl = `${API_BASE_URL}/music/stream-proxy?url=${encodeURIComponent(streamUrl)}`;
        newPlayer = createAudioPlayer(proxyUrl, {
          updateInterval: 300,
          keepAudioSessionActive: true,
        });
      }

      // Nếu trong lúc tạo player có request mới hơn đến → hủy player vừa tạo và thoát
      if (myLoadId !== this.currentLoadId) {
        console.log(`[AudioEngine] Load #${myLoadId} superseded after player create, removing ghost player.`);
        try { newPlayer?.remove(); } catch (_) {}
        return false;
      }

      // 3. Cấu hình Lock Screen / Now Playing Metadata (Màn hình khóa & Trung tâm điều khiển)
      try {
        newPlayer.setActiveForLockScreen(true, {
          title: song.title || 'Tempo Track',
          artist: song.artistsNames || 'Nghệ sĩ',
          albumTitle: song.album?.title || 'Tempo Music',
          artworkUrl:
            song.thumbnail ||
            'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
        });
      } catch (lockScreenErr) {
        console.warn('[AudioEngine] Lock screen metadata error:', lockScreenErr);
      }

      // 4. Đăng ký lắng nghe sự kiện phát nhạc và kết thúc bài
      newPlayer.addListener('playbackStatusUpdate', (status: AudioStatus) => {
        if (this.onStatusUpdateCallback) {
          this.onStatusUpdateCallback({
            isLoaded: status.isLoaded,
            isPlaying: status.playing,
            durationMillis: Math.round((status.duration || 0) * 1000),
            positionMillis: Math.round((status.currentTime || 0) * 1000),
            isBuffering: status.isBuffering,
            didJustFinish: status.didJustFinish,
          });
        }

        if (status.didJustFinish) {
          if (this.onTrackEndedCallback) {
            this.onTrackEndedCallback();
          }
        }
      });

      // 5. Bắt đầu phát
      newPlayer.play();

      // Gán player mới
      this.player = newPlayer;
      this.currentSongId = song.id || (song as any).encodeId || null;
      return true;

    } catch (error: any) {
      console.warn('Audio playback error:', error?.message);
      if (song.isVip || error?.message?.includes('VIP')) {
        useToastStore.getState().showToast('Bài hát này chỉ dành cho tài khoản VIP Zing MP3', 'vip');
      }
      return false;
    }
  }

  async play() {
    if (this.player) {
      this.player.play();
    }
  }

  async pause() {
    if (this.player) {
      this.player.pause();
    }
  }

  async seekTo(positionMs: number) {
    if (this.player) {
      // expo-audio seekTo nhận tham số là giây (seconds)
      const targetSeconds = Math.max(0, positionMs / 1000);
      await this.player.seekTo(targetSeconds);
    }
  }

  async stop() {
    if (this.player) {
      this.player.pause();
      await this.player.seekTo(0);
    }
  }

  async stopAndUnload() {
    if (this.player) {
      const old = this.player;
      this.player = null;
      this.currentSongId = null;
      try { old.pause(); } catch (_) {}
      try { old.clearLockScreenControls(); } catch (_) {}
      try { old.remove(); } catch (_) {}
    }
  }
}

export const audioEngine = new AudioEngine();
