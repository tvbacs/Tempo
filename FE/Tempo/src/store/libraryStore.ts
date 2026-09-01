/**
 * libraryStore - Dual-layer Persistence (AsyncStorage for 0ms load + Supabase Cloud DB)
 * Strictly isolated per user. Data is NEVER lost on reload.
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../api/supabase';
import { UnifiedSong, Artist, Album } from '../types/music';
import { useAuthStore } from './authStore';
import { useToastStore } from './toastStore';

export interface HistoryItem {
  song: UnifiedSong;
  lastPositionMs: number;
  durationMs: number;
  updatedAt: number;
}

export interface CustomPlaylist {
  id: string;
  name: string;
  description?: string;
  coverUrl?: string;
  songCount?: number;
  songs?: UnifiedSong[];
}

export interface PlayedContext {
  id: string;
  title: string;
  thumbnail: string;
  type: 'playlist' | 'album';
  artistsNames?: string;
  updatedAt: number;
}

interface LibraryState {
  likedSongs: UnifiedSong[];
  playlists: CustomPlaylist[];
  followedArtists: Artist[];
  savedAlbums: Album[];
  history: HistoryItem[];
  lastPlayedContext: PlayedContext | null;
  lastPlayedAlbum: PlayedContext | null;
  lastPlayedPlaylist: PlayedContext | null;
  isLoading: boolean;

  resetForUser: () => void;
  fetchLikedSongs: () => Promise<void>;
  toggleLike: (song: UnifiedSong) => Promise<boolean>;
  isLiked: (songId: string) => boolean;

  createPlaylist: (name: string, description?: string) => Promise<boolean>;
  deletePlaylist: (playlistId: string) => Promise<void>;
  renamePlaylist: (playlistId: string, newName: string) => Promise<void>;
  addSongToPlaylist: (playlistId: string, song: UnifiedSong) => Promise<boolean>;
  removeSongFromPlaylist: (playlistId: string, songId: string) => Promise<void>;
  isSongInPlaylist: (playlistId: string, songId: string) => boolean;
  fetchPlaylists: () => Promise<void>;

  fetchFollowedArtists: () => Promise<void>;
  toggleFollowArtist: (artist: Artist) => Promise<boolean>;
  isArtistFollowed: (artistIdOrName: string) => boolean;

  fetchSavedAlbums: () => Promise<void>;
  toggleSaveAlbum: (album: Album) => Promise<boolean>;
  isAlbumSaved: (albumId: string) => boolean;

  fetchHistory: () => Promise<void>;
  recordHistory: (song: UnifiedSong, positionMs?: number, durationMs?: number) => Promise<void>;

  fetchLastPlayedContext: () => Promise<void>;
  setLastPlayedContext: (context: { id: string; title: string; thumbnail: string; type: 'playlist' | 'album'; artistsNames?: string }) => Promise<void>;
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const uid = () => useAuthStore.getState().user?.id ?? null;
const userKey = (base: string) => `${base}_${uid() || 'anon'}`;

const isGhostOfflineSong = (s: any): boolean => {
  if (!s) return true;
  const isOfflineType = s.source === 'downloaded' || s.source === 'local' || s.isOffline === true;
  const isLocalId = typeof s.id === 'string' && (s.id.startsWith('local_') || s.id.startsWith('download_'));
  if (isOfflineType || isLocalId) {
    try {
      const { useDownloadStore } = require('./downloadStore');
      const downloadedSongs = useDownloadStore.getState().downloadedSongs;
      return !downloadedSongs.some((d: any) => d.id === s.id);
    } catch (_) {}
    return true;
  }
  return false;
};

const STORAGE_KEYS = {
  LIKED: 'tempo_liked_songs',
  PLAYLISTS: 'tempo_custom_playlists',
  ARTISTS: 'tempo_followed_artists',
  ALBUMS: 'tempo_saved_albums',
  HISTORY: 'tempo_history_items',
};

export const useLibraryStore = create<LibraryState>((set, get) => ({
  likedSongs: [],
  playlists: [],
  followedArtists: [],
  savedAlbums: [],
  history: [],
  lastPlayedContext: null,
  lastPlayedAlbum: null,
  lastPlayedPlaylist: null,
  isLoading: false,

  resetForUser: () =>
    set({
      likedSongs: [],
      playlists: [],
      followedArtists: [],
      savedAlbums: [],
      history: [],
      lastPlayedContext: null,
      lastPlayedAlbum: null,
      lastPlayedPlaylist: null,
    }),

  // ── Liked Songs ──────────────────────────────────────────────────────────
  fetchLikedSongs: async () => {
    const userId = uid();
    const storageKey = userKey(STORAGE_KEYS.LIKED);

    // 1. Instant local read (0ms load)
    try {
      const local = await AsyncStorage.getItem(storageKey);
      if (local) {
        const parsed: UnifiedSong[] = JSON.parse(local);
        if (Array.isArray(parsed)) {
          const validLocal = parsed.filter((s) => !isGhostOfflineSong(s));
          set({ likedSongs: validLocal });
        }
      }
    } catch (e) {
      console.warn('[Library] Failed to load local liked songs:', e);
    }

    if (!userId) return;

    // 2. Background sync from Supabase using exact schema columns
    try {
      const { data, error } = await supabase
        .from('liked_songs')
        .select('song_id, title, artists_names, thumbnail, duration, source, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[Supabase] fetchLikedSongs error:', error.message);
        return;
      }

      if (data && data.length > 0) {
        const cloudSongs: UnifiedSong[] = data
          .map((r: any) => ({
            id: r.song_id,
            rawId: r.song_id,
            title: r.title || 'Bài hát',
            artistsNames: r.artists_names || 'Nghệ sĩ',
            thumbnail: r.thumbnail || '',
            duration: r.duration || 0,
            source: (r.source as any) || 'zing',
            addedAt: r.created_at,
          }))
          .filter((s) => !isGhostOfflineSong(s));

        // Merge cloud with local
        const currentLocal = get().likedSongs.filter((s) => !isGhostOfflineSong(s));
        const mergedMap = new Map<string, UnifiedSong>();
        cloudSongs.forEach((s) => mergedMap.set(s.id, s));
        currentLocal.forEach((s) => {
          if (!mergedMap.has(s.id)) {
            mergedMap.set(s.id, s);
          } else {
            const cloud = mergedMap.get(s.id)!;
            mergedMap.set(s.id, { ...cloud, addedAt: cloud.addedAt || s.addedAt });
          }
        });
        const merged = Array.from(mergedMap.values()).filter((s) => !isGhostOfflineSong(s));

        set({ likedSongs: merged });
        await AsyncStorage.setItem(storageKey, JSON.stringify(merged));
      } else if (get().likedSongs.length > 0) {
        // Cloud is empty but local has items: sync local up to Supabase
        const localSongs = get().likedSongs.filter((s) => !isGhostOfflineSong(s));
        for (const s of localSongs) {
          await supabase.from('liked_songs').upsert({
            user_id: userId,
            song_id: s.id,
            title: s.title,
            artists_names: s.artistsNames,
            thumbnail: s.thumbnail,
            duration: s.duration || 0,
            source: s.source || 'zing',
          });
        }
      }
    } catch (e) {
      console.warn('[Library] Background sync liked songs error:', e);
    }
  },

  toggleLike: async (song) => {
    const userId = uid();
    const { likedSongs } = get();
    const liked = likedSongs.some((s) => s.id === song.id);
    let updated: UnifiedSong[];

    if (liked) {
      updated = likedSongs.filter((s) => s.id !== song.id);
      useToastStore.getState().showToast('Đã xóa khỏi Bài hát ưa thích', 'info');
    } else {
      const nowIso = new Date().toISOString();
      const songWithAddedAt: UnifiedSong = { ...song, addedAt: song.addedAt || nowIso };
      updated = [songWithAddedAt, ...likedSongs];
      useToastStore.getState().showToast('Đã thêm vào Bài hát ưa thích', 'info');
    }

    // Local immediate write
    set({ likedSongs: updated });
    await AsyncStorage.setItem(userKey(STORAGE_KEYS.LIKED), JSON.stringify(updated));

    // Cloud background sync
    if (userId) {
      try {
        if (liked) {
          await supabase.from('liked_songs').delete().eq('user_id', userId).eq('song_id', song.id);
        } else {
          await supabase.from('liked_songs').upsert({
            user_id: userId,
            song_id: song.id,
            title: song.title,
            artists_names: song.artistsNames,
            thumbnail: song.thumbnail,
            duration: song.duration || 0,
            source: song.source || 'zing',
          });
        }
      } catch (e) {
        console.warn('[Supabase] toggleLike error:', e);
      }
    }

    return !liked;
  },

  isLiked: (songId) => get().likedSongs.some((s) => s.id === songId),

  // ── Playlists ─────────────────────────────────────────────────────────────
  fetchPlaylists: async () => {
    const userId = uid();
    const storageKey = userKey(STORAGE_KEYS.PLAYLISTS);

    // 1. Instant local read
    try {
      const local = await AsyncStorage.getItem(storageKey);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter((p: any) => p.name && !p.name.includes('TEMPO_ACTIVE') && !p.name.includes('active-server') && !p.name.startsWith('__'));
          set({ playlists: cleaned });
        }
      }
    } catch (e) {}

    if (!userId) return;

    // 2. Background sync from Supabase
    try {
      const { data, error } = await supabase
        .from('playlists')
        .select('id, name, description, cover_url, created_at, updated_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[Supabase] fetchPlaylists error:', error.message);
        return;
      }

      if (data && data.length > 0) {
        const localList = get().playlists.filter((p: any) => p.name && !p.name.includes('TEMPO_ACTIVE') && !p.name.includes('active-server') && !p.name.startsWith('__'));
        const cloudPlaylists: CustomPlaylist[] = data
          .filter((r: any) => r.name && !r.name.includes('TEMPO_ACTIVE') && !r.name.includes('active-server') && !r.name.startsWith('__'))
          .map((r: any) => {
            const matchedLocal = localList.find((p) => p.id === r.id);
            let parsedSongs: UnifiedSong[] = [];
            if (r.description) {
              try {
                if (r.description.startsWith('[') || r.description.startsWith('{')) {
                  const p = JSON.parse(r.description);
                  if (Array.isArray(p)) parsedSongs = p;
                  else if (p && Array.isArray(p.songs)) parsedSongs = p.songs;
                }
              } catch (_) {}
            }
            const localSongs = (matchedLocal?.songs || []).filter((s) => !isGhostOfflineSong(s));
            const validSongs = parsedSongs.length > 0 ? parsedSongs : localSongs;

            // Nếu local có bài mà cloud chưa có trong description, sync lên cloud
            if (localSongs.length > 0 && parsedSongs.length === 0 && userId) {
              void supabase.from('playlists').update({
                description: JSON.stringify(localSongs),
                cover_url: localSongs[0]?.thumbnail || r.cover_url || '',
                updated_at: new Date().toISOString(),
              }).eq('id', r.id);
            }

            return {
              id: r.id,
              name: r.name,
              description: r.description?.startsWith('[') ? '' : r.description,
              coverUrl: r.cover_url || validSongs[0]?.thumbnail,
              songs: validSongs,
              songCount: validSongs.length,
            };
          });

        // Merge
        const mergedMap = new Map<string, CustomPlaylist>();
        cloudPlaylists.forEach((p) => mergedMap.set(p.id, p));
        localList.forEach((p) => {
          if (!mergedMap.has(p.id)) {
            const validSongs = (p.songs || []).filter((s) => !isGhostOfflineSong(s));
            mergedMap.set(p.id, { ...p, songs: validSongs, songCount: validSongs.length });
          }
        });
        const merged = Array.from(mergedMap.values());

        set({ playlists: merged });
        await AsyncStorage.setItem(storageKey, JSON.stringify(merged));
      }
    } catch (e) {
      console.warn('[Library] Background sync playlists error:', e);
    }
  },

  createPlaylist: async (name, description) => {
    const userId = uid();
    const plId = generateUUID();
    const pl: CustomPlaylist = {
      id: plId,
      name,
      description,
      songs: [],
      songCount: 0,
    };
    const updated = [pl, ...get().playlists];
    set({ playlists: updated });
    await AsyncStorage.setItem(userKey(STORAGE_KEYS.PLAYLISTS), JSON.stringify(updated));

    if (userId) {
      try {
        await supabase.from('playlists').upsert({
          id: pl.id,
          user_id: userId,
          name: pl.name,
          description: pl.description || '',
          cover_url: pl.coverUrl || '',
        });
      } catch (e) {
        console.warn('[Supabase] createPlaylist error:', e);
      }
    }

    useToastStore.getState().showToast('Đã tạo danh sách phát', 'success');
    return true;
  },

  deletePlaylist: async (playlistId) => {
    const userId = uid();
    const updated = get().playlists.filter((p) => p.id !== playlistId);
    set({ playlists: updated });
    await AsyncStorage.setItem(userKey(STORAGE_KEYS.PLAYLISTS), JSON.stringify(updated));

    if (userId) {
      try {
        await supabase.from('playlists').delete().eq('user_id', userId).eq('id', playlistId);
      } catch (e) {}
    }
  },

  renamePlaylist: async (playlistId, newName) => {
    const userId = uid();
    const updated = get().playlists.map((p) =>
      p.id === playlistId ? { ...p, name: newName } : p
    );
    set({ playlists: updated });
    await AsyncStorage.setItem(userKey(STORAGE_KEYS.PLAYLISTS), JSON.stringify(updated));

    if (userId) {
      try {
        await supabase.from('playlists').update({ name: newName }).eq('id', playlistId);
      } catch (e) {}
    }
  },

  addSongToPlaylist: async (playlistId, song) => {
    const userId = uid();
    const pl = get().playlists.find((p) => p.id === playlistId);
    if (!pl) return false;

    const songs = pl.songs || [];
    if (songs.some((s) => s.id === song.id)) {
      useToastStore.getState().showToast('Bài hát đã có trong danh sách', 'info');
      return false;
    }

    const updatedSongs = [...songs, song];
    const updated = get().playlists.map((p) =>
      p.id === playlistId
        ? {
            ...p,
            songs: updatedSongs,
            songCount: updatedSongs.length,
            coverUrl: p.coverUrl || song.thumbnail,
          }
        : p
    );

    set({ playlists: updated });
    await AsyncStorage.setItem(userKey(STORAGE_KEYS.PLAYLISTS), JSON.stringify(updated));

    if (userId) {
      try {
        await supabase
          .from('playlists')
          .update({
            description: JSON.stringify(updatedSongs),
            cover_url: updatedSongs[0]?.thumbnail || '',
            updated_at: new Date().toISOString(),
          })
          .eq('id', playlistId);
      } catch (e) {}
    }

    useToastStore.getState().showToast(`Đã thêm vào ${pl.name}`, 'success');
    return true;
  },

  removeSongFromPlaylist: async (playlistId, songId) => {
    const userId = uid();
    const pl = get().playlists.find((p) => p.id === playlistId);
    if (!pl) return;

    const updatedSongs = (pl.songs || []).filter((s) => s.id !== songId);
    const updated = get().playlists.map((p) =>
      p.id === playlistId
        ? {
            ...p,
            songs: updatedSongs,
            songCount: updatedSongs.length,
          }
        : p
    );

    set({ playlists: updated });
    await AsyncStorage.setItem(userKey(STORAGE_KEYS.PLAYLISTS), JSON.stringify(updated));

    if (userId) {
      try {
        await supabase
          .from('playlists')
          .update({
            description: JSON.stringify(updatedSongs),
            cover_url: updatedSongs[0]?.thumbnail || '',
            updated_at: new Date().toISOString(),
          })
          .eq('id', playlistId);
      } catch (e) {}
    }

    useToastStore.getState().showToast('Đã xóa bài hát khỏi danh sách phát', 'info');
  },

  isSongInPlaylist: (playlistId, songId) => {
    const pl = get().playlists.find((p) => p.id === playlistId);
    return pl ? (pl.songs || []).some((s) => s.id === songId) : false;
  },

  // ── Followed Artists ──────────────────────────────────────────────────────
  fetchFollowedArtists: async () => {
    const userId = uid();
    const storageKey = userKey(STORAGE_KEYS.ARTISTS);

    try {
      const local = await AsyncStorage.getItem(storageKey);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) set({ followedArtists: parsed });
      }
    } catch (e) {}

    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('followed_artists')
        .select('artist_data')
        .eq('user_id', userId);

      if (!error && data && data.length > 0) {
        const cloudArtists = data.map((r: any) => r.artist_data);
        const mergedMap = new Map<string, Artist>();
        cloudArtists.forEach((a: Artist) => mergedMap.set(a.id || a.name, a));
        get().followedArtists.forEach((a) => mergedMap.set(a.id || a.name, a));
        const merged = Array.from(mergedMap.values());
        set({ followedArtists: merged });
        await AsyncStorage.setItem(storageKey, JSON.stringify(merged));
      }
    } catch (e) {}
  },

  toggleFollowArtist: async (artist) => {
    const userId = uid();
    const { followedArtists } = get();
    const following = followedArtists.some(
      (a) => a.id === artist.id || a.name === artist.name
    );
    let updated: Artist[];

    if (following) {
      updated = followedArtists.filter((a) => a.id !== artist.id && a.name !== artist.name);
      useToastStore.getState().showToast('Đã bỏ theo dõi nghệ sĩ', 'info');
    } else {
      updated = [artist, ...followedArtists];
      useToastStore.getState().showToast('Đã theo dõi nghệ sĩ', 'success');
    }

    set({ followedArtists: updated });
    await AsyncStorage.setItem(userKey(STORAGE_KEYS.ARTISTS), JSON.stringify(updated));

    if (userId) {
      try {
        if (following) {
          await supabase
            .from('followed_artists')
            .delete()
            .eq('user_id', userId)
            .eq('artist_id', artist.id || artist.name);
        } else {
          await supabase.from('followed_artists').upsert({
            user_id: userId,
            artist_id: artist.id || artist.name,
            artist_data: artist,
          });
        }
      } catch (e) {}
    }

    return !following;
  },

  isArtistFollowed: (artistIdOrName) =>
    get().followedArtists.some((a) => a.id === artistIdOrName || a.name === artistIdOrName),

  // ── Saved Albums ──────────────────────────────────────────────────────────
  fetchSavedAlbums: async () => {
    const userId = uid();
    const storageKey = userKey(STORAGE_KEYS.ALBUMS);

    try {
      const local = await AsyncStorage.getItem(storageKey);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) set({ savedAlbums: parsed });
      }
    } catch (e) {}

    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('saved_albums')
        .select('album_data')
        .eq('user_id', userId);

      if (!error && data && data.length > 0) {
        const cloudAlbums = data.map((r: any) => r.album_data);
        const mergedMap = new Map<string, Album>();
        cloudAlbums.forEach((a: Album) => mergedMap.set(a.id, a));
        get().savedAlbums.forEach((a) => mergedMap.set(a.id, a));
        const merged = Array.from(mergedMap.values());
        set({ savedAlbums: merged });
        await AsyncStorage.setItem(storageKey, JSON.stringify(merged));
      }
    } catch (e) {}
  },

  toggleSaveAlbum: async (album) => {
    const userId = uid();
    const { savedAlbums } = get();
    const saved = savedAlbums.some((a) => a.id === album.id);
    let updated: Album[];

    if (saved) {
      updated = savedAlbums.filter((a) => a.id !== album.id);
      useToastStore.getState().showToast('Đã xóa album đã lưu', 'info');
    } else {
      updated = [album, ...savedAlbums];
      useToastStore.getState().showToast('Đã lưu album', 'success');
    }

    set({ savedAlbums: updated });
    await AsyncStorage.setItem(userKey(STORAGE_KEYS.ALBUMS), JSON.stringify(updated));

    if (userId) {
      try {
        if (saved) {
          await supabase.from('saved_albums').delete().eq('user_id', userId).eq('album_id', album.id);
        } else {
          await supabase.from('saved_albums').upsert({
            user_id: userId,
            album_id: album.id,
            album_data: album,
          });
        }
      } catch (e) {}
    }

    return !saved;
  },

  isAlbumSaved: (albumId) => get().savedAlbums.some((a) => a.id === albumId),

  // ── History ───────────────────────────────────────────────────────────────
  fetchHistory: async () => {
    const userId = uid();
    const storageKey = userKey(STORAGE_KEYS.HISTORY);

    try {
      const local = await AsyncStorage.getItem(storageKey);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) {
          set({ history: parsed.filter((item: HistoryItem) => !isGhostOfflineSong(item?.song)) });
        }
      }
    } catch (e) {}

    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('history')
        .select('song_data')
        .eq('user_id', userId)
        .order('played_at', { ascending: false })
        .limit(100);

      if (!error && data && data.length > 0) {
        const historyItems = data
          .map((r: any) => r.song_data)
          .filter((h: HistoryItem) => h?.song && !isGhostOfflineSong(h.song));
        const mergedMap = new Map<string, HistoryItem>();
        historyItems.forEach((h: HistoryItem) => mergedMap.set(h.song.id, h));
        get().history.forEach((h) => {
          if (!mergedMap.has(h.song.id) && !isGhostOfflineSong(h.song)) mergedMap.set(h.song.id, h);
        });
        const merged = Array.from(mergedMap.values())
          .filter((h) => !isGhostOfflineSong(h.song))
          .sort((a, b) => b.updatedAt - a.updatedAt)
          .slice(0, 100);

        set({ history: merged });
        await AsyncStorage.setItem(storageKey, JSON.stringify(merged));
      }
    } catch (e) {}
  },

  recordHistory: async (song, positionMs = 0, durationMs = 0) => {
    const userId = uid();
    const item: HistoryItem = {
      song,
      lastPositionMs: positionMs,
      durationMs,
      updatedAt: Date.now(),
    };
    const updated = [item, ...get().history.filter((h) => h.song.id !== song.id)].slice(0, 100);

    set({ history: updated });
    await AsyncStorage.setItem(userKey(STORAGE_KEYS.HISTORY), JSON.stringify(updated));

    if (userId) {
      try {
        await supabase.from('history').upsert(
          {
            user_id: userId,
            song_id: song.id,
            song_data: item,
            played_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,song_id' }
        );
      } catch (e) {}
    }
  },

  // ── Last Played Context ───────────────────────────────────────────────────
  fetchLastPlayedContext: async () => {},

  setLastPlayedContext: async (context) => {
    const ctx: PlayedContext = { ...context, updatedAt: Date.now() };
    set({ lastPlayedContext: ctx });
    if (context.type === 'album') set({ lastPlayedAlbum: ctx });
    if (context.type === 'playlist') set({ lastPlayedPlaylist: ctx });
  },
}));
