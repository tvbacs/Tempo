/**
 * Backend API Client for Tempo Mobile
 * Automatically synchronizes with dynamic Cloudflare Tunnel from Supabase & Expo Host IP
 */
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { HomeFeedData, ChartData, SearchResults, UnifiedSong, LyricData, AIDJResponse } from '../types/music';

let currentApiUrl = 'https://privileges-outstanding-allows-multi.trycloudflare.com/api';

AsyncStorage.getItem('@tempo_active_server_url').then((cached) => {
  if (cached && cached.startsWith('http')) {
    currentApiUrl = cached;
  }
}).catch(() => {});

export const getActiveApiUrl = async (): Promise<string> => {
  // 1. Nhận diện IP nội bộ máy tính nếu chạy Expo Go cùng mạng Wi-Fi
  const hostUri = Constants.expoConfig?.hostUri;
  if (__DEV__ && hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:5050/api`;
  }

  // 2. Lấy URL Cloudflare Tunnel mới nhất được cập nhật tự động lên Supabase
  try {
    const { data } = await supabase
      .from('playlists')
      .select('description')
      .eq('name', '__TEMPO_ACTIVE_SERVER__')
      .maybeSingle();

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

export const apiClient = {
  async getHome(): Promise<HomeFeedData> {
    const baseUrl = await getActiveApiUrl();
    const res = await fetch(`${baseUrl}/music/home`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Failed to fetch home feed');
    return json.data;
  },

  async getChart(): Promise<ChartData> {
    const baseUrl = await getActiveApiUrl();
    const res = await fetch(`${baseUrl}/music/chart`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Failed to fetch chart data');
    return json.data;
  },

  async getSongStream(id: string, title?: string, artist?: string): Promise<{ audioUrl: string; quality?: string; isFallback?: boolean; message?: string }> {
    const baseUrl = await getActiveApiUrl();
    const params = new URLSearchParams();
    if (title) params.append('title', title);
    if (artist) params.append('artist', artist);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${baseUrl}/music/song/${id}${query}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Audio stream not found');
    return json.data;
  },

  async getLyrics(id: string): Promise<LyricData> {
    const baseUrl = await getActiveApiUrl();
    const res = await fetch(`${baseUrl}/music/lyrics/${id}`);
    const json = await res.json();
    if (!json.success) return { lrcUrl: null, sentences: [] };
    return json.data;
  },

  async search(query: string): Promise<SearchResults> {
    const baseUrl = await getActiveApiUrl();
    const res = await fetch(`${baseUrl}/music/search?q=${encodeURIComponent(query)}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Search failed');
    return json.data;
  },

  async askAIDJ(prompt: string, currentSong?: UnifiedSong, recentHistory?: UnifiedSong[]): Promise<AIDJResponse> {
    const baseUrl = await getActiveApiUrl();
    const res = await fetch(`${baseUrl}/music/ai-dj`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, currentSong, recentHistory }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'AI DJ failed');
    return json.data;
  },

  async getSongStory(title: string, artist: string): Promise<string> {
    const baseUrl = await getActiveApiUrl();
    const res = await fetch(`${baseUrl}/music/story`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, artist }),
    });
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
    const baseUrl = await getActiveApiUrl();
    const res = await fetch(`${baseUrl}/music/artist/${encodeURIComponent(alias)}`);
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
    const baseUrl = await getActiveApiUrl();
    const rawId = id.replace(/^zing_/, '');
    const res = await fetch(`${baseUrl}/music/playlist/${encodeURIComponent(rawId)}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Playlist not found');
    return json.data;
  },

  async extractYouTube(url: string): Promise<UnifiedSong & { audioUrl: string; quality?: string; fileSize?: string }> {
    const baseUrl = await getActiveApiUrl();
    const res = await fetch(`${baseUrl}/music/extract-youtube`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Không thể trích xuất nhạc từ YouTube');
    return json.data;
  },
};
