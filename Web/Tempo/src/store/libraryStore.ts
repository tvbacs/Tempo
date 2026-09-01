import { create } from 'zustand';
import { supabase } from '../api/supabase';
import { UnifiedSong, CustomPlaylist, Artist } from '../types/music';
import { useAuthStore } from './authStore';

interface LibraryState {
  likedSongs: UnifiedSong[];
  downloadedSongs: UnifiedSong[];
  playlists: CustomPlaylist[];
  followedArtists: Artist[];
  savedAlbums: any[];
  history: UnifiedSong[];
  isLoading: boolean;

  fetchLikedSongs: () => Promise<void>;
  toggleLike: (song: UnifiedSong) => Promise<boolean>;
  isLiked: (songId: string) => boolean;

  fetchDownloadedSongs: () => Promise<void>;
  addDownloadedSong: (song: UnifiedSong) => void;
  removeDownloadedSong: (songId: string) => void;
  clearDownloadedSongs: () => void;

  fetchPlaylists: () => Promise<void>;
  createPlaylist: (name: string) => Promise<void>;
  deletePlaylist: (id: string) => Promise<void>;
  addSongToPlaylist: (playlistId: string, song: UnifiedSong) => Promise<void>;
  removeSongFromPlaylist: (playlistId: string, songId: string) => Promise<void>;

  fetchFollowedArtists: () => Promise<void>;
  toggleFollowArtist: (artist: Artist) => Promise<boolean>;
  isArtistFollowed: (artistIdOrName: string) => boolean;

  fetchSavedAlbums: () => Promise<void>;
  toggleSaveAlbum: (album: any) => Promise<boolean>;
  isAlbumSaved: (albumId: string) => boolean;

  fetchHistory: () => Promise<void>;
  recordHistory: (song: UnifiedSong) => Promise<void>;
  reset: () => void;
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return fallback;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  likedSongs: loadFromStorage('tempo_liked_songs', []),
  downloadedSongs: loadFromStorage('tempo_downloaded_songs', []),
  playlists: loadFromStorage('tempo_custom_playlists', []),
  followedArtists: loadFromStorage('tempo_followed_artists', []),
  savedAlbums: loadFromStorage('tempo_saved_albums', []),
  history: loadFromStorage('tempo_listening_history', []),
  isLoading: false,

  fetchLikedSongs: async () => {
    try {
      const stored = localStorage.getItem('tempo_liked_songs');
      if (stored) {
        set({ likedSongs: JSON.parse(stored) });
      }
    } catch (_) {}

    const user = useAuthStore.getState().user;
    if (!user) return;
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('liked_songs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const songs: UnifiedSong[] = data.map((r: any) => ({
          id: r.song_id || r.id,
          encodeId: r.song_id || r.id,
          title: r.title,
          artistsNames: r.artists_names,
          thumbnail: r.thumbnail,
          duration: r.duration,
          source: r.source || 'zing',
          addedAt: r.created_at,
        }));
        set({ likedSongs: songs });
        try {
          localStorage.setItem('tempo_liked_songs', JSON.stringify(songs));
        } catch (_) {}
      }
    } catch (e) {
      console.error('fetchLikedSongs error:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  toggleLike: async (song: UnifiedSong) => {
    const user = useAuthStore.getState().user;
    if (!user) {
      useAuthStore.getState().openAuthModal();
      return false;
    }

    const songId = song.encodeId || song.id;
    const isCurrentlyLiked = get().likedSongs.some((s) => s.id === songId);

    if (isCurrentlyLiked) {
      set({ likedSongs: get().likedSongs.filter((s) => s.id !== songId) });
      await supabase.from('liked_songs').delete().eq('user_id', user.id).eq('song_id', songId);
      return false;
    } else {
      const newSong: UnifiedSong = {
        id: songId,
        title: song.title,
        artistsNames: song.artistsNames || '',
        thumbnail: song.thumbnail || song.thumbnailM || '',
        duration: song.duration || 0,
        source: song.source || 'zing',
        addedAt: new Date().toISOString(),
      };
      set({ likedSongs: [newSong, ...get().likedSongs] });
      await supabase.from('liked_songs').upsert({
        user_id: user.id,
        song_id: songId,
        title: song.title,
        artists_names: song.artistsNames || '',
        thumbnail: song.thumbnail || song.thumbnailM || '',
        duration: song.duration || 0,
        source: song.source || 'zing',
      });
      return true;
    }
  },

  isLiked: (songId: string) => {
    return get().likedSongs.some((s) => s.id === songId);
  },

  fetchDownloadedSongs: async () => {
    try {
      const stored = localStorage.getItem('tempo_downloaded_songs');
      if (stored) {
        set({ downloadedSongs: JSON.parse(stored) });
      } else {
        set({ downloadedSongs: [] });
      }
    } catch (_) {
      set({ downloadedSongs: [] });
    }
  },

  addDownloadedSong: (song: UnifiedSong) => {
    const current = get().downloadedSongs;
    if (!current.some((s) => s.id === song.id)) {
      const updated = [song, ...current];
      set({ downloadedSongs: updated });
      localStorage.setItem('tempo_downloaded_songs', JSON.stringify(updated));
    }
  },

  removeDownloadedSong: (songId: string) => {
    const updated = get().downloadedSongs.filter((s) => s.id !== songId);
    set({ downloadedSongs: updated });
    localStorage.setItem('tempo_downloaded_songs', JSON.stringify(updated));
  },

  clearDownloadedSongs: () => {
    set({ downloadedSongs: [] });
    localStorage.removeItem('tempo_downloaded_songs');
  },

  fetchPlaylists: async () => {
    try {
      const stored = localStorage.getItem('tempo_custom_playlists');
      if (stored) {
        set({ playlists: JSON.parse(stored) });
      }
    } catch (_) {}

    const user = useAuthStore.getState().user;
    try {
      let query = supabase.from('playlists').select('*');
      if (user) {
        query = query.eq('user_id', user.id);
      }
      const { data, error } = await query.order('created_at', { ascending: false });

      if (!error && data) {
        const cleanPlaylists = data
          .filter(
            (p: any) =>
              p.name &&
              !p.name.includes('TEMPO_ACTIVE') &&
              !p.name.includes('active-server') &&
              !p.name.startsWith('__')
          )
          .map((r: any) => {
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
            return {
              id: r.id,
              name: r.name,
              description: r.description?.startsWith('[') ? '' : r.description,
              coverUrl: r.cover_url || parsedSongs[0]?.thumbnail,
              songs: parsedSongs,
              songCount: parsedSongs.length,
            };
          });

        set({ playlists: cleanPlaylists });
        try {
          localStorage.setItem('tempo_custom_playlists', JSON.stringify(cleanPlaylists));
        } catch (_) {}
      }
    } catch (e) {
      console.error('fetchPlaylists error:', e);
    }
  },

  createPlaylist: async (name: string) => {
    const user = useAuthStore.getState().user;
    const newPlaylist: any = {
      id: crypto.randomUUID(),
      user_id: user?.id || 'bdf7cb30-0ae2-47fa-865e-f3ab1abc8263',
      name,
      song_count: 0,
      songs: [],
    };
    const updated = [newPlaylist, ...get().playlists];
    set({ playlists: updated });
    try {
      localStorage.setItem('tempo_custom_playlists', JSON.stringify(updated));
    } catch (_) {}

    if (user) {
      await supabase.from('playlists').insert(newPlaylist);
    }
  },

  deletePlaylist: async (id: string) => {
    const user = useAuthStore.getState().user;
    const updated = get().playlists.filter((p) => p.id !== id);
    set({ playlists: updated });
    try {
      localStorage.setItem('tempo_custom_playlists', JSON.stringify(updated));
    } catch (_) {}

    if (user) {
      await supabase.from('playlists').delete().eq('user_id', user.id).eq('id', id);
    }
  },

  addSongToPlaylist: async (playlistId: string, song: UnifiedSong) => {
    const playlists = get().playlists.map((pl) => {
      if (pl.id === playlistId) {
        const existingSongs = pl.songs || [];
        if (!existingSongs.some((s) => (s.encodeId || s.id) === (song.encodeId || song.id))) {
          const updatedSongs = [song, ...existingSongs];
          return {
            ...pl,
            songs: updatedSongs,
            song_count: updatedSongs.length,
            songCount: updatedSongs.length,
            coverUrl: pl.coverUrl || song.thumbnail,
          };
        }
      }
      return pl;
    });

    set({ playlists });
    try {
      localStorage.setItem('tempo_custom_playlists', JSON.stringify(playlists));
    } catch (_) {}

    const target = playlists.find((p) => p.id === playlistId);
    if (target) {
      try {
        await supabase
          .from('playlists')
          .update({
            description: JSON.stringify(target.songs || []),
            cover_url: target.songs?.[0]?.thumbnail || target.coverUrl || '',
            updated_at: new Date().toISOString(),
          })
          .eq('id', playlistId);
      } catch (_) {}
    }
  },

  removeSongFromPlaylist: async (playlistId: string, songId: string) => {
    const playlists = get().playlists.map((pl) => {
      if (pl.id === playlistId) {
        const existingSongs = pl.songs || [];
        const updatedSongs = existingSongs.filter((s) => (s.encodeId || s.id) !== songId);
        return {
          ...pl,
          songs: updatedSongs,
          song_count: updatedSongs.length,
          songCount: updatedSongs.length,
        };
      }
      return pl;
    });

    set({ playlists });
    try {
      localStorage.setItem('tempo_custom_playlists', JSON.stringify(playlists));
    } catch (_) {}

    const target = playlists.find((p) => p.id === playlistId);
    if (target) {
      try {
        await supabase
          .from('playlists')
          .update({
            description: JSON.stringify(target.songs || []),
            cover_url: target.songs?.[0]?.thumbnail || '',
            updated_at: new Date().toISOString(),
          })
          .eq('id', playlistId);
      } catch (_) {}
    }
  },

  fetchFollowedArtists: async () => {
    try {
      const stored = localStorage.getItem('tempo_followed_artists');
      if (stored) {
        set({ followedArtists: JSON.parse(stored) });
      }
    } catch (_) {}

    const user = useAuthStore.getState().user;
    const userId = user?.id || 'bdf7cb30-0ae2-47fa-865e-f3ab1abc8263';
    try {
      const { data, error } = await supabase
        .from('followed_artists')
        .select('*')
        .eq('user_id', userId);

      if (!error && data) {
        const artists: Artist[] = data.map((r: any) => {
          const ad = r.artist_data || {};
          return {
            id: ad.id || r.artist_id || r.id,
            name: ad.name || 'Nghệ sĩ',
            alias: ad.alias || ad.link || r.artist_id || ad.name,
            thumbnail:
              ad.thumbnail ||
              ad.cover ||
              'https://photo-resize-zmp3.zmdcdn.me/w600_r1x1_jpeg/avatars/5/9/6/9/59696c9dba7a914d587d886049c10df6.jpg',
            totalFollow: ad.totalFollow || 0,
          };
        });
        set({ followedArtists: artists });
        try {
          localStorage.setItem('tempo_followed_artists', JSON.stringify(artists));
        } catch (_) {}
      }
    } catch (e) {
      console.error('fetchFollowedArtists error:', e);
    }
  },

  toggleFollowArtist: async (artist: Artist) => {
    const user = useAuthStore.getState().user;
    const userId = user?.id || 'bdf7cb30-0ae2-47fa-865e-f3ab1abc8263';
    const id = artist.alias || artist.id || artist.name;
    const isFollowing = get().followedArtists.some(
      (a) =>
        (a.id && a.id === id) ||
        (a.alias && a.alias === id) ||
        (a.name && a.name.toLowerCase() === (artist.name || '').toLowerCase())
    );

    let updated: Artist[];
    if (isFollowing) {
      updated = get().followedArtists.filter(
        (a) =>
          a.id !== id &&
          a.alias !== id &&
          a.name.toLowerCase() !== (artist.name || '').toLowerCase()
      );
    } else {
      updated = [artist, ...get().followedArtists];
    }
    set({ followedArtists: updated });
    try {
      localStorage.setItem('tempo_followed_artists', JSON.stringify(updated));
    } catch (_) {}

    try {
      if (isFollowing) {
        await supabase
          .from('followed_artists')
          .delete()
          .eq('user_id', userId)
          .eq('artist_id', id);
      } else {
        await supabase.from('followed_artists').upsert({
          user_id: userId,
          artist_id: id,
          artist_data: artist,
        });
      }
    } catch (e) {
      console.error('toggleFollowArtist error:', e);
    }
    return !isFollowing;
  },

  isArtistFollowed: (artistIdOrName: string) => {
    if (!artistIdOrName) return false;
    const target = artistIdOrName.toLowerCase();
    return get().followedArtists.some(
      (a) =>
        (a.id && a.id.toLowerCase() === target) ||
        (a.alias && a.alias.toLowerCase() === target) ||
        (a.name && a.name.toLowerCase() === target)
    );
  },

  fetchSavedAlbums: async () => {
    try {
      const stored = localStorage.getItem('tempo_saved_albums');
      if (stored) {
        set({ savedAlbums: JSON.parse(stored) });
      }
    } catch (_) {}

    const user = useAuthStore.getState().user;
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('saved_albums')
        .select('*')
        .eq('user_id', user.id);

      if (!error && data) {
        const albums = data.map((r: any) => {
          if (r.album_data) {
            return {
              id: r.album_data.id || r.album_id || r.id,
              encodeId: r.album_data.id || r.album_id || r.id,
              title: r.album_data.title || r.title || 'Album',
              artistsNames: r.album_data.artistsNames || r.artists_names || '',
              thumbnail:
                r.album_data.thumbnail ||
                r.album_data.coverUrl ||
                r.thumbnail ||
                'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400',
              songCount: r.album_data.songCount || r.album_data.songs?.length || r.song_count || 0,
              songs: r.album_data.songs || [],
            };
          }
          return {
            id: r.album_id || r.id,
            encodeId: r.album_id || r.id,
            title: r.title || 'Album',
            artistsNames: r.artists_names || '',
            thumbnail: r.thumbnail || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400',
            songCount: r.song_count || 0,
            songs: [],
          };
        });
        set({ savedAlbums: albums });
        try {
          localStorage.setItem('tempo_saved_albums', JSON.stringify(albums));
        } catch (_) {}
      }
    } catch (_) {}
  },

  toggleSaveAlbum: async (album: any) => {
    const user = useAuthStore.getState().user;
    const isSaved = get().savedAlbums.some((a) => a.id === album.id);
    let updated: any[];
    if (isSaved) {
      updated = get().savedAlbums.filter((a) => a.id !== album.id);
    } else {
      updated = [album, ...get().savedAlbums];
    }
    set({ savedAlbums: updated });
    try {
      localStorage.setItem('tempo_saved_albums', JSON.stringify(updated));
    } catch (_) {}

    if (user) {
      if (isSaved) {
        await supabase.from('saved_albums').delete().eq('user_id', user.id).eq('album_id', album.id);
      } else {
        await supabase.from('saved_albums').upsert({
          user_id: user.id,
          album_id: album.id,
          title: album.title,
          artists_names: album.artistsNames || '',
          thumbnail: album.thumbnail || '',
          album_data: album,
        });
      }
    }
    return !isSaved;
  },

  isAlbumSaved: (albumId: string) => {
    return get().savedAlbums.some((a) => a.id === albumId);
  },

  fetchHistory: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('listening_history')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(40);

      if (!error && data) {
        const songs: UnifiedSong[] = data.map((r: any) => ({
          id: r.song_id,
          title: r.title,
          artistsNames: r.artists_names || '',
          thumbnail: r.thumbnail || '',
          duration: r.duration || 0,
          source: r.source || 'zing',
        }));
        set({ history: songs });
      }
    } catch (e) {
      console.error('fetchHistory error:', e);
    }
  },

  recordHistory: async (song: UnifiedSong) => {
    const user = useAuthStore.getState().user;
    if (!user || !song) return;
    try {
      const songId = song.encodeId || song.id;
      await supabase.from('listening_history').upsert({
        user_id: user.id,
        song_id: songId,
        title: song.title,
        artists_names: song.artistsNames || '',
        thumbnail: song.thumbnail || song.thumbnailM || '',
        duration: song.duration || 0,
        source: song.source || 'zing',
        updated_at: new Date().toISOString(),
      });
    } catch (_) {}
  },

  reset: () =>
    set({
      likedSongs: [],
      playlists: [],
      followedArtists: [],
      history: [],
      savedAlbums: [],
      downloadedSongs: [],
    }),
}));
