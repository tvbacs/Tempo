/**
 * Audio Engine Service wrapping Expo-AV
 * Configures background playback, proxy fallback, and VIP notification
 */
import { Audio, AVPlaybackStatus, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import { UnifiedSong } from '../types/music';
import { apiClient, API_BASE_URL } from '../api/client';
import { useToastStore } from '../store/toastStore';

class AudioEngine {
  private sound: Audio.Sound | null = null;
  private onStatusUpdateCallback: ((status: AVPlaybackStatus) => void) | null = null;
  private onTrackEndedCallback: (() => void) | null = null;
  private isInitialized = false;
  private currentSongId: string | null = null;
  // Mutex: mỗi lần loadAndPlay tăng lên 1 — request cũ tự huỷ nếu bị thay thế
  private currentLoadId = 0;

  getCurrentSongId(): string | null {
    return this.currentSongId;
  }

  async init() {
    try {
      await Audio.setIsEnabledAsync(true);
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,      // ← giữ audio session khi lock screen / background
        playsInSilentModeIOS: true,         // ← phát cả khi điện thoại để chế độ im lặng
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      this.isInitialized = true;
    } catch (e) {
      console.error('Failed to configure audio mode:', e);
    }
  }

  setStatusCallback(cb: (status: AVPlaybackStatus) => void) {
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
      // Dừng & unload bài cũ ngay lập tức trước khi load bài mới
      if (this.sound) {
        const oldSound = this.sound;
        this.sound = null;
        try { await oldSound.stopAsync(); } catch (e) {}
        try { await oldSound.unloadAsync(); } catch (e) {}
      }

      // Nếu trong lúc unload có request mới hơn đến thì dừng luôn
      if (myLoadId !== this.currentLoadId) {
        console.log(`[AudioEngine] Load #${myLoadId} superseded, aborting.`);
        return false;
      }

      // Resolve audio stream URL
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

      // Tạo sound object — thử direct URL trước, fallback sang proxy
      let newSound: Audio.Sound | null = null;
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: streamUrl },
          { shouldPlay: true, progressUpdateIntervalMillis: 300 },
          this.handlePlaybackStatusUpdate
        );
        newSound = sound;
      } catch (directError: any) {
        const proxyUrl = `${API_BASE_URL}/music/stream-proxy?url=${encodeURIComponent(streamUrl)}`;
        const { sound } = await Audio.Sound.createAsync(
          { uri: proxyUrl },
          { shouldPlay: true, progressUpdateIntervalMillis: 300 },
          this.handlePlaybackStatusUpdate
        );
        newSound = sound;
      }

      // Nếu trong lúc createAsync có request mới hơn đến → unload sound vừa tạo và thoát
      if (myLoadId !== this.currentLoadId) {
        console.log(`[AudioEngine] Load #${myLoadId} superseded after createAsync, unloading ghost sound.`);
        try { await newSound?.unloadAsync(); } catch (e) {}
        return false;
      }

      // Gán sound mới
      this.sound = newSound;
      this.currentSongId = song.id || song.encodeId || null;
      return true;

    } catch (error: any) {
      console.warn('Audio playback error:', error?.message);
      if (song.isVip || error?.message?.includes('VIP')) {
        useToastStore.getState().showToast('Bài hát này chỉ dành cho tài khoản VIP Zing MP3', 'vip');
      }
      return false;
    }
  }

  private handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (this.onStatusUpdateCallback) {
      this.onStatusUpdateCallback(status);
    }

    if (status.isLoaded && status.didJustFinish) {
      if (this.onTrackEndedCallback) {
        this.onTrackEndedCallback();
      }
    }
  };

  async play() {
    if (this.sound) {
      await this.sound.playAsync();
    }
  }

  async pause() {
    if (this.sound) {
      await this.sound.pauseAsync();
    }
  }

  async seekTo(positionMs: number) {
    if (this.sound) {
      await this.sound.setPositionAsync(positionMs);
    }
  }

  async stop() {
    if (this.sound) {
      await this.sound.stopAsync();
    }
  }

  async stopAndUnload() {
    if (this.sound) {
      const old = this.sound;
      this.sound = null;
      this.currentSongId = null;
      try { await old.stopAsync(); } catch (_) {}
      try { await old.unloadAsync(); } catch (_) {}
    }
  }
}

export const audioEngine = new AudioEngine();
