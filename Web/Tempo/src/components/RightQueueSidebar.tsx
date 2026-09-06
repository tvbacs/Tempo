import React from 'react';
import { Trash2, Play, Pause, Download, Music2 } from 'lucide-react';
import { useLibraryStore } from '../store/libraryStore';
import { usePlayerStore } from '../store/playerStore';

export const RightQueueSidebar: React.FC = () => {
  const { downloadedSongs, removeDownloadedSong } = useLibraryStore();
  const { currentSong, isPlaying, playSong, togglePlayPause } = usePlayerStore();

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <aside className="w-64 lg:w-72 xl:w-80 bg-[#121212] rounded-lg p-4 flex flex-col select-none flex-shrink-0 border-none overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">Tập tin đã tải</span>
          <span className="w-5 h-5 rounded-full bg-[#242424] text-[#b3b3b3] text-[11px] font-bold flex items-center justify-center">
            {downloadedSongs.length}
          </span>
        </div>
        <span className="text-xs text-[#b3b3b3]">Ngoại tuyến</span>
      </div>

      {/* Real Downloaded Items List */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2 custom-scrollbar pr-1">
        {downloadedSongs.length > 0 ? (
          downloadedSongs.map((song, index) => {
            const isThisCurrent = (currentSong?.encodeId || currentSong?.id) === (song.encodeId || song.id);
            const isThisPlaying = isThisCurrent && isPlaying;

            return (
              <div
                key={song.encodeId || song.id || index}
                onClick={() => {
                  if (isThisCurrent) {
                    togglePlayPause();
                  } else {
                    playSong(song, downloadedSongs);
                  }
                }}
                className={`bg-[#181818] hover:bg-[#242424] rounded-md p-2.5 flex items-center gap-3 transition-colors group cursor-pointer ${
                  isThisCurrent ? 'bg-[#242424]' : ''
                }`}
              >
                <div className="relative w-10 h-10 rounded-md overflow-hidden bg-[#282828] flex-shrink-0">
                  <img
                    src={song.thumbnail || song.thumbnailM || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120'}
                    alt={song.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    {isThisPlaying ? (
                      <Pause className="w-3.5 h-3.5 fill-white text-white" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" />
                    )}
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <h4
                    className={`text-xs font-bold truncate ${
                      isThisCurrent ? 'text-white font-extrabold' : 'text-white'
                    }`}
                  >
                    {song.title}
                  </h4>
                  <p className="text-[11px] text-[#b3b3b3] truncate mt-0.5">
                    {song.artistsNames || 'Nghệ sĩ'}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] text-[#b3b3b3]">
                    {formatTime(song.duration)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeDownloadedSong(song.id);
                    }}
                    title="Xóa khỏi bộ nhớ ngoại tuyến"
                    className="p-1 text-[#b3b3b3] hover:text-white transition-colors opacity-0 group-hover:opacity-100 border-none bg-transparent cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-[#b3b3b3] text-xs py-16 px-4">
            <Download className="w-8 h-8 text-[#535353] mb-2" />
            <span className="font-semibold text-white mb-1">Chưa có bài hát nào</span>
            <span className="text-[11px] text-[#b3b3b3]">
              Dán link hoặc bấm tải xuống để lưu nhạc nghe ngoại tuyến tại đây
            </span>
          </div>
        )}
      </div>
    </aside>
  );
};
