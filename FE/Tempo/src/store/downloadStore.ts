/**
 * Download & Isolated Offline Playback Store
 * Quản lý tải và lưu trữ nhạc ngoại tuyến tách biệt 100% theo từng User
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
  downloadProgress: Record<string, number>; // songId -> 0..1
  isLoading: boolean;

  // Actions
  resetForUser: () => void;
  fetchDownloads: () => Promise<void>;
  downloadSong: (song: UnifiedSong) => Promise<void>;
  removeDownload: (songId: string) => Promise<void>;
  isDownloaded: (songId: string) => boolean;
  isDownloading: (songId: string) => boolean;
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

export const useDownloadStore = create<DownloadState>((set, get) => ({
  downloadedSongs: [],
  downloadingIds: [],
  downloadProgress: {},
  isLoading: false,

  resetForUser: () => {
    set({ downloadedSongs: [], downloadingIds: [], downloadProgress: {} });
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
    if (downloadingIds.includes(song.id)) return;

    set({
      downloadingIds: [...downloadingIds, song.id],
      downloadProgress: { ...get().downloadProgress, [song.id]: 0 },
    });
    useToastStore.getState().showToast(`Bắt đầu tải "${song.title.length > 22 ? song.title.substring(0, 22) + '…' : song.title}"...`, 'info');
    useToastStore.getState().showDownloadToast(song.id, song.title, 0);

    try {
      await ensureDirExists();

      // Lấy URL stream
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

      // Tải với progress callback — cập nhật real-time progress bar
      const downloadResumable = FileSystem.createDownloadResumable(
        sourceUrl,
        fileUri,
        {},
        (progress) => {
          const { totalBytesExpectedToWrite, totalBytesWritten } = progress;
          if (totalBytesExpectedToWrite > 0) {
            const pct = totalBytesWritten / totalBytesExpectedToWrite;
            set({ downloadProgress: { ...get().downloadProgress, [song.id]: pct } });
            // Cập nhật progress bar toast liên tục
            useToastStore.getState().showDownloadToast(song.id, song.title, pct);
          }
        }
      );

      let downloadResult = await downloadResumable.downloadAsync();

      // Nếu direct URL thất bại, thử proxy backend
      if (!downloadResult || downloadResult.status !== 200) {
        console.warn('[Download] Direct URL failed, trying proxy...');
        const proxyUrl = `${API_BASE_URL}/music/stream-proxy?url=${encodeURIComponent(sourceUrl)}`;
        const proxyResumable = FileSystem.createDownloadResumable(
          proxyUrl,
          fileUri,
          {},
          (progress) => {
            const { totalBytesExpectedToWrite, totalBytesWritten } = progress;
            if (totalBytesExpectedToWrite > 0) {
              const pct = totalBytesWritten / totalBytesExpectedToWrite;
              set({ downloadProgress: { ...get().downloadProgress, [song.id]: pct } });
            }
          }
        );
        downloadResult = await proxyResumable.downloadAsync();
      }

      if (downloadResult && downloadResult.status === 200) {
        const downloadedSong: UnifiedSong = {
          ...song,
          audioUrl: downloadResult.uri,
          localUri: downloadResult.uri,
          isOffline: true,
        };

        const updated = [downloadedSong, ...get().downloadedSongs.filter(s => s.id !== song.id)];
        const clearProgress = () => {
          const p = { ...get().downloadProgress };
          delete p[song.id];
          return p;
        };

        set({
          downloadedSongs: updated,
          downloadingIds: get().downloadingIds.filter((id) => id !== song.id),
          downloadProgress: clearProgress(),
        });

        await AsyncStorage.setItem(getUserKey(DOWNLOAD_STORAGE_KEY), JSON.stringify(updated));
        useToastStore.getState().showDownloadToast(song.id, song.title, 1);
        useToastStore.getState().showToast(`Đã lưu "${song.title}" thành công!`, 'success');
      } else {
        throw new Error(`Download failed with HTTP ${downloadResult?.status ?? 'unknown'}`);
      }
    } catch (err: any) {
      console.error('Download failed:', err);
      const clearProgress = () => {
        const p = { ...get().downloadProgress };
        delete p[song.id];
        return p;
      };
      set({
        downloadingIds: get().downloadingIds.filter((id) => id !== song.id),
        downloadProgress: clearProgress(),
      });
      useToastStore.getState().hideDownloadToast(song.id);
      useToastStore.getState().showToast('Tải xuống thất bại: ' + (err.message || 'Lỗi mạng'), 'error');
    }
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

  getProgress: (songId: string) => {
    return get().downloadProgress[songId] ?? 0;
  },
}));
