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
import * as FileSystem from 'expo-file-system/legacy';
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
  private isStopping = false;
  private hasTriggeredEndForCurrentTrack = false;
  // Mutex: mỗi lần loadAndPlay tăng lên 1 — request cũ tự huỷ nếu bị thay thế
  private currentLoadId = 0;
  // Watchdog: phát hiện kết thúc bài khi iOS không fire thêm event
  private watchdogInterval: ReturnType<typeof setInterval> | null = null;
  private lastKnownPosition = -1;
  private lastKnownDuration = -1;
  private lastStatusTime = 0;

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

  private clearWatchdog() {
    if (this.watchdogInterval !== null) {
      clearInterval(this.watchdogInterval);
      this.watchdogInterval = null;
    }
    this.lastKnownPosition = -1;
    this.lastKnownDuration = -1;
    this.lastStatusTime = 0;
  }

  private startWatchdog() {
    this.clearWatchdog();
    this.lastStatusTime = Date.now();
    this.watchdogInterval = setInterval(() => {
      if (this.hasTriggeredEndForCurrentTrack || this.isStopping) return;

      const now = Date.now();
      const silenceSec = (now - this.lastStatusTime) / 1000;
      const pos = this.lastKnownPosition;
      const dur = this.lastKnownDuration;

      // iOS đã ngừng fire event: nếu im lặng > 2s VÀ pos > 95% duration → next bài
      if (silenceSec > 2 && pos >= 0 && dur > 5 && pos >= dur * 0.95) {
        console.log(`[AudioEngine][Watchdog] iOS stopped events. pos=${pos.toFixed(2)}s / dur=${dur.toFixed(2)}s / silence=${silenceSec.toFixed(1)}s → triggering next`);
        this.hasTriggeredEndForCurrentTrack = true;
        this.clearWatchdog();
        if (this.player) {
          try { this.player.pause(); } catch (_) {}
          try { (this.player as any).clearLockScreenControls?.(); } catch (_) {}
          try { this.player.remove(); } catch (_) {}
          this.player = null;
        }
        this.currentSongId = null;
        if (this.onTrackEndedCallback) {
          this.onTrackEndedCallback();
        }
      }
    }, 1000);
  }

  async loadAndPlay(song: UnifiedSong): Promise<boolean> {
    await this.init();

    // Tăng loadId — bất kỳ request cũ nào đang chạy sẽ tự biết mình đã bị supersede
    const myLoadId = ++this.currentLoadId;

    // Dừng watchdog cũ nếu có
    this.clearWatchdog();

    // Dừng ngay lập tức bài cũ đang phát, huỷ player cũ và lock screen controls
    if (this.player) {
      try { this.player.pause(); } catch (_) {}
      try { (this.player as any).clearLockScreenControls?.(); } catch (_) {}
      try { this.player.remove(); } catch (_) {}
      this.player = null;
    }
    this.currentSongId = null;

    // Reset ngay lập tức trạng thái phát nhạc về loading, position 0
    if (this.onStatusUpdateCallback) {
      this.onStatusUpdateCallback({
        isLoaded: false,
        isPlaying: false,
        durationMillis: (song.duration && song.duration > 0) ? song.duration * 1000 : 0,
        positionMillis: 0,
        isBuffering: true,
        didJustFinish: false,
      });
    }

    try {
      // Nếu trong lúc chuyển bài có request mới hơn đến thì dừng luôn
      if (myLoadId !== this.currentLoadId) {
        console.log(`[AudioEngine] Load #${myLoadId} superseded, aborting.`);
        return false;
      }

      // 1. Resolve audio stream URL
      let streamUrl: string | undefined = undefined;

      // Ưu tiên 1: Kiểm tra bài đã tải xuống trên máy (local file) và XÁC NHẬN FILE THỰC SỰ TỒN TẠI
      const candidateLocalUri = song.localUri || (song.audioUrl?.startsWith('file://') ? song.audioUrl : undefined);
      if (candidateLocalUri) {
        try {
          const info = await FileSystem.getInfoAsync(candidateLocalUri);
          if (info.exists && !info.isDirectory && (info.size || 0) > 1024) {
            streamUrl = candidateLocalUri;
            console.log('[AudioEngine] Found valid local file from song:', candidateLocalUri);
          }
        } catch (_) {}
      }

      if (!streamUrl) {
        try {
          const { useDownloadStore } = require('../store/downloadStore');
          const downloadedSongs = useDownloadStore.getState().downloadedSongs;
          const downloadedVersion = downloadedSongs.find((s: any) => s.id === song.id);
          if (downloadedVersion?.localUri?.startsWith('file://')) {
            const info = await FileSystem.getInfoAsync(downloadedVersion.localUri);
            if (info.exists && !info.isDirectory && (info.size || 0) > 1024) {
              streamUrl = downloadedVersion.localUri;
              console.log('[AudioEngine] Using verified downloaded local file for:', song.title);
            }
          }
        } catch (e) {}
      }

      // Kiểm tra xem bài có phải nguồn trích xuất online không (YouTube/TikTok/SoundCloud/extract)
      const isOnlineExtract = (song.source as string) === 'youtube'
        || (song.source as string) === 'tiktok'
        || (song.source as string) === 'soundcloud'
        || (song.source as string) === 'extract'
        || (song as any).isExtracted === true
        || (song.id?.startsWith('yt_') || song.id?.startsWith('tt_') || song.id?.startsWith('sc_'));

      // Ưu tiên 2: Nếu bài có direct audioUrl HTTP trực tiếp (không phải file:// và không phải extract hết hạn)
      if (!streamUrl && song.audioUrl && song.audioUrl.startsWith('http') && !isOnlineExtract) {
        streamUrl = song.audioUrl;
        console.log('[AudioEngine] Using direct audioUrl for stream track:', song.title);
      }

      // Ưu tiên 2b: Bài trích xuất online → Luôn gọi API làm mới link (tránh 403 sau vài giờ)
      if (!streamUrl && isOnlineExtract) {
        try {
          console.log('[AudioEngine] Refreshing extract URL for:', song.title);
          const ytUrl = (song as any).url || (song as any).webpageUrl || (song as any).originalUrl || (song.id?.startsWith('yt_') ? `https://www.youtube.com/watch?v=${song.id.replace('yt_', '')}` : undefined);
          if (ytUrl && ytUrl.startsWith('http')) {
            try {
              const ext = await apiClient.extractYouTube(ytUrl);
              if (ext?.audioUrl) {
                streamUrl = ext.audioUrl;
              }
            } catch (_) {}
          }
          if (!streamUrl) {
            const freshData = await apiClient.getSongStream(song.id, song.title, song.artistsNames);
            if (freshData?.audioUrl) {
              streamUrl = freshData.audioUrl;
            } else if (song.audioUrl && song.audioUrl.startsWith('http')) {
              streamUrl = song.audioUrl;
            }
          }
        } catch (refreshErr: any) {
          console.warn('[AudioEngine] Refresh extract URL failed, trying original HTTP:', refreshErr?.message);
          if (song.audioUrl && song.audioUrl.startsWith('http')) {
            streamUrl = song.audioUrl;
          }
        }
      }

      // Nếu là bài local do người dùng tự import từ máy (file nội bộ) mà file không còn trên máy
      const isImportedLocalOnly = (song.source as any) === 'local' || song.id?.startsWith('local_');
      if (isImportedLocalOnly && !streamUrl) {
        useToastStore.getState().showToast('File nhạc nội bộ không còn tồn tại trên máy', 'info');
        return false;
      }

      // Ưu tiên 3: Nếu không có file offline (hoặc file offline đã bị xóa khi cài lại app)
      // -> TỰ ĐỘNG GỌI API BACKEND ĐỂ PHÁT ONLINE (không bị kẹt 0s)
      if (!streamUrl) {
        try {
          console.log('[AudioEngine] Resolving online stream from API for:', song.title);
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
          updateInterval: 400,
          keepAudioSessionActive: true,
        });
      } catch (directError: any) {
        console.warn('[AudioEngine] Direct player creation failed, trying fresh stream resolution:', directError?.message);
        try {
          const freshData = await apiClient.getSongStream(song.id, song.title, song.artistsNames);
          if (freshData?.audioUrl) {
            streamUrl = freshData.audioUrl;
            newPlayer = createAudioPlayer(streamUrl, {
              updateInterval: 400,
              keepAudioSessionActive: true,
            });
          }
        } catch (_) {}

        if (!newPlayer) {
          try {
            const proxyUrl = `${API_BASE_URL}/music/stream-proxy?url=${encodeURIComponent(streamUrl)}`;
            newPlayer = createAudioPlayer(proxyUrl, {
              updateInterval: 400,
              keepAudioSessionActive: true,
            });
          } catch (proxyErr) {
            console.warn('[AudioEngine] Proxy stream also failed:', proxyErr);
          }
        }
      }

      if (!newPlayer) {
        useToastStore.getState().showToast('Không thể kết nối luồng phát bài hát này', 'error');
        return false;
      }

      // Nếu trong lúc tạo player có request mới hơn đến → hủy player vừa tạo và thoát
      if (myLoadId !== this.currentLoadId) {
        console.log(`[AudioEngine] Load #${myLoadId} superseded after player create, removing ghost player.`);
        try { newPlayer?.remove(); } catch (_) {}
        return false;
      }

      // 3. Cấu hình Lock Screen / Now Playing Metadata (Màn hình khóa & Trung tâm điều khiển)
      try {
        if (typeof (newPlayer as any)?.setActiveForLockScreen === 'function') {
          (newPlayer as any).setActiveForLockScreen(
            true,
            {
              title: song.title || 'Tempo Track',
              artist: song.artistsNames || 'Nghệ sĩ',
              albumTitle: song.album?.title || 'Tempo Music',
              artworkUrl:
                song.thumbnail ||
                'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
            },
            {
              showSeekForward: true,
              showSeekBackward: true,
            }
          );
        }
      } catch (lockScreenErr) {
        // Safe fallback - Lockscreen metadata is handled natively by Expo AudioSession
      }

      // 4. Đăng ký lắng nghe sự kiện phát nhạc và kết thúc bài
      let lastTrackPosition = -1;
      let nearEndStallCount = 0;

      (newPlayer as any).addListener('playbackStatusUpdate', (status: AudioStatus) => {
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

        // Cập nhật watchdog state mỗi lần nhận event
        const eventCurTime = status.currentTime || 0;
        const eventDur = status.duration || 0;
        if (eventDur > 0) this.lastKnownDuration = eventDur;
        if (eventCurTime > 0) this.lastKnownPosition = eventCurTime;
        this.lastStatusTime = Date.now();

        const curTime = status.currentTime || 0;
        const rawDur = status.duration || 0;
        const metaDurSec = (song.duration && song.duration > 0) ? song.duration : 0;

        // Luôn dùng rawDur (thực tế từ stream) để phát hiện kết thúc bài.
        // metaDur chỉ dùng khi engine chưa report ra duration (rawDur=0) hoặc
        // khi rawDur lớn hơn metaDur quá nhiều (AVPlayer x2 bitrate bug).
        // KHÔNG dùng metaDur khi metaDur < rawDur — tránh kích hoạt next bài sớm.
        let dur = rawDur;
        if (rawDur <= 0 && metaDurSec > 0) {
          // Engine chưa report duration → fallback về metadata
          dur = metaDurSec;
        } else if (rawDur > 0 && metaDurSec > 0 && rawDur > metaDurSec * 1.8) {
          // AVPlayer x2 bitrate estimation bug → dùng metadata
          dur = metaDurSec;
        }
        // Mọi trường hợp còn lại: rawDur > metaDur hoặc rawDur ≈ metaDur → dùng rawDur

        const pState = (status.playbackState || '').toLowerCase();

        // 1. Tín hiệu Native trực tiếp (didJustFinish hoặc state=ended)
        const nativeEnded = status.didJustFinish === true || pState === 'ended';

        // 2. Chạm ngưỡng cuối bài (trong vòng 1.5s cuối cùng của bài thực tế)
        const reachEndThreshold = dur > 2 && curTime > 0 && curTime >= (dur - 1.5);

        // 3. Dừng/đứng hình sau khi đã qua 96% thời lượng thực tế
        let isStalledNearEnd = false;
        if (dur > 5 && curTime >= dur * 0.96) {
          if (!status.playing || pState === 'idle' || pState === 'paused' || pState === 'stopped') {
            isStalledNearEnd = true;
          } else if (lastTrackPosition >= 0 && Math.abs(curTime - lastTrackPosition) < 0.25) {
            nearEndStallCount++;
            if (nearEndStallCount >= 2) {
              isStalledNearEnd = true;
            }
          } else {
            nearEndStallCount = 0;
          }
        } else {
          nearEndStallCount = 0;
        }
        lastTrackPosition = curTime;

        const isReachedEnd = nativeEnded || reachEndThreshold || isStalledNearEnd;

        if (isReachedEnd && !this.isStopping && !this.hasTriggeredEndForCurrentTrack) {
          this.hasTriggeredEndForCurrentTrack = true;
          this.clearWatchdog();
          if (this.player) {
            try { this.player.pause(); } catch (_) {}
            try { (this.player as any).clearLockScreenControls?.(); } catch (_) {}
            try { this.player.remove(); } catch (_) {}
            this.player = null;
          }
          this.currentSongId = null;
          console.log(`[AudioEngine] Track finished -> next (native=${nativeEnded}, reachEnd=${reachEndThreshold}, stalled=${isStalledNearEnd}, pos=${curTime.toFixed(2)}s / rawDur=${rawDur.toFixed(2)}s / metaDur=${metaDurSec.toFixed(2)}s)`);
          if (this.onTrackEndedCallback) {
            this.onTrackEndedCallback();
          }
        }
      });

      // 5. Bắt đầu phát + khởi động watchdog
      this.hasTriggeredEndForCurrentTrack = false;
      newPlayer.play();
      this.startWatchdog();

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
      try {
        this.player.play();
        this.startWatchdog();
      } catch (error) {
        console.warn('[AudioEngine] Play failed:', error);
      }
    }
  }

  async pause() {
    this.clearWatchdog();
    if (!this.player) return;
    try {
      this.player.pause();
    } catch (error) {
      console.warn('[AudioEngine] Pause failed:', error);
    }
  }

  async seekTo(positionMs: number) {
    if (this.player) {
      try {
        // expo-audio seekTo nhận tham số là giây (seconds)
        const targetSeconds = Math.max(0, positionMs / 1000);
        this.lastKnownPosition = targetSeconds;
        this.lastStatusTime = Date.now();
        await this.player.seekTo(targetSeconds);
      } catch (error) {
        console.warn('[AudioEngine] SeekTo failed:', error);
      }
    }
  }

  async stop() {
    this.clearWatchdog();
    if (this.player) {
      try {
        this.player.pause();
        await this.player.seekTo(0);
      } catch (error) {
        console.warn('[AudioEngine] Stop failed:', error);
      }
    }
  }

  async stopAndUnload() {
    this.clearWatchdog();
    if (!this.player) return;
    this.isStopping = true;
    const old = this.player;
    this.player = null;
    this.currentSongId = null;
    try { old.pause(); } catch (_) {}
    try { old.clearLockScreenControls(); } catch (_) {}
    try { old.remove(); } catch (_) {}
    this.isStopping = false;
  }
}

export const audioEngine = new AudioEngine();
