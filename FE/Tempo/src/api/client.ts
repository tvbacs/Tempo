/**
 * Backend API Client for Tempo Mobile
 * Automatically synchronizes with dynamic Cloudflare Tunnel from Supabase & Expo Host IP
 */
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { HomeFeedData, ChartData, SearchResults, UnifiedSong, LyricData, AIDJResponse } from '../types/music';

let currentApiUrl = 'https://privileges-outstanding-allows-multi.trycloudflare.com/api';

// Khởi tạo ngay từ cache trước (sync-like) để không bao giờ dùng URL cũ lỗi thời
AsyncStorage.getItem('@tempo_active_server_url').then((cached) => {
  if (cached && cached.startsWith('http')) {
    currentApiUrl = cached;
  }
}).catch(() => {});

export const getActiveApiUrl = async (forceRefresh = false): Promise<string> => {
  // 1. Nhận diện IP nội bộ máy tính nếu chạy Expo Go cùng mạng Wi-Fi
  const hostUri = Constants.expoConfig?.hostUri;
  if (__DEV__ && hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:5050/api`;
  }

  // 2. Nếu không force refresh, dùng cache đã load trước
  if (!forceRefresh && currentApiUrl) {
    // Vẫn query Supabase ngầm để cập nhật nếu URL thay đổi (không block)
    supabase
      .from('playlists')
      .select('description')
      .eq('name', '__TEMPO_ACTIVE_SERVER__')
      .maybeSingle()
      .then(({ data }) => {
        if (data?.description && data.description.startsWith('http')) {
          const liveUrl = data.description.trim().replace(/\/+$/, '');
          const fullApiUrl = liveUrl.endsWith('/api') ? liveUrl : `${liveUrl}/api`;
          if (fullApiUrl !== currentApiUrl) {
            currentApiUrl = fullApiUrl;
            AsyncStorage.setItem('@tempo_active_server_url', fullApiUrl).catch(() => {});
          }
        }
      })
      .catch(() => {});
    return currentApiUrl;
  }

  // 3. Force refresh: query Supabase với timeout 5s
  try {
    const supabasePromise = supabase
      .from('playlists')
      .select('description')
      .eq('name', '__TEMPO_ACTIVE_SERVER__')
      .maybeSingle();

    const timeoutPromise = new Promise<{ data: any; error: any }>((_, reject) =>
      setTimeout(() => reject(new Error('Supabase discovery timeout')), 5000)
    );

    const { data } = await Promise.race([supabasePromise, timeoutPromise]);

    if (data?.description && data.description.startsWith('http')) {
      const liveUrl = data.description.trim().replace(/\/+$/, '');
      const fullApiUrl = liveUrl.endsWith('/api') ? liveUrl : `${liveUrl}/api`;
      currentApiUrl = fullApiUrl;
      AsyncStorage.setItem('@tempo_active_server_url', fullApiUrl).catch(() => {});
      return fullApiUrl;
    }
  } catch (e) {}

  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  return currentApiUrl;
};

export const API_BASE_URL = currentApiUrl;

/**
 * Fetch với timeout tuỳ chỉnh — mặc định 12s để chịu được cold start server
 */
export const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs = 12000): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Fetch với retry 1 lần: nếu lần đầu timeout/lỗi, tự động force-refresh URL từ Supabase rồi thử lại
 */
const fetchWithRetry = async (
  pathFactory: (base: string) => string,
  options: RequestInit = {},
  timeoutMs = 12000
): Promise<Response> => {
  const baseUrl = await getActiveApiUrl();
  try {
    return await fetchWithTimeout(pathFactory(baseUrl), options, timeoutMs);
  } catch (firstErr) {
    // Lần đầu lỗi → force refresh URL từ Supabase rồi thử lại
    try {
      const freshBase = await getActiveApiUrl(true);
      return await fetchWithTimeout(pathFactory(freshBase), options, timeoutMs);
    } catch (retryErr) {
      throw retryErr;
    }
  }
};

export const apiClient = {
  async getHome(): Promise<HomeFeedData> {
    const res = await fetchWithRetry((base) => `${base}/music/home`, {}, 15000);
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Failed to fetch home feed');
    return json.data;
  },

  async getChart(): Promise<ChartData> {
    const res = await fetchWithRetry((base) => `${base}/music/chart`, {}, 15000);
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Failed to fetch chart data');
    return json.data;
  },

  async getSongStream(id: string, title?: string, artist?: string): Promise<{ audioUrl: string; quality?: string; isFallback?: boolean; message?: string }> {
    const params = new URLSearchParams();
    if (title) params.append('title', title);
    if (artist) params.append('artist', artist);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetchWithRetry((base) => `${base}/music/song/${id}${query}`, {}, 20000);
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Audio stream not found');
    return json.data;
  },

  async getLyrics(id: string): Promise<LyricData> {
    const baseUrl = await getActiveApiUrl();
    const res = await fetchWithTimeout(`${baseUrl}/music/lyrics/${id}`, {}, 5000);
    const json = await res.json();
    if (!json.success) return { lrcUrl: null, sentences: [] };
    return json.data;
  },

  async search(query: string): Promise<SearchResults> {
    const res = await fetchWithRetry(
      (base) => `${base}/music/search?q=${encodeURIComponent(query)}`,
      {},
      12000
    );
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Search failed');
    return json.data;
  },

  async askAIDJ(prompt: string, currentSong?: UnifiedSong, recentHistory?: UnifiedSong[]): Promise<AIDJResponse> {
    const res = await fetchWithRetry((base) => `${base}/music/ai-dj`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, currentSong, recentHistory }),
    }, 20000);
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'AI DJ failed');
    return json.data;
  },

  async getSongStory(title: string, artist: string): Promise<string> {
    const res = await fetchWithRetry((base) => `${base}/music/story`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, artist }),
    }, 10000);
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Failed to get song story');
    return json.data.story;
  },

  async getArtistInfo(alias: string): Promise<{
    id: string;
    name: string;
    alias: string;
    thumbnail: string;
    cover: string;
    biography: string;
    sortBiography: string;
    totalFollow: number;
    national: string;
    realname: string;
  }> {
    const res = await fetchWithRetry((base) => `${base}/music/artist/${encodeURIComponent(alias)}`, {}, 12000);
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Artist not found');
    return json.data;
  },

  async getPlaylistDetail(id: string): Promise<{
    id: string;
    title: string;
    thumbnail: string;
    artistsNames?: string;
    description?: string;
    songCount: number;
    songs: UnifiedSong[];
  }> {
    const rawId = id.replace(/^zing_/, '');
    const res = await fetchWithRetry((base) => `${base}/music/playlist/${encodeURIComponent(rawId)}`, {}, 12000);
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Playlist not found');
    return json.data;
  },

  async extractYouTube(url: string): Promise<UnifiedSong & { audioUrl: string; quality?: string; fileSize?: string }> {
    const res = await fetchWithRetry((base) => `${base}/music/extract-youtube`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    }, 30000);
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Không thể trích xuất nhạc từ YouTube');
    return json.data;
  },
};
