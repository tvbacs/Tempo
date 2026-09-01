/**
 * Download & Isolated Offline Playback Store
 * Quản lý tải và lưu trữ nhạc ngoại tuyến tách biệt 100% theo từng User
 * Tối ưu hóa hàng đợi tải tuần tự (Concurrency = 1) + Throttled UI để app không bị giật lag
 * Strictly follows STANDARDS.md
 */
import { create } from 'zustand';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import JSZip from 'jszip';
import { UnifiedSong } from '../types/music';
import { apiClient, API_BASE_URL } from '../api/client';
import { useToastStore } from './toastStore';

interface DownloadState {
  downloadedSongs: UnifiedSong[];
  downloadingIds: string[];
  queueSongIds: string[];
  downloadProgress: Record<string, number>; // songId -> 0..1
  isLoading: boolean;
  preserveOnUninstall: boolean;
  totalStorageBytes: number;

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
  setPreserveOnUninstall: (preserve: boolean) => Promise<void>;
  clearAllDownloads: () => Promise<void>;
  exportSongToDevice: (song: UnifiedSong) => Promise<void>;
  exportAllDownloads: () => Promise<void>;
  calculateStorageUsage: () => Promise<number>;
  scanAndSyncLocalFiles: () => Promise<number>;
}

const DOWNLOAD_STORAGE_KEY = 'tempo_offline_downloaded_songs';
const PRESERVE_ON_UNINSTALL_KEY = 'tempo_preserve_downloads_on_uninstall';
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
  preserveOnUninstall: true,
  totalStorageBytes: 0,

  resetForUser: () => {
    downloadQueue.length = 0;
    batchTotal = 0;
    batchCompleted = 0;
    set({ downloadedSongs: [], downloadingIds: [], queueSongIds: [], downloadProgress: {}, totalStorageBytes: 0 });
  },

  fetchDownloads: async () => {
    try {
      const data = await AsyncStorage.getItem(getUserKey(DOWNLOAD_STORAGE_KEY));
      const preserveVal = await AsyncStorage.getItem(PRESERVE_ON_UNINSTALL_KEY);
      const isPreserve = preserveVal !== null ? preserveVal === 'true' : true;

      if (data) {
        const list: UnifiedSong[] = JSON.parse(data);
        set({ downloadedSongs: list, preserveOnUninstall: isPreserve });
      } else {
        set({ downloadedSongs: [], preserveOnUninstall: isPreserve });
      }
      get().calculateStorageUsage();
    } catch (e) {
      console.error('Error fetching downloads:', e);
    }
  },

  setPreserveOnUninstall: async (preserve: boolean) => {
    set({ preserveOnUninstall: preserve });
    await AsyncStorage.setItem(PRESERVE_ON_UNINSTALL_KEY, preserve ? 'true' : 'false');
    useToastStore.getState().showToast(
      preserve
        ? 'Đã bật: File nhạc được lưu bảo toàn trên máy khi xoá app'
        : 'Đã tắt: File nhạc sẽ tự động dọn sạch khi gỡ cài đặt app',
      'info'
    );
  },

  calculateStorageUsage: async () => {
    try {
      await ensureDirExists();
      const dirInfo = await FileSystem.getInfoAsync(DOWNLOADS_DIR);
      if (!dirInfo.exists) {
        set({ totalStorageBytes: 0 });
        return 0;
      }
      const files = await FileSystem.readDirectoryAsync(DOWNLOADS_DIR);
      let total = 0;
      for (const f of files) {
        const fileInfo = await FileSystem.getInfoAsync(`${DOWNLOADS_DIR}${f}`);
        if (fileInfo.exists && (fileInfo as any).size) {
          total += (fileInfo as any).size;
        }
      }
      set({ totalStorageBytes: total });
      return total;
    } catch (e) {
      return 0;
    }
  },

  scanAndSyncLocalFiles: async () => {
    try {
      await ensureDirExists();
      const existingSongs = [...get().downloadedSongs];
      const existingUris = new Set(existingSongs.map((s) => s.localUri || s.audioUrl));
      const newlyFound: UnifiedSong[] = [];

      // Quét cả thư mục gốc DocumentDirectory (nơi user giải nén hoặc copy file) và thư mục tempo_downloads
      const dirsToScan = [
        FileSystem.documentDirectory,
        DOWNLOADS_DIR,
      ];

      for (const dir of dirsToScan) {
        if (!dir) continue;
        try {
          const dirInfo = await FileSystem.getInfoAsync(dir);
          if (!dirInfo.exists) continue;

          const entries = await FileSystem.readDirectoryAsync(dir);
          for (const entry of entries) {
            const fullPath = `${dir}${entry}`;
            const fileInfo = await FileSystem.getInfoAsync(fullPath);

            // Nếu là thư mục con (ví dụ thư mục giải nén từ zip)
            if (fileInfo.isDirectory) {
              try {
                const subFiles = await FileSystem.readDirectoryAsync(`${fullPath}/`);
                for (const sub of subFiles) {
                  if (sub.toLowerCase().endsWith('.mp3')) {
                    const subFullPath = `${fullPath}/${sub}`;
                    if (!existingUris.has(subFullPath)) {
                      existingUris.add(subFullPath);
                      const baseName = sub.replace(/\.mp3$/i, '');
                      let title = baseName;
                      let artist = 'Tempo Local';
                      if (baseName.includes(' - ')) {
                        const parts = baseName.split(' - ');
                        artist = parts[0].trim();
                        title = parts.slice(1).join(' - ').trim();
                      }
                      const songId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
                      newlyFound.push({
                        id: songId,
                        rawId: songId,
                        title: title || 'Bài hát tệp máy',
                        artistsNames: artist,
                        audioUrl: subFullPath,
                        localUri: subFullPath,
                        isOffline: true,
                        source: 'local',
                        duration: 0,
                        thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
                      });
                    }
                  }
                }
              } catch (_) {}
            } else if (entry.toLowerCase().endsWith('.mp3')) {
              if (!existingUris.has(fullPath)) {
                existingUris.add(fullPath);
                const baseName = entry.replace(/\.mp3$/i, '');
                let title = baseName;
                let artist = 'Tempo Local';
                if (baseName.includes(' - ')) {
                  const parts = baseName.split(' - ');
                  artist = parts[0].trim();
                  title = parts.slice(1).join(' - ').trim();
                }
                const songId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
                newlyFound.push({
                  id: songId,
                  rawId: songId,
                  title: title || 'Bài hát tệp máy',
                  artistsNames: artist,
                  audioUrl: fullPath,
                  localUri: fullPath,
                  isOffline: true,
                  source: 'local',
                  duration: 0,
                  thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
                });
              }
            }
          }
        } catch (scanErr) {
          console.warn('Scan dir error:', scanErr);
        }
      }

      if (newlyFound.length > 0) {
        const updated = [...newlyFound, ...existingSongs];
        set({ downloadedSongs: updated });
        await AsyncStorage.setItem(getUserKey(DOWNLOAD_STORAGE_KEY), JSON.stringify(updated));
        get().calculateStorageUsage();
        useToastStore.getState().showToast(`Đã tìm thấy và khôi phục ${newlyFound.length} bài hát từ tệp máy!`, 'success');
        return newlyFound.length;
      } else {
        useToastStore.getState().showToast('Thư viện bài hát đã đồng bộ đủ với tệp máy', 'info');
        return 0;
      }
    } catch (e) {
      console.error('scanAndSyncLocalFiles error:', e);
      return 0;
    }
  },

  exportSongToDevice: async (song: UnifiedSong) => {
    const fileUri = song.localUri || song.audioUrl;
    if (!fileUri || !fileUri.startsWith('file://')) {
      useToastStore.getState().showToast('Không tìm thấy tệp nhạc để xuất', 'error');
      return;
    }
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      useToastStore.getState().showToast('Thiết bị không hỗ trợ tính năng chia sẻ tệp', 'error');
      return;
    }
    try {
      const artistPart = song.artistsNames ? `${song.artistsNames} - ` : '';
      const cleanName = `${artistPart}${song.title}`.replace(/[/\\?%*:|"<>]/g, '_').trim();
      const exportUri = `${FileSystem.documentDirectory}${cleanName}.mp3`;

      const fileInfo = await FileSystem.getInfoAsync(exportUri);
      if (!fileInfo.exists) {
        await FileSystem.copyAsync({ from: fileUri, to: exportUri });
      }

      await Sharing.shareAsync(exportUri, {
        mimeType: 'audio/mpeg',
        dialogTitle: `Lưu bài hát vào Tệp: ${song.title}`,
        UTI: 'public.mp3',
      });
      useToastStore.getState().showToast(`Đã xuất "${song.title}" ra Tệp máy`, 'success');
    } catch (e) {
      console.error('Share failed:', e);
    }
  },

  exportAllDownloads: async () => {
    const { downloadedSongs } = get();
    if (downloadedSongs.length === 0) {
      useToastStore.getState().showToast('Chưa có bài hát nào được tải để sao lưu', 'info');
      return;
    }

    // 1. Android: Sử dụng Storage Access Framework (SAF) để lưu toàn bộ tệp vào thư mục người dùng chọn (Music/Downloads)
    if (Platform.OS === 'android' && FileSystem.StorageAccessFramework) {
      try {
        useToastStore.getState().showToast('Vui lòng chọn thư mục trên máy để lưu toàn bộ bài hát', 'info');
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (!permissions.granted) {
          useToastStore.getState().showToast('Đã hủy quyền chọn thư mục lưu', 'info');
          return;
        }

        const targetDirUri = permissions.directoryUri;
        useToastStore.getState().showToast(`Đang sao lưu ${downloadedSongs.length} bài hát ra máy...`, 'info');

        let savedCount = 0;
        for (const song of downloadedSongs) {
          const fileUri = song.localUri || song.audioUrl;
          if (!fileUri || !fileUri.startsWith('file://')) continue;

          const artistPart = song.artistsNames ? `${song.artistsNames} - ` : '';
          const cleanName = `${artistPart}${song.title}`.replace(/[/\\?%*:|"<>]/g, '_').trim();

          try {
            const fileBase64 = await FileSystem.readAsStringAsync(fileUri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            const createdFileUri = await FileSystem.StorageAccessFramework.createFileAsync(
              targetDirUri,
              `${cleanName}.mp3`,
              'audio/mpeg'
            );
            await FileSystem.writeAsStringAsync(createdFileUri, fileBase64, {
              encoding: FileSystem.EncodingType.Base64,
            });
            savedCount++;
          } catch (itemErr) {
            console.warn(`Could not export song ${cleanName}:`, itemErr);
          }
        }

        useToastStore.getState().showToast(
          `Đã sao lưu thành công ${savedCount}/${downloadedSongs.length} bài hát vào thư mục thiết bị!`,
          'success'
        );
        return;
      } catch (safErr) {
        console.warn('[ExportAll] SAF failed, falling back to Sharing...', safErr);
      }
    }

    // 2. iOS & Fallback: Đóng gói 100% TẤT CẢ bài hát vào tệp ZIP (Tempo_Backup_All_Songs.zip)
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      useToastStore.getState().showToast('Thiết bị không hỗ trợ tính năng xuất tệp', 'error');
      return;
    }

    try {
      useToastStore.getState().showToast(`Đang nén ${downloadedSongs.length} bài hát thành tệp sao lưu...`, 'info');

      const zip = new JSZip();
      let packedCount = 0;

      for (const song of downloadedSongs) {
        const fileUri = song.localUri || song.audioUrl;
        if (!fileUri || !fileUri.startsWith('file://')) continue;

        const artistPart = song.artistsNames ? `${song.artistsNames} - ` : '';
        const cleanName = `${artistPart}${song.title}`.replace(/[/\\?%*:|"<>]/g, '_').trim();

        try {
          const base64Data = await FileSystem.readAsStringAsync(fileUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          zip.file(`${cleanName}.mp3`, base64Data, { base64: true });
          packedCount++;
        } catch (readErr) {
          console.warn(`Could not read ${cleanName} for zip:`, readErr);
        }
      }

      if (packedCount === 0) {
        useToastStore.getState().showToast('Không tìm thấy tệp hợp lệ để sao lưu', 'error');
        return;
      }

      const zipBase64 = await zip.generateAsync({ type: 'base64' });
      const zipUri = `${FileSystem.documentDirectory}Tempo_Backup_${packedCount}_BaiHat.zip`;
      await FileSystem.writeAsStringAsync(zipUri, zipBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await Sharing.shareAsync(zipUri, {
        mimeType: 'application/zip',
        dialogTitle: `Sao lưu toàn bộ ${packedCount} bài hát (Tệp ZIP)`,
        UTI: 'public.zip-archive',
      });
      useToastStore.getState().showToast(`Đã tạo gói sao lưu ${packedCount} bài hát!`, 'success');
    } catch (e) {
      console.error('Export all failed:', e);
      useToastStore.getState().showToast('Lỗi khi sao lưu bài hát', 'error');
    }
  },

  clearAllDownloads: async () => {
    try {
      await FileSystem.deleteAsync(DOWNLOADS_DIR, { idempotent: true });
      await ensureDirExists();
      set({ downloadedSongs: [], totalStorageBytes: 0 });
      await AsyncStorage.removeItem(getUserKey(DOWNLOAD_STORAGE_KEY));
      useToastStore.getState().showToast('Đã xóa sạch toàn bộ tệp nhạc tải về', 'success');
    } catch (e) {
      console.error('Clear all downloads error:', e);
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

    get().calculateStorageUsage();
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
