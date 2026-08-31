import React from 'react';
import { Check, UserPlus, Mic2, Music2 } from 'lucide-react';
import { usePlayerStore } from '../store/playerStore';
import { useLibraryStore } from '../store/libraryStore';

export const RightSidebar: React.FC = () => {
  const { currentSong, positionSec, lyrics } = usePlayerStore();
  const { isArtistFollowed, toggleFollowArtist } = useLibraryStore();

  if (!currentSong) {
    return (
      <aside className="w-[340px] bg-[#121212] rounded-lg p-6 flex flex-col items-center justify-center text-center select-none flex-shrink-0">
        <div className="w-16 h-16 rounded-full bg-[#181818] flex items-center justify-center text-text-muted mb-4">
          <Music2 className="w-8 h-8" />
        </div>
        <h4 className="text-base font-bold text-white mb-1">Chưa phát bài hát nào</h4>
        <p className="text-xs text-text-secondary">Chọn một bài hát từ danh sách để xem thông tin và lời bài hát</p>
      </aside>
    );
  }

  const primaryArtist = currentSong.artistsNames?.split(',')[0]?.trim() || currentSong.artistsNames || 'Nghệ sĩ';
  const isFollowing = isArtistFollowed(primaryArtist);

  return (
    <aside className="w-[340px] bg-[#121212] rounded-lg p-4 flex flex-col select-none flex-shrink-0 overflow-y-auto custom-scrollbar">
      {/* Header with Title */}
      <div className="flex items-center justify-between pb-3 px-1">
        <h3 className="text-sm font-bold text-white truncate max-w-[260px]">{currentSong.title}</h3>
      </div>

      {/* Big Hero Artwork Card */}
      <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-[#181818] mb-4 shadow-xl">
        <img
          src={currentSong.thumbnailM || currentSong.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600'}
          alt={currentSong.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Song Title & Artists */}
      <div className="flex items-start justify-between mb-6 px-1">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-extrabold text-white truncate hover:underline cursor-pointer">
            {currentSong.title}
          </h2>
          <p className="text-sm text-text-secondary truncate mt-0.5 hover:underline cursor-pointer">
            {currentSong.artistsNames}
          </p>
        </div>
      </div>

      {/* Artist Credits Card ("Người tham gia thực hiện") */}
      <div className="bg-[#181818] rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-white">Người tham gia thực hiện</span>
          <span className="text-xs font-bold text-text-secondary hover:text-white cursor-pointer">Hiện tất cả</span>
        </div>

        <div className="flex items-center justify-between py-1">
          <div className="min-w-0 flex-1 pr-2">
            <h4 className="text-sm font-bold text-white truncate hover:underline cursor-pointer">
              {primaryArtist}
            </h4>
            <p className="text-xs text-text-muted truncate mt-0.5">
              Nghệ sĩ chính · Ca sĩ
            </p>
          </div>
          <button
            onClick={() =>
              toggleFollowArtist({
                id: primaryArtist.toLowerCase().replace(/\s+/g, '-'),
                name: primaryArtist,
                alias: primaryArtist.toLowerCase().replace(/\s+/g, '-'),
                thumbnail: currentSong.thumbnail,
              })
            }
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              isFollowing
                ? 'bg-transparent border border-white/30 text-white hover:border-white'
                : 'bg-transparent border border-white/30 text-white hover:scale-105 hover:border-white'
            }`}
          >
            {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
          </button>
        </div>
      </div>

      {/* Lyrics Snippet Card */}
      {lyrics.length > 0 && (
        <div className="bg-[#181818] rounded-lg p-4 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Mic2 className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-white">Lời bài hát</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar max-h-52">
            {lyrics.map((line, idx) => {
              const currentMs = positionSec * 1000;
              const isActive = currentMs >= line.startMs && currentMs <= line.startMs + 4500;
              return (
                <p
                  key={idx}
                  className={`text-sm font-bold transition-all cursor-pointer ${
                    isActive ? 'text-primary text-base font-extrabold scale-102 origin-left' : 'text-text-muted hover:text-text-secondary'
                  }`}
                  onClick={() => usePlayerStore.getState().seekTo(line.startMs / 1000)}
                >
                  {line.words}
                </p>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
};
