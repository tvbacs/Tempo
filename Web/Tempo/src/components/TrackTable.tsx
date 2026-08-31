import React from 'react';
import { Play, Pause, Clock, Heart } from 'lucide-react';
import { UnifiedSong } from '../types/music';
import { usePlayerStore } from '../store/playerStore';
import { useLibraryStore } from '../store/libraryStore';

interface TrackTableProps {
  songs: UnifiedSong[];
  showAlbum?: boolean;
  showDateAdded?: boolean;
}

export const TrackTable: React.FC<TrackTableProps> = ({
  songs,
  showAlbum = true,
  showDateAdded = true,
}) => {
  const { currentSong, isPlaying, playSong, togglePlayPause } = usePlayerStore();
  const { isLiked, toggleLike } = useLibraryStore();

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Vừa xong';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN');
    } catch (_) {
      return 'Vừa xong';
    }
  };

  if (songs.length === 0) {
    return (
      <div className="py-16 text-center text-text-muted text-sm">
        Chưa có bài hát nào trong danh sách này
      </div>
    );
  }

  return (
    <div className="w-full select-none">
      {/* Table Header */}
      <div className="grid grid-cols-[16px_1fr_1fr_120px_60px] gap-4 px-4 py-2 border-b border-white/5 text-xs font-bold text-text-muted uppercase tracking-wider">
        <span className="text-center">#</span>
        <span>Tiêu đề</span>
        {showAlbum ? <span>Album</span> : <span />}
        {showDateAdded ? <span>Ngày thêm</span> : <span />}
        <span className="flex justify-end pr-2">
          <Clock className="w-4 h-4" />
        </span>
      </div>

      {/* Table Rows */}
      <div className="flex flex-col py-1">
        {songs.map((song, index) => {
          const isThisCurrent = (currentSong?.encodeId || currentSong?.id) === (song.encodeId || song.id);
          const isThisPlaying = isThisCurrent && isPlaying;
          const liked = isLiked(song.encodeId || song.id);

          return (
            <div
              key={song.encodeId || song.id || index}
              onDoubleClick={() => playSong(song, songs)}
              className={`grid grid-cols-[16px_1fr_1fr_120px_60px] gap-4 px-4 py-2 rounded-md hover:bg-white/10 items-center transition-colors group ${
                isThisCurrent ? 'bg-white/5' : ''
              }`}
            >
              {/* Index / Play / Equalizer */}
              <div className="flex items-center justify-center">
                <span className={`text-sm font-semibold group-hover:hidden ${isThisCurrent ? 'text-primary font-bold' : 'text-text-muted'}`}>
                  {index + 1}
                </span>
                <button
                  onClick={() => {
                    if (isThisCurrent) {
                      togglePlayPause();
                    } else {
                      playSong(song, songs);
                    }
                  }}
                  className="hidden group-hover:flex text-white hover:scale-110 transition-transform"
                >
                  {isThisPlaying ? (
                    <Pause className="w-4 h-4 fill-white" />
                  ) : (
                    <Play className="w-4 h-4 fill-white" />
                  )}
                </button>
              </div>

              {/* Title & Artist */}
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <img
                  src={song.thumbnail || song.thumbnailM || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120'}
                  alt={song.title}
                  className="w-10 h-10 rounded object-cover flex-shrink-0 bg-[#282828]"
                />
                <div className="min-w-0 flex-1">
                  <h4 className={`text-sm font-bold truncate ${isThisCurrent ? 'text-primary' : 'text-white'}`}>
                    {song.title}
                  </h4>
                  <p className="text-xs text-text-secondary truncate mt-0.5 hover:underline cursor-pointer">
                    {song.artistsNames}
                  </p>
                </div>
              </div>

              {/* Album */}
              <div className="min-w-0 truncate text-xs text-text-secondary hover:underline cursor-pointer">
                {song.album?.title || song.title}
              </div>

              {/* Date Added */}
              <div className="text-xs text-text-secondary truncate">
                {formatDate(song.addedAt)}
              </div>

              {/* Heart & Duration */}
              <div className="flex items-center justify-end gap-3 text-xs text-text-secondary font-medium">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLike(song);
                  }}
                  className={`transition-all hover:scale-110 ${
                    liked ? 'text-primary' : 'opacity-0 group-hover:opacity-100 text-text-muted hover:text-white'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${liked ? 'fill-primary' : ''}`} />
                </button>
                <span className="w-9 text-right">{formatTime(song.duration)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
