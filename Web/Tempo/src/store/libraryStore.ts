import { create } from 'zustand';
import { supabase } from '../api/supabase';
import { UnifiedSong, CustomPlaylist, Artist } from '../types/music';
import { useAuthStore } from './authStore';

interface LibraryState {
  likedSongs: UnifiedSong[];
  playlists: CustomPlaylist[];
  followedArtists: Artist[];
  history: UnifiedSong[];
  isLoading: boolean;

  fetchLikedSongs: () => Promise<void>;
  toggleLike: (song: UnifiedSong) => Promise<boolean>;
  isLiked: (songId: string) => boolean;

  fetchPlaylists: () => Promise<void>;
  createPlaylist: (name: string) => Promise<void>;

  fetchFollowedArtists: () => Promise<void>;
  toggleFollowArtist: (artist: Artist) => Promise<boolean>;
  isArtistFollowed: (artistIdOrName: string) => boolean;

  fetchHistory: () => Promise<void>;
  recordHistory: (song: UnifiedSong) => Promise<void>;
  reset: () => void;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  likedSongs: [],
  playlists: [],
  followedArtists: [],
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
        const songs: UnifiedSong[] = data.map((r: any) => ({
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
    const isCurrentlyLiked = get().likedSongs.some(s => s.id === songId);

    if (isCurrentlyLiked) {
      set({ likedSongs: get().likedSongs.filter(s => s.id !== songId) });
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
    return get().likedSongs.some(s => s.id === songId);
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
        set({ playlists: data });
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

  fetchFollowedArtists: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('followed_artists')
        .select('*')
        .eq('user_id', user.id);

      if (!error && data) {
        const artists: Artist[] = data.map((r: any) => ({
          id: r.artist_id || r.id,
          name: r.name,
          alias: r.link || r.name.toLowerCase().replace(/\s+/g, '-'),
          thumbnail: r.thumbnail,
          totalFollow: r.total_follow,
        }));
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
    const id = artist.alias || artist.id;
    const isFollowing = get().followedArtists.some(a => (a.alias || a.id) === id);

    if (isFollowing) {
      set({ followedArtists: get().followedArtists.filter(a => (a.alias || a.id) !== id) });
      await supabase.from('followed_artists').delete().eq('user_id', user.id).eq('artist_id', id);
      return false;
    } else {
      set({ followedArtists: [artist, ...get().followedArtists] });
      await supabase.from('followed_artists').upsert({
        user_id: user.id,
        artist_id: id,
        name: artist.name,
        thumbnail: artist.thumbnail || '',
        link: artist.alias,
        total_follow: artist.totalFollow || 0,
      });
      return true;
    }
  },

  isArtistFollowed: (artistIdOrName: string) => {
    return get().followedArtists.some(
      a => a.id === artistIdOrName || a.alias === artistIdOrName || a.name.toLowerCase() === artistIdOrName.toLowerCase()
    );
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

  reset: () => set({ likedSongs: [], playlists: [], followedArtists: [], history: [] }),
}));
