/**
 * Backend API Client for Tempo Mobile
 * Automatically synchronizes with dynamic Cloudflare Tunnel from Supabase & Expo Host IP
 */
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { HomeFeedData, ChartData, SearchResults, UnifiedSong, LyricData, AIDJResponse } from '../types/music';

// Render fallback cũ (tạm comment theo yêu cầu để tránh việc chờ Render ngủ dậy quá lâu):
// const RENDER_API_URL = 'https://tempo-y734.onrender.com/api';
const LOCAL_PORT = 5050;

// URL khởi tạo: load từ cache nếu có
let currentApiUrl = '';
export let API_BASE_URL = currentApiUrl;

AsyncStorage.getItem('@tempo_active_server_url').then((cached) => {
  if (cached && cached.startsWith('http')) {
    currentApiUrl = cached;
    API_BASE_URL = cached;
  }
}).catch(() => {});

let lastLocalCheckTime = 0;
const LOCAL_RECHECK_INTERVAL = 15000;
let isCheckingLocal = false;

/**
 * Kiểm tra xem một URL backend có đang sống không (health check)
 */
const checkUrlHealth = async (baseUrl: string, timeoutMs = 2000): Promise<boolean> => {
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
 * Lấy danh sách các URL Local Backend khả dĩ (Expo host IP, LAN IP máy tính, localhost, emulator)
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

  // IP Wi-Fi của máy tính chạy BE (để điện thoại cùng mạng Wi-Fi truy cập trực tiếp cực nhanh)
  list.push(`http://192.168.1.7:${LOCAL_PORT}/api`);
  list.push(`http://localhost:${LOCAL_PORT}/api`);
  list.push(`http://127.0.0.1:${LOCAL_PORT}/api`);
  list.push(`http://10.0.2.2:${LOCAL_PORT}/api`);
  return [...new Set(list)];
};

/**
 * Lấy URL Cloudflare Tunnel mới nhất từ Supabase
 * (tunnel-sync.js trong backend.bat tự động đồng bộ lên mỗi khi mở server)
 */
const fetchSupabaseTunnelUrl = async (): Promise<string | null> => {
  try {
    const supabasePromise = supabase
      .from('playlists')
      .select('description')
      .eq('name', '__TEMPO_ACTIVE_SERVER__')
      .maybeSingle();
    const timeoutPromise = new Promise<{ data: any; error: any }>((_, reject) =>
      setTimeout(() => reject(new Error('Supabase discovery timeout')), 3000)
    );
    const { data } = await Promise.race([supabasePromise, timeoutPromise]);
    if (data?.description && data.description.startsWith('http')) {
      const liveUrl = data.description.trim().replace(/\/+$/, '');
      const fullApiUrl = liveUrl.endsWith('/api') ? liveUrl : `${liveUrl}/api`;
      return fullApiUrl;
    }
  } catch (_) {}
  return null;
};

/**
 * Dò tìm nhanh URL Backend đang sống (kết hợp Cloudflare Tunnel từ Supabase + IP nội bộ)
 */
const findOnlineServerUrl = async (): Promise<string | null> => {
  const candidateChecks: Promise<string>[] = [];

  // 1. Kiểm tra Cloudflare Tunnel từ Supabase (giải pháp chính cho điện thoại)
  const tunnelCheck = fetchSupabaseTunnelUrl().then(async (tunnelUrl) => {
    if (tunnelUrl) {
      const ok = await checkUrlHealth(tunnelUrl, 2500);
      if (ok) return tunnelUrl;
    }
    throw new Error('Tunnel offline');
  });
  candidateChecks.push(tunnelCheck);

  // 2. Kiểm tra các IP nội bộ (LAN / Expo host)
  const localUrls = getLocalCandidateUrls();
  localUrls.forEach((url) => {
    const localCheck = checkUrlHealth(url, 1500).then((ok) => {
      if (ok) return url;
      throw new Error('Local IP offline');
    });
    candidateChecks.push(localCheck);
  });

  // URL nào phản hồi 200 trước thì chốt luôn URL đó
  try {
    const winner = await Promise.any(candidateChecks);
    if (winner) {
      AsyncStorage.setItem('@tempo_active_server_url', winner).catch(() => {});
      return winner;
    }
  } catch (_) {}

  return null;
};

// Khởi động kiểm tra ngay khi mở app
findOnlineServerUrl().then((onlineUrl) => {
  if (onlineUrl) {
    currentApiUrl = onlineUrl;
    API_BASE_URL = onlineUrl;
    console.log('[API Client] Đã kết nối BE thành công:', onlineUrl);
  } else {
    console.log('[API Client] BE chưa online -> Sẽ hiển thị chế độ Ngoại tuyến (Offline)');
  }
}).catch(() => {});

export const getActiveApiUrl = async (forceRefresh = false): Promise<string> => {
  // 1. Nếu không forceRefresh và đã có URL đang dùng
  if (!forceRefresh && currentApiUrl) {
    return currentApiUrl;
  }

  // 2. Dò tìm Server đang online (Cloudflare Tunnel từ backend.bat hoặc IP LAN)
  try {
    lastLocalCheckTime = Date.now();
    const onlineUrl = await findOnlineServerUrl();
    if (onlineUrl) {
      console.log('[API Client] Đang kết nối BE:', onlineUrl);
      currentApiUrl = onlineUrl;
      API_BASE_URL = onlineUrl;
      return currentApiUrl;
    }
  } catch (_) {}

  // Fallback sang Render cũ (tạm đóng theo yêu cầu để vào ngay Offline, không chờ Render lâu):
  /*
  console.log('[API Client] BE Local không online, chuyển sang Render fallback:', RENDER_API_URL);
  currentApiUrl = RENDER_API_URL;
  API_BASE_URL = currentApiUrl;
  return currentApiUrl;
  */

  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Nếu không có server nào phản hồi -> ném lỗi ngay để app kích hoạt chế độ Ngoại tuyến (Offline)
  throw new Error('Local Backend is unreachable (Offline mode)');
};

/**
 * Fetch với timeout tuỳ chỉnh — mặc định 6s cho Local BE (thay vì 12s chờ Render)
 */
export const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs = 6000): Promise<Response> => {
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
 * Fetch với Local BE:
 * Nếu không kết nối được Local BE -> chuyển ngay sang chế độ Offline (không chờ Render)
 */
const fetchWithRetry = async (
  pathFactory: (base: string) => string,
  options: RequestInit = {},
  timeoutMs = 6000
): Promise<Response> => {
  try {
    const baseUrl = await getActiveApiUrl();
    return await fetchWithTimeout(pathFactory(baseUrl), options, timeoutMs);
  } catch (firstErr) {
    // Thử làm mới kiểm tra lại Local BE 1 lần
    try {
      const freshBase = await getActiveApiUrl(true);
      return await fetchWithTimeout(pathFactory(freshBase), options, timeoutMs);
    } catch (retryErr) {
      /*
      // Fallback sang Render cũ (tạm đóng theo yêu cầu):
      if (typeof RENDER_API_URL !== 'undefined') {
        console.warn('[API Client] BE Local không phản hồi, tự động chuyển sang Render fallback...');
        try {
          return await fetchWithTimeout(pathFactory(RENDER_API_URL), options, 12000);
        } catch (renderErr) {
          throw renderErr;
        }
      }
      */
      console.warn('[API Client] Không thể kết nối BE Local -> Kích hoạt chế độ Ngoại tuyến (Offline)');
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
