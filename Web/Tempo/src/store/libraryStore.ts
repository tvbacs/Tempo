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

  fetchPlaylists: () => Promise<void>;
  createPlaylist: (name: string) => Promise<void>;
  deletePlaylist: (id: string) => Promise<void>;

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

export const useLibraryStore = create<LibraryState>((set, get) => ({
  likedSongs: [],
  downloadedSongs: [],
  playlists: [],
  followedArtists: [],
  savedAlbums: [],
  history: [],
  isLoading: false,

  fetchLikedSongs: async () => {
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
        const songs: UnifiedSong[] = data
          .filter((r: any) => {
            const isLocalOrDownload =
              r.source === 'local' ||
              r.source === 'youtube' ||
              r.source === 'extracted' ||
              r.source === 'downloaded' ||
              r.source === 'offline' ||
              (r.song_id && (r.song_id.startsWith('yt_') || r.song_id.startsWith('dl_') || r.song_id.startsWith('local_'))) ||
              (r.audio_url && r.audio_url.startsWith('file://'));
            return !isLocalOrDownload;
          })
          .map((r: any) => ({
            id: r.song_id,
            title: r.title,
            artistsNames: r.artists_names || '',
            thumbnail: r.thumbnail || '',
            duration: r.duration || 0,
            source: r.source || 'zing',
            addedAt: r.created_at,
          }));
        set({ likedSongs: songs });
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

  fetchPlaylists: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('playlists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const cleanPlaylists = data.filter(
          (p: any) => p.name && !p.name.includes('TEMPO_ACTIVE') && !p.name.includes('active-server') && !p.name.startsWith('__')
        );
        set({ playlists: cleanPlaylists });
      }
    } catch (e) {
      console.error('fetchPlaylists error:', e);
    }
  },

  createPlaylist: async (name: string) => {
    const user = useAuthStore.getState().user;
    if (!user) {
      useAuthStore.getState().openAuthModal();
      return;
    }
    const newPlaylist = {
      id: crypto.randomUUID(),
      user_id: user.id,
      name,
      song_count: 0,
      songs: [],
    };
    set({ playlists: [newPlaylist as any, ...get().playlists] });
    await supabase.from('playlists').insert(newPlaylist);
  },

  deletePlaylist: async (id: string) => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    set({ playlists: get().playlists.filter((p) => p.id !== id) });
    await supabase.from('playlists').delete().eq('user_id', user.id).eq('id', id);
  },

  fetchFollowedArtists: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('followed_artists')
        .select('*')
        .eq('user_id', user.id);

      if (!error && data) {
        const artists: Artist[] = data.map((r: any) => {
          if (r.artist_data) {
            return {
              id: r.artist_data.id || r.artist_id || r.id,
              name: r.artist_data.name || r.name,
              alias: r.artist_data.alias || r.artist_data.link || r.link || r.name,
              thumbnail: r.artist_data.thumbnail || r.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300',
              totalFollow: r.artist_data.totalFollow || r.total_follow,
            };
          }
          return {
            id: r.artist_id || r.id,
            name: r.name || 'Nghệ sĩ',
            alias: r.link || r.name,
            thumbnail: r.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300',
            totalFollow: r.total_follow,
          };
        });
        set({ followedArtists: artists });
      }
    } catch (e) {
      console.error('fetchFollowedArtists error:', e);
    }
  },

  toggleFollowArtist: async (artist: Artist) => {
    const user = useAuthStore.getState().user;
    if (!user) {
      useAuthStore.getState().openAuthModal();
      return false;
    }
    const id = artist.alias || artist.id || artist.name;
    const isFollowing = get().followedArtists.some((a) => (a.alias || a.id || a.name) === id);

    if (isFollowing) {
      set({ followedArtists: get().followedArtists.filter((a) => (a.alias || a.id || a.name) !== id) });
      await supabase.from('followed_artists').delete().eq('user_id', user.id).eq('artist_id', id);
      return false;
    } else {
      set({ followedArtists: [artist, ...get().followedArtists] });
      await supabase.from('followed_artists').upsert({
        user_id: user.id,
        artist_id: id,
        name: artist.name,
        thumbnail: artist.thumbnail || '',
        link: artist.alias || artist.name,
        total_follow: artist.totalFollow || 0,
        artist_data: artist,
      });
      return true;
    }
  },

  isArtistFollowed: (artistIdOrName: string) => {
    return get().followedArtists.some(
      (a) =>
        a.id === artistIdOrName ||
        a.alias === artistIdOrName ||
        a.name.toLowerCase() === artistIdOrName.toLowerCase()
    );
  },

  fetchSavedAlbums: async () => {
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
              title: r.album_data.title || r.title || 'Album',
              artistsNames: r.album_data.artistsNames || r.artists_names || '',
              thumbnail:
                r.album_data.thumbnail ||
                r.album_data.coverUrl ||
                r.thumbnail ||
                'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400',
              songCount: r.album_data.songCount || r.song_count || 0,
            };
          }
          return {
            id: r.album_id || r.id,
            title: r.title || 'Album',
            artistsNames: r.artists_names || '',
            thumbnail: r.thumbnail || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400',
            songCount: r.song_count || 0,
          };
        });
        set({ savedAlbums: albums });
      }
    } catch (_) {}
  },

  toggleSaveAlbum: async (album: any) => {
    const user = useAuthStore.getState().user;
    if (!user) {
      useAuthStore.getState().openAuthModal();
      return false;
    }
    const isSaved = get().savedAlbums.some((a) => a.id === album.id);
    if (isSaved) {
      set({ savedAlbums: get().savedAlbums.filter((a) => a.id !== album.id) });
      await supabase.from('saved_albums').delete().eq('user_id', user.id).eq('album_id', album.id);
      return false;
    } else {
      set({ savedAlbums: [album, ...get().savedAlbums] });
      await supabase.from('saved_albums').upsert({
        user_id: user.id,
        album_id: album.id,
        title: album.title,
        artists_names: album.artistsNames || '',
        thumbnail: album.thumbnail || '',
        album_data: album,
      });
      return true;
    }
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
