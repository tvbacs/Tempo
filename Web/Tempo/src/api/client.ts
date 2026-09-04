import { UnifiedSong, LyricSentence, Artist } from '../types/music';
// import { supabase } from './supabase';

const LOCAL_PORT = 5050;
const RENDER_API_BASE = 'https://tempo-y734.onrender.com';

// URL khởi tạo:
let cachedApiBase = '';
let lastLocalCheckTime = 0;
const LOCAL_RECHECK_INTERVAL = 15000;
let isCheckingLocal = false;

// Backend Render cố định cũ:
// let cachedApiBase = 'https://tempo-y734.onrender.com';

// Logic cũ từ env / dynamic tunnel:
// let cachedApiBase = (import.meta as any).env?.VITE_API_URL || '';

/**
 * Kiểm tra xem một URL backend có đang sống không (health check)
 */
const checkHealth = async (url: string, timeoutMs = 1500): Promise<boolean> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const cleanUrl = url.replace(/\/+$/, '');
    const healthUrl = cleanUrl.endsWith('/api') ? `${cleanUrl}/health` : `${cleanUrl}/api/health`;
    const res = await fetch(healthUrl, { signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Lấy danh sách các URL Local Backend khả dĩ (localhost, LAN IP từ window.location, env)
 */
const getLocalCandidateUrls = (): string[] => {
  const list: string[] = [];
  try {
    const envUrl = (import.meta as any).env?.VITE_API_URL;
    if (envUrl && typeof envUrl === 'string' && envUrl.includes('5050')) {
      list.push(envUrl.trim().replace(/\/+$/, ''));
    }
  } catch (_) {}

  list.push(`http://localhost:${LOCAL_PORT}`);
  list.push(`http://127.0.0.1:${LOCAL_PORT}`);

  try {
    if (typeof window !== 'undefined' && window.location?.hostname) {
      const host = window.location.hostname;
      if (host && host !== 'localhost' && host !== '127.0.0.1') {
        list.push(`http://${host}:${LOCAL_PORT}`);
      }
    }
  } catch (_) {}

  return [...new Set(list)];
};

/**
 * Helper tương thích Promise.any cho môi trường TypeScript/trình duyệt
 */
const promiseAny = <T>(promises: Promise<T>[]): Promise<T> => {
  if (typeof (Promise as any).any === 'function') {
    return (Promise as any).any(promises);
  }
  return new Promise<T>((resolve, reject) => {
    let rejected = 0;
    if (promises.length === 0) return reject(new Error('Empty promises'));
    promises.forEach((p) => {
      p.then(resolve).catch(() => {
        rejected++;
        if (rejected === promises.length) {
          reject(new Error('All promises failed'));
        }
      });
    });
  });
};

/**
 * Dò tìm nhanh xem có Local Backend nào đang chạy không (< 1.5s)
 */
const findOnlineLocalUrl = async (): Promise<string | null> => {
  const candidates = getLocalCandidateUrls();
  const checks = candidates.map(async (url) => {
    const ok = await checkHealth(url, 1500);
    if (ok) return url;
    throw new Error('Offline');
  });
  try {
    return await promiseAny(checks);
  } catch {
    return null;
  }
};

// Khởi động kiểm tra Local BE ngay lập tức ở background khi mở web
findOnlineLocalUrl().then((onlineLocal) => {
  if (onlineLocal) {
    cachedApiBase = onlineLocal;
    console.log('[Web API] Phát hiện BE Local online khi mở web:', onlineLocal);
  } else {
    console.log('[Web API] BE Local chưa online, dùng Render fallback:', RENDER_API_BASE);
  }
}).catch(() => {});

export async function fetchServerBaseUrl(forceRefresh = false): Promise<string> {
  if (!forceRefresh && cachedApiBase) {
    // Nếu hiện tại đang dùng Render nhưng đã quá 15s kể từ lần check trước,
    // kiểm tra ngầm xem BE Local trên máy đã bật lên chưa để tự động chuyển lại:
    if (cachedApiBase === RENDER_API_BASE && !isCheckingLocal && Date.now() - lastLocalCheckTime > LOCAL_RECHECK_INTERVAL) {
      isCheckingLocal = true;
      findOnlineLocalUrl().then((onlineLocal) => {
        isCheckingLocal = false;
        lastLocalCheckTime = Date.now();
        if (onlineLocal) {
          console.log('[Web API] BE Local đã bật lại:', onlineLocal);
          cachedApiBase = onlineLocal;
        }
      }).catch(() => {
        isCheckingLocal = false;
        lastLocalCheckTime = Date.now();
      });
    }
    return cachedApiBase;
  }

  // 1. Thử ưu tiên kết nối Local Backend trước (port 5050)
  try {
    lastLocalCheckTime = Date.now();
    const onlineLocal = await findOnlineLocalUrl();
    if (onlineLocal) {
      console.log('[Web API] Đang kết nối BE Local:', onlineLocal);
      cachedApiBase = onlineLocal;
      return cachedApiBase;
    }
  } catch (_) {}

  // Logic cũ khi chạy localhost dev server và dynamic sync từ Supabase, giữ lại dạng comment:
  /*
  // Khi chạy localhost
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return '';
  }

  try {
    if (!forceRefresh) {
      const stored = localStorage.getItem('tempo_active_api_url');
      if (stored && stored.startsWith('http')) {
        cachedApiBase = stored;
        return stored;
      }
    }

    const { data } = await supabase
      .from('playlists')
      .select('description')
      .eq('name', '__TEMPO_ACTIVE_SERVER__')
      .maybeSingle();

    if (data?.description && data.description.startsWith('http')) {
      const base = data.description.trim().replace(/\/+$/, '');
      cachedApiBase = base;
      localStorage.setItem('tempo_active_api_url', base);
      return base;
    }
  } catch (_) {}
  */

  // 2. BE Local không online -> fallback sang Render
  console.log('[Web API] BE Local không online, chuyển sang Render fallback:', RENDER_API_BASE);
  cachedApiBase = RENDER_API_BASE;
  return cachedApiBase;
}

export async function getApiUrl(path: string, forceRefresh = false): Promise<string> {
  const base = await fetchServerBaseUrl(forceRefresh);
  if (!base) return path.startsWith('/') ? path : '/' + path;
  const cleanBase = base.replace(/\/api$/, '');
  const cleanPath = path.startsWith('/') ? path : '/' + path;
  return `${cleanBase}${cleanPath}`;
}

async function fetchApi(path: string, options?: RequestInit): Promise<any> {
  let url = await getApiUrl(path);
  try {
    const res = await fetch(url, options);
    if (!res.ok && res.status >= 500) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    // Nếu đang dùng Local BE mà bị lỗi kết nối -> tự động chuyển sang Render fallback
    if (cachedApiBase !== RENDER_API_BASE) {
      console.warn('[Web API] BE Local không phản hồi, tự động chuyển sang Render fallback...');
      cachedApiBase = RENDER_API_BASE;
      const cleanPath = path.startsWith('/') ? path : '/' + path;
      const renderUrl = `${RENDER_API_BASE.replace(/\/api$/, '')}${cleanPath}`;
      try {
        const res = await fetch(renderUrl, options);
        if (!res.ok && res.status >= 500) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch (renderErr) {
        console.warn('[Web API] Cả BE Local và Render đều không khả dụng (Offline)');
        throw renderErr;
      }
    } else {
      // Đang dùng Render mà lỗi -> thử refresh tìm lại xem BE Local đã bật chưa
      try {
        const freshBase = await fetchServerBaseUrl(true);
        if (freshBase && freshBase !== RENDER_API_BASE) {
          console.log('[Web API] BE Local đã bật lại, thử lại với:', freshBase);
          const cleanPath = path.startsWith('/') ? path : '/' + path;
          const freshUrl = `${freshBase.replace(/\/api$/, '')}${cleanPath}`;
          const res = await fetch(freshUrl, options);
          if (!res.ok && res.status >= 500) throw new Error(`HTTP ${res.status}`);
          return await res.json();
        }
      } catch (_) {}
      throw err;
    }
  }
}

export const apiClient = {
  async getChart(): Promise<UnifiedSong[]> {
    try {
      const json = await fetchApi('/api/music/chart');
      const items = json.data?.items || json.data?.songs || (Array.isArray(json.data) ? json.data : []);
      return items;
    } catch (e) {
      console.error('getChart error:', e);
      return [];
    }
  },

  async getHome(): Promise<{
    newReleases: UnifiedSong[];
    featuredPlaylists: any[];
    globalTrending: UnifiedSong[];
  }> {
    try {
      const json = await fetchApi('/api/music/home');
      const d = json.data || {};
      return {
        newReleases: d.newReleasesVPop || d.newReleases || d.newRelease || [],
        featuredPlaylists: d.featuredPlaylists || d.playlists || [],
        globalTrending: d.globalTrending || [],
      };
    } catch (e) {
      console.error('getHome error:', e);
      return { newReleases: [], featuredPlaylists: [], globalTrending: [] };
    }
  },

  async search(query: string): Promise<UnifiedSong[]> {
    if (!query.trim()) return [];
    try {
      const json = await fetchApi(`/api/music/search?q=${encodeURIComponent(query)}`);
      return json.data?.songs || (Array.isArray(json.data) ? json.data : []);
    } catch (e) {
      console.error('search error:', e);
      return [];
    }
  },

  async getSongStream(songId: string, title?: string, artist?: string): Promise<string | null> {
    try {
      const enc = encodeURIComponent;
      const json = await fetchApi(`/api/music/song/${songId}?title=${enc(title || '')}&artist=${enc(artist || '')}`);
      return json.data?.audioUrl || null;
    } catch (e) {
      console.error('getSongStream error:', e);
      return null;
    }
  },

  async getLyrics(songId: string): Promise<LyricSentence[]> {
    try {
      const json = await fetchApi(`/api/music/lyrics/${songId}`);
      return json.data?.sentences || [];
    } catch (e) {
      return [];
    }
  },

  async getPlaylist(id: string): Promise<{ title: string; songs: UnifiedSong[] } | null> {
    try {
      const cleanId = id.startsWith('zing_') ? id.replace('zing_', '') : id;
      const json = await fetchApi(`/api/music/playlist/${cleanId}`);
      const rawSongs = json.data?.songs || json.data?.song?.items || [];
      return {
        title: json.data?.title || 'Playlist',
        songs: Array.isArray(rawSongs) ? rawSongs : [],
      };
    } catch (e) {
      return null;
    }
  },

  async getArtistInfo(alias: string): Promise<Artist | null> {
    try {
      const json = await fetchApi(`/api/music/artist/${alias}`);
      return json.data || null;
    } catch (e) {
      return null;
    }
  },

  async extractYouTube(url: string): Promise<UnifiedSong | null> {
    try {
      const json = await fetchApi('/api/music/extract-youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      return json.data || null;
    } catch (e) {
      console.error('extractYouTube error:', e);
      return null;
    }
  },
};
