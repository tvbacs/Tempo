import React, { useEffect, useState } from 'react';
import { ListMusic, Play, Shuffle } from 'lucide-react';
import { CustomPlaylist, UnifiedSong } from '../types/music';
import { apiClient } from '../api/client';
import { usePlayerStore } from '../store/playerStore';
import { TrackTable } from '../components/TrackTable';

interface PlaylistViewProps {
  playlist: CustomPlaylist | any;
}

export const PlaylistView: React.FC<PlaylistViewProps> = ({ playlist }) => {
  const [songs, setSongs] = useState<UnifiedSong[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { playSong } = usePlayerStore();

  useEffect(() => {
    if (playlist.encodeId || playlist.id) {
      setIsLoading(true);
      apiClient.getPlaylist(playlist.encodeId || playlist.id).then((res) => {
        if (res && res.songs) {
          setSongs(res.songs);
        } else if (playlist.songs) {
          setSongs(playlist.songs);
        }
        setIsLoading(false);
      });
    }
  }, [playlist]);

  const handlePlayAll = (shuffle: boolean = false) => {
    if (songs.length === 0) return;
    const list = shuffle ? [...songs].sort(() => Math.random() - 0.5) : songs;
    playSong(list[0], list);
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar select-none">
      {/* Hero Header */}
      <div className="bg-gradient-to-b from-[#7C2D12] via-[#451A03] to-[#121212] p-8 flex items-end gap-6 flex-shrink-0">
        <div className="w-52 h-52 rounded-md bg-[#282828] overflow-hidden flex items-center justify-center text-white shadow-2xl flex-shrink-0">
          {playlist.thumbnailM || playlist.thumbnail || playlist.coverUrl ? (
            <img
              src={playlist.thumbnailM || playlist.thumbnail || playlist.coverUrl}
              alt={playlist.name || playlist.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <ListMusic className="w-20 h-20 text-text-muted" />
          )}
        </div>

        <div className="flex flex-col justify-end">
          <span className="text-xs font-bold uppercase tracking-wider text-white mb-2">Playlist</span>
          <h1 className="text-5xl font-black text-white tracking-tight mb-4">
            {playlist.name || playlist.title}
          </h1>
          <p className="text-xs font-semibold text-white/80">
            {playlist.description || playlist.sortDescription || `${songs.length} bài hát`}
          </p>
        </div>
      </div>

      {/* Action Controls */}
      <div className="px-8 py-6 flex items-center gap-6 bg-[#121212]/80 backdrop-blur-sm sticky top-0 z-10">
        <button
          onClick={() => handlePlayAll(false)}
          disabled={songs.length === 0}
          className="w-14 h-14 rounded-full bg-[#1DB954] hover:bg-[#1ed760] hover:scale-105 active:scale-95 text-black flex items-center justify-center shadow-xl transition-all disabled:opacity-50"
        >
          <Play className="w-6 h-6 fill-black text-black ml-0.5" />
        </button>

        <button
          onClick={() => handlePlayAll(true)}
          title="Trộn bài"
          className="text-text-secondary hover:text-white transition-colors"
        >
          <Shuffle className="w-6 h-6" />
        </button>
      </div>

      {/* Track List */}
      <div className="px-8 pb-12">
        {isLoading ? (
          <div className="py-16 text-center text-text-secondary text-sm">Đang tải danh sách bài hát...</div>
        ) : (
          <TrackTable songs={songs} />
        )}
      </div>
    </div>
  );
};
