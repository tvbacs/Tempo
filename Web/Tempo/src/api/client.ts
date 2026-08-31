import { UnifiedSong, LyricSentence, Artist } from '../types/music';

const API_BASE = (import.meta as any).env?.VITE_API_URL || '';

export const apiClient = {
  async getChart(): Promise<UnifiedSong[]> {
    try {
      const res = await fetch(`${API_BASE}/api/music/chart`);
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
      const res = await fetch(`${API_BASE}/api/music/home`);
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
      const res = await fetch(`${API_BASE}/api/music/search?q=${encodeURIComponent(query)}`);
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
      const res = await fetch(`${API_BASE}/api/music/song/${songId}?title=${enc(title || '')}&artist=${enc(artist || '')}`);
      const json = await res.json();
      return json.data?.audioUrl || null;
    } catch (e) {
      console.error('getSongStream error:', e);
      return null;
    }
  },

  async getLyrics(songId: string): Promise<LyricSentence[]> {
    try {
      const res = await fetch(`${API_BASE}/api/music/lyrics/${songId}`);
      const json = await res.json();
      return json.data?.sentences || [];
    } catch (e) {
      return [];
    }
  },

  async getPlaylist(id: string): Promise<{ title: string; songs: UnifiedSong[] } | null> {
    try {
      const res = await fetch(`${API_BASE}/api/music/playlist/${id}`);
      const json = await res.json();
      return {
        title: json.data?.title || 'Playlist',
        songs: json.data?.song?.items || [],
      };
    } catch (e) {
      return null;
    }
  },

  async getArtistInfo(alias: string): Promise<Artist | null> {
    try {
      const res = await fetch(`${API_BASE}/api/music/artist/${alias}`);
      const json = await res.json();
      return json.data || null;
    } catch (e) {
      return null;
    }
  },
};
