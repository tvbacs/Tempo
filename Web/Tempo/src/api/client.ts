import { UnifiedSong, LyricSentence, Artist } from '../types/music';
import { supabase } from './supabase';

let cachedApiBase = (import.meta as any).env?.VITE_API_URL || '';

export async function fetchServerBaseUrl(forceRefresh = false): Promise<string> {
  if (!forceRefresh && cachedApiBase) return cachedApiBase;

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

  return cachedApiBase || '';
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
    // Nếu lỗi kết nối (tunnel đổi URL hoặc mất mạng), xóa cache và query lại Supabase
    try {
      localStorage.removeItem('tempo_active_api_url');
      cachedApiBase = '';
      url = await getApiUrl(path, true);
      const res = await fetch(url, options);
      return await res.json();
    } catch (retryErr) {
      throw retryErr;
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
