/**
 * Backend API Client for Tempo Mobile
 * Automatically synchronizes with dynamic Cloudflare Tunnel from Supabase & Expo Host IP
 */
import Constants from 'expo-constants';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { supabase } from './supabase';
import { HomeFeedData, ChartData, SearchResults, UnifiedSong, LyricData, AIDJResponse } from '../types/music';

const RENDER_API_URL = 'https://tempo-y734.onrender.com/api';
const LOCAL_PORT = 5050;

// URL khởi tạo mặc định là Render fallback
let currentApiUrl = RENDER_API_URL;
export let API_BASE_URL = currentApiUrl;

let lastLocalCheckTime = 0;
const LOCAL_RECHECK_INTERVAL = 15000;
let isCheckingLocal = false;

// Tạm thời không dùng URL backend đã cache để luôn kết nối Render:
// AsyncStorage.getItem('@tempo_active_server_url').then((cached) => {
//   if (cached && cached.startsWith('http')) {
//     currentApiUrl = cached;
//   }
// }).catch(() => {});

/**
 * Kiểm tra xem một URL backend có đang sống không (health check)
 */
const checkUrlHealth = async (baseUrl: string, timeoutMs = 1500): Promise<boolean> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const cleanBase = baseUrl.replace(/\/+$/, '');
    const healthUrl = cleanBase.endsWith('/api') ? `${cleanBase}/health` : `${cleanBase}/api/health`;
    const res = await fetch(healthUrl, {
      method: 'GET',
      signal: controller.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Lấy danh sách các URL Local Backend khả dĩ (Expo host IP, localhost, emulator)
 */
const getLocalCandidateUrls = (): string[] => {
  const list: string[] = [];
  try {
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      const host = hostUri.split(':')[0];
      if (host) list.push(`http://${host}:${LOCAL_PORT}/api`);
    }
  } catch (_) {}
  list.push(`http://localhost:${LOCAL_PORT}/api`);
  list.push(`http://127.0.0.1:${LOCAL_PORT}/api`);
  list.push(`http://10.0.2.2:${LOCAL_PORT}/api`);
  return [...new Set(list)];
};

/**
 * Dò tìm nhanh xem có Local Backend nào đang chạy không (< 1.5s)
 */
const findOnlineLocalUrl = async (): Promise<string | null> => {
  const candidates = getLocalCandidateUrls();
  const checks = candidates.map(async (url) => {
    const ok = await checkUrlHealth(url, 1500);
    if (ok) return url;
    throw new Error('Offline');
  });
  try {
    return await Promise.any(checks);
  } catch {
    return null;
  }
};

// Khởi động kiểm tra Local BE ngay lập tức ở background khi app mở
findOnlineLocalUrl().then((onlineLocal) => {
  if (onlineLocal) {
    currentApiUrl = onlineLocal;
    API_BASE_URL = onlineLocal;
    console.log('[API Client] Phát hiện BE Local online khi mở app:', onlineLocal);
  } else {
    console.log('[API Client] BE Local chưa online, dùng Render fallback:', RENDER_API_URL);
  }
}).catch(() => {});

export const getActiveApiUrl = async (forceRefresh = false): Promise<string> => {
  // Backend local khi chạy Expo Go, giữ lại để có thể bật lại khi cần:
  // const hostUri = Constants.expoConfig?.hostUri;
  // if (__DEV__ && hostUri) {
  //   const host = hostUri.split(':')[0];
  //   return `http://${host}:5050/api`;
  // }

  // 2. Nếu không force refresh, dùng URL đang active
  if (!forceRefresh && currentApiUrl) {
    // Nếu hiện tại đang trỏ Render nhưng đã quá 15s kể từ lần check local trước,
    // thăm dò ngầm xem BE Local trên máy tính đã bật lên chưa để tự động chuyển lại:
    if (currentApiUrl === RENDER_API_URL && !isCheckingLocal && Date.now() - lastLocalCheckTime > LOCAL_RECHECK_INTERVAL) {
      isCheckingLocal = true;
      findOnlineLocalUrl().then((onlineLocal) => {
        isCheckingLocal = false;
        lastLocalCheckTime = Date.now();
        if (onlineLocal) {
          console.log('[API Client] BE Local đã hoạt động trở lại:', onlineLocal);
          currentApiUrl = onlineLocal;
          API_BASE_URL = onlineLocal;
        }
      }).catch(() => {
        isCheckingLocal = false;
        lastLocalCheckTime = Date.now();
      });
    }

    // Tạm thời tắt tự động đổi URL từ Supabase để giữ backend Render cố định.
    // Promise.resolve(
    //   supabase
    //     .from('playlists')
    //     .select('description')
    //     .eq('name', '__TEMPO_ACTIVE_SERVER__')
    //     .maybeSingle()
    // )
    //   .then((res: any) => {
    //     const data = res?.data;
    //     if (data?.description && data.description.startsWith('http')) {
    //       const liveUrl = data.description.trim().replace(/\/+$/, '');
    //       const fullApiUrl = liveUrl.endsWith('/api') ? liveUrl : `${liveUrl}/api`;
    //       if (fullApiUrl !== currentApiUrl) {
    //         currentApiUrl = fullApiUrl;
    //         AsyncStorage.setItem('@tempo_active_server_url', fullApiUrl).catch(() => {});
    //       }
    //     }
    //   })
    //   .catch(() => {});
    return currentApiUrl;
  }

  // Tạm thời tắt force refresh từ Supabase để không ghi đè backend Render:
  // try {
  //   const supabasePromise = supabase
  //     .from('playlists')
  //     .select('description')
  //     .eq('name', '__TEMPO_ACTIVE_SERVER__')
  //     .maybeSingle();
  //   const timeoutPromise = new Promise<{ data: any; error: any }>((_, reject) =>
  //     setTimeout(() => reject(new Error('Supabase discovery timeout')), 5000)
  //   );
  //   const { data } = await Promise.race([supabasePromise, timeoutPromise]);
  //   if (data?.description && data.description.startsWith('http')) {
  //     const liveUrl = data.description.trim().replace(/\/+$/, '');
  //     const fullApiUrl = liveUrl.endsWith('/api') ? liveUrl : `${liveUrl}/api`;
  //     currentApiUrl = fullApiUrl;
  //     AsyncStorage.setItem('@tempo_active_server_url', fullApiUrl).catch(() => {});
  //     return fullApiUrl;
  //   }
  // } catch (e) {}

  // 1. Thử ưu tiên Local Backend trước
  try {
    lastLocalCheckTime = Date.now();
    const onlineLocal = await findOnlineLocalUrl();
    if (onlineLocal) {
      console.log('[API Client] Đang kết nối BE Local:', onlineLocal);
      currentApiUrl = onlineLocal;
      API_BASE_URL = onlineLocal;
      return currentApiUrl;
    }
  } catch (_) {}

  // 2. Không thấy Local BE -> Fallback sang Render
  console.log('[API Client] BE Local không online, chuyển sang Render fallback:', RENDER_API_URL);
  currentApiUrl = RENDER_API_URL;
  API_BASE_URL = currentApiUrl;

  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  return currentApiUrl;
};

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
 * Fetch với retry 3 cấp độ:
 * 1. Ưu tiên Local BE
 * 2. Nếu Local BE không phản hồi / lỗi -> tự động nhảy sang Render
 * 3. Nếu cả Render cũng lỗi -> throw để giao diện hiển thị Offline
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
    // Nếu đang dùng Local BE mà bị lỗi kết nối -> chuyển ngay sang Render fallback
    if (baseUrl !== RENDER_API_URL) {
      console.warn('[API Client] BE Local không phản hồi, tự động chuyển sang Render fallback...');
      currentApiUrl = RENDER_API_URL;
      API_BASE_URL = RENDER_API_URL;
      try {
        return await fetchWithTimeout(pathFactory(RENDER_API_URL), options, timeoutMs);
      } catch (renderErr) {
        console.warn('[API Client] Cả BE Local và Render đều không khả dụng (Chế độ Offline)');
        throw renderErr;
      }
    } else {
      // Đang dùng Render mà lỗi -> thử refresh tìm lại BE Local xem người dùng đã bật chưa
      try {
        const freshBase = await getActiveApiUrl(true);
        if (freshBase !== RENDER_API_URL) {
          console.log('[API Client] BE Local đã bật lại, thực hiện lại request:', freshBase);
          return await fetchWithTimeout(pathFactory(freshBase), options, timeoutMs);
        }
      } catch (_) {}
      // Nếu Render vẫn lỗi và Local không có -> báo lỗi để UI hiển thị offline
      throw firstErr;
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
