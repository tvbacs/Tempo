import { UnifiedSong, LyricSentence, Artist } from '../types/music';
import { supabase } from './supabase';

let cachedApiBase = (import.meta as any).env?.VITE_API_URL || '';

export async function getApiUrl(path: string): Promise<string> {
  let base = cachedApiBase;

  if (!base && typeof window !== 'undefined') {
    // Nếu chạy trên localhost thì dùng proxy Vite tương đối
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return path.startsWith('/') ? path : '/' + path;
    }

    // Khi chạy trên Vercel / Production: lấy từ Supabase
    try {
      const stored = localStorage.getItem('tempo_active_api_url');
      if (stored && stored.startsWith('http')) {
        base = stored;
      } else {
        const { data } = await supabase
          .from('playlists')
          .select('description')
          .eq('name', '__TEMPO_ACTIVE_SERVER__')
          .maybeSingle();

        if (data?.description && data.description.startsWith('http')) {
          base = data.description.trim().replace(/\/+$/, '');
          cachedApiBase = base;
          localStorage.setItem('tempo_active_api_url', base);
        }
      }
    } catch (_) {}
  }

  if (!base) return path.startsWith('/') ? path : '/' + path;
  const cleanBase = base.replace(/\/api$/, '');
  const cleanPath = path.startsWith('/') ? path : '/' + path;
  return `${cleanBase}${cleanPath}`;
}

export const apiClient = {
  async getChart(): Promise<UnifiedSong[]> {
    try {
      const url = await getApiUrl('/api/music/chart');
      const res = await fetch(url);
      const json = await res.json();
      return json.data?.songs || [];
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
      const url = await getApiUrl('/api/music/home');
      const res = await fetch(url);
      const json = await res.json();
      return {
        newReleases: json.data?.newReleases || [],
        featuredPlaylists: json.data?.featuredPlaylists || [],
        globalTrending: json.data?.globalTrending || [],
      };
    } catch (e) {
      console.error('getHome error:', e);
      return { newReleases: [], featuredPlaylists: [], globalTrending: [] };
    }
  },

  async search(query: string): Promise<UnifiedSong[]> {
    if (!query.trim()) return [];
    try {
      const url = await getApiUrl(`/api/music/search?q=${encodeURIComponent(query)}`);
      const res = await fetch(url);
      const json = await res.json();
      return json.data?.songs || [];
    } catch (e) {
      console.error('search error:', e);
      return [];
    }
  },

  async getSongStream(songId: string, title?: string, artist?: string): Promise<string | null> {
    try {
      const enc = encodeURIComponent;
      const url = await getApiUrl(`/api/music/song/${songId}?title=${enc(title || '')}&artist=${enc(artist || '')}`);
      const res = await fetch(url);
      const json = await res.json();
      return json.data?.audioUrl || null;
    } catch (e) {
      console.error('getSongStream error:', e);
      return null;
    }
  },

  async getLyrics(songId: string): Promise<LyricSentence[]> {
    try {
      const url = await getApiUrl(`/api/music/lyrics/${songId}`);
      const res = await fetch(url);
      const json = await res.json();
      return json.data?.sentences || [];
    } catch (e) {
      return [];
    }
  },

  async getPlaylist(id: string): Promise<{ title: string; songs: UnifiedSong[] } | null> {
    try {
      const cleanId = id.startsWith('zing_') ? id.replace('zing_', '') : id;
      const url = await getApiUrl(`/api/music/playlist/${cleanId}`);
      const res = await fetch(url);
      const json = await res.json();
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
      const url = await getApiUrl(`/api/music/artist/${alias}`);
      const res = await fetch(url);
      const json = await res.json();
      return json.data || null;
    } catch (e) {
      return null;
    }
  },

  async extractYouTube(url: string): Promise<UnifiedSong | null> {
    try {
      const postUrl = await getApiUrl('/api/music/extract-youtube');
      const res = await fetch(postUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const json = await res.json();
      return json.data || null;
    } catch (e) {
      console.error('extractYouTube error:', e);
      return null;
    }
  },
};
