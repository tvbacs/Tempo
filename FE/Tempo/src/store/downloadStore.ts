/**
 * Download & Isolated Offline Playback Store
 * Quản lý tải và lưu trữ nhạc ngoại tuyến tách biệt 100% theo từng User
 * Tối ưu hóa hàng đợi tải tuần tự (Concurrency = 1) + Throttled UI để app không bị giật lag
 * Strictly follows STANDARDS.md
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { UnifiedSong } from '../types/music';
import { apiClient, API_BASE_URL } from '../api/client';
import { useToastStore } from './toastStore';

interface DownloadState {
  downloadedSongs: UnifiedSong[];
  downloadingIds: string[];
  queueSongIds: string[];
  downloadProgress: Record<string, number>; // songId -> 0..1
  isLoading: boolean;

  // Actions
  resetForUser: () => void;
  fetchDownloads: () => Promise<void>;
  downloadSong: (song: UnifiedSong) => Promise<void>;
  downloadMultiple: (songs: UnifiedSong[]) => void;
  removeDownload: (songId: string) => Promise<void>;
  isDownloaded: (songId: string) => boolean;
  isDownloading: (songId: string) => boolean;
  isQueued: (songId: string) => boolean;
  getProgress: (songId: string) => number;
}

const DOWNLOAD_STORAGE_KEY = 'tempo_offline_downloaded_songs';
const DOWNLOADS_DIR = `${FileSystem.documentDirectory}tempo_downloads/`;

const getUserKey = (baseKey: string) => {
  try {
    const { useAuthStore } = require('./authStore');
    const user = useAuthStore.getState().user;
    if (user?.id) {
      return `${baseKey}_${user.id}`;
    }
  } catch (e) {}
  return baseKey;
};

const ensureDirExists = async () => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(DOWNLOADS_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(DOWNLOADS_DIR, { intermediates: true });
    }
  } catch (e) {
    console.error('Failed to create downloads dir:', e);
  }
};

// Hàng đợi tải tuần tự (Task Queue) tránh nghẽn CPU và mạng
const downloadQueue: UnifiedSong[] = [];
let isWorkerRunning = false;
let batchTotal = 0;
let batchCompleted = 0;

const syncQueueState = (store: any) => {
  store.setState({
    queueSongIds: downloadQueue.map((s) => s.id),
  });
};

const processNextInQueue = async (store: any) => {
  if (isWorkerRunning) return;
  if (downloadQueue.length === 0) {
    if (batchTotal > 1 && batchCompleted >= batchTotal) {
      useToastStore.getState().showToast(`Đã hoàn tất tải toàn bộ ${batchTotal} bài hát!`, 'success');
      batchTotal = 0;
      batchCompleted = 0;
    }
    syncQueueState(store);
    return;
  }

  isWorkerRunning = true;
  const song = downloadQueue.shift()!;
  syncQueueState(store);

  try {
    await performDownload(song, store);
  } catch (err) {
    console.error(`[DownloadQueue] Failed for ${song.title}:`, err);
  } finally {
    isWorkerRunning = false;
    // Chạy bài tiếp theo trong hàng đợi
    if (downloadQueue.length > 0) {
      setTimeout(() => processNextInQueue(store), 100);
    } else {
      if (batchTotal > 1) {
        useToastStore.getState().showToast(`Đã hoàn tất tải toàn bộ ${batchTotal} bài hát!`, 'success');
        batchTotal = 0;
        batchCompleted = 0;
      }
      syncQueueState(store);
    }
  }
};

const performDownload = async (song: UnifiedSong, store: any) => {
  const { downloadedSongs, downloadingIds } = store.getState();
  if (downloadedSongs.some((s: any) => s.id === song.id)) {
    return;
  }

  store.setState({
    downloadingIds: Array.from(new Set([...downloadingIds, song.id])),
    downloadProgress: { ...store.getState().downloadProgress, [song.id]: 0 },
  });

  const currentIndex = batchCompleted + 1;
  const totalCount = Math.max(batchTotal, downloadQueue.length + 1);
  const queueRemaining = downloadQueue.length;

  useToastStore.getState().showDownloadToast(song.id, song.title, 0.05, {
    currentIndex,
    totalCount,
    remainingInQueue: queueRemaining,
  });

  try {
    await ensureDirExists();

    // 1. Resolve Audio Stream URL
    let sourceUrl = song.audioUrl;
    if (!sourceUrl) {
      try {
        const streamData = await apiClient.getSongStream(song.id, song.title, song.artistsNames);
        sourceUrl = streamData.audioUrl;
      } catch (e) {
        console.error('Could not get audio stream for download:', e);
      }
    }

    if (!sourceUrl) throw new Error('Không tìm thấy luồng âm thanh để tải về');

    const safeId = song.id.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileUri = `${DOWNLOADS_DIR}${safeId}.mp3`;

    // 2. Sử dụng createDownloadResumable với Throttled Progress Callback (300ms) để không làm nghẽn JS thread
    let lastProgressTime = 0;
    const progressCallback = (downloadProgress: FileSystem.DownloadProgressData) => {
      const now = Date.now();
      if (now - lastProgressTime > 300 || downloadProgress.totalBytesWritten === downloadProgress.totalBytesExpectedToWrite) {
        lastProgressTime = now;
        const ratio = downloadProgress.totalBytesExpectedToWrite > 0
          ? downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite
          : 0.5;
        useToastStore.getState().showDownloadToast(song.id, song.title, ratio, {
          currentIndex,
          totalCount,
          remainingInQueue: queueRemaining,
        });
      }
    };

    let downloadResult: FileSystem.FileSystemDownloadResult | null = null;
    try {
      const resumable = FileSystem.createDownloadResumable(sourceUrl, fileUri, {}, progressCallback);
      const res = await resumable.downloadAsync();
      if (res && res.status === 200) {
        downloadResult = res;
      }
    } catch (directErr) {
      console.warn('[Download] Direct download failed, trying proxy...', directErr);
    }

    // Nếu direct URL thất bại, thử qua stream proxy
    if (!downloadResult || downloadResult.status !== 200) {
      const proxyUrl = `${API_BASE_URL}/music/stream-proxy?url=${encodeURIComponent(sourceUrl)}`;
      const resumable = FileSystem.createDownloadResumable(proxyUrl, fileUri, {}, progressCallback);
      downloadResult = (await resumable.downloadAsync()) || null;
    }

    if (downloadResult && downloadResult.status === 200) {
      const downloadedSong: UnifiedSong = {
        ...song,
        audioUrl: downloadResult.uri,
        localUri: downloadResult.uri,
        isOffline: true,
      };

      const updated = [downloadedSong, ...store.getState().downloadedSongs.filter((s: any) => s.id !== song.id)];
      const clearProgress = () => {
        const p = { ...store.getState().downloadProgress };
        delete p[song.id];
        return p;
      };

      batchCompleted += 1;

      store.setState({
        downloadedSongs: updated,
        downloadingIds: store.getState().downloadingIds.filter((id: string) => id !== song.id),
        downloadProgress: clearProgress(),
      });

      await AsyncStorage.setItem(getUserKey(DOWNLOAD_STORAGE_KEY), JSON.stringify(updated));
      useToastStore.getState().showDownloadToast(song.id, song.title, 1, {
        currentIndex,
        totalCount,
        remainingInQueue: downloadQueue.length,
      });

      if (totalCount === 1) {
        useToastStore.getState().showToast(`Đã lưu "${song.title}" thành công!`, 'success');
      }
    } else {
      throw new Error(`Download failed with HTTP ${downloadResult?.status ?? 'unknown'}`);
    }
  } catch (err: any) {
    console.error('Download failed:', err);
    const clearProgress = () => {
      const p = { ...store.getState().downloadProgress };
      delete p[song.id];
      return p;
    };
    store.setState({
      downloadingIds: store.getState().downloadingIds.filter((id: string) => id !== song.id),
      downloadProgress: clearProgress(),
    });
    useToastStore.getState().hideDownloadToast(song.id);
    useToastStore.getState().showToast('Tải xuống thất bại: ' + (err.message || 'Lỗi mạng'), 'error');
  }
};

export const useDownloadStore = create<DownloadState>((set, get) => ({
  downloadedSongs: [],
  downloadingIds: [],
  queueSongIds: [],
  downloadProgress: {},
  isLoading: false,

  resetForUser: () => {
    downloadQueue.length = 0;
    batchTotal = 0;
    batchCompleted = 0;
    set({ downloadedSongs: [], downloadingIds: [], queueSongIds: [], downloadProgress: {} });
  },

  fetchDownloads: async () => {
    try {
      const data = await AsyncStorage.getItem(getUserKey(DOWNLOAD_STORAGE_KEY));
      if (data) {
        const list: UnifiedSong[] = JSON.parse(data);
        set({ downloadedSongs: list });
      } else {
        set({ downloadedSongs: [] });
      }
    } catch (e) {
      console.error('Error fetching downloads:', e);
    }
  },

  downloadSong: async (song: UnifiedSong) => {
    const { downloadedSongs, downloadingIds } = get();
    if (downloadedSongs.some((s) => s.id === song.id)) {
      useToastStore.getState().showToast('Bài hát đã có trong bộ nhớ máy', 'info');
      return;
    }
    if (downloadingIds.includes(song.id) || downloadQueue.some((s) => s.id === song.id)) {
      useToastStore.getState().showToast('Bài hát đang nằm trong hàng đợi tải', 'info');
      return;
    }

    downloadQueue.push(song);
    syncQueueState(useDownloadStore);

    if (!isWorkerRunning) {
      batchTotal = 1;
      batchCompleted = 0;
      useToastStore.getState().showToast(`Bắt đầu tải "${song.title.length > 22 ? song.title.substring(0, 22) + '…' : song.title}"...`, 'info');
    } else {
      batchTotal += 1;
      useToastStore.getState().showToast(`Đã thêm vào hàng đợi tải (Vị trí #${downloadQueue.length})`, 'info');
    }

    processNextInQueue(useDownloadStore);
  },

  downloadMultiple: (songs: UnifiedSong[]) => {
    const { downloadedSongs, downloadingIds } = get();
    const toAdd = songs.filter(
      (s) => !downloadedSongs.some((ds) => ds.id === s.id) &&
             !downloadingIds.includes(s.id) &&
             !downloadQueue.some((qs) => qs.id === s.id)
    );

    if (toAdd.length === 0) {
      useToastStore.getState().showToast('Tất cả bài hát đã được tải hoặc đang chờ tải', 'info');
      return;
    }

    downloadQueue.push(...toAdd);
    syncQueueState(useDownloadStore);

    if (!isWorkerRunning) {
      batchTotal = toAdd.length;
      batchCompleted = 0;
    } else {
      batchTotal += toAdd.length;
    }

    useToastStore.getState().showToast(`Đã thêm ${toAdd.length} bài hát vào hàng đợi tải xuống`, 'info');
    processNextInQueue(useDownloadStore);
  },

  removeDownload: async (songId: string) => {
    const { downloadedSongs } = get();
    const song = downloadedSongs.find((s) => s.id === songId);
    const updated = downloadedSongs.filter((s) => s.id !== songId);

    set({ downloadedSongs: updated });
    await AsyncStorage.setItem(getUserKey(DOWNLOAD_STORAGE_KEY), JSON.stringify(updated));

    const fileUri = song?.localUri || song?.audioUrl;
    if (fileUri?.startsWith('file://')) {
      try {
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
      } catch (e) {
        console.warn('Could not delete offline file:', e);
      }
    }

    useToastStore.getState().showToast('Đã xóa bài hát khỏi bộ nhớ', 'info');
  },

  isDownloaded: (songId: string) => {
    return get().downloadedSongs.some((s) => s.id === songId);
  },

  isDownloading: (songId: string) => {
    return get().downloadingIds.includes(songId);
  },

  isQueued: (songId: string) => {
    return get().queueSongIds?.includes(songId) || false;
  },

  getProgress: (songId: string) => {
    return get().downloadProgress[songId] ?? 0;
  },
}));
