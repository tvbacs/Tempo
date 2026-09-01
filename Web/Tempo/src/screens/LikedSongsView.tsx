import React from 'react';
import { Heart, Play, Shuffle, Download, Search, ArrowUpDown } from 'lucide-react';
import { useLibraryStore } from '../store/libraryStore';
import { usePlayerStore } from '../store/playerStore';
import { useAuthStore } from '../store/authStore';
import { TrackTable } from '../components/TrackTable';

export const LikedSongsView: React.FC = () => {
  const { likedSongs } = useLibraryStore();
  const { playSong } = usePlayerStore();
  const { user } = useAuthStore();

  const totalDurationSec = likedSongs.reduce((acc, s) => acc + (s.duration || 0), 0);
  const totalHours = Math.floor(totalDurationSec / 3600);
  const totalMins = Math.floor((totalDurationSec % 3600) / 60);

  const durationLabel = totalHours > 0
    ? `khoảng ${totalHours} giờ`
    : `${totalMins} phút`;

  const handlePlayAll = (shuffle: boolean = false) => {
    if (likedSongs.length === 0) return;
    const list = shuffle ? [...likedSongs].sort(() => Math.random() - 0.5) : likedSongs;
    playSong(list[0], list);
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar select-none bg-[#121212]">
      {/* Big Spotify Hero Header with Purple Gradient Matching Screenshot 2 */}
      <div className="bg-gradient-to-b from-[#491f8f] via-[#20113a] to-[#121212] p-8 flex items-end gap-6 flex-shrink-0">
        {/* Big Heart Square Icon 232x232 */}
        <div className="w-56 h-56 rounded-md bg-gradient-to-br from-[#450af5] via-[#8e8ee5] to-[#c4efd9] flex items-center justify-center text-white shadow-2xl flex-shrink-0">
          <Heart className="w-24 h-24 fill-white text-white" />
        </div>

        <div className="flex flex-col justify-end">
          <span className="text-xs font-bold uppercase tracking-wider text-white mb-2">Playlist</span>
          <h1 className="text-6xl font-black text-white tracking-tight mb-4">
            Bài hát đã thích
          </h1>
          <div className="flex items-center gap-2 text-xs font-semibold text-white/90">
            <div className="w-6 h-6 rounded-full bg-[#535353] flex items-center justify-center text-white text-[10px] font-bold">
              {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="font-bold text-white">{user?.email?.split('@')[0] || 'Tempo User'}</span>
            <span>•</span>
            <span>{likedSongs.length} bài hát</span>
            {likedSongs.length > 0 && (
              <>
                <span>,</span>
                <span>{durationLabel}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action Controls Bar */}
      <div className="px-8 py-5 flex items-center justify-between sticky top-0 z-10 bg-[#121212]/90 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <button
            onClick={() => handlePlayAll(false)}
            disabled={likedSongs.length === 0}
            className="w-14 h-14 rounded-full bg-[#1ed760] hover:scale-105 active:scale-95 text-black flex items-center justify-center shadow-2xl transition-all disabled:opacity-50 border-none cursor-pointer"
          >
            <Play className="w-6 h-6 fill-black text-black ml-0.5" />
          </button>

          <button
            onClick={() => handlePlayAll(true)}
            title="Trộn bài"
            className="text-[#b3b3b3] hover:text-white transition-colors border-none bg-transparent cursor-pointer p-1"
          >
            <Shuffle className="w-6 h-6" />
          </button>

          <button
            title="Tải xuống toàn bộ"
            className="w-8 h-8 rounded-full border border-white/20 hover:border-white text-[#b3b3b3] hover:text-white flex items-center justify-center transition-colors bg-transparent cursor-pointer"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-4 text-[#b3b3b3]">
          <button
            title="Tìm kiếm trong danh sách"
            className="w-8 h-8 rounded-full hover:text-white flex items-center justify-center transition-colors border-none bg-transparent cursor-pointer"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            className="flex items-center gap-1.5 text-xs font-semibold hover:text-white transition-colors border-none bg-transparent cursor-pointer p-1"
          >
            <span>Danh sách</span>
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Track Table */}
      <div className="px-8 pb-16">
        <TrackTable songs={likedSongs} />
      </div>
    </div>
  );
};
