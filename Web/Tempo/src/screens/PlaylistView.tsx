import React, { useEffect, useState } from 'react';
import { ListMusic, Play, Pause, Shuffle, ArrowLeft } from 'lucide-react';
import { CustomPlaylist, UnifiedSong } from '../types/music';
import { apiClient } from '../api/client';
import { usePlayerStore } from '../store/playerStore';
import { useLibraryStore } from '../store/libraryStore';
import { TrackTable } from '../components/TrackTable';

interface PlaylistViewProps {
  playlist: CustomPlaylist | any;
  onBack?: () => void;
}

export const PlaylistView: React.FC<PlaylistViewProps> = ({ playlist, onBack }) => {
  const [songs, setSongs] = useState<UnifiedSong[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { currentSong, isPlaying, playSong, togglePlayPause, isShuffle, toggleShuffle } = usePlayerStore();
  const { playlists } = useLibraryStore();

  const targetPlaylist = playlists.find((p) => p.id === playlist?.id) || playlist;

  const isCurrentListPlaying =
    isPlaying &&
    Boolean(
      currentSong &&
        songs.some(
          (s) => (s.encodeId || s.id) === (currentSong.encodeId || currentSong.id)
        )
    );

  useEffect(() => {
    if (!targetPlaylist) return;

    // Check if it is a user-created custom playlist
    const isCustom = Boolean(
      targetPlaylist.user_id ||
      playlists.some((p) => p.id === targetPlaylist.id) ||
      !targetPlaylist.encodeId
    );

    if (isCustom) {
      // Use user's exact playlist songs without random searches
      setSongs(targetPlaylist.songs || []);
      setIsLoading(false);
      return;
    }

    // For official Zing MP3 album/playlist
    if (targetPlaylist.encodeId) {
      setIsLoading(true);
      apiClient
        .getPlaylist(targetPlaylist.encodeId)
        .then((res) => {
          if (res && res.songs && res.songs.length > 0) {
            setSongs(res.songs);
          } else {
            setSongs(targetPlaylist.songs || []);
          }
          setIsLoading(false);
        })
        .catch(() => {
          setSongs(targetPlaylist.songs || []);
          setIsLoading(false);
        });
    } else {
      setSongs(targetPlaylist.songs || []);
    }
  }, [targetPlaylist, playlists]);

  const handlePlayClick = () => {
    if (songs.length === 0) return;
    if (isCurrentListPlaying) {
      togglePlayPause();
    } else {
      playSong(songs[0], songs);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar select-none bg-[#121212]">
      {/* Hero Header */}
      <div className="bg-gradient-to-b from-[#2d2d38] via-[#1b1b22] to-[#121212] p-8 flex items-end gap-6 flex-shrink-0 relative">
        {onBack && (
          <button
            onClick={onBack}
            className="absolute top-6 left-6 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 flex items-center justify-center text-white transition-colors border-none cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        <div className="w-52 h-52 rounded-md bg-[#242424] overflow-hidden flex items-center justify-center text-white shadow-2xl flex-shrink-0">
          {targetPlaylist.thumbnailM || targetPlaylist.thumbnail || targetPlaylist.coverUrl ? (
            <img
              src={targetPlaylist.thumbnailM || targetPlaylist.thumbnail || targetPlaylist.coverUrl}
              alt={targetPlaylist.name || targetPlaylist.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <ListMusic className="w-20 h-20 text-[#b3b3b3]" />
          )}
        </div>

        <div className="flex flex-col justify-end">
          <span className="text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
            Danh sách phát
          </span>
          <h1 className="text-5xl font-black text-white tracking-tight mb-4 line-clamp-2">
            {targetPlaylist.name || targetPlaylist.title}
          </h1>
          <p className="text-xs font-semibold text-white/90">
            {targetPlaylist.description || targetPlaylist.sortDescription || `${songs.length} bài hát`}
          </p>
        </div>
      </div>

      {/* Action Controls Bar */}
      <div className="px-8 py-5 flex items-center justify-between sticky top-0 z-10 bg-[#121212]/90 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <button
            onClick={handlePlayClick}
            disabled={songs.length === 0 || isLoading}
            className="w-14 h-14 rounded-full bg-white hover:scale-105 active:scale-95 text-black flex items-center justify-center shadow-2xl transition-all disabled:opacity-50 border-none cursor-pointer"
          >
            {isCurrentListPlaying ? (
              <Pause className="w-6 h-6 fill-black text-black" />
            ) : (
              <Play className="w-6 h-6 fill-black text-black ml-0.5" />
            )}
          </button>

          <button
            onClick={toggleShuffle}
            title={isShuffle ? 'Tắt phát ngẫu nhiên' : 'Bật phát ngẫu nhiên'}
            className={`transition-colors border-none bg-transparent cursor-pointer p-1 ${
              isShuffle ? 'text-white font-bold scale-110' : 'text-[#b3b3b3] hover:text-white'
            }`}
          >
            <Shuffle className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Track Table */}
      <div className="px-8 pb-16">
        {isLoading ? (
          <div className="py-16 text-center text-[#b3b3b3] text-sm">Đang tải bài hát...</div>
        ) : songs.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center text-[#b3b3b3]">
            <ListMusic className="w-16 h-16 stroke-1 mb-3 text-[#535353]" />
            <h3 className="text-base font-bold text-white mb-1">Danh sách phát này chưa có bài hát</h3>
            <p className="text-xs text-[#b3b3b3] max-w-sm">
              Bạn có thể thêm các bài hát yêu thích vào danh sách phát này để nghe bất cứ lúc nào.
            </p>
          </div>
        ) : (
          <TrackTable songs={songs} />
        )}
      </div>
    </div>
  );
};
