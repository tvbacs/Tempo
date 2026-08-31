import React from 'react';
import { Heart, Play, Shuffle, Download, Search } from 'lucide-react';
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
    ? `khoảng ${totalHours} giờ ${totalMins} phút`
    : `${totalMins} phút`;

  const handlePlayAll = (shuffle: boolean = false) => {
    if (likedSongs.length === 0) return;
    const list = shuffle ? [...likedSongs].sort(() => Math.random() - 0.5) : likedSongs;
    playSong(list[0], list);
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar select-none">
      {/* Big Spotify Hero Header with Purple Gradient */}
      <div className="bg-gradient-to-b from-[#4A154B] via-[#2F1133] to-[#121212] p-8 flex items-end gap-6 flex-shrink-0">
        {/* Big Heart Square Icon */}
        <div className="w-56 h-56 rounded-md bg-gradient-to-br from-[#450af5] via-[#8e8ee5] to-[#c4efd9] flex items-center justify-center text-white shadow-2xl flex-shrink-0">
          <Heart className="w-24 h-24 fill-white" />
        </div>

        <div className="flex flex-col justify-end">
          <span className="text-xs font-bold uppercase tracking-wider text-white mb-2">Playlist</span>
          <h1 className="text-6xl font-black text-white tracking-tight mb-4">
            Bài hát đã thích
          </h1>
          <div className="flex items-center gap-2 text-xs font-semibold text-white/80">
            <span className="font-bold text-white">{user?.email?.split('@')[0] || 'Tempo User'}</span>
            <span>·</span>
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
      <div className="px-8 py-6 flex items-center justify-between bg-[#121212]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-6">
          <button
            onClick={() => handlePlayAll(false)}
            disabled={likedSongs.length === 0}
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
      </div>

      {/* Track Table */}
      <div className="px-8 pb-12">
        <TrackTable songs={likedSongs} />
      </div>
    </div>
  );
};
